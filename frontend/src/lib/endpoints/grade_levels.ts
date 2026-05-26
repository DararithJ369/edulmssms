export const GRADE_LEVELS = {
    SETUP_FORM: "/grade-levels/setup-form",
    GET_ALL: "/grade-levels",
    CREATE: "/grade-levels",
    GET_BY_ID: (gradeLevelId: string) => `/grade-levels/${gradeLevelId}`,
    UPDATE: (gradeLevelId: string) => `/grade-levels/${gradeLevelId}`,
    DELETE: (gradeLevelId: string) => `/grade-levels/${gradeLevelId}`,
    GET_CLASSES: (gradeLevelId: string) => `/grade-levels/${gradeLevelId}/classes`,
} as const;