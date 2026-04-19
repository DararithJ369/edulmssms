/**
 * Learning/Lessons Page Integration Guide
 * 
 * Complete frontend-backend integration for the Lessons (Learning) page.
 * This page allows instructors to manage lessons and view learning materials.
 */

// ────────────────────────────────────────────────────────────────────────────
// 1. FILES CREATED
// ────────────────────────────────────────────────────────────────────────────

/**
 * Pages:
 * - frontend/src/pages/lms/Lessons.tsx
 *   Main page component for managing lessons
 *   - Fetch and display paginated lessons
 *   - Create, edit, delete lessons
 *   - Search lessons by title
 * 
 * Components:
 * - frontend/src/components/lms/LessonTable.tsx
 *   Table display for lessons with actions (edit/delete)
 *   - Read-only view for students
 *   - Full CRUD dropdown menu for instructors
 * 
 * - frontend/src/components/lms/LessonForm.tsx
 *   Form dialog for creating/editing lessons
 *   - Fields: title, description, content, course_id, order
 *   - Validation for required fields
 * 
 * Router:
 * - Updated frontend/src/pages/routes/router.tsx
 *   Added: { path: "lms/lessons", element: <Lessons /> }
 * 
 * Sidebar:
 * - Updated frontend/src/components/sidebar/AppSidebar.tsx
 *   Added: { title: "Lessons", url: "/lms/lessons" }
 */

// ────────────────────────────────────────────────────────────────────────────
// 2. BACKEND ENDPOINTS AVAILABLE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Base URL: /api/v1/lessons
 * 
 * Endpoints configured:
 * ✅ GET    /lessons                     - Get all lessons (paginated)
 * ✅ POST   /lessons                     - Create lesson (admin/instructor)
 * ✅ GET    /lessons/{lesson_id}         - Get single lesson
 * ✅ PUT    /lessons/{lesson_id}         - Update lesson (admin/instructor)
 * ✅ DELETE /lessons/{lesson_id}         - Delete lesson (admin/instructor)
 * ✅ GET    /lessons/{lesson_id}/materials - Get lesson materials
 * ✅ POST   /lessons/{lesson_id}/materials - Add material (admin/instructor)
 * ✅ DELETE /lessons/materials/{material_id} - Delete material (admin/instructor)
 * 
 * All endpoints in: frontend/src/lib/endpoints.ts
 * Constants:
 * - API.LESSONS.GET_ALL
 * - API.LESSONS.CREATE
 * - API.LESSONS.GET_BY_ID(id)
 * - API.LESSONS.UPDATE(id)
 * - API.LESSONS.DELETE(id)
 * - API.LESSONS.GET_MATERIALS(id)
 * - API.LESSONS.ADD_MATERIAL(id)
 * - API.LESSONS.DELETE_MATERIAL(id)
 */

// ────────────────────────────────────────────────────────────────────────────
// 3. PAGE FEATURES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Lessons.tsx features:
 * 
 * 1. Data Management:
 *    - Fetch lessons with pagination (10 per page)
 *    - Search/filter lessons by title
 *    - Automatic refetch after create/update/delete
 * 
 * 2. Role-Based Actions:
 *    - Instructors/Admins: Can create, edit, delete lessons
 *    - Students: Read-only access
 * 
 * 3. Performance:
 *    - useRef guard prevents duplicate API calls on mount
 *    - useCallback for stable fetch function
 *    - Debounced search (500ms)
 *    - Pagination support
 * 
 * 4. Error Handling:
 *    - Toast notifications for success/error messages
 *    - API error messages displayed to user
 * 
 * 5. UI Components:
 *    - Loading spinner while fetching
 *    - Pagination controls
 *    - Create button (instructors only)
 *    - Search bar
 *    - Dropdown actions for each lesson
 */

// ────────────────────────────────────────────────────────────────────────────
// 4. HOW TO USE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Visit the page: http://localhost:5173/lms/lessons
 * 
 * As an Instructor:
 * 1. Click "Create Lesson" button
 * 2. Fill in: Title, Description, Content, Course ID, Order
 * 3. Click "Create" to save
 * 4. Click the three-dot menu on any lesson for Edit/Delete
 * 5. Use search bar to find specific lessons
 * 
 * As a Student:
 * - View all available lessons
 * - Click lesson to view materials
 * - Cannot create/edit/delete
 * 
 * Search:
 * - Start typing in the search bar
 * - Results update automatically (500ms debounce)
 * - Clear search to see all lessons
 */

// ────────────────────────────────────────────────────────────────────────────
// 5. DATA STRUCTURE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Lesson Object:
 * {
 *   id: number;
 *   course_id: number;
 *   title: string;
 *   description?: string;
 *   content?: string;
 *   order: number;
 *   created_at: string (ISO 8601);
 *   updated_at?: string (ISO 8601);
 * }
 * 
 * API Response:
 * {
 *   data: Lesson[];
 *   meta: {
 *     page: number;
 *     total: number;
 *     limit: number;
 *   }
 * }
 * 
 * Create/Update Payload:
 * {
 *   title: string;
 *   description?: string | null;
 *   content?: string | null;
 *   course_id: number;
 *   order: number;
 * }
 */

