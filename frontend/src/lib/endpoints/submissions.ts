export const SUBMISSIONS = {
    GET_ALL: "/submissions",
    CREATE: "/submissions",
    GET_BY_ID: (submissionId: string) => `/submissions/${submissionId}`,
    UPDATE: (submissionId: string) => `/submissions/${submissionId}`,
    DELETE: (submissionId: string) => `/submissions/${submissionId}`,
} as const;