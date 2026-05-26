export const QUIZZES = {
    GET_ALL: "/quizzes",
    CREATE: "/quizzes",
    GET_BY_ID: (quizId: string) => `/quizzes/${quizId}`,
    UPDATE: (quizId: string) => `/quizzes/${quizId}`,
    DELETE: (quizId: string) => `/quizzes/${quizId}`,
    GET_QUESTIONS: (quizId: string) => `/quizzes/${quizId}/questions`,
    ADD_QUESTION: (quizId: string) => `/quizzes/${quizId}/questions`,
    REMOVE_QUESTION: (quizId: string, questionId: string) => `/quizzes/${quizId}/questions/${questionId}`,
    SUBMIT: (quizId: string) => `/quizzes/${quizId}/submit`,
    GET_RESULTS: (quizId: string) => `/quizzes/${quizId}/results`,
} as const;