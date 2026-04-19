/**
 * SMS + LMS API Endpoints
 * 
 * Centralized API route definitions for the frontend
 * Usage: import { API } from '@/lib/endpoints';
 *        import { api } from '@/lib/api';
 *        
 *        api.get(API.USERS.GET_ALL)
 */

export const API = {
  // ─────────────────────────────────────────────────────────────────────────
  // Auth & Login
  // ─────────────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/login",
    LOGOUT: "/logout",
    REFRESH: "/refresh",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────────────────────────────────
  USERS: {
    GET_ALL: "/users",
    CREATE: "/users",
    GET_BY_ID: (userId: string) => `/users/${userId}`,
    UPDATE: (userId: string) => `/users/${userId}`,
    DELETE: (userId: string) => `/users/${userId}`,
    GET_ME: "/users/me",
    SETUP_FORM: "/users/setup-form",
    GET_STUDENTS: "/users/students",
    GET_INSTRUCTORS: "/users/instructors",
    GET_PARENTS: "/users/parents",
    GET_ADMINS: "/users/admins",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // User Profiles (Base)
  // ─────────────────────────────────────────────────────────────────────────
  PROFILES: {
    GET_ALL: "/profiles",
    GET_BY_ID: (userId: string) => `/profiles/${userId}`,
    CREATE: (userId: string) => `/profiles/${userId}`,
    UPDATE: (userId: string) => `/profiles/${userId}`,
    DELETE: (userId: string) => `/profiles/${userId}`,
    ASSIGN_CLASS: (userId: string) => `/profiles/${userId}/class`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Student Profiles
  // ─────────────────────────────────────────────────────────────────────────
  STUDENTS: {
    GET_PROFILE: (userId: string) => `/students/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    GET_GRADES: (studentId: string) => `/students/${studentId}/grades`,
    GET_ATTENDANCE: (studentId: string) => `/students/${studentId}/attendance`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Instructor Profiles
  // ─────────────────────────────────────────────────────────────────────────
  INSTRUCTORS: {
    GET_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Parent Profiles
  // ─────────────────────────────────────────────────────────────────────────
  PARENTS: {
    SETUP_FORM: "/parents/setup-form",
    GET_ALL: "/parents",
    GET_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    GET_STUDENTS: (userId: string) => `/parents/${userId}/students`,
    LINK_STUDENT: (userId: string, studentId: number) =>
      `/parents/${userId}/students/${studentId}`,
    UNLINK_STUDENT: (userId: string, studentId: number) =>
      `/parents/${userId}/students/${studentId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────────────────────────────────
  DASHBOARD: {
    GET_STATS: "/dashboard/stats",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Grades
  // ─────────────────────────────────────────────────────────────────────────
  GRADES: {
    GET_ALL: "/grades",
    CREATE_OR_UPDATE: "/grades",
    UPDATE: (gradeId: number) => `/grades/${gradeId}`,
    DELETE: (gradeId: number) => `/grades/${gradeId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Grade Levels
  // ─────────────────────────────────────────────────────────────────────────
  GRADE_LEVELS: {
    SETUP_FORM: "/grade-levels/setup-form",
    GET_ALL: "/grade-levels",
    CREATE: "/grade-levels",
    GET_BY_ID: (levelId: number) => `/grade-levels/${levelId}`,
    UPDATE: (levelId: number) => `/grade-levels/${levelId}`,
    DELETE: (levelId: number) => `/grade-levels/${levelId}`,
    GET_CLASSES: (levelId: number) => `/grade-levels/${levelId}/classes`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Academic Years
  // ─────────────────────────────────────────────────────────────────────────
  ACADEMIC_YEARS: {
    SETUP_FORM: "/academic-years/setup-form",
    GET_CURRENT: "/academic-years/current",
    GET_ALL: "/academic-years",
    CREATE: "/academic-years",
    GET_BY_ID: (yearId: number) => `/academic-years/${yearId}`,
    UPDATE: (yearId: number) => `/academic-years/${yearId}`,
    DELETE: (yearId: number) => `/academic-years/${yearId}`,
    GET_TERMS: (yearId: number) => `/academic-years/${yearId}/terms`,
    CREATE_TERM: (yearId: number) => `/academic-years/${yearId}/terms`,
    UPDATE_TERM: (termId: number) => `/academic-years/terms/${termId}`,
    DELETE_TERM: (termId: number) => `/academic-years/terms/${termId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Classes
  // ─────────────────────────────────────────────────────────────────────────
  CLASSES: {
    GET_ALL: "/classes",
    CREATE: "/classes",
    GET_BY_ID: (classId: number) => `/classes/${classId}`,
    UPDATE: (classId: number) => `/classes/${classId}`,
    DELETE: (classId: number) => `/classes/${classId}`,
    GET_STUDENTS: (classId: number) => `/classes/${classId}/students`,
    ADD_STUDENT: (classId: number, studentId: number) =>
      `/classes/${classId}/students/${studentId}`,
    REMOVE_STUDENT: (classId: number, studentId: number) =>
      `/classes/${classId}/students/${studentId}`,
    GET_SESSIONS: (classId: number) => `/classes/${classId}/sessions`,
    CREATE_SESSION: (classId: number) => `/classes/${classId}/sessions`,
    GET_ATTENDANCE: (classId: number, sessionId: number) =>
      `/classes/${classId}/sessions/${sessionId}/attendance`,
    MARK_ATTENDANCE: (classId: number, sessionId: number) =>
      `/classes/${classId}/sessions/${sessionId}/attendance`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Courses
  // ─────────────────────────────────────────────────────────────────────────
  COURSES: {
    GET_ALL: "/courses",
    CREATE: "/courses",
    GET_BY_ID: (courseId: number) => `/courses/${courseId}`,
    UPDATE: (courseId: number) => `/courses/${courseId}`,
    DELETE: (courseId: number) => `/courses/${courseId}`,
    GET_LESSONS: (courseId: number) => `/courses/${courseId}/lessons`,
    ENROLL: (courseId: number) => `/courses/${courseId}/enroll`,
    UNENROLL: (courseId: number, studentId: number) =>
      `/courses/${courseId}/enroll/${studentId}`,
    GET_STUDENTS: (courseId: number) => `/courses/${courseId}/students`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Course Management (Modules/Lessons)
  // ─────────────────────────────────────────────────────────────────────────
  COURSES_MANAGEMENT: {
    GET_ALL: "/courses-management",
    CREATE_MODULE: (courseId: number) => `/courses-management/${courseId}/modules`,
    CREATE_LESSON: (moduleId: number) => `/courses-management/modules/${moduleId}/lessons`,
    UPDATE_LESSON: (lessonId: number) => `/courses-management/lessons/${lessonId}`,
    DELETE_MODULE: (moduleId: number) => `/courses-management/modules/${moduleId}`,
    DELETE_LESSON: (lessonId: number) => `/courses-management/lessons/${lessonId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Subjects
  // ─────────────────────────────────────────────────────────────────────────
  SUBJECTS: {
    SETUP_FORM: "/subjects/setup-form",
    GET_ALL: "/subjects",
    CREATE: "/subjects",
    GET_BY_ID: (subjectId: number) => `/subjects/${subjectId}`,
    UPDATE: (subjectId: number) => `/subjects/${subjectId}`,
    DELETE: (subjectId: number) => `/subjects/${subjectId}`,
    GET_COURSES: (subjectId: number) => `/subjects/${subjectId}/courses`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Lessons
  // ─────────────────────────────────────────────────────────────────────────
  LESSONS: {
    GET_ALL: "/lessons",
    CREATE: "/lessons",
    GET_BY_ID: (lessonId: number) => `/lessons/${lessonId}`,
    UPDATE: (lessonId: number) => `/lessons/${lessonId}`,
    DELETE: (lessonId: number) => `/lessons/${lessonId}`,
    GET_MATERIALS: (lessonId: number) => `/lessons/${lessonId}/materials`,
    ADD_MATERIAL: (lessonId: number) => `/lessons/${lessonId}/materials`,
    DELETE_MATERIAL: (materialId: number) => `/lessons/materials/${materialId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Assignments
  // ─────────────────────────────────────────────────────────────────────────
  ASSIGNMENTS: {
    GET_ALL: "/assignments",
    CREATE: "/assignments",
    GET_BY_ID: (assignmentId: number) => `/assignments/${assignmentId}`,
    UPDATE: (assignmentId: number) => `/assignments/${assignmentId}`,
    DELETE: (assignmentId: number) => `/assignments/${assignmentId}`,
    GET_SUBMISSIONS: (assignmentId: number) =>
      `/assignments/${assignmentId}/submissions`,
    SUBMIT: (assignmentId: number) => `/assignments/${assignmentId}/submit`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Quizzes
  // ─────────────────────────────────────────────────────────────────────────
  QUIZZES: {
    GET_ALL: "/quizzes",
    CREATE: "/quizzes",
    GET_BY_ID: (quizId: number) => `/quizzes/${quizId}`,
    UPDATE: (quizId: number) => `/quizzes/${quizId}`,
    DELETE: (quizId: number) => `/quizzes/${quizId}`,
    SUBMIT: (quizId: number) => `/quizzes/${quizId}/submit`,
    GET_RESULTS: (quizId: number) => `/quizzes/${quizId}/results`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Exams
  // ─────────────────────────────────────────────────────────────────────────
  EXAMS: {
    GET_ALL: "/exams",
    CREATE: "/exams",
    GET_BY_ID: (examId: number) => `/exams/${examId}`,
    UPDATE: (examId: number) => `/exams/${examId}`,
    DELETE: (examId: number) => `/exams/${examId}`,
    SUBMIT: (examId: number) => `/exams/${examId}/submit`,
    GET_RESULTS: (examId: number) => `/exams/${examId}/results`,
    GRADE_RESULT: (resultId: number) => `/exams/results/${resultId}/grade`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Results
  // ─────────────────────────────────────────────────────────────────────────
  RESULTS: {
    GET_ALL: "/results",
    CREATE: "/results",
    GET_BY_ID: (resultId: number) => `/results/${resultId}`,
    UPDATE: (resultId: number) => `/results/${resultId}`,
    DELETE: (resultId: number) => `/results/${resultId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Enrollments
  // ─────────────────────────────────────────────────────────────────────────
  ENROLLMENTS: {
    GET_ALL: "/enrollments",
    CREATE: "/enrollments",
    GET_BY_ID: (enrollmentId: number) => `/enrollments/${enrollmentId}`,
    UPDATE: (enrollmentId: number) => `/enrollments/${enrollmentId}`,
    DELETE: (enrollmentId: number) => `/enrollments/${enrollmentId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Attendance
  // ─────────────────────────────────────────────────────────────────────────
  ATTENDANCE: {
    GET_ALL: "/attendance",
    UPDATE: (attendanceId: number) => `/attendance/${attendanceId}`,
    DELETE: (attendanceId: number) => `/attendance/${attendanceId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Submissions
  // ─────────────────────────────────────────────────────────────────────────
  SUBMISSIONS: {
    GET_ALL: "/submissions",
    GET_BY_ID: (submissionId: number) => `/submissions/${submissionId}`,
    UPDATE: (submissionId: number) => `/submissions/${submissionId}`,
    DELETE: (submissionId: number) => `/submissions/${submissionId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Finance
  // ─────────────────────────────────────────────────────────────────────────
  FINANCE: {
    FEES: "/finance/fees",
    FEES_BY_ID: (feeId: number) => `/finance/fees/${feeId}`,
    EXPENSES: "/finance/expenses",
    EXPENSES_BY_ID: (expenseId: number) => `/finance/expenses/${expenseId}`,
    SALARY: "/finance/salary",
    SALARY_BY_ID: (salaryId: number) => `/finance/salary/${salaryId}`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Roles & Permissions
  // ─────────────────────────────────────────────────────────────────────────
  ROLES: {
    GET_ALL: "/roles",
    CREATE: "/roles",
    UPDATE: (roleId: number) => `/roles/${roleId}`,
    DELETE: (roleId: number) => `/roles/${roleId}`,
    GET_PERMISSIONS: (roleId: number) => `/roles/${roleId}/permissions`,
    SET_PERMISSIONS: (roleId: number) => `/roles/${roleId}/permissions`,
  },

  PERMISSIONS: {
    GET_ALL: "/permissions",
    CREATE: "/permissions",
    UPDATE: (permissionId: number) => `/permissions/${permissionId}`,
    DELETE: (permissionId: number) => `/permissions/${permissionId}`,
  },
} as const;

/**
 * Usage Examples:
 *
 * // Simple endpoint:
 * import { api } from '@/lib/api';
 * import { API } from '@/lib/endpoints';
 * 
 * api.get(API.DASHBOARD.GET_STATS);
 *
 * // With parameters:
 * api.get(API.STUDENTS.GET_PROFILE("student-123"));
 *
 * // Multiple parameters:
 * api.post(API.CLASSES.ADD_STUDENT(5, 10), data);
 *
 * // In React components:
 * useEffect(() => {
 *   api.get(API.USERS.GET_ALL).then(res => setUsers(res.data));
 * }, []);
 */
