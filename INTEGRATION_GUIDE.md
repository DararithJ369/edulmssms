# SMS + LMS Backend & Frontend Integration Guide

## Overview
This document provides a complete integration guide for the SMS (Student Management System) + LMS (Learning Management System) platform, connecting your FastAPI backend with React TypeScript frontend.

---

## Table of Contents
1. [Architecture](#architecture)
2. [API Structure](#api-structure)
3. [Frontend Integration Points](#frontend-integration-points)
4. [Data Models](#data-models)
5. [Usage Examples](#usage-examples)
6. [Common Patterns](#common-patterns)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Architecture

### Backend (FastAPI)
- **Base URL**: `http://localhost:8000/api/v1`
- **Framework**: FastAPI + SQLAlchemy ORM
- **Database**: PostgreSQL/MySQL
- **Authentication**: JWT (Bearer tokens)

### Frontend (React + TypeScript)
- **Framework**: React 18 + Vite
- **State Management**: React hooks + Context API
- **API Client**: Axios with custom interceptor
- **Styling**: Tailwind CSS + shadcn/ui

### Data Flow
```
User Action → React Component
    ↓
useEffect/Event Handler
    ↓
API Call (axios instance)
    ↓
FastAPI Endpoint
    ↓
Database Query
    ↓
Response → State Update
    ↓
UI Render
```

---

## API Structure

### Base Configuration
```typescript
// File: src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Endpoint Definitions
```typescript
// File: src/lib/endpoints.ts
export const API = {
  AUTH: { LOGIN, LOGOUT, REFRESH },
  USERS: { GET_ALL, CREATE, GET_BY_ID, UPDATE, DELETE },
  COURSES: { GET_ALL, CREATE, GET_BY_ID, GET_LESSONS, ENROLL },
  // ... more endpoints
};
```

---

## Frontend Integration Points

### 1. User Management (People Pages)

#### Students Page
**File**: `src/pages/users/Students.tsx`

**Key Features**:
- List all students with pagination
- Search & filter by grade level, department
- View student profile
- Delete student

**API Integration**:
```typescript
// Fetch students
const { data } = await api.get(`${API.USERS.GET_STUDENTS}?page=${page}&limit=10`);

// Fetch individual student profile
const profileRes = await api.get(API.PROFILES.GET_BY_ID(student.id));

// Delete student
await api.delete(API.USERS.DELETE(deleteId));
```

**Related Models**: 
- `User` (base user data)
- `StudentProfile` (grade level, department)
- `Enrollment` (course enrollments)

---

#### Instructors Page
**File**: `src/pages/users/Instructors.tsx`

**Key Features**:
- List all instructors
- Search & filter by department
- View instructor profile
- Delete instructor

**API Integration**:
```typescript
// Fetch instructors
const { data } = await api.get(`${API.USERS.GET_INSTRUCTORS}?page=${page}&limit=10`);

// Fetch instructor profile
const profileRes = await api.get(API.PROFILES.GET_BY_ID(instructor.id));
```

**Related Models**:
- `User` (base user data)
- `InstructorProfile` (department, position, hire_date)
- `Course` (courses taught by instructor)

---

#### Parents Page
**File**: `src/pages/users/Parents.tsx`

**Key Features**:
- List all parents
- View parent profile
- Link/unlink students to parents

**API Integration**:
```typescript
// Fetch parents
const { data } = await api.get(`${API.USERS.GET_PARENTS}?page=${page}&limit=10`);

// Get linked students
const students = await api.get(API.PARENTS.GET_STUDENTS(parent.id));

// Link student to parent
await api.post(API.PARENTS.LINK_STUDENT(parent.id, student.id));

// Unlink student
await api.delete(API.PARENTS.UNLINK_STUDENT(parent.id, student.id));
```

**Related Models**:
- `User` (base user data)
- `ParentProfile` (occupation, emergency_phone)
- `ParentStudent` (junction table linking parents to students)

---

#### Admins Page
**File**: `src/pages/users/Admins.tsx`

**Key Features**:
- List all administrators
- Search admins
- Delete admin

**API Integration**:
```typescript
// Fetch admins
const { data } = await api.get(`${API.USERS.GET_ADMINS}?page=${page}&limit=10`);

// Delete admin
await api.delete(API.USERS.DELETE(admin.id));
```

**Related Models**:
- `User` (with role='admin')

---

### 2. Courses & Learning (LMS Pages)

#### CoursesDashboard
**File**: `src/pages/lms/CoursesDashboard.tsx`

**Key Features**:
- Dashboard statistics (total courses, lessons, reviews, workshops)
- Currently learning table (enrolled courses with progress)
- Recommended courses grid
- Search & category filtering

**API Integration**:
```typescript
// Fetch all courses
const coursesRes = await api.get(`${API.COURSES.GET_ALL}?limit=1000`);

// Fetch enrollments (currently learning)
const enrollmentsRes = await api.get(`${API.ENROLLMENTS.GET_ALL}?limit=1000`);

// Get course lessons
const lessons = await api.get(API.COURSES.GET_LESSONS(courseId));

// Enroll student in course
await api.post(API.COURSES.ENROLL(courseId), { student_id: userId });

// Unenroll student
await api.delete(API.COURSES.UNENROLL(courseId, studentId));
```

**Related Models**:
- `Course` (course metadata)
- `Enrollment` (student-course relationship)
- `Lesson` (course lessons)
- `Module` (course structure)

---

#### CourseDetail
**File**: `src/pages/lms/CourseDetail.tsx`

**Key Features**:
- Display single course with full details
- List lessons organized by modules
- Enroll/unenroll functionality

**API Integration**:
```typescript
// Get course details
const course = await api.get(API.COURSES.GET_BY_ID(courseId));

// Get course lessons
const lessons = await api.get(API.COURSES.GET_LESSONS(courseId));

// Get course students
const students = await api.get(API.COURSES.GET_STUDENTS(courseId));
```

---

### 3. Academic Management

#### Classes Page
**File**: `src/pages/academics/Classes.tsx`

**Key Features**:
- List all classes
- View class students
- Manage class sessions

**API Integration**:
```typescript
// Fetch classes
const classes = await api.get(API.CLASSES.GET_ALL);

// Get class students
const students = await api.get(API.CLASSES.GET_STUDENTS(classId));

// Add student to class
await api.post(API.CLASSES.ADD_STUDENT(classId, studentId));

// Remove student from class
await api.delete(API.CLASSES.REMOVE_STUDENT(classId, studentId));

// Get class sessions
const sessions = await api.get(API.CLASSES.GET_SESSIONS(classId));

// Create session
await api.post(API.CLASSES.CREATE_SESSION(classId), sessionData);
```

---

#### Subjects Page
**File**: `src/pages/academics/Subjects.tsx`

**Key Features**:
- List all subjects
- View subject courses
- Create/update/delete subjects

**API Integration**:
```typescript
// Fetch subjects
const subjects = await api.get(API.SUBJECTS.GET_ALL);

// Get subject courses
const courses = await api.get(API.SUBJECTS.GET_COURSES(subjectId));

// Create subject
await api.post(API.SUBJECTS.CREATE, subjectData);

// Update subject
await api.put(API.SUBJECTS.UPDATE(subjectId), updatedData);

// Delete subject
await api.delete(API.SUBJECTS.DELETE(subjectId));
```

---

### 4. Settings & Configuration

#### Academic Years Page
**File**: `src/pages/settings/academic-year.tsx`

**Key Features**:
- List academic years
- Create/update/delete years
- Manage terms within each year

**API Integration**:
```typescript
// Fetch academic years
const years = await api.get(API.ACADEMIC_YEARS.GET_ALL);

// Get current year
const current = await api.get(API.ACADEMIC_YEARS.GET_CURRENT);

// Create year
await api.post(API.ACADEMIC_YEARS.CREATE, yearData);

// Get year terms
const terms = await api.get(API.ACADEMIC_YEARS.GET_TERMS(yearId));

// Create term
await api.post(API.ACADEMIC_YEARS.CREATE_TERM(yearId), termData);

// Update term
await api.put(API.ACADEMIC_YEARS.UPDATE_TERM(termId), updatedData);

// Delete term
await api.delete(API.ACADEMIC_YEARS.DELETE_TERM(termId));
```

---

## Data Models

### User & Profile Hierarchy
```
User (base user record)
├── StudentProfile (if role=student)
├── InstructorProfile (if role=instructor)
└── ParentProfile (if role=parent)
```

### Course Hierarchy
```
Course
├── Module[]
│   └── Lesson[]
│       └── Material[]
├── Quiz[]
├── Enrollment[] (students)
└── Subject (optional)
```

### Class Hierarchy
```
Class
├── Student[]
├── ClassSession[]
│   └── Attendance[]
└── Curriculum
```

### Assessment Hierarchy
```
Assignment
└── Submission[]

Quiz
├── QuizQuestion[]
│   └── QuizOption[]
└── Result[]

Exam
└── Result[]
```

---

## Usage Examples

### Example 1: Fetch Students with Profiles
```typescript
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { API } from '@/lib/endpoints';

export function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Fetch base student data
        const { data } = await api.get(API.USERS.GET_STUDENTS);
        
        // Fetch profiles for each student
        const withProfiles = await Promise.all(
          data.data.map(async (student) => {
            const profileRes = await api.get(API.PROFILES.GET_BY_ID(student.id));
            return {
              ...student,
              ...profileRes.data,
            };
          })
        );
        
        setStudents(withProfiles);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : <StudentList students={students} />}
    </div>
  );
}
```

---

### Example 2: Enroll Student in Course
```typescript
async function enrollStudent(courseId: number, studentId: string) {
  try {
    const response = await api.post(
      API.COURSES.ENROLL(courseId),
      { student_id: studentId }
    );
    
    console.log('Enrollment successful:', response.data);
    // Optionally refetch enrollments or show success toast
    
  } catch (error) {
    console.error('Enrollment failed:', error);
    // Show error toast
  }
}
```

---

### Example 3: Dashboard Stats with Dynamic Data
```typescript
const fetchDashboardStats = useCallback(async () => {
  try {
    const [coursesRes, enrollmentsRes] = await Promise.all([
      api.get(`${API.COURSES.GET_ALL}?limit=1000`),
      api.get(`${API.ENROLLMENTS.GET_ALL}?limit=1000`),
    ]);

    const courses = coursesRes.data.data || [];
    const enrollments = enrollmentsRes.data.data || [];

    setStats({
      totalCourses: courses.length,
      totalLessons: courses.reduce(
        (sum, c) => sum + Math.max(5, Math.ceil((c.duration || 10) / 2)),
        0
      ),
      totalReviews: enrollments.length,
      totalWorkshops: Math.floor(courses.length / 3),
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
}, []);
```

---

## Common Patterns

### 1. Pagination
```typescript
const [page, setPage] = useState(1);
const { data } = await api.get(`${API.COURSES.GET_ALL}?page=${page}&limit=12`);
const totalPages = Math.ceil(data.meta.total / data.meta.limit);
```

### 2. Search & Filter
```typescript
const params = new URLSearchParams({
  page: page.toString(),
  limit: '10',
});

if (search) params.append('search', search);
if (category) params.append('category', category);

const { data } = await api.get(`${API.COURSES.GET_ALL}?${params.toString()}`);
```

### 3. Debounced Search
```typescript
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
    setPage(1);
  }, 500);
  return () => clearTimeout(timer);
}, [search]);
```

### 4. Error Handling with Toast
```typescript
try {
  await api.post(API.USERS.CREATE, userData);
  toast.success('User created successfully');
} catch (error) {
  if (error.response?.status === 409) {
    toast.error('User already exists');
  } else {
    toast.error(error.response?.data?.message || 'Failed to create user');
  }
}
```

### 5. Batch Operations (Promise.all)
```typescript
const [enrollments, courses] = await Promise.all([
  api.get(API.ENROLLMENTS.GET_ALL),
  api.get(API.COURSES.GET_ALL),
]);
```

---

## Error Handling

### Axios Interceptor Setup
```typescript
// File: src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Component-Level Error Handling
```typescript
try {
  const data = await api.get(API.USERS.GET_ALL);
  setUsers(data.data);
} catch (error: any) {
  const message = error.response?.data?.detail || 'An error occurred';
  toast.error(message);
  console.error('API Error:', error);
}
```

---

## Best Practices

### 1. ✅ Use API Constants
```typescript
// Good
api.get(API.USERS.GET_ALL)

// Avoid
api.get('/users')
```

### 2. ✅ Parallel Data Fetching
```typescript
// Good - faster
const [users, courses] = await Promise.all([
  api.get(API.USERS.GET_ALL),
  api.get(API.COURSES.GET_ALL),
]);

// Avoid - slower
const users = await api.get(API.USERS.GET_ALL);
const courses = await api.get(API.COURSES.GET_ALL);
```

### 3. ✅ Proper State Management
```typescript
// Good - separate concerns
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Avoid
const [state, setState] = useState({ users: [], loading: false, error: null });
```

### 4. ✅ Debounce Search Input
```typescript
// Good - prevents excessive API calls
useEffect(() => {
  const timer = setTimeout(() => setDebounced(search), 500);
  return () => clearTimeout(timer);
}, [search]);

// Avoid - every keystroke = API call
onChange={(e) => fetchUsers(e.target.value)}
```

### 5. ✅ Type Safety with TypeScript
```typescript
// Good
interface Course {
  id: number;
  course_name: string;
  // ...
}

const course: Course = data;

// Avoid
const course: any = data;
```

### 6. ✅ Proper Cleanup
```typescript
// Good - prevent memory leaks
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  
  return () => { isMounted = false; };
}, []);
```

### 7. ✅ Loading & Empty States
```typescript
// Good
if (loading) return <Loader />;
if (data.length === 0) return <EmptyState />;
return <DataGrid data={data} />;

// Avoid
return <DataGrid data={data || []} />;
```

---

## Key Integration Endpoints by Feature

### User Management
- `GET /users` - Get all users
- `GET /users/{user_id}` - Get specific user
- `POST /users` - Create user
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

### Student Management
- `GET /users/students` - List students
- `GET /students/{user_id}/profile` - Get student profile
- `GET /students/{student_id}/grades` - Get student grades
- `GET /students/{student_id}/attendance` - Get attendance

### Course Management
- `GET /courses` - List courses
- `POST /courses/{course_id}/enroll` - Enroll in course
- `DELETE /courses/{course_id}/enroll/{student_id}` - Unenroll
- `GET /courses/{course_id}/lessons` - Get course lessons

### Class Management
- `GET /classes` - List classes
- `GET /classes/{class_id}/students` - Get class students
- `POST /classes/{class_id}/students/{student_id}` - Add student
- `DELETE /classes/{class_id}/students/{student_id}` - Remove student

### Academic Settings
- `GET /academic-years` - List academic years
- `GET /academic-years/{year_id}/terms` - Get year terms
- `POST /academic-years/{year_id}/terms` - Create term

---

## Testing Checklist

- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Pagination works correctly
- [ ] Search/filter returns expected results
- [ ] Error messages display properly
- [ ] Loading states show during API calls
- [ ] JWT token refreshes work
- [ ] Unauthorized requests redirect to login
- [ ] Data persists correctly after operations
- [ ] Profile pages show all nested data
- [ ] Batch operations complete successfully

---

## Troubleshooting

### Common Issues

**1. "401 Unauthorized"**
- Check if access_token exists in localStorage
- Verify JWT isn't expired
- Try logging in again

**2. "CORS Error"**
- Ensure backend has CORS enabled
- Check `Access-Control-Allow-Origin` header

**3. "Data not updating"**
- Verify API call completed successfully
- Check if response data structure matches interface
- Ensure state setter is called correctly

**4. "Slow page load"**
- Use `Promise.all()` for parallel requests
- Implement pagination for large datasets
- Add loading indicators

---

## Resources

- Backend API: `http://localhost:8000/docs`
- Swagger Docs: `http://localhost:8000/api/v1/docs`
- Frontend Docs: `src/lib/endpoints.ts`

---

## Next Steps

1. ✅ Review this guide
2. ✅ Check `src/lib/endpoints.ts` for all available endpoints
3. ✅ Review existing pages for integration patterns
4. ✅ Use the provided examples as templates
5. ✅ Test all CRUD operations
6. ✅ Implement error handling consistently

---

**Last Updated**: April 3, 2026
**Version**: 1.0
**Maintainers**: Development Team
