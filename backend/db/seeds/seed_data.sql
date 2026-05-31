-- Seed data for LMS FastAPI project
-- Users (supervisors, teachers, students)
INSERT INTO users (id, username, email, hashed_password, is_active, is_superuser, created_at, updated_at)
VALUES
    ('318b410a-e7dc-49b2-a7aa-a7dbe854badb', 'supervisor1', 'supervisor1@example.com', 'hashedpwd', TRUE, FALSE, NOW(), NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'teacher1', 'teacher1@example.com', 'hashedpwd', TRUE, FALSE, NOW(), NOW()),
    ('b2c3d4e5-f6a7-8901-bcde-f234567890ab', 'student1', 'student1@example.com', 'hashedpwd', TRUE, FALSE, NOW(), NOW());

-- Profiles (link to users)
INSERT INTO user_profiles (id, user_id, full_name, avatar_url, class_id, created_at, updated_at)
VALUES
    (UUID(), '318b410a-e7dc-49b2-a7aa-a7dbe854badb', 'Supervisor One', NULL, NULL, NOW(), NOW()),
    (UUID(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Teacher One', NULL, NULL, NOW(), NOW()),
    (UUID(), 'b2c3d4e5-f6a7-8901-bcde-f234567890ab', 'Student One', NULL, NULL, NOW(), NOW());

-- Grades
INSERT INTO grades (id, name, created_at, updated_at)
VALUES
    (1, 'Grade 10', NOW(), NOW()),
    (2, 'Grade 11', NOW(), NOW());

-- Classes (link to grades and supervisors)
INSERT INTO classes (id, grade_id, supervisor_id, name, section, room, capacity, academic_year, is_active, created_at, updated_at)
VALUES
    (1, 1, '318b410a-e7dc-49b2-a7aa-a7dbe854badb', 'Grade 10', 'A', 'Room 101', 40, '2025-26', TRUE, NOW(), NOW()),
    (2, 2, '318b410a-e7dc-49b2-a7aa-a7dbe854badb', 'Grade 11', 'B', 'Room 102', 35, '2025-26', TRUE, NOW(), NOW());

-- Subjects (assign instructor later)
INSERT INTO subjects (id, name, description, created_at, updated_at)
VALUES
    (1, 'Mathematics', 'Core math curriculum', NOW(), NOW()),
    (2, 'English', 'Language and literature', NOW(), NOW());

-- Assign instructors to subjects (example relationship if exists)
-- Assuming a subject_instructors table with subject_id and instructor_id columns
INSERT INTO subject_instructors (subject_id, instructor_id)
VALUES
    (1, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    (2, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Students enrollment (example linking users to classes via profiles)
UPDATE user_profiles SET class_id = 1 WHERE user_id = 'b2c3d4e5-f6a7-8901-bcde-f234567890ab';
