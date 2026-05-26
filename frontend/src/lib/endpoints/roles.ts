export const ROLES = {
    GET_ALL: "/roles",
    CREATE: "/roles",
    UPDATE: (roleId: number) => `/roles/${roleId}`,
    DELETE: (roleId: number) => `/roles/${roleId}`,
    GET_PERMISSIONS: (roleId: number) => `/roles/${roleId}/permissions`,
    SET_PERMISSIONS: (roleId: number) => `/roles/${roleId}/permissions`,
} as const;