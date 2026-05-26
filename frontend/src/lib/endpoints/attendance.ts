export const ATTENDANCE = {
    GET_ALL: "/attendance",
    CREATE: "/attendance",
    GET_BY_ID: (attendanceId: string) => `/attendance/${attendanceId}`,
    UPDATE: (attendanceId: string) => `/attendance/${attendanceId}`,
    DELETE: (attendanceId: string) => `/attendance/${attendanceId}`,
} as const;