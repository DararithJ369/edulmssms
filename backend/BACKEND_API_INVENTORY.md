# Backend API Inventory

## Overview
- **Framework:** FastAPI
- **API prefix:** `/api/v1`
- **App entry:** `backend/app/main.py`
- **Static assets:** `/uploads` and `/public`
- **Root page:** `GET /` serves `app/index.html`

## Endpoint Map

### Auth (`/api/v1`)
- `POST /login`
- `POST /refresh`
- `POST /logout`

### Users (`/api/v1/users`)
- `GET /setup-form`
- `GET /me`
- `GET /students`
- `GET /instructors`
- `GET /parents`
- `GET /admins`
- `POST /`
- `GET /`
- `GET /{user_id}`
- `PUT /{user_id}`
- `DELETE /{user_id}`

### Profiles (`/api/v1/profiles`)
- `GET /`
- `GET /{user_id}`
- `POST /{user_id}`
- `PUT /{user_id}`
- `DELETE /{user_id}`
- `PATCH /{user_id}/image`

### Student Profiles (`/api/v1/students`)
- `GET /{user_id}/profile`
- `POST /{user_id}/profile`
- `PUT /{user_id}/profile`
- `DELETE /{user_id}/profile`
- `GET /{user_id}/classes`
- `GET /{student_id}/grades`
- `GET /{student_id}/attendance`

### Instructor Profiles (`/api/v1/instructors`)
- `GET /{user_id}/profile`
- `POST /{user_id}/profile`
- `PUT /{user_id}/profile`
- `DELETE /{user_id}/profile`
- `GET /{user_id}/classes`
- `GET /{instructor_id}/students`

### Parent Profiles (`/api/v1/parents`)
- `GET /setup-form`
- `GET /`
- `GET /{user_id}/profile`
- `POST /{user_id}/profile`
- `PUT /{user_id}/profile`
- `DELETE /{user_id}/profile`
- `GET /{user_id}/students`
- `POST /{parent_id}/students/{student_id}`
- `DELETE /{parent_id}/students/{student_id}`

### Academic Years (`/api/v1/academic-years`)
- `GET /setup-form`
- `GET /current`
- `GET /`
- `POST /`
- `GET /{year_id}`
- `PUT /{year_id}`
- `DELETE /{year_id}`
- `GET /{year_id}/terms`
- `POST /{year_id}/terms`
- `PUT /terms/{term_id}`
- `DELETE /terms/{term_id}`

### Grade Levels (`/api/v1/grade-levels`)
- `GET /setup-form`
- `GET /`
- `POST /`
- `GET /{level_id}`
- `PUT /{level_id}`
- `DELETE /{level_id}`
- `GET /{level_id}/classes`

### Grades (`/api/v1`)
- `GET /grades`
- `POST /grades`
- `PUT /grades/{grade_id}`
- `DELETE /grades/{grade_id}`
- `GET /students/{student_id}/grades`

### Classes (`/api/v1/classes`)
- `GET /`
- `GET /{class_id}`
- `POST /`
- `PUT /{class_id}`
- `DELETE /{class_id}`
- `GET /{class_id}/students`
- `POST /{class_id}/students/{student_id}`
- `DELETE /{class_id}/students/{student_id}`
- `GET /{class_id}/sessions`
- `POST /{class_id}/sessions`

### Subjects (`/api/v1/subjects`)
- `GET /setup-form`
- `GET /`
- `POST /`
- `GET /{subject_id}`
- `PUT /{subject_id}`
- `DELETE /{subject_id}`
- `GET /{subject_id}/courses`

### Courses (`/api/v1/courses`)
- `GET /`
- `GET /{course_id}`
- `POST /`
- `PUT /{course_id}`
- `DELETE /{course_id}`
- `GET /{course_id}/lessons`
- `POST /{course_id}/enroll`
- `DELETE /{course_id}/enroll/{student_id}`
- `GET /{course_id}/students`

