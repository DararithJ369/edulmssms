export const ENROLLMENTS = {
    GET_ALL: "/enrollments",
    CREATE: "/enrollments",
    GET_BY_ID: (enrollmentId: string) => `/enrollments/${enrollmentId}`,
    UPDATE: (enrollmentId: string) => `/enrollments/${enrollmentId}`,
    DELETE: (enrollmentId: string) => `/enrollments/${enrollmentId}`,
} as const;