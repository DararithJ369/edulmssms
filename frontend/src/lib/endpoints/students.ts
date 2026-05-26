export const STUDENTS = {
    GET_PROFILE: (userId: string) => `/students/${userId}/profile`,
    CREATE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    UPDATE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    DELETE_PROFILE: (userId: string) => `/students/${userId}/profile`,
    GET_CLASSES: (userId: string) => `/students/${userId}/classes`,
    GET_GRADES: (studentId: string) => `/students/${studentId}/grades`,
    GET_ATTENDANCE: (studentId: string) => `/students/${studentId}/attendance`,
} as const;