### Course Management (`/api/v1/courses-management`)
- `GET /`
- `POST /{course_id}/modules`
- `POST /modules/{module_id}/lessons`
- `PUT /lessons/{lesson_id}`
- `DELETE /modules/{module_id}`
- `DELETE /lessons/{lesson_id}`

### Lessons (`/api/v1/lessons`)
- `GET /`
- `GET /{lesson_id}`
- `POST /`
- `PUT /{lesson_id}`
- `DELETE /{lesson_id}`
- `DELETE /materials/{material_id}`
- `POST /{lesson_id}/materials`

### Assignments (`/api/v1/assignments`)
- `GET /`
- `GET /{assignment_id}`
- `POST /`
- `PUT /{assignment_id}`
- `DELETE /{assignment_id}`
- `GET /{assignment_id}/submissions`
- `POST /{assignment_id}/submit`

### Quizzes (`/api/v1/quizzes`)
- `GET /`
- `GET /{quiz_id}`
- `POST /`
- `PUT /{quiz_id}`
- `DELETE /{quiz_id}`
- `POST /{quiz_id}/submit`
- `GET /{quiz_id}/results`

### Exams (`/api/v1/exams`)
- `GET /`
- `GET /{exam_id}`
- `POST /`
- `PUT /{exam_id}`
- `DELETE /{exam_id}`
- `POST /{exam_id}/submit`
- `GET /{exam_id}/results`

### Results (`/api/v1/results`)
- `GET /`
- `GET /{result_id}`
- `POST /`
- `PUT /{result_id}`
- `DELETE /{result_id}`

### Enrollments (`/api/v1/enrollments`)
- `GET /`
- `GET /{enrollment_id}`
- `POST /`
- `PUT /{enrollment_id}`
- `DELETE /{enrollment_id}`
- `POST /checkout`

### Attendance (`/api/v1`)
- `GET /attendance`
- `POST /attendance`
- `GET /attendance/{attendance_id}`
- `PUT /attendance/{attendance_id}`
- `DELETE /attendance/{attendance_id}`
- `GET /students/{student_id}/attendance`

### Submissions (`/api/v1/submissions`)
- `GET /`
- `GET /{submission_id}`
- `POST /`
- `PUT /{submission_id}`
- `DELETE /{submission_id}`

### Finance (`/api/v1/finance`)
- `GET /fees`
- `POST /fees`
- `PUT /fees/{fee_id}`
- `DELETE /fees/{fee_id}`
- `GET /expenses`
- `POST /expenses`
- `PUT /expenses/{expense_id}`
- `DELETE /expenses/{expense_id}`
- `GET /salary`
- `POST /salary`
- `PUT /salary/{salary_id}`
- `DELETE /salary/{salary_id}`

### Roles and Permissions (`/api/v1`)
- `GET /roles`
- `POST /roles`
- `PUT /roles/{role_id}`
- `DELETE /roles/{role_id}`
- `GET /roles/{role_id}/permissions`
- `PUT /roles/{role_id}/permissions`
- `GET /permissions`
- `POST /permissions`
- `PUT /permissions/{permission_id}`
- `DELETE /permissions/{permission_id}`

### Dashboard (`/api/v1/dashboard`)
- `GET /stats`

## Entities and Attributes

### `User`
- `id` (string, PK)
- `username` (unique)
- `email` (unique)
- `hashed_password`
- `image` (nullable)
- `is_active`
- `is_superuser`
- `role_id` (FK to `roles.id`)
- `created_at`
- `updated_at`

### `Role`
- `id` (PK)
- `name` (unique)
- `description`
- `is_active`

### `Permission`
- `id` (PK)
- `key` (unique)
- `description`
- `is_active`
- `created_at`
- `updated_at`

### `RolePermission`
- `id` (PK)
- `role_id` (FK)
- `permission_id` (FK)
- `created_at`

