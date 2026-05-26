export const ACADEMIC_YEARS = {
    SETUP_FORM: "/academic-years/setup-form",
    GET_ALL: "/academic-years",
    CREATE: "/academic-years",
    GET_BY_ID: (yearId: string) => `/academic-years/${yearId}`,
    UPDATE: (yearId: string) => `/academic-years/${yearId}`,
    DELETE: (yearId: string) => `/academic-years/${yearId}`,
    GET_TERMS: (yearId: string) => `/academic-years/${yearId}/terms`,
    CREATE_TERM: (yearId: string) => `/academic-years/${yearId}/terms`,
    GET_TERM_BY_ID: (yearId: string, termId: string) => `/academic-years/${yearId}/terms/${termId}`,
    UPDATE_TERM: (yearId: string, termId: string) => `/academic-years/${yearId}/terms/${termId}`,
    DELETE_TERM: (yearId: string, termId: string) => `/academic-years/${yearId}/terms/${termId}`,
} as const;