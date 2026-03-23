import { createBrowserRouter } from "react-router"; // Keeping your requested import
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import PrivateRoutes from "@/pages/routes/PrivateRoutes";
import Dashboard from "@/pages/Dashboard";
import AcademicYear from "@/pages/settings/academic-year";
import Classes from "@/pages/academics/Classes";
import { Subjects } from "@/pages/academics/Subjects";
import Timetable from "@/pages/academics/Timetable";
import Exams from "@/pages/lms/Exams";
import Exam from "../lms/Exam";
import Students from "@/pages/users/Students";
import Instructors from "@/pages/users/Instructors";
import Parents from "@/pages/users/Parents";
import Admins from "@/pages/users/Admins";
import UserProfile from "@/pages/profiles/UserProfile";
import { StudentDetail } from "@/pages/users/StudentDetail";
import { InstructorDetail } from "@/pages/users/InstructorDetail";
import { ParentDetail } from "@/pages/users/ParentDetail";

export const router = createBrowserRouter([
  {
    children: [
      // public routes
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      // protected routes would go here
      {
        element: <PrivateRoutes />, // Assuming PrivateRoutes is imported
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "activities-log", element: <Dashboard /> },
          { path: "settings/academic-years", element: <AcademicYear /> },
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
            path: "lms/exams",
            element: <Exams />,
          },
          {
            path: "lms/exams/:id",
            element: <Exam />,
          },
        ],
      },
    ],
  },
]);
