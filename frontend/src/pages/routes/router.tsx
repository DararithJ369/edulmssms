import { createBrowserRouter } from "react-router"; // Keeping your requested import
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import PrivateRoutes from "@/pages/routes/PrivateRoutes";
import ErrorPage from "@/pages/ErrorPage";
import Dashboard from "@/pages/Dashboard";
import AcademicYear from "@/pages/settings/academic-year";
import GradeLevels from "@/pages/settings/grade-levels";
import Classes from "@/pages/academics/Classes";
import { Subjects } from "@/pages/academics/Subjects";
import Timetable from "@/pages/academics/Timetable";
import Grades from "@/pages/academics/Grades";
import Assignments from "@/pages/academics/Assignments";
import Quizzes from "@/pages/academics/Quizzes";
import Results from "@/pages/academics/Results";
import Attendance from "@/pages/academics/Attendance";
import Enrollments from "@/pages/academics/Enrollments";
import Exams from "@/pages/lms/Exams";
import Exam from "../lms/Exam";
import Submissions from "@/pages/lms/Submissions";
import Courses from "@/pages/lms/Courses";
import CoursesDashboard from "@/pages/lms/CoursesDashboard";
import CourseDetail from "@/pages/lms/CourseDetail";
import CourseManagement from "@/pages/lms/CourseManagement";
import PublicCourses from "@/pages/public/Courses";
import PublicCourseDetail from "@/pages/public/CourseDetail";
import EnrollmentCheckout from "@/pages/public/EnrollmentCheckout";
import Students from "@/pages/users/Students";
import Instructors from "@/pages/users/Instructors";
import Parents from "@/pages/users/Parents";
import Admins from "@/pages/users/Admins";
import UserProfile from "@/pages/profiles/UserProfile";
import { StudentDetail } from "@/pages/users/StudentDetail";
import { InstructorDetail } from "@/pages/users/InstructorDetail";
import { ParentDetail } from "@/pages/users/ParentDetail";
import Roles from "@/pages/settings/Roles";

export const router = createBrowserRouter([
  {
    children: [
      // public routes
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      // protected routes would go here
      {
        element: <PrivateRoutes />, // Assuming PrivateRoutes is imported
        errorElement: <ErrorPage />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "activities-log", element: <Dashboard /> },
          { path: "settings/academic-years", element: <AcademicYear /> },
          { path: "settings/grade-levels", element: <GradeLevels /> },
          {
            path: "users/students",
            element: <Students />,
          },
          {
            path: "users/instructors",
            element: <Instructors />,
          },
          {
            path: "users/parents",
            element: <Parents />,
          },
          {
            path: "users/admins",
            element: <Admins />,
          },
          {
            path: "users/students/:id",
            element: <StudentDetail />,
          },
          {
            path: "users/instructors/:id",
            element: <InstructorDetail />,
          },
          {
            path: "users/parents/:id",
            element: <ParentDetail />,
          },
          {
            path: "users/:userId",
            element: <UserProfile />,
          },
          {
            path: "classes",
            element: <Classes />,
          },
          {
            path: "subjects",
            element: <Subjects />,
          },
          {
            path: "timetable",
            element: <Timetable />,
          },
          {
            path: "academics/grades",
            element: <Grades />,
          },
          {
            path: "academics/assignments",
            element: <Assignments />,
          },
          {
            path: "academics/quizzes",
            element: <Quizzes />,
          },
          {
            path: "academics/results",
            element: <Results />,
          },
          {
            path: "academics/attendance",
            element: <Attendance />,
          },
          {
            path: "academics/enrollments",
            element: <Enrollments />,
          },
          {
            path: "lms/courses",
            element: <CoursesDashboard />,
          },
          {
            path: "lms/courses-list",
            element: <Courses />,
          },
          {
            path: "lms/courses/:courseId",
            element: <CourseDetail />,
          },
          {
            path: "lms/course-management",
            element: <CourseManagement />,
          },
          {
            path: "lms/submissions",
            element: <Submissions />,
          },
          {
            path: "lms/exams",
            element: <Exams />,
          },
          {
            path: "lms/exams/:id",
            element: <Exam />,
          },
          {
            path: "settings/roles",
            element: <Roles />,
          },
        ],
      },
      // Public routes (not protected)
      {
        path: "courses",
        element: <PublicCourses />,
      },
      {
        path: "courses/:courseId",
        element: <PublicCourseDetail />,
      },
      {
        path: "checkout/:courseId",
        element: <EnrollmentCheckout />,
      },
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
    errorElement: <ErrorPage />,
  },
]);
