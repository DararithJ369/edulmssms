import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import { serverFetch } from "@/lib/server-api";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { InstructorProfileResponse, UserResponse } from "@/types";

const normalizeRole = (role: string | null | undefined) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role ?? "";
};

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const cookieStore = cookies();
  const role = normalizeRole(cookieStore.get("user_role")?.value);
  const token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value;

  let profileError: string | null = null;
  let userError: string | null = null;

  // Fetch instructor profile and user details concurrently
  const [instructor, user] = await Promise.all([
    serverFetch<InstructorProfileResponse>(
      `/instructors/${id}/profile${token ? `?token=${token}` : ""}`
    ).catch((err) => {
      console.error("FAILED to fetch instructor profile:", err);
      profileError = err instanceof Error ? err.message : String(err);
      return null;
    }),
    serverFetch<UserResponse>(`/users/${id}`).catch((err) => {
      console.error("FAILED to fetch user record:", err);
      userError = err instanceof Error ? err.message : String(err);
      return null;
    }),
  ]);

  if (!instructor || !user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6 flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Unable to View Teacher Profile</h1>
        <p className="text-sm">We encountered an issue fetching data from the backend API for ID: <code>{id}</code></p>
        <div className="mt-2 text-xs font-mono bg-white p-3 border border-red-100 rounded">
          <p><strong>Instructor Profile API Status:</strong> {instructor ? "LOADED" : (profileError || "Unknown API Error")}</p>
          <p className="mt-1"><strong>User Account API Status:</strong> {user ? "LOADED" : (userError || "Unknown API Error")}</p>
        </div>
        <p className="text-sm mt-2 text-gray-500">Please make sure the backend server is running and the session cookies/token are valid.</p>
        <Link href="/list/teachers" className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          Back to Teachers List
        </Link>
      </div>
    );
  }

  // Fetch instructor classes count dynamically
  const classesData = await serverFetch<any[]>(`/instructors/${id}/classes`).catch(() => []);
  const classesCount = classesData.length;

  const displayBirthday = instructor.date_of_birth
    ? new Intl.DateTimeFormat("en-GB").format(new Date(instructor.date_of_birth))
    : "-";

  const teacherUpdateData = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: instructor.full_name ? instructor.full_name.split(" ")[0] : "",
    surname: instructor.full_name ? instructor.full_name.split(" ").slice(1).join(" ") : "",
    phone: instructor.phone || "",
    address: instructor.address || "",
    bloodType: instructor.blood_type || "",
    birthday: instructor.date_of_birth || "",
    sex: instructor.gender?.toLowerCase() === "female" || instructor.gender === "FEMALE" || instructor.gender === "F" ? "female" : "male",
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
                src={instructor.pfp || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {instructor.full_name || user.username}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacherUpdateData} />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {instructor.bio || "Teacher profile registered in the Learning Management System."}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{instructor.blood_type || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{displayBirthday}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{user.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{instructor.phone || "-"}</span>
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
              <div className="">
                <h1 className="text-xl font-semibold">95%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
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
                  {instructor.instructor_profile?.department ? 1 : 0}
                </h1>
                <span className="text-sm text-gray-400">Branches</span>
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
                  {classesCount * 2}
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
                <h1 className="text-xl font-semibold">
                  {classesCount}
                </h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendarContainer type="teacherId" id={user.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/classes?supervisorId=${user.id}`}
            >
              Teacher&apos;s Classes
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/students?teacherId=${user.id}`}
            >
              Teacher&apos;s Students
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/lessons?teacherId=${user.id}`}
            >
              Teacher&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?teacherId=${user.id}`}
            >
              Teacher&apos;s Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?teacherId=${user.id}`}
            >
              Teacher&apos;s Assignments
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
