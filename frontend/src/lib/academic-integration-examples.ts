/**
 * Academic Features Integration Guide
 * 
 * This document provides usage examples for integrating backend endpoints
 * for classes, courses, assignments, exams, and lessons into React components.
 * 
 * IMPORTANT: This file contains DOCUMENTATION ONLY. The actual implementations
 * should be imported from their respective hook files:
 * - useClasses from "@/hooks/useClasses"
 * - useCourses from "@/hooks/useCourses"
 * - useAssignments from "@/hooks/useAssignments"
 * - useExams from "@/hooks/useExams"
 * - useLessons from "@/hooks/useLessons"
 * 
 * All examples below show the recommended usage patterns for each hook.
 */

// ──────────────────────────────────────────────────────────────────────────
// 1. CLASSES - Managing Educational Classes
// ──────────────────────────────────────────────────────────────────────────

/**
 * Classes Hook Usage Example
 * 
 * Features:
 * - Fetch paginated list of classes
 * - Create new class
 * - Edit existing class
 * - Delete class
 * - No duplicate API calls (using useRef pattern internally)
 * 
 * @example
 * ```typescript
 * import { useClasses } from "@/hooks/useClasses";
 * 
 * export function ClassesPage() {
 *   const { classes, meta, loading, error, fetchClasses, createClass, updateClass, deleteClass, setPage } = useClasses();
 * 
 *   const handleCreate = async () => {
 *     const result = await createClass({
 *       name: "Class 10-A",
 *       description: "Advanced Science Class",
 *       grade_level_id: 10,
 *       instructor_id: "instructor-123"
 *     });
 *     if (result) console.log("Class created:", result);
 *   };
 * 
 *   const handleUpdate = async (classId: number) => {
 *     const result = await updateClass(classId, { name: "Updated Name" });
 *   };
 * 
 *   const handleDelete = async (classId: number) => {
 *     const success = await deleteClass(classId);
 *   };
 * 
 *   const handlePageChange = (newPage: number) => {
 *     setPage(newPage);
 *   };
 * 
 *   return (
 *     <div>
 *       {loading ? <Spinner /> : <ClassTable data={classes} />}
 *       <Pagination page={meta.page} total={meta.total} onPageChange={handlePageChange} />
 *     </div>
 *   );
 * }
 * ```
 */

// ──────────────────────────────────────────────────────────────────────────
// 2. COURSES - Managing Courses
// ──────────────────────────────────────────────────────────────────────────

/**
 * Courses Hook Usage Example
 * 
 * Features:
 * - Get all courses with pagination
 * - Create course
 * - Update course
 * - Delete course
 * - Enroll/unenroll students
 * - Get course lessons and students
 * 
 * @example
 * ```typescript
 * import { useCourses } from "@/hooks/useCourses";
 * import { api } from "@/lib/api";
 * import { API } from "@/lib/endpoints";
 * 
 * export function CoursesPage() {
 *   const { courses, meta, loading, error, fetchCourses, createCourse, updateCourse, deleteCourse, setPage } = useCourses();
 * 
 *   const handleCreate = async () => {
 *     const result = await createCourse({
 *       name: "Physics 101",
 *       code: "PHYS101",
 *       description: "Introduction to Physics",
 *       instructor_id: "instructor-123",
 *       credits: 3
 *     });
 *   };
 * 
 *   const getCourseLessons = async (courseId: number) => {
 *     const { data } = await api.get(API.COURSES.GET_LESSONS(courseId));
 *     return data;
 *   };
 * 
 *   const enrollStudent = async (courseId: number) => {
 *     const { data } = await api.post(API.COURSES.ENROLL(courseId), {
 *       student_id: "student-123"
 *     });
 *     return data;
 *   };
 * 
 *   return (
 *     <div>
 *       {loading ? <Spinner /> : <CourseTable data={courses} />}
 *     </div>
 *   );
 * }
 * ```
 */

