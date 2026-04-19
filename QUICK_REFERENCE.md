# Quick Reference: Academic Features Hooks

## Import Statements

```typescript
import { useClasses } from "@/hooks/useClasses";
import { useCourses } from "@/hooks/useCourses";
import { useAssignments } from "@/hooks/useAssignments";
import { useExams } from "@/hooks/useExams";
import { useLessons } from "@/hooks/useLessons";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";
```

---

## Hook Return Values (All Hooks Follow This Pattern)

```typescript
const {
  // Data
  data,                    // Array of items
  meta,                    // { page: number, total: number, limit: number }
  
  // State
  loading,                 // boolean
  error,                   // string | null
  
  // Operations
  fetchData,              // () => Promise<void>
  createData,             // (data) => Promise<Item | null>
  updateData,             // (id, data) => Promise<Item | null>
  deleteData,             // (id) => Promise<boolean>
  
  // Pagination
  setPage,                // (page: number) => void
  
  // Special (varies by hook)
  // ... exam-specific: submitExam, getExamResults, gradeResult
  // ... lesson-specific: addMaterial, deleteMaterial
  // ... assignment-specific: submitAssignment, getSubmissions
} = useHook();
```

---

## Classes

```typescript
const { classes, meta, loading, fetchClasses, createClass, updateClass, deleteClass, setPage } = useClasses();

// Create
await createClass({
  name: "Class 10-A",
  description: "...",
  grade_level_id: 10,
  instructor_id: "..."
});

// Update
await updateClass(classId, { name: "Updated Name" });

// Delete
await deleteClass(classId);

// Pagination
setPage(2);
```

---

## Courses

```typescript
const { courses, meta, loading, fetchCourses, createCourse, updateCourse, deleteCourse, setPage } = useCourses();

// Create
await createCourse({
  name: "Physics 101",
  code: "PHYS101",
  instructor_id: "...",
  credits: 3
});

// Update
await updateCourse(courseId, { name: "Updated" });

// Delete
await deleteCourse(courseId);

// Direct API for nested resources
await api.get(API.COURSES.GET_LESSONS(courseId));
await api.post(API.COURSES.ENROLL(courseId), { student_id: "..." });
```

---

## Assignments

```typescript
const { assignments, meta, loading, createAssignment, updateAssignment, deleteAssignment } = useAssignments();

// Create with file
const formData = new FormData();
formData.append("course_id", "5");
formData.append("title", "Problem Set 1");
formData.append("description", "Solve these...");
formData.append("due_date", "2025-04-15");
formData.append("total_marks", "100");
formData.append("file", fileObject);
await createAssignment(formData);

// Update with file
const updateFormData = new FormData();
updateFormData.append("title", "Updated Title");
updateFormData.append("file", newFile);
await updateAssignment(assignmentId, updateFormData);

// Delete
await deleteAssignment(assignmentId);

// Student submission
await api.post(API.ASSIGNMENTS.SUBMIT(assignmentId), {
  content: "My solution",
  file: fileObject
});

// Get submissions (instructor only)
await api.get(API.ASSIGNMENTS.GET_SUBMISSIONS(assignmentId));
```

---

## Exams

```typescript
const { exams, meta, loading, createExam, updateExam, deleteExam, submitExam, getExamResults } = useExams();

// Create
await createExam({
  title: "Midterm Exam",
  description: "...",
  total_marks: 100,
  start_date: "2025-04-01T10:00:00",
  end_date: "2025-04-01T12:00:00"
});

// Update
await updateExam(examId, { title: "Updated" });

// Delete
await deleteExam(examId);

// Submit exam (as student)
await submitExam(examId, { questions_answers: [...] });

// Get results (as instructor)
const results = await getExamResults(examId);

// Grade result (direct API)
await api.put(API.EXAMS.GRADE_RESULT(resultId), {
  score: 85,
  notes: "Good effort"
});
```

---

## Lessons & Materials

