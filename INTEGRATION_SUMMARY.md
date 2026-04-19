# Backend to Frontend Integration Summary

## ✅ Completed Integration

Successfully integrated backend endpoints for **Classes, Courses, Assignments, Exams, and Lesson Materials** with the frontend.

---

## 📦 Hooks Created

### 1. **useClasses**
- **Location:** `frontend/src/hooks/useClasses.ts`
- **Features:**
  - Fetch paginated classes list
  - Create, update, delete classes
  - Automatic page management
  - Error handling with toast notifications
  - Uses `useRef` pattern to prevent duplicate API calls

### 2. **useCourses**
- **Location:** `frontend/src/hooks/useCourses.ts`
- **Features:**
  - Fetch paginated courses
  - Create, update, delete courses
  - Enroll/unenroll students (via direct API calls)
  - Get course lessons and students
  - Automatic refetch on mutations

### 3. **useAssignments**
- **Location:** `frontend/src/hooks/useAssignments.ts`
- **Features:**
  - Fetch assignments with pagination
  - Create assignments with file uploads
  - Update and delete assignments
  - Get assignment submissions
  - Student assignment submission
  - Multipart form data support

### 4. **useExams**
- **Location:** `frontend/src/hooks/useExams.ts`
- **Features:**
  - Fetch exams with pagination
  - Create, update, delete exams
  - Submit exam as student
  - Get exam results as instructor
  - Grade exam results
  - Full lifecycle management

### 5. **useLessons**
- **Location:** `frontend/src/hooks/useLessons.ts`
- **Features:**
  - Fetch lessons with pagination
  - Create, update, delete lessons
  - Add lesson materials with file uploads
  - Delete materials
  - Get course lessons
  - Support for PDFs, documents, videos

---

## 📚 API Endpoints Already Configured

All endpoints are available in `frontend/src/lib/endpoints.ts`:

### Classes
```typescript
API.CLASSES = {
  GET_ALL: "/classes",
  CREATE: "/classes",
  GET_BY_ID: (classId) => `/classes/${classId}`,
  UPDATE: (classId) => `/classes/${classId}`,
  DELETE: (classId) => `/classes/${classId}`,
  GET_STUDENTS: (classId) => `/classes/${classId}/students`,
  ADD_STUDENT: (classId, studentId) => `/classes/${classId}/students/${studentId}`,
  REMOVE_STUDENT: (classId, studentId) => `/classes/${classId}/students/${studentId}`,
  GET_SESSIONS: (classId) => `/classes/${classId}/sessions`,
  CREATE_SESSION: (classId) => `/classes/${classId}/sessions`,
  // ... more endpoints
}
```

### Courses
```typescript
API.COURSES = {
  GET_ALL: "/courses",
  CREATE: "/courses",
  GET_BY_ID: (courseId) => `/courses/${courseId}`,
  UPDATE: (courseId) => `/courses/${courseId}`,
  DELETE: (courseId) => `/courses/${courseId}`,
  GET_LESSONS: (courseId) => `/courses/${courseId}/lessons`,
  ENROLL: (courseId) => `/courses/${courseId}/enroll`,
  UNENROLL: (courseId, studentId) => `/courses/${courseId}/enroll/${studentId}`,
  GET_STUDENTS: (courseId) => `/courses/${courseId}/students`,
}
```

### Assignments
```typescript
API.ASSIGNMENTS = {
  GET_ALL: "/assignments",
  CREATE: "/assignments",
  GET_BY_ID: (assignmentId) => `/assignments/${assignmentId}`,
  UPDATE: (assignmentId) => `/assignments/${assignmentId}`,
  DELETE: (assignmentId) => `/assignments/${assignmentId}`,
  GET_SUBMISSIONS: (assignmentId) => `/assignments/${assignmentId}/submissions`,
  SUBMIT: (assignmentId) => `/assignments/${assignmentId}/submit`,
}
```

