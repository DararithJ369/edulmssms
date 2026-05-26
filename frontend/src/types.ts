export type UserRole = "admin" | "instructor" | "student" | "parent";

export interface user {
  _id: string;
  name: string;
  email: string;
  role: UserRole | string;
}

export interface academicYear {
  _id: string;
  name: string;
  fromYear?: string | Date;
  toYear?: string | Date;
  isCurrent?: boolean;
}
