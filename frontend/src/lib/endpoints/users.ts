export const USERS = {
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
} as const;