### `AcademicYear`
- `id` (PK)
- `name` (unique)
- `start_date`
- `end_date`
- `is_current`
- `is_active`
- `created_at`
- `updated_at`

### `Term`
- `id` (PK)
- `academic_year_id` (FK)
- `name`
- `start_date`
- `end_date`
- `is_current`
- `is_active`
- `created_at`
- `updated_at`

### `GradeLevel`
- `id` (PK)
- `name` (unique)
- `code` (unique, nullable)
- `description`
- `order`
- `is_active`
- `created_at`
- `updated_at`

### `Grade`
- `id` (PK)
- `name`
- `level`
- `description`
- `created_at`

### `Class`
- `id` (PK)
- `grade_id` (FK)
- `supervisor_id` (FK to `users.id`)
- `name`
- `section`
- `room`
- `capacity`
- `academic_year`
- `is_active`
- `created_at`
- `updated_at`

### `Subject`
- `id` (PK)
- `instructor_id` (FK to `users.id`)
- `name` (unique)
- `code`
- `description`
- `credits`
- `hours_per_week`
- `is_active`
- `created_at`

### `Curriculum`
- `id` (PK)
- `grade_level_id` (FK)
- `subject_id` (FK)
- `is_core`
- `hours_per_week`

### `Course`
- `id` (PK)
- `course_name`
- `course_code` (unique)
- `description`
- `category`
- `duration`
- `price`
- `max_students`
- `difficulty`
- `instructor_name`
- `instructor_id` (FK to `users.id`)
- `subject_id` (FK to `subjects.id`, nullable)
- `thumbnail`
- `enrollment_status`
- `student_enrolled`
- `has_modules`
- `has_quizzes`
- `certificate_offered`
- `certificate_title`
- `certificate_description`
- `is_published`
- `created_at`
- `updated_at`

### `Module`
- `id` (PK)
- `course_id` (FK)
- `title`
- `description`
- `order`
- `created_at`

### `Lesson`
- `id` (PK)
- `module_id` (FK)
- `title`
- `description`
- `content`
- `duration`
- `material_type`
- `material_url`
- `material_file`
- `order`
- `created_at`

### Legacy `Lesson` model
- `id` (PK)
- `title`
- `content`
- `duration`
- `material_type`
- `material_url`
- `material_file`
- `order`
- `module_id` (FK)
- `created_at`
- `updated_at`

### `LessonMaterial`
- `id` (PK)
- `lesson_id` (FK)
- `uploaded_by` (FK to `users.id`)
- `title`
- `description`
- `file_url`
- `type`
- `file_size`
- `is_visible`
- `uploaded_at`

### `ClassSession`
- `id` (PK)
- `class_id` (FK)
- `subject_id` (FK)
- `teacher_id` (FK to `users.id`)
- `title`
- `description`
- `date`
- `start_time`
- `end_time`
- `room`
- `status`
- `created_at`

### `Enrollment`
- `id` (PK)
- `student_profile_id` (FK)
- `course_id` (FK)
- `grade_level_id` (FK, nullable)
- `academic_year_id` (FK)
- `term_id` (FK, nullable)
- `is_active`
- `enrolled_date`
- `dropped_date`
- `payment_status`
- `payment_id`
- `amount_paid`
- `created_at`
- `updated_at`

### `UserProfile`
- `id` (PK)
- `user_id` (FK to `users.id`, unique)
- `class_id` (FK to `classes.id`, nullable)
- `full_name`
- `image`
- `phone`
- `address`
- `bio`
- `date_of_birth`
- `gender`
- `national_id`
- `nationality`
- `website`
- `linkedin`
- `emergency_contact_name`
- `emergency_contact_phone`
- `emergency_contact_relationship`
- `blood_type`
- `medical_conditions`
- `created_at`
- `updated_at`

