export const SUBJECTS = {
    SETUP_FORM: "/subjects/setup-form",
    GET_ALL: "/subjects",
    CREATE: "/subjects",
    GET_BY_ID: (subjectId: string) => `/subjects/${subjectId}`,
    UPDATE: (subjectId: string) => `/subjects/${subjectId}`,
    DELETE: (subjectId: string) => `/subjects/${subjectId}`,
    GET_COURSES: (subjectId: string) => `/subjects/${subjectId}/courses`,
} as const;