export const ASSIGNMENTS = {
    GET_ALL: "/assignments",
    CREATE: "/assignments",
    GET_BY_ID: (assignmentId: string) => `/assignments/${assignmentId}`,
    UPDATE: (assignmentId: string) => `/assignments/${assignmentId}`,
    DELETE: (assignmentId: string) => `/assignments/${assignmentId}`,
    GET_SUBMISSIONS: (assignmentId: string) => `/assignments/${assignmentId}/submissions`,
    SUBMIT: (assignmentId: string) => `/assignments/${assignmentId}/submit`,
} as const;