// ──────────────────────────────────────────────────────────────────────────
// 3. ASSIGNMENTS - Managing Assignments with File Uploads
// ──────────────────────────────────────────────────────────────────────────

/**
 * Assignments Hook Usage Example
 * 
 * Features:
 * - Create assignment with file attachment
 * - Update assignment
 * - Delete assignment
 * - Get submissions
 * - Submit assignment (as student)
 * - Multipart FormData support
 * 
 * @example
 * ```typescript
 * import { useAssignments } from "@/hooks/useAssignments";
 * import { api } from "@/lib/api";
 * import { API } from "@/lib/endpoints";
 * 
 * export function AssignmentsPage() {
 *   const { assignments, meta, loading, error, fetchAssignments, createAssignment, updateAssignment, deleteAssignment, setPage } = useAssignments();
 * 
 *   const handleCreateAssignment = async (file: File, courseId: number) => {
 *     const formData = new FormData();
 *     formData.append("course_id", courseId.toString());
 *     formData.append("title", "Problem Set 1");
 *     formData.append("description", "Solve these problems");
 *     formData.append("due_date", "2025-04-15");
 *     formData.append("total_marks", "100");
 *     formData.append("file", file);
 * 
 *     const result = await createAssignment(formData);
 *   };
 * 
 *   const getSubmissions = async (assignmentId: number) => {
 *     const { data } = await api.get(API.ASSIGNMENTS.GET_SUBMISSIONS(assignmentId));
 *     return data;
 *   };
 * 
 *   const submitAssignment = async (assignmentId: number, file: File) => {
 *     const formData = new FormData();
 *     formData.append("file", file);
 *     formData.append("content", "My solution text");
 * 
 *     const { data } = await api.post(API.ASSIGNMENTS.SUBMIT(assignmentId), formData);
 *     return data;
 *   };
 * 
 *   return (
 *     <div>
 *       {loading ? <Spinner /> : <AssignmentTable data={assignments} />}
 *     </div>
 *   );
 * }
 * ```
 */

// ──────────────────────────────────────────────────────────────────────────
// 4. EXAMS - Managing Exams and Results
// ──────────────────────────────────────────────────────────────────────────

/**
 * Exams Hook Usage Example
 * 
 * Features:
 * - List exams with pagination
 * - Create exam
 * - Update exam
 * - Delete exam
 * - Submit exam (as student)
 * - Get exam results (as instructor)
 * - Grade exam results
 * 
 * @example
 * ```typescript
 * import { useExams } from "@/hooks/useExams";
 * import { api } from "@/lib/api";
 * import { API } from "@/lib/endpoints";
 * 
 * export function ExamsPage() {
 *   const { exams, meta, loading, error, fetchExams, createExam, updateExam, deleteExam, submitExam, getExamResults, setPage } = useExams();
 * 
 *   const handleCreateExam = async () => {
 *     await createExam({
 *       title: "Midterm Exam",
 *       description: "General Knowledge Test",
 *       total_marks: 100,
 *       start_date: "2025-04-01T10:00:00",
 *       end_date: "2025-04-01T12:00:00"
 *     });
 *   };
 * 
 *   const handleSubmitExam = async (examId: number, answers: any[]) => {
 *     await submitExam(examId, { questions_answers: answers });
 *   };
 * 
 *   const handleGetResults = async (examId: number) => {
 *     const results = await getExamResults(examId);
 *   };
 * 
 *   const gradeResult = async (resultId: number, score: number) => {
 *     const { data } = await api.put(API.EXAMS.GRADE_RESULT(resultId), {
 *       score: score,
 *       notes: "Good attempt"
 *     });
 *     return data;
 *   };
 * 
 *   return (
 *     <div>
 *       {loading ? <Spinner /> : <ExamTable data={exams} />}
 *       <Pagination page={meta.page} total={meta.total} onPageChange={(p) => setPage(p)} />
 *     </div>
 *   );
 * }
 * ```
 */

