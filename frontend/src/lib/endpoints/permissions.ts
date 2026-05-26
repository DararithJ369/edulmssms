export const PERMISSIONS = {
    GET_ALL: "/permissions",
    CREATE: "/permissions",
    GET_BY_ID: (permissionId: number) => `/permissions/${permissionId}`,
    UPDATE: (permissionId: number) => `/permissions/${permissionId}`,
    DELETE: (permissionId: number) => `/permissions/${permissionId}`,
} as const; 