```typescript
const { lessons, meta, loading, createLesson, updateLesson, deleteLesson, addMaterial, deleteMaterial } = useLessons();

// Create lesson
await createLesson({
  course_id: 5,
  title: "Introduction to Algebra",
  description: "...",
  content: "HTML or markdown content",
  order: 1
});

// Update lesson
await updateLesson(lessonId, { title: "Updated" });

// Delete lesson
await deleteLesson(lessonId);

// Add material (with file)
const materialFormData = new FormData();
materialFormData.append("title", "Lecture Notes");
materialFormData.append("description", "Complete notes");
materialFormData.append("file", pdfFile);
await addMaterial(lessonId, materialFormData);

// Delete material
await deleteMaterial(materialId);

// Get course lessons (direct API)
await api.get(API.COURSES.GET_LESSONS(courseId));
```

---

## Pagination Example

```typescript
function MyList() {
  const { data, meta, setPage } = useClasses();

  return (
    <div>
      {/* Show current data */}
      {data.map(item => <div key={item.id}>{item.name}</div>)}
      
      {/* Pagination controls */}
      <div>
        <button onClick={() => setPage(meta.page - 1)} disabled={meta.page === 1}>
          Previous
        </button>
        <span>{meta.page} of {Math.ceil(meta.total / meta.limit)}</span>
        <button onClick={() => setPage(meta.page + 1)} disabled={meta.page * meta.limit >= meta.total}>
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Error Handling

```typescript
function MyComponent() {
  const { data, loading, error } = useClasses();

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return <div>{data.length} items</div>;
}
```

---

## File Upload Best Practices

```typescript
// Always use FormData for files
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("title", "My Document");
  formData.append("description", "Description");
  formData.append("file", file);
  
  await createAssignment(formData);  // Hook handles multipart headers
};

// For multiple files
const handleMultipleFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);  // Same field name for multiple
  });
  await api.post("/upload", formData);
};
```

---

## Common Patterns

### Refetch manually
```typescript
const { fetchClasses } = useClasses();
await fetchClasses();  // Triggered automatically after mutations anyway
```

### Watch for loading state
```typescript
{loading && <Spinner />}
{!loading && data.map(...)}
```

### Handle success/error with toast
```typescript
const { createClass } = useClasses();

const handleCreate = async () => {
  const result = await createClass(data);
  // Toast is shown automatically!
  // Error: toast.error(message)
  // Success: toast.success("... successfully")
};
```

---

## TypeScript Types

```typescript
import type { Class } from "@/hooks/useClasses";
import type { Course } from "@/hooks/useCourses";
import type { Assignment } from "@/hooks/useAssignments";
import type { Exam } from "@/hooks/useExams";
import type { Lesson, LessonMaterial } from "@/hooks/useLessons";

function MyComponent() {
  const item: Class = { id: 1, name: "A", ... };
  return <div>{item.name}</div>;
}
```

---

## API Endpoint Reference

All endpoints are constants to prevent typos:

```typescript
API.CLASSES.CREATE          // "/classes"
API.CLASSES.GET_BY_ID(5)    // "/classes/5"
API.CLASSES.GET_STUDENTS(5) // "/classes/5/students"

API.COURSES.GET_LESSONS(3)  // "/courses/3/lessons"
API.ASSIGNMENTS.SUBMIT(10)  // "/assignments/10/submit"
API.EXAMS.GET_RESULTS(7)    // "/exams/7/results"
API.LESSONS.ADD_MATERIAL(4) // "/lessons/4/materials"
```

---

## Performance Tips

✅ **Already Optimized (Built into Hooks):**
- No duplicate API calls (useRef pattern)
- Automatic refetch on mutations
- Memoized fetch functions
- Proper dependency management

✅ **Use These for Better UX:**
- Show loading spinner while fetching
- Display error messages clearly
- Debounce search inputs
- Paginate large lists
- Cache results when possible

❌ **Avoid:**
- Calling hooks multiple times for same data (breaks memoization)
- Not handling errors
- Direct DOM manipulation
- Sync API calls in useEffect