// ────────────────────────────────────────────────────────────────────────────
// 6. INTEGRATION CHECKLIST
// ────────────────────────────────────────────────────────────────────────────

/**
 * ✅ Backend
 *    ✅ All lesson endpoints working (verified via logs)
 *    ✅ Curriculum relationship fixed
 *    ✅ Permission guards in place
 *    ✅ Error handling implemented
 * 
 * ✅ Frontend Components
 *    ✅ Lessons.tsx page created
 *    ✅ LessonTable.tsx component created
 *    ✅ LessonForm.tsx component created
 *    ✅ All endpoints added to endpoints.ts
 * 
 * ✅ Router & Navigation
 *    ✅ /lms/lessons route added
 *    ✅ Sidebar menu item added
 *    ✅ Import statements added
 * 
 * ✅ Features
 *    ✅ CRUD operations
 *    ✅ Pagination
 *    ✅ Search/filter
 *    ✅ Role-based access
 *    ✅ Error handling
 *    ✅ Loading states
 * 
 * ⏳ Future Enhancements
 *    - [ ] Add lesson materials management UI
 *    - [ ] Add lesson preview/detail view
 *    - [ ] Add bulk actions (select multiple)
 *    - [ ] Add sorting options
 *    - [ ] Add lesson templates
 *    - [ ] Add lesson progress tracking
 */

// ────────────────────────────────────────────────────────────────────────────
// 7. ADDING LESSON MATERIALS MANAGEMENT
// ────────────────────────────────────────────────────────────────────────────

/**
 * To add material management, you can create:
 * 
 * frontend/src/components/lms/LessonMaterials.tsx
 * 
 * Features:
 * - List materials for a lesson
 * - Upload new material (PDF, video, doc, image)
 * - Delete material
 * - Set material visibility
 * 
 * Usage would be:
 * <LessonMaterials lessonId={lesson.id} />
 * 
 * Example implementation:
 * 
 * ```typescript
 * import { useEffect, useState } from "react";
 * import { api } from "@/lib/api";
 * import { API } from "@/lib/endpoints";
 * import { Button } from "@/components/ui/button";
 * 
 * interface Props {
 *   lessonId: number;
 * }
 * 
 * export function LessonMaterials({ lessonId }: Props) {
 *   const [materials, setMaterials] = useState([]);
 * 
 *   useEffect(() => {
 *     const fetchMaterials = async () => {
 *       const { data } = await api.get(
 *         API.LESSONS.GET_MATERIALS(lessonId)
 *       );
 *       setMaterials(data);
 *     };
 *     fetchMaterials();
 *   }, [lessonId]);
 * 
 *   const handleAddMaterial = async (file: File) => {
 *     const formData = new FormData();
 *     formData.append("file", file);
 *     formData.append("title", file.name);
 *     
 *     await api.post(
 *       API.LESSONS.ADD_MATERIAL(lessonId),
 *       formData
 *     );
 *   };
 * 
 *   return (
 *     <div>
 *       {materials.map((m) => (
 *         <div key={m.id}>{m.title}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

// ────────────────────────────────────────────────────────────────────────────
// 8. TESTING THE INTEGRATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Manual Testing Steps:
 * 
 * 1. Start Backend: npm run dev (from backend folder)
 * 2. Start Frontend: npm run dev (from frontend folder)
 * 3. Login as instructor/admin
 * 4. Navigate to Learning → Lessons
 * 5. Test Create:
 *    - Click "Create Lesson"
 *    - Fill in form fields
 *    - Click "Create"
 *    - Verify lesson appears in list
 * 6. Test Edit:
 *    - Click three-dot menu on lesson
 *    - Click "Edit"
 *    - Modify fields
 *    - Click "Update"
 *    - Verify changes
 * 7. Test Delete:
 *    - Click three-dot menu on lesson
 *    - Click "Delete"
 *    - Confirm deletion
 *    - Verify lesson removed
 * 8. Test Search:
 *    - Type in search bar
 *    - Verify filtering works
 * 9. Test Pagination:
 *    - Create multiple lessons
 *    - Navigate between pages
 */

/**
 * API Testing (curl):
 * 
 * Get all lessons:
 * curl http://localhost:8000/api/v1/lessons
 * 
 * Create lesson:
 * curl -X POST http://localhost:8000/api/v1/lessons \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -d '{
 *     "title": "Test Lesson",
 *     "description": "Test Description",
 *     "course_id": 1,
 *     "order": 1
 *   }'
 * 
 * Update lesson:
 * curl -X PUT http://localhost:8000/api/v1/lessons/1 \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -d '{"title": "Updated Title"}'
 * 
 * Delete lesson:
 * curl -X DELETE http://localhost:8000/api/v1/lessons/1 \
 *   -H "Authorization: Bearer YOUR_TOKEN"
 */
