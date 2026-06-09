import logging
import os
from datetime import datetime, time
from typing import List, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user_profile import UserProfile
from app.models.ai_tutor import AIConversation, AIMessage
from app.models.course import Course, Module, Lesson

logger = logging.getLogger(__name__)


class AITutorService:

    @staticmethod
    def get_conversation(db: Session, student_id: str, lesson_id: int) -> AIConversation:
        """Get or create an AI conversation for the student and lesson."""
        conv = db.query(AIConversation).filter(
            AIConversation.student_id == student_id,
            AIConversation.lesson_id == lesson_id
        ).first()

        if not conv:
            conv = AIConversation(student_id=student_id, lesson_id=lesson_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
        return conv

    @staticmethod
    def get_history(db: Session, student_id: str, lesson_id: int) -> List[AIMessage]:
        """Retrieve the conversation history for a student and lesson."""
        conv = AITutorService.get_conversation(db, student_id, lesson_id)
        return conv.messages

    @staticmethod
    def clear_history(db: Session, student_id: str, lesson_id: int) -> bool:
        """Clear the conversation history for a student and lesson."""
        conv = db.query(AIConversation).filter(
            AIConversation.student_id == student_id,
            AIConversation.lesson_id == lesson_id
        ).first()

        if conv:
            db.delete(conv)
            db.commit()
            return True
        return False

    @staticmethod
    def get_quota_info(db: Session, student_id: str) -> Tuple[int, int]:
        """
        Get student's AI message quota.
        Returns: (quota_remaining, quota_limit)
        """
        # Fetch the student's profile to find their tier
        profile = db.query(UserProfile).filter(UserProfile.user_id == student_id).first()
        tier = "free"
        if profile and profile.tier:
            tier = profile.tier.lower()

        if tier == "premium":
            return 9999, 9999  # Unlimited

        # For free and standard tiers, limit is 5 messages per day
        limit = 5
        
        # Count user messages sent today (UTC timezone)
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        
        sent_today = db.query(AIMessage).join(AIConversation).filter(
            AIConversation.student_id == student_id,
            AIMessage.sender == "user",
            AIMessage.created_at >= today_start
        ).count()

        quota_remaining = max(0, limit - sent_today)
        return quota_remaining, limit

    @staticmethod
    def chat(db: Session, student_id: str, lesson_id: int, prompt: str) -> Tuple[str, int, int]:
        """
        Send a message to the AI Tutor.
        Validates quota, generates response (using OpenAI or fallback mock),
        saves the exchange in the DB, and returns the response with updated quota info.
        """
        # 1. Validate Quota
        quota_remaining, quota_limit = AITutorService.get_quota_info(db, student_id)
        if quota_limit != 9999 and quota_remaining <= 0:
            raise HTTPException(
                status_code=403,
                detail="You have exceeded your daily limit of 5 AI Tutor queries. Upgrade to Premium for unlimited access."
            )

        # 2. Get active conversation
        conv = AITutorService.get_conversation(db, student_id, lesson_id)

        # 3. Save User message
        user_msg = AIMessage(conversation_id=conv.id, sender="user", content=prompt)
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # 4. Fetch Lesson and Context Details
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        module = db.query(Module).filter(Module.id == lesson.module_id).first()
        module_title = module.title if module else "Unknown Module"
        course_title = "Unknown Course"
        if module:
            course = db.query(Course).filter(Course.id == module.course_id).first()
            if course:
                course_title = course.course_name

        lesson_title = lesson.title
        lesson_content = lesson.content or "No text content available for this lesson."

        # 5. Compile Prompt and Messages for LLM
        system_instruction = (
            "You are a friendly, knowledgeable AI Learning Coach in a university LMS.\n"
            f"You are tutoring the student on the lesson: '{lesson_title}' "
            f"which belongs to the module '{module_title}' in the course '{course_title}'.\n\n"
            f"Here is the lesson content for context:\n"
            f"--- BEGIN LESSON CONTENT ---\n{lesson_content}\n--- END LESSON CONTENT ---\n\n"
            "Use this lesson context to answer the student's questions. "
            "Keep your explanations concise, structured, and easy for a student to understand. "
            "Use Markdown formatting (bullet points, bold text) for readability.\n"
            "Always include specific citation references pointing to the specific sections or topics of the lesson content when you mention details from it "
            "(e.g., '[Citation: Introduction]' or '[Citation: Core Concept]'). Make sure these citations are relevant to the lesson text provided.\n"
            "If the student asks to summarize, explain concepts, or make a quiz, fulfill their request using the lesson details above."
        )

        # Get recent message history (last 10 messages)
        history_msgs = db.query(AIMessage).filter(
            AIMessage.conversation_id == conv.id,
            AIMessage.id != user_msg.id  # Exclude current message
        ).order_by(AIMessage.created_at.asc()).limit(10).all()

        openai_messages = [{"role": "system", "content": system_instruction}]
        for hm in history_msgs:
            role = "user" if hm.sender == "user" else "assistant"
            openai_messages.append({"role": role, "content": hm.content})
        
        # Append the new user message
        openai_messages.append({"role": "user", "content": prompt})

        # 6. Call LLM or Fallback
        api_key = os.getenv("OPENAI_API_KEY")
        response_text = ""

        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=openai_messages,
                    temperature=0.7
                )
                response_text = completion.choices[0].message.content
            except Exception as e:
                logger.error("OpenAI API call failed, falling back to mock response: %s", e)
                response_text = AITutorService._generate_mock_response(prompt, lesson_title, lesson_content) + "\n\n*(Note: Fallback to local simulator due to API error)*"
        else:
            response_text = AITutorService._generate_mock_response(prompt, lesson_title, lesson_content)

        # 7. Save Assistant message
        assistant_msg = AIMessage(conversation_id=conv.id, sender="assistant", content=response_text)
        db.add(assistant_msg)
        db.commit()

        # 8. Re-evaluate remaining quota (since we just used 1 query)
        new_quota_remaining, _ = AITutorService.get_quota_info(db, student_id)

        return response_text, new_quota_remaining, quota_limit

    @staticmethod
    def chat_stream(db: Session, student_id: str, lesson_id: int, prompt: str):
        """
        Send a message to the AI Tutor and yield SSE streaming events.
        Checks quota, persists prompt, accumulates and saves assistant response.
        """
        # 1. Validate Quota
        quota_remaining, quota_limit = AITutorService.get_quota_info(db, student_id)
        if quota_limit != 9999 and quota_remaining <= 0:
            raise HTTPException(
                status_code=403,
                detail="You have exceeded your daily limit of 5 AI Tutor queries. Upgrade to Premium for unlimited access."
            )

        # 2. Get active conversation
        conv = AITutorService.get_conversation(db, student_id, lesson_id)

        # 3. Save User message
        user_msg = AIMessage(conversation_id=conv.id, sender="user", content=prompt)
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # 4. Fetch Lesson and Context Details
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        module = db.query(Module).filter(Module.id == lesson.module_id).first()
        module_title = module.title if module else "Unknown Module"
        course_title = "Unknown Course"
        if module:
            course = db.query(Course).filter(Course.id == module.course_id).first()
            if course:
                course_title = course.course_name

        lesson_title = lesson.title
        lesson_content = lesson.content or "No text content available for this lesson."

        # 5. Compile Prompt and Messages for LLM
        system_instruction = (
            "You are a friendly, knowledgeable AI Learning Coach in a university LMS.\n"
            f"You are tutoring the student on the lesson: '{lesson_title}' "
            f"which belongs to the module '{module_title}' in the course '{course_title}'.\n\n"
            f"Here is the lesson content for context:\n"
            f"--- BEGIN LESSON CONTENT ---\n{lesson_content}\n--- END LESSON CONTENT ---\n\n"
            "Use this lesson context to answer the student's questions. "
            "Keep your explanations concise, structured, and easy for a student to understand. "
            "Use Markdown formatting (bullet points, bold text) for readability.\n"
            "Always include specific citation references pointing to the specific sections or topics of the lesson content when you mention details from it "
            "(e.g., '[Citation: Introduction]' or '[Citation: Core Concept]'). Make sure these citations are relevant to the lesson text provided.\n"
            "If the student asks to summarize, explain concepts, or make a quiz, fulfill their request using the lesson details above."
        )

        # Get recent message history (last 10 messages)
        history_msgs = db.query(AIMessage).filter(
            AIMessage.conversation_id == conv.id,
            AIMessage.id != user_msg.id  # Exclude current message
        ).order_by(AIMessage.created_at.asc()).limit(10).all()

        openai_messages = [{"role": "system", "content": system_instruction}]
        for hm in history_msgs:
            role = "user" if hm.sender == "user" else "assistant"
            openai_messages.append({"role": role, "content": hm.content})
        
        # Append the new user message
        openai_messages.append({"role": "user", "content": prompt})

        # 6. Call LLM stream or Fallback mock generator
        api_key = os.getenv("OPENAI_API_KEY")
        
        import json
        import time as pytime
        full_response = []

        if api_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                stream_completion = client.chat.completions.create(
                    model="gpt-4o",
                    messages=openai_messages,
                    temperature=0.7,
                    stream=True
                )
                for chunk in stream_completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_response.append(content)
                        yield f"data: {json.dumps({'type': 'content', 'delta': content})}\n\n"
            except Exception as e:
                logger.error("OpenAI API streaming call failed, falling back to mock: %s", e)
                # Fallback mock streaming
                mock_text = AITutorService._generate_mock_response(prompt, lesson_title, lesson_content) + "\n\n*(Note: Fallback to local simulator due to API error)*"
                words = mock_text.split(" ")
                for i, word in enumerate(words):
                    content = word + (" " if i < len(words) - 1 else "")
                    full_response.append(content)
                    yield f"data: {json.dumps({'type': 'content', 'delta': content})}\n\n"
                    pytime.sleep(0.02)
        else:
            mock_text = AITutorService._generate_mock_response(prompt, lesson_title, lesson_content)
            words = mock_text.split(" ")
            for i, word in enumerate(words):
                content = word + (" " if i < len(words) - 1 else "")
                full_response.append(content)
                yield f"data: {json.dumps({'type': 'content', 'delta': content})}\n\n"
                pytime.sleep(0.02)

        # 7. Save Assistant message
        full_text = "".join(full_response)
        assistant_msg = AIMessage(conversation_id=conv.id, sender="assistant", content=full_text)
        db.add(assistant_msg)
        db.commit()

        # 8. Yield a final done event with updated quota info
        new_quota_remaining, _ = AITutorService.get_quota_info(db, student_id)
        yield f"data: {json.dumps({'type': 'done', 'quota_remaining': new_quota_remaining, 'quota_limit': quota_limit})}\n\n"

    @staticmethod
    def _generate_mock_response(prompt: str, lesson_title: str, lesson_content: str) -> str:
        """Helper to generate a context-aware mock response for offline/keyless environments."""
        prompt_lower = prompt.lower()

        if "summarize" in prompt_lower or "summary" in prompt_lower:
            return (
                f"### 📋 Summary of: **{lesson_title}**\n\n"
                f"Here is a quick summary of the lesson material:\n\n"
                f"1. **Core Concept**: [Citation: Overview] This lesson covers the fundamental concepts of {lesson_title}.\n"
                f"2. **Content Brief**: [Citation: Core Material] {lesson_content[:150]}...\n"
                f"3. **Key Takeaway**: [Citation: Conclusion] Understanding this lesson is essential for mastering subsequent sections in this module."
            )
        elif "quiz" in prompt_lower or "test" in prompt_lower:
            return (
                f"### 📝 Practice Quiz for: **{lesson_title}**\n\n"
                f"Here are a couple of practice multiple-choice questions to test your knowledge:\n\n"
                f"**Question 1**: What is the primary focus of the lesson '{lesson_title}'?\n"
                f"- A) A completely unrelated subject\n"
                f"- B) Core concepts and practical applications of {lesson_title} [Citation: Lesson Description]\n"
                f"- C) Grade configuration\n\n"
                f"*Correct Answer: B*\n\n"
                f"**Question 2**: Based on the lesson text, which of the following is true?\n"
                f"- A) The content is empty\n"
                f"- B) This module is optional\n"
                f"- C) The material provides foundational learning for students [Citation: Student Guidelines]\n\n"
                f"*Correct Answer: C*"
            )
        elif "explain" in prompt_lower or "concept" in prompt_lower or "difficult" in prompt_lower:
            return (
                f"### 🧠 Core Concepts in: **{lesson_title}**\n\n"
                f"Let's break down the main concepts of this lesson:\n\n"
                f"* **{lesson_title}**: [Citation: Intro Details] The central focus, which describes the lesson topic.\n"
                f"* **Key Terms**: [Citation: Key Definitions] This lesson involves key structural elements that form the basis of the module.\n\n"
                f"Is there a specific sentence or concept in the text you'd like me to explain further?"
            )
        else:
            return (
                f"Hello! I am your **AI Learning Coach**. I am currently running in **Simulation Mode** (no OpenAI API key configured).\n\n"
                f"I am ready to help you with the lesson **'{lesson_title}'**! Here's a brief quote from the lesson material:\n"
                f"> \"{lesson_content[:200]}...\" [Citation: Document Excerpt]\n\n"
                f"Feel free to ask me to **Summarize**, **Explain Concepts**, or **Generate a Quiz** using the buttons below or by typing in the chat!"
            )
