export const COURSES = {
    GET_ALL: "/courses",
    CREATE: "/courses",
    GET_BY_ID: (courseId: string) => `/courses/${courseId}`,
    UPDATE: (courseId: string) => `/courses/${courseId}`,
    DELETE: (courseId: string) => `/courses/${courseId}`,
    GET_LESSONS: (courseId: string) => `/courses/${courseId}/lessons`,
    ENROLL: (courseId: string) => `/courses/${courseId}/enroll`,
    UNENROLL: (courseId: string) => `/courses/${courseId}/unenroll`,
    GET_STUDENTS: (courseId: string) => `/courses/${courseId}/students`,
} as const;