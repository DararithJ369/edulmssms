import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import { serverFetch } from "@/lib/server-api";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentProfileResponse, UserResponse, ClassResponse } from "@/types";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value;

  let profileError: string | null = null;
  let userError: string | null = null;

  // Fetch student profile (StudentProfileResponse) and user details (UserResponse)
  const [student, user] = await Promise.all([
    serverFetch<StudentProfileResponse>(
      `/students/${id}/profile${token ? `?token=${token}` : ""}`
    ).catch((err) => {
      console.error("FAILED to fetch student profile:", err);
      profileError = err instanceof Error ? err.message : String(err);
      return null;
    }),
    serverFetch<UserResponse>(`/users/${id}`).catch((err) => {
      console.error("FAILED to fetch user record:", err);
      userError = err instanceof Error ? err.message : String(err);
      return null;
    }),
  ]);

  if (!student || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Unable to View Student Profile</h1>
        <p className="text-sm">We encountered an issue fetching data from the backend API for ID: <code>{id}</code></p>
        <div className="mt-2 text-xs font-mono bg-white p-3 border border-red-100 rounded">
          <p><strong>Student Profile API Status:</strong> {student ? "LOADED" : (profileError || "Unknown API Error")}</p>
          <p className="mt-1"><strong>User Account API Status:</strong> {user ? "LOADED" : (userError || "Unknown API Error")}</p>
        </div>
        <p className="text-sm mt-2 text-gray-500">Please make sure the backend server is running and the session cookies/token are valid.</p>
        <Link href="/list/students" className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          Back to Students List
        </Link>
      </div>
    );
  }

  const classId = student.class_id || student.student_profile?.class_id;
  const classData = classId ? await serverFetch<ClassResponse>(`/classes/${classId}`).catch(() => null) : null;
  const sessions = classId ? await serverFetch<any[]>(`/classes/${classId}/sessions`).catch(() => []) : [];
  const lessonsCount = sessions.length;

  const studentUpdateData = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: student.full_name ? student.full_name.split(" ")[0] : "",
    surname: student.full_name ? student.full_name.split(" ").slice(1).join(" ") : "",
    phone: student.phone || "",
    address: student.address || "",
    bloodType: student.blood_type || "",
    birthday: student.date_of_birth || "",
    parentId: student.student_profile?.parents?.[0]?.profile?.user_id || "",
    sex: student.gender?.toLowerCase() === "female" || student.gender === "FEMALE" || student.gender === "F" ? "female" : "male",
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={student.pfp || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.full_name || user.username}
                </h1>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={studentUpdateData} />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {student.bio || "No biography available."}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{student.blood_type || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {student.date_of_birth
                      ? new Intl.DateTimeFormat("en-GB").format(new Date(student.date_of_birth))
                      : "-"}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{user.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <Suspense fallback="loading...">
                <StudentAttendanceCard id={student.user_id} />
              </Suspense>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {classData?.name ? `${classData.name.charAt(0)}th` : "-"}
                </h1>
                <span className="text-sm text-gray-400">Grade</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {lessonsCount}
                </h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{classData?.name || "-"}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          {classId ? (
            <BigCalendarContainer type="classId" id={classId} />
          ) : (
            <div className="p-4 text-gray-500">No class assigned.</div>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            {classId ? (
              <>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/list/lessons?classId=${classId}`}
                >
                  Student&apos;s Lessons
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurpleLight"
                  href={`/list/teachers?classId=${classId}`}
                >
                  Student&apos;s Teachers
                </Link>
                <Link
                  className="p-3 rounded-md bg-pink-50"
                  href={`/list/exams?classId=${classId}`}
                >
                  Student&apos;s Exams
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/list/assignments?classId=${classId}`}
                >
                  Student&apos;s Assignments
                </Link>
              </>
            ) : null}
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/results?studentId=${student.user_id}`}
            >
              Student&apos;s Results
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
