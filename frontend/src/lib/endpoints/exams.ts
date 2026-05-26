export const EXAMS = {
    GET_ALL: "/exams",
    CREATE: "/exams",
    GET_BY_ID: (examId: string) => `/exams/${examId}`,
    UPDATE: (examId: string) => `/exams/${examId}`,
    DELETE: (examId: string) => `/exams/${examId}`,
    SUBMIT: (examId: string) => `/exams/${examId}/submit`,
    GET_RESULTS: (examId: string) => `/exams/${examId}/results`,
    ADD_RESULT: (examId: string) => `/exams/${examId}/results`,
    REMOVE_RESULT: (examId: string, resultId: string) => `/exams/${examId}/results/${resultId}`,
    GRADE_RESULT: (examId: string, resultId: string) => `/exams/${examId}/results/${resultId}/grade`,
} as const;