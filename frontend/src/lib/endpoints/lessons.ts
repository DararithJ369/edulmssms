export const LESSONS = {
    GET_ALL: "/lessons",
    CREATE: "/lessons",
    GET_BY_ID: (lessonId: string) => `/lessons/${lessonId}`,
    UPDATE: (lessonId: string) => `/lessons/${lessonId}`,
    DELETE: (lessonId: string) => `/lessons/${lessonId}`,
    GET_MATERIALS: (lessonId: string) => `/lessons/${lessonId}/materials`,
    ADD_MATERIAL: (lessonId: string) => `/lessons/${lessonId}/materials`,
    REMOVE_MATERIAL: (lessonId: string, materialId: string) => `/lessons/${lessonId}/materials/${materialId}`,
} as const;