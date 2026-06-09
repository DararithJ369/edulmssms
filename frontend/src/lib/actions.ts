"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  ParentSchema,
  LessonSchema,
  AssignmentSchema,
  ResultSchema,
  AnnouncementSchema,
  AttendanceSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { cookies } from "next/headers";

type CurrentState = { success: boolean; error: boolean };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/classes");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    await prisma.teacher.create({
      data: {
        id: data.id || crypto.randomUUID(),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    await (prisma as any).user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        password: data.password || "",
        roleId: 2,
      } as any,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  try {
    const body = {
      username: data.username,
      email: data.email || null,
      password: data.password,
      role: "student",
    };
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();

    const form = new FormData();
    if (data.name || data.surname) form.append("full_name", `${data.name || ""} ${data.surname || ""}`.trim());
    if (data.phone)   form.append("phone",   data.phone);
    if (data.address) form.append("address", data.address);
    if (data.sex)     form.append("gender",  data.sex);
    if (data.birthday) form.append("date_of_birth", typeof data.birthday === "string" ? data.birthday : (data.birthday as Date).toISOString().split("T")[0]);
    if (data.img)     form.append("pfp",     data.img);
    if (data.tier)    form.append("tier",    data.tier);

    await fetch(`${API_URL}/profiles/${created.id}`, {
      method: "POST",
      body: form,
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await (prisma as any).user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        password: data.password || "",
        roleId: 3,
      } as any,
    });

    const form = new FormData();
    if (data.name || data.surname) form.append("full_name", `${data.name || ""} ${data.surname || ""}`.trim());
    if (data.phone)   form.append("phone",   data.phone);
    if (data.address) form.append("address", data.address);
    if (data.sex)     form.append("gender",  data.sex);
    if (data.birthday) form.append("date_of_birth", typeof data.birthday === "string" ? data.birthday : (data.birthday as Date).toISOString().split("T")[0]);
    if (data.img)     form.append("pfp",     data.img);
    if (data.tier)    form.append("tier",    data.tier);

    const res = await fetch(`${API_URL}/profiles/${data.id}`, {
      method: "PUT",
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  try {
    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    await prisma.parent.create({
      data: {
        id: data.id || crypto.randomUUID(),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: "A+",
        sex: "MALE",
        birthday: new Date(),
      } as any,
    });
    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await (prisma as any).user.update({
      where: { id: data.id },
      data: {
        username: data.username,
        email: data.email,
        password: data.password || "",
        roleId: 4,
      } as any,
    });

    await prisma.parent.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
      } as any,
    });
    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.parent.delete({
      where: { id },
    });
    revalidatePath("/list/parents");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    const { materialFile, ...prismaData } = data;
    await prisma.lesson.create({
      data: {
        name: prismaData.name,
        day: prismaData.day,
        startTime: prismaData.startTime,
        endTime: prismaData.endTime,
        subjectId: prismaData.subjectId,
        classId: prismaData.classId,
        teacherId: prismaData.teacherId,
      },
    });
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    const { materialFile, ...prismaData } = data;
    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: prismaData.name,
        day: prismaData.day,
        startTime: prismaData.startTime,
        endTime: prismaData.endTime,
        subjectId: prismaData.subjectId,
        classId: prismaData.classId,
        teacherId: prismaData.teacherId,
      },
    });
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    const { attachmentFile, ...prismaData } = data;
    await prisma.assignment.create({
      data: {
        title: prismaData.title,
        startDate: prismaData.startDate,
        dueDate: prismaData.dueDate,
        lessonId: prismaData.lessonId,
      },
    });
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    const { attachmentFile, ...prismaData } = data;
    await prisma.assignment.update({
      where: { id: data.id },
      data: {
        title: prismaData.title,
        startDate: prismaData.startDate,
        dueDate: prismaData.dueDate,
        lessonId: prismaData.lessonId,
      },
    });
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  try {
    await prisma.result.create({
      data: {
        score: data.score,
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (
  currentState: CurrentState,
  data: ResultSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.result.update({
      where: { id: data.id },
      data: {
        score: data.score,
        studentId: data.studentId,
        examId: data.examId || null,
        assignmentId: data.assignmentId || null,
      },
    });
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/results");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};


export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value || cookieStore.get("session")?.value;

    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.message,
        date: new Date(),
        classId: data.courseId ? String(data.courseId) : null,
      } as any,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/announcements`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        title: data.title,
        type: data.type || "general",
        message: data.message,
        course_id: data.courseId ? String(data.courseId) : null,
        recipient_id: data.recipientId || null
      }),
    });

    if (!response.ok) {
      const logDetails = await response.json();
      console.error("FastAPI Synchronization Reject Log:", JSON.stringify(logDetails));
      return { success: false, error: true };
    }

    revalidatePath("/list/announcements");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.announcement.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.message,
      } as any,
    });

    revalidatePath("/list/announcements");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value || cookieStore.get("session")?.value;

    await prisma.announcement.delete({
      where: { id: parseInt(id) },
    });

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/announcements/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      const logDetails = await response.json();
      console.error("FastAPI Deletion Sync Reject Log:", JSON.stringify(logDetails));
      return { success: false, error: true };
    }

    revalidatePath("/list/announcements");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};



export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  try {
    await prisma.attendance.create({
      data: {
        date: data.date,
        present: data.status === "present",
        studentId: data.studentId,
        lessonId: 1,
      },
    });
    revalidatePath("/list/attendance");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.attendance.update({
      where: { id: data.id },
      data: {
        date: data.date,
        present: data.status === "present",
        studentId: data.studentId,
      },
    });
    revalidatePath("/list/attendance");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.attendance.delete({
      where: { id: parseInt(id) },
    });
    revalidatePath("/list/attendance");
    revalidatePath("/admin");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};