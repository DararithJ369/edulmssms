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

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI Schema Aligned Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RoleNested {
  id: number;
  name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  role_id: number;
  role: RoleNested;
  image?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserProfileResponse {
  id: number;
  user_id: string;
  class_id?: number | null;
  full_name?: string | null;
  bio?: string | null;
  pfp?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  national_id?: string | null;
  nationality?: string | null;
  website?: string | null;
  linkedin?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  blood_type?: string | null;
  medical_conditions?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ParentProfileBasicProfile {
  user_id?: string | null;
}

export interface ParentProfileBasic {
  id: number;
  occupation?: string | null;
  parent_relationship?: string | null;
  emergency_phone?: string | null;
  full_name?: string | null;
  profile?: ParentProfileBasicProfile | null;
}

export interface StudentProfileNested {
  id: number;
  student_id?: string | null;
  department?: string | null;
  enrolment_date?: string | null;
  grade_level_id?: number | null;
  grade_level_name?: string | null;
  previous_school?: string | null;
  scholarship_status?: string | null;
  special_needs?: string | null;
  parents?: ParentProfileBasic[] | null;
  class_id?: number | null;
}

export interface StudentProfileResponse extends UserProfileResponse {
  student_profile?: StudentProfileNested | null;
}

export interface StudentNested {
  id: number;
  student_id?: string | null;
  department?: string | null;
  enrolment_date?: string | null;
  grade_level_id?: number | null;
  grade_level_name?: string | null;
  full_name?: string | null;
  profile?: ParentProfileBasicProfile | null;
}

export interface ParentProfileResponse {
  id: number;
  profile_id: number;
  occupation?: string | null;
  relationship?: string | null;
  emergency_phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  students?: StudentNested[];
}

export interface ParentFullResponse {
  id: number;
  user_id: string;
  class_id?: number | null;
  full_name?: string | null;
  bio?: string | null;
  pfp?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  national_id?: string | null;
  website?: string | null;
  linkedin?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  parent_profile?: ParentProfileResponse | null;
}

export interface InstructorProfileNested {
  id: number;
  department?: string | null;
  position?: string | null;
  office?: string | null;
  hire_date?: string | null;
}

export interface InstructorProfileResponse extends UserProfileResponse {
  instructor_profile?: InstructorProfileNested | null;
}

export interface ClassResponse {
  id: number;
  grade_id: number;
  supervisor_id: string;
  name: string;
  section?: string | null;
  room?: string | null;
  capacity?: number | null;
  academic_year: string;
  is_active?: boolean;
  created_at: string;
}

export interface AttendanceResponse {
  id: number;
  student_id: string;
  course_id: string;
  date: string;
  status: string; // present, absent, late
  time?: string | null;
  note?: string | null;
  recorded_by: string;
  created_at: string;
}

export interface AssignmentResponse {
  id: number;
  course_id: number;
  module_name?: string | null;
  title: string;
  description?: string | null;
  due_date: string;
  attachment_file?: string | null;
  teacher_id: string;
  created_at: string;
}

export interface ExamResponse {
  id: number;
  lesson_id: number;
  created_by: string;
  title: string;
  description?: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_marks?: number | null;
  pass_mark?: number | null;
  venue?: string | null;
  created_at: string;
}

export interface LessonResponse {
  id: number;
  title: string;
  content?: string | null;
  duration?: string | null;
  material_type?: string | null;
  material_url?: string | null;
  material_file?: string | null;
  order: number;
  created_at: string;
}

export interface ResultResponse {
  id: number;
  student_id: string;
  assignment_id?: number | null;
  exam_id?: number | null;
  graded_by: string;
  score: number;
  total_marks: number;
  percentage?: number | null;
  grade?: string | null;
  feedback?: string | null;
  is_passed?: boolean;
  graded_at: string;
}

export interface SubjectResponse {
  id: number;
  instructor_id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  credits?: number | null;
  hours_per_week?: number | null;
  is_active?: boolean;
  created_at: string;
}

export interface GradeLevelResponse {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}