### `StudentProfile`
- `id` (PK)
- `profile_id` (FK to `user_profiles.id`, unique)
- `grade_level_id` (FK)
- `student_id`
- `department`
- `enrolment_date`
- `previous_school`
- `scholarship_status`
- `special_needs`
- `created_at`
- `updated_at`

### `InstructorProfile`
- `id` (PK)
- `profile_id` (FK to `user_profiles.id`, unique)
- `department`
- `position`
- `office`
- `hire_date`
- `created_at`
- `updated_at`

### `ParentProfile`
- `id` (PK)
- `profile_id` (FK to `user_profiles.id`, unique)
- `occupation`
- `parent_relationship`
- `emergency_phone`
- `created_at`
- `updated_at`

### `ParentStudent` association
- `parent_profile_id` (FK to `parent_profiles.id`)
- `student_profile_id` (FK to `student_profiles.id`)

### `Quiz`
- `id` (PK)
- `module_name`
- `title`
- `description`
- `due_date`
- `course_id` (FK)
- `instructor_id` (FK to `users.id`)
- `created_at`
- `updated_at`

### `QuizQuestion`
- `id` (PK)
- `quiz_id` (FK)
- `question_text`

### `QuizOption`
- `id` (PK)
- `question_id` (FK)
- `option_text`
- `is_correct`

### `Exam`
- `id` (PK)
- `lesson_id` (FK)
- `created_by` (FK to `users.id`)
- `title`
- `description`
- `exam_date`
- `start_time`
- `end_time`
- `duration`
- `total_marks`
- `pass_mark`
- `venue`
- `created_at`

### `Assignment`
- `id` (PK)
- `module_name`
- `title`
- `description`
- `due_date`
- `attachment_file`
- `course_id` (FK)
- `teacher_id` (FK to `users.id`)
- `created_at`
- `updated_at`

### `Result`
- `id` (PK)
- `student_id` (FK to `users.id`)
- `assignment_id` (FK, nullable)
- `exam_id` (FK, nullable)
- `quiz_id` (FK, nullable)
- `graded_by` (FK to `users.id`)
- `score`
- `total_marks`
- `percentage`
- `grade`
- `feedback`
- `is_passed`
- `graded_at`

### `Submission`
- `id` (PK)
- `submission_type`
- `reference_id`
- `student_id` (FK to `users.id`)
- `submission_file`
- `submission_text`
- `submitted_at`
- `status`
- `score`
- `graded_at`
- `feedback`
- `created_at`
- `updated_at`

### `Attendance`
- `id` (PK)
- `student_id` (FK to `users.id`)
- `course_id` (FK)
- `date`
- `status`
- `time`
- `note`
- `recorded_by` (FK to `users.id`)
- `created_at`
- `updated_at`

### `FeeCollection`
- `id` (PK)
- `student_name`
- `reference`
- `amount`
- `status`
- `paid_date`
- `notes`
- `created_at`
- `updated_at`

### `Expense`
- `id` (PK)
- `title`
- `category`
- `amount`
- `spent_date`
- `notes`
- `created_at`
- `updated_at`

### `Salary`
- `id` (PK)
- `staff_name`
- `role`
- `month`
- `amount`
- `status`
- `paid_date`
- `notes`
- `created_at`
- `updated_at`

### `Certificate`
- `id` (PK)
- `title`
- `description`
- `course_id` (FK)
- `template`
- `created_at`
- `updated_at`

### `StudentCertificate`
- `id` (PK)
- `certificate_id` (FK)
- `student_id` (FK to `users.id`)
- `course_id` (FK)
- `issued_date`
- `completion_date`
- `credential_id` (unique)
- `certificate_url`
- `status`

## Notes
- Some modules have both newer and legacy model definitions, especially `Course`/`Module`/`Lesson`.
- Route protection is mixed: some endpoints require `PermissionGuard.admin_only` or `admin_or_instructor`.
- The note reflects the current code layout observed in `backend/app/models` and `backend/app/routes`.