### Exams
```typescript
API.EXAMS = {
  GET_ALL: "/exams",
  CREATE: "/exams",
  GET_BY_ID: (examId) => `/exams/${examId}`,
  UPDATE: (examId) => `/exams/${examId}`,
  DELETE: (examId) => `/exams/${examId}`,
  SUBMIT: (examId) => `/exams/${examId}/submit`,
  GET_RESULTS: (examId) => `/exams/${examId}/results`,
  GRADE_RESULT: (resultId) => `/exams/results/${resultId}/grade`,
}
```

### Lessons
```typescript
API.LESSONS = {
  GET_ALL: "/lessons",
  CREATE: "/lessons",
  GET_BY_ID: (lessonId) => `/lessons/${lessonId}`,
  UPDATE: (lessonId) => `/lessons/${lessonId}`,
  DELETE: (lessonId) => `/lessons/${lessonId}`,
  GET_MATERIALS: (lessonId) => `/lessons/${lessonId}/materials`,
  ADD_MATERIAL: (lessonId) => `/lessons/${lessonId}/materials`,
  DELETE_MATERIAL: (materialId) => `/lessons/materials/${materialId}`,
}
```

---

## 🔄 Pages Updated

### Classes.tsx
- **Before:** Manual fetch logic with useState
- **After:** Uses `useClasses` hook
- **Benefits:** 
  - Eliminated duplicate API calls
  - Automatic page management
  - Cleaner component code

### Exams.tsx
- **Before:** Manual fetch with useEffect
- **After:** Uses `useExams` hook
- **Benefits:**
  - Pagination support added
  - Automatic refetch on operations
  - Better error handling

---

## 💻 Usage Examples

### Using useClasses Hook
```typescript
import { useClasses } from "@/hooks/useClasses";

export function MyComponent() {
  const { classes, meta, loading, error, createClass, updateClass, deleteClass, setPage } = useClasses();

  const handleCreate = async () => {
    const result = await createClass({
      name: "Class 10-A",
      description: "Advanced Science",
      grade_level_id: 10
    });
  };

  return (
    <div>
      {loading ? <Loader /> : (
        <div>
          {classes.map(cls => (
            <div key={cls.id}>{cls.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Using useAssignments with File Upload
```typescript
import { useAssignments } from "@/hooks/useAssignments";

export function CreateAssignment() {
  const { createAssignment } = useAssignments();

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("course_id", "5");
    formData.append("title", "Problem Set 1");
    formData.append("file", file);
    
    const result = await createAssignment(formData);
  };

  return <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />;
}
```

### Direct API Calls
```typescript
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";

// When you need custom endpoints not covered by hooks
const getClassStudents = async (classId: number) => {
  const { data } = await api.get(API.CLASSES.GET_STUDENTS(classId));
  return data;
};

const enrollStudent = async (courseId: number, studentId: string) => {
  const { data } = await api.post(API.COURSES.ENROLL(courseId), {
    student_id: studentId
  });
  return data;
};
```

---

## 🎯 Key Features

✅ **No Duplicate API Calls**
- Uses `useRef` initialization guards
- Follows React best practices
- Works with React StrictMode

✅ **Automatic Data Refetching**
- After create/update/delete operations
- Keeps UI in sync with backend

✅ **Pagination Support**
- Built-in page state management
- `setPage()` for navigation
- Meta information (total, limit, current page)

✅ **Error Handling**
- Toast notifications for errors
- Error state accessible in components
- Consistent error messages

✅ **File Upload Support**
- Multipart form data handling
- Works with assignments and lessons
- Automatic axios configuration

✅ **TypeScript Type Safety**
- Full type definitions for all hooks
- IntelliSense support
- Compile-time type checking

---

## 📝 Additional Resources

- **Integration Guide:** `frontend/src/lib/academic-integration-examples.ts`
- **Endpoints Reference:** `frontend/src/lib/endpoints.ts`
- **Generic Hook:** `frontend/src/hooks/useFetchList.ts` (reusable pattern)

---

## 🚀 Next Steps

To use these hooks in your components:

1. Import the hook:
   ```typescript
   import { useClasses } from "@/hooks/useClasses";
   ```

2. Use in component:
   ```typescript
   const { classes, loading, createClass } = useClasses();
   ```

3. Call operations:
   ```typescript
   await createClass({ name: "Class Name" });
   ```

All hooks follow the same pattern for consistency and ease of use.
