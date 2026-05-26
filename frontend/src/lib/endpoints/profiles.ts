export const PROFILES = {
    GET_ALL: "/profiles",
    GET_BY_ID: (userId: string) => `/profiles/${userId}`,
    CREATE: (userId: string) => `/profiles/${userId}`,
    UPDATE: (userId: string) => `/profiles/${userId}`,
    DELETE: (userId: string) => `/profiles/${userId}`,
    ASSIGN_CLASS: (userId: string, classId: string) => `/profiles/${userId}/classes/${classId}`
} as const;