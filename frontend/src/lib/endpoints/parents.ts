export const PARENTS = {
    SETUP_FORM: "/parents/setup-form",
    GET_ALL: "/parents",
    GET_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/parents/${userId}/profile`,
    GET_STUDENTS: (parentId: string) => `/parents/${parentId}/students`,
    LINK_STUDENT: (parentId: string, studentId: string) => `/parents/${parentId}/students/${studentId}`,
    UNLINK_STUDENT: (parentId: string, studentId: string) => `/parents/${parentId}/students/${studentId}`,
} as const; 