export const RESULTS = {
    GET_ALL: "/results",
    CREATE: "/results",
    GET_BY_ID: (resultId: string) => `/results/${resultId}`,
    UPDATE: (resultId: string) => `/results/${resultId}`,
    DELETE: (resultId: string) => `/results/${resultId}`,
} as const;