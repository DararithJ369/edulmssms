export const INSTRUCTORS = {
    GET_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/instructors/${userId}/profile`,
    GET_CLASSES: (userId: string) => `/instructors/${userId}/classes`,
    GET_STUDENTS: (instructorId: string) => `/instructors/${instructorId}/students`,
} as const; 