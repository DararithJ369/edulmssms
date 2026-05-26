export const GRADES = {
    GET_ALL: "/grades",
    GET_BY_ID: (gradeId: string) => `/grades/${gradeId}`,
    CREATE: "/grades",
    UPDATE: (gradeId: string) => `/grades/${gradeId}`,
    DELETE: (gradeId: string) => `/grades/${gradeId}`,
} as const;