// ──────────────────────────────────────────────────────────────────────────
// 5. LESSONS & MATERIALS - Managing Learning Content
// ──────────────────────────────────────────────────────────────────────────

/**
 * Lessons Hook Usage Example
 * 
 * Features:
 * - List lessons with pagination
 * - Create lesson
 * - Update lesson
 * - Delete lesson
 * - Add learning materials (PDFs, videos, documents)
 * - Delete materials
 * - Get course lessons
 * 
 * @example
 * ```typescript
 * import { useLessons } from "@/hooks/useLessons";
 * import { api } from "@/lib/api";
 * import { API } from "@/lib/endpoints";
 * 
 * export function LessonsPage() {
 *   const { lessons, meta, loading, error, fetchLessons, createLesson, updateLesson, deleteLesson, addMaterial, deleteMaterial, setPage } = useLessons();
 * 
 *   const handleCreateLesson = async () => {
 *     await createLesson({
 *       course_id: 5,
 *       title: "Introduction to Algebra",
 *       description: "Basics of algebraic equations",
 *       content: "HTML or markdown content here",
 *       order: 1
 *     });
 *   };
 * 
 *   const handleAddMaterial = async (lessonId: number, file: File) => {
 *     const formData = new FormData();
 *     formData.append("title", "Lecture Notes");
 *     formData.append("description", "Complete notes for this lesson");
 *     formData.append("file", file);
 *     await addMaterial(lessonId, formData);
 *   };
 * 
 *   const handleDeleteMaterial = async (materialId: number) => {
 *     await deleteMaterial(materialId);
 *   };
 * 
 *   const getCourseLessons = async (courseId: number) => {
 *     const { data } = await api.get(API.COURSES.GET_LESSONS(courseId));
 *     return data;
 *   };
 * 
 *   return (
 *     <div>
 *       {loading ? <Spinner /> : <LessonTable data={lessons} />}
 *       <Pagination page={meta.page} total={meta.total} onPageChange={(p) => setPage(p)} />
 *     </div>
 *   );
 * }
 * ```
 */

// ──────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS AND RETURN TYPES
// ──────────────────────────────────────────────────────────────────────────

/**
 * All hooks follow a consistent return pattern:
 * 
 * @example
 * ```typescript
 * {
 *   data: T[],                          // Array of items from API
 *   meta: { page: number, total: number, limit: number },  // Pagination metadata
 *   loading: boolean,                   // Loading state during fetch
 *   error: string | null,               // Error message if any
 *   setPage: (page: number) => void,    // Update page for pagination
 *   fetchData: () => Promise<void>,     // Manually refetch data
 *   create: (payload: any) => Promise<T | null>,      // Create new item
 *   update: (id: number, payload: any) => Promise<boolean>,  // Update existing
 *   delete: (id: number) => Promise<boolean>,         // Delete item
 *   // Additional hooks-specific methods...
 * }
 * ```
 */

/**
 * Common patterns:
 * 
 * 1. PAGINATION:
 *    - All hooks support pagination with page/total/limit
 *    - Use setPage(newPage) to change page
 *    - Automatically refetches data when page changes
 * 
 * 2. ERROR HANDLING:
 *    - Error messages automatically shown via toast.error()
 *    - Check error state for conditional rendering
 * 
 * 3. FILE UPLOADS:
 *    - Use FormData for multipart requests (assignments, lessons)
 *    - Set proper Content-Type header (handled automatically)
 *    - Example: formData.append("file", file)
 * 
 * 4. PERFORMANCE:
 *    - Uses useRef to prevent React StrictMode double-calls
 *    - Wraps fetches in useCallback with proper dependencies
 *    - useEffect with hasInitialized guard prevents duplicate requests
 * 
 * 5. AUTO-REFETCH:
 *    - After any mutation (create/update/delete), data automatically refetches
 *    - No manual setData() calls needed
 */
