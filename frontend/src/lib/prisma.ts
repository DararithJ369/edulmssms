import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const resolveLiveApiQuery = async (model: string, method: string, args: any) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  
  // Safe helper to extract cookies in server context
  let token = "";
  try {
    const cookieStore = cookies();
    token = cookieStore.get("access_token")?.value || cookieStore.get("token")?.value || "";
  } catch (e) {
    // Console fallback if not inside a Server Component/Action request context
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const callApi = async (path: string) => {
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers, cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          const { redirect } = require("next/navigation");
          redirect("/login?clear=1");
        }
        return null;
      }
      return await res.json();
    } catch (e: any) {
      if (e?.message === "NEXT_REDIRECT" || e?.digest?.includes("NEXT_REDIRECT")) {
        throw e;
      }
      console.error(`FAILED proxy fetch for ${path}:`, e);
      return null;
    }
  };

  const callApiMutate = async (path: string, methodType: "POST" | "PUT" | "DELETE", body?: any, isMultipart = false) => {
    try {
      const finalHeaders: Record<string, string> = { ...headers };
      if (isMultipart) {
        delete finalHeaders["Content-Type"];
      }
      const res = await fetch(`${baseUrl}${path}`, {
        method: methodType,
        headers: finalHeaders,
        body: isMultipart ? body : (body ? JSON.stringify(body) : undefined),
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401) {
          const { redirect } = require("next/navigation");
          redirect("/login?clear=1");
        }
        const txt = await res.text();
        console.error(`MUTATION ERROR for ${methodType} ${path}:`, txt);
        return null;
      }
      return await res.json();
    } catch (e: any) {
      if (e?.message === "NEXT_REDIRECT" || e?.digest?.includes("NEXT_REDIRECT")) {
        throw e;
      }
      console.error(`FAILED proxy mutation for ${methodType} ${path}:`, e);
      return null;
    }
  };

  const today = new Date();

  // Model-specific query mapping to bridge Prisma direct calls to FastAPI REST endpoints
  if (model === "user") {
    if (method === "findMany") {
      const page = args?.where?.page || 1;
      const limit = args?.where?.limit || 10;
      const search = args?.where?.search || "";
      const roleFilter = args?.where?.role || "";
      const res = await callApi(`/users?page=${page}&limit=${limit}&search=${search}&role=${roleFilter}`);
      const raw = res?.data || [];
      const meta = res?.meta || { page, total: 0, limit };
      return {
        data: raw.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          roleId: u.role_id,
          roleName: u.role?.name || "user",
          isActive: u.is_active,
          image: u.profile_image || u.image,
        })),
        meta,
      };
    }
    if (method === "create") {
      const fd = new FormData();
      fd.append("username", args.data.username);
      fd.append("email", args.data.email);
      fd.append("password", args.data.password);
      fd.append("role_id", String(args.data.roleId));
      return await callApiMutate("/users", "POST", fd, true);
    }
    if (method === "update") {
      const id = args.where.id;
      const fd = new FormData();
      fd.append("username", args.data.username);
      fd.append("email", args.data.email);
      fd.append("password", args.data.password || "");
      fd.append("role_id", String(args.data.roleId));
      return await callApiMutate(`/users/${id}`, "PUT", fd, true);
    }
    if (method === "delete") {
      return await callApiMutate(`/users/${args.where.id}`, "DELETE");
    }
  }

  if (model === "role") {
    if (method === "findMany") {
      const page = args?.where?.page || 1;
      const limit = args?.where?.limit || 50;
      const res = await callApi(`/roles?page=${page}&limit=${limit}`);
      const raw = res?.data || [];
      const meta = res?.meta || { page, total: 0, limit };
      return {
        data: raw.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          isActive: r.is_active,
        })),
        meta,
      };
    }
    if (method === "create") {
      return await callApiMutate("/roles", "POST", {
        name: args.data.name,
        description: args.data.description,
      });
    }
    if (method === "update") {
      const id = args.where.id;
      return await callApiMutate(`/roles/${id}`, "PUT", {
        name: args.data.name,
        description: args.data.description,
        is_active: args.data.isActive,
      });
    }
    if (method === "delete") {
      return await callApiMutate(`/roles/${args.where.id}`, "DELETE");
    }
  }

  if (model === "permission") {
    if (method === "findMany") {
      const page = args?.where?.page || 1;
      const limit = args?.where?.limit || 100;
      const res = await callApi(`/permissions?page=${page}&limit=${limit}`);
      const raw = res?.data || [];
      const meta = res?.meta || { page, total: 0, limit };
      return {
        data: raw.map((p: any) => ({
          id: p.id,
          key: p.key,
          description: p.description || "",
          isActive: p.is_active,
        })),
        meta,
      };
    }
    if (method === "create") {
      return await callApiMutate("/permissions", "POST", {
        key: args.data.key,
        description: args.data.description,
        is_active: true,
      });
    }
    if (method === "update") {
      const id = args.where.id;
      return await callApiMutate(`/permissions/${id}`, "PUT", {
        key: args.data.key,
        description: args.data.description,
        is_active: args.data.isActive,
      });
    }
    if (method === "delete") {
      return await callApiMutate(`/permissions/${args.where.id}`, "DELETE");
    }
  }

  if (model === "auditLog") {
    if (method === "findMany") {
      const page = args?.where?.page || 1;
      const limit = args?.where?.limit || 10;
      const search = args?.where?.search || "";
      const res = await callApi(`/audit-logs?page=${page}&limit=${limit}&search=${search}`);
      const raw = res?.data || [];
      const meta = res?.meta || { page, total: 0, limit };
      return {
        data: raw.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          action: log.action,
          message: log.message,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at),
          user: log.user ? {
            id: log.user.id,
            username: log.user.username,
            email: log.user.email,
          } : null,
        })),
        meta,
      };
    }
  }

  if (model === "attendance") {
    if (method === "findMany") {
      const res = await callApi("/attendance?limit=100");
      const raw = res?.data || [];
      let mapped = raw.map((a: any) => ({
        id: a.id,
        date: new Date(a.date + "T00:00:00"),   // force local midnight parse (avoids UTC offset shift)
        present: a.status === "present" || a.status === "online" || a.status === "late",
        status: a.status,
        studentId: a.student_id,
        lessonId: a.course_id,
      }));
      if (args?.where?.studentId) {
        mapped = mapped.filter((a: any) => a.studentId === args.where.studentId);
      }
      return mapped;
    }
  }


  if (model === "result") {
    if (method === "findMany") {
      let url = "/results?limit=5000";
      if (args?.where?.studentId) {
        url = `/results?student_id=${args.where.studentId}&limit=100`;
      }
      const res = await callApi(url);
      const raw = res?.data || [];
      let filtered = raw.map((r: any) => ({
        id: r.id,
        assessment_title: r.assessment_title || "Assessment",
        score: r.score,
        total_marks: r.total_marks || 100,
        percentage: r.percentage || 0,
        grade: r.grade,
        is_passed: r.is_passed,
        feedback: r.feedback || "",
        studentId: r.student_id,
      }));
      if (args?.where?.studentId) {
        filtered = filtered.filter((r: any) => r.studentId === args.where.studentId);
      }
      return filtered;
    }
  }

  if (model === "student") {
    if (method === "groupBy") {
      const res = await callApi("/users/students?limit=300");
      const raw = res?.data || [];
      // Calculate boy/girl student counts based on gender profiles
      const boys = raw.filter((u: any) => u.gender === "MALE" || u.gender === "M").length;
      const girls = raw.filter((u: any) => u.gender === "FEMALE" || u.gender === "F").length;
      return [
        { sex: "MALE", _count: boys },
        { sex: "FEMALE", _count: girls }
      ];
    }
    if (method === "findMany") {
      if (args?.where?.parentId) {
        // Fetch only children linked to this parent
        const res = await callApi(`/parents/${args.where.parentId}/students`);
        const raw = res || [];
        
        const mappedStudents = [];
        for (const u of raw) {
          const userId = u.profile?.user_id;
          if (!userId) continue;

          // Fetch student profile details to get class_id
          const studentProfileRes = await callApi(`/students/${userId}/profile`);
          const classId = studentProfileRes?.class_id || studentProfileRes?.student_profile?.class_id || null;

          mappedStudents.push({
            id: userId,
            user_id: userId,
            name: u.full_name || "Student",
            surname: "",
            classId: classId,
          });
        }
        return mappedStudents;
      }

      const res = await callApi("/users/students?limit=200");
      const raw = res?.data || [];
      return raw.map((u: any) => ({
        id: u.id,
        user_id: u.id,
        name: u.full_name || u.username,
        surname: "",
        classId: 1,
      }));
    }
    if (method === "findUnique" || method === "findFirst") {
      const id = args.where.id || args.where.user_id;
      const u = await callApi(`/users/${id}`);
      const profile = await callApi(`/students/${id}/profile`);
      if (!u || !profile) return null;

      const parentUser = profile.student_profile?.parents?.[0]?.profile?.user;
      const parentName = profile.student_profile?.parents?.[0]?.profile?.full_name || (parentUser ? parentUser.username : "Guardian");
      const parentPhone = profile.student_profile?.parents?.[0]?.profile?.phone || "";

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        student_profile: profile.student_profile,
        parent: {
          name: parentName,
          phone: parentPhone,
          relationship: profile.student_profile?.parents?.[0]?.profile?.relationship || "Guardian"
        },
        class: {
          name: profile.class_name || "A-Level"
        },
        grade: {
          level: profile.grade_level_order || 10
        }
      };
    }
  }

  if (model === "parent") {
    if (method === "findUnique" || method === "findFirst") {
      const id = args.where.id;
      const u = await callApi(`/users/${id}`);
      const profile = await callApi(`/parents/${id}/profile`);
      if (!u || !profile) return null;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        parent_profile: profile.parent_profile,
      };
    }
  }

  if (model === "course") {
    if (method === "findMany") {
      const res = await callApi("/courses?limit=100");
      const raw = res?.data || [];
      return raw.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        credits: c.credits,
        specialisation: c.specialisation
      }));
    }
    if (method === "findUnique" || method === "findFirst") {
      const id = args.where.id;
      const course = await callApi(`/courses/${id}`);
      if (!course) return null;
      const modulesRes = await callApi(`/courses/${id}/modules`);
      const modules = modulesRes || [];
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        credits: course.credits,
        specialisation: course.specialisation,
        modules: modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            content: l.content,
            duration: l.duration,
            material_type: l.material_type,
            material_url: l.material_url,
            material_file: l.material_file,
            order: l.order
          }))
        }))
      };
    }
  }

  if (model === "studentProgress") {
    if (method === "findUnique" || method === "findFirst") {
      const courseId = args.where.course_id;
      const res = await callApi(`/progress/course/${courseId}`);
      return res || {
        progress_percentage: 0.0,
        completed_lessons_count: 0,
        total_lessons_count: 0,
        completed_modules_count: 0,
        total_modules_count: 0,
        completed_lesson_ids: [],
        completed_module_ids: []
      };
    }
  }

  if (model === "teacher") {
    if (method === "findMany") {
      const res = await callApi("/users/instructors?limit=200");
      const raw = res?.data || [];
      return raw.map((u: any) => ({
        id: u.id,
        name: u.full_name || u.username,
        surname: "",
      }));
    }
  }

  if (model === "class") {
    if (method === "findMany") {
      const res = await callApi("/classes?limit=100");
      const raw = res?.data || [];
      return raw.map((c: any) => ({
        id: c.id,
        name: c.name,
        gradeId: c.grade_id || 1,
        grade: { id: c.grade_id || 1, level: 10 },
        _count: { students: c.students?.length || 20 },
      }));
    }
  }

  if (model === "grade") {
    if (method === "findMany") {
      const res = await callApi("/grade_level?limit=100");
      const raw = res?.data || [];
      return raw.map((g: any) => ({
        id: g.id,
        level: g.order,
      }));
    }
  }

  if (model === "subject") {
    if (method === "findMany") {
      const res = await callApi("/subjects?limit=100");
      const raw = res?.data || [];
      return raw.map((s: any) => ({
        id: s.id,
        name: s.name,
      }));
    }
  }

  if (model === "lesson") {
    if (method === "findMany") {
      // Run independent API calls in parallel for speed
      const [res, coursesRes, filterData] = await Promise.all([
        callApi("/lessons?limit=100"),
        callApi("/courses?limit=100"),
        args?.where?.studentId
          ? callApi(`/students/${args.where.studentId}/overview`)
          : args?.where?.classId
            ? callApi(`/classes/${args.where.classId}/students`)
            : Promise.resolve(null),
      ]);

      const raw = res?.data || [];
      const courses = coursesRes?.data || [];
      const courseToInstructor: Record<number, string> = {};
      courses.forEach((c: any) => {
        if (c.id && c.instructor_id) {
          courseToInstructor[c.id] = c.instructor_id;
        }
      });

      // Get filters from query arguments
      let filterCourseIds: number[] | null = null;

      if (args?.where) {
        if (args.where.studentId) {
          const studentCourses = filterData?.courses || [];
          filterCourseIds = studentCourses.map((c: any) => c.course_id);
        } else if (args.where.teacherId) {
          const teacherCourses = courses.filter((c: any) => c.instructor_id === args.where.teacherId);
          filterCourseIds = teacherCourses.map((c: any) => c.id);
        } else if (args.where.classId) {
          const students = filterData || [];
          if (students.length > 0) {
            const firstStudentId = students[0].id || students[0].user_id;
            const overview = await callApi(`/students/${firstStudentId}/overview`);
            const studentCourses = overview?.courses || [];
            filterCourseIds = studentCourses.map((c: any) => c.course_id);
          }
        }
      }

      // Filter raw lessons first so slot assignment only considers relevant lessons
      let filteredRaw = raw;
      if (filterCourseIds !== null) {
        filteredRaw = raw.filter((item: any) => {
          const cid = item.course_id || item.module?.course_id;
          return filterCourseIds!.includes(cid);
        });
      }

      // Calendar slot assignment:
      // Distribute lessons across Mon-Fri with rotating time slots.
      // Each lesson gets its own day+time slot so the schedule is spread across the week.
      const days = [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri
      const timeSlots = [
        { start: 8, end: 9 },
        { start: 9, end: 10 },
        { start: 10, end: 11 },
        { start: 13, end: 14 },
      ];

      const nowFresh = new Date();
      const currentDay = nowFresh.getDay(); // 0=Sun, 1=Mon …

      const toLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };

      const mappedLessons = filteredRaw.map((item: any, idx: number) => {
        const lessonCourseId = item.course_id || item.module?.course_id || 1;
        const mappedInstructorId = courseToInstructor[lessonCourseId] || "instructor-placeholder";

        // Spread lessons across days and time slots using the lesson index
        const assignedDay = days[idx % days.length];
        const slot = timeSlots[idx % timeSlots.length];
        const startHour = slot.start;
        const endHour = slot.end;

        // Compute the date for that day-of-week in the current week
        const dayOffset = assignedDay - (currentDay === 0 ? 7 : currentDay);
        const startDate = new Date(nowFresh);
        startDate.setDate(nowFresh.getDate() + dayOffset);
        startDate.setHours(startHour, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(endHour, 0, 0, 0);

        return {
          id: item.id,
          name: item.title,
          title: item.title,
          startTime: toLocalISO(startDate),
          endTime: toLocalISO(endDate),
          day: ["SUN","MON","TUE","WED","THU","FRI","SAT"][assignedDay] || "MON",
          duration: item.duration || "90min",
          teacherId: mappedInstructorId,
          classId: args?.where?.classId || 1,
          courseId: lessonCourseId,
        };
      });

      return mappedLessons;
    }
  }


  if (model === "exam") {
    if (method === "findMany") {
      const res = await callApi("/exams?limit=100");
      const raw = res?.data || [];
      return raw.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
      }));
    }
  }

  if (model === "assignment") {
    if (method === "findMany") {
      const res = await callApi("/assignments?limit=100");
      const raw = res?.data || [];
      return raw.map((a: any) => ({
        id: a.id,
        title: a.title,
      }));
    }
  }

  if (model === "announcement") {
    if (method === "findMany") {
      const res = await callApi("/announcements?limit=100");
      const raw = res?.data || [];
      const items = raw.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.message,
        date: new Date(a.created_at || new Date()),
      }));
      // Sort desc
      items.sort((x: any, y: any) => y.date.getTime() - x.date.getTime());
      if (args?.take) {
        return items.slice(0, args.take);
      }
      return items;
    }
    if (method === "count") {
      const res = await callApi("/announcements?limit=1");
      return res?.meta?.total || 0;
    }
  }

  if (model === "event") {
    if (method === "findMany") {
      // Mock beautiful academic calendar events dynamically to support event calendars cleanly
      const event_data = [
        {
          id: 1,
          title: "Full-Stack Web Dev Hackathon",
          description: "24-hour team hackathon to design and build Next.js dynamic dashboard projects.",
          startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 2,
          title: "Google UX Engineer Guest Lecture",
          description: "Interactive guest workshop on 'CSS Subgrids and Container Queries in Production'.",
          startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
        {
          id: 3,
          title: "Spring Semester Midterm Prep Session",
          description: "Optional review session covering python dictionary lookups and scope rules.",
          startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        }
      ];
      if (args?.take) {
        return event_data.slice(0, args.take);
      }
      return event_data;
    }
    if (method === "count") {
      return 3;
    }
  }

  // --- MUTATION HANDLING INTERCEPTORS ---
  if (method === "create" || method === "update" || method === "delete") {
    if (model === "course") {
      if (method === "delete") {
        return await callApiMutate(`/courses/${args.where.id}`, "DELETE");
      }
    }

    if (model === "event") {
      if (method === "delete") {
        return await callApiMutate(`/events/${args.where.id}`, "DELETE");
      }
    }

    // Subject Mutation
    if (model === "subject") {
      if (method === "create") {
        const fd = new FormData();
        const teacherId = args.data.teachers?.connect?.[0]?.id || "";
        fd.append("name", args.data.name);
        fd.append("code", args.data.code);
        fd.append("credits", args.data.credits.toString());
        if (args.data.gradeId) fd.append("grade_id", args.data.gradeId.toString());
        fd.append("teacher_id", teacherId);
        fd.append("is_active", "true");
        return await callApiMutate("/subjects", "POST", fd, true);
      }
      if (method === "update") {
        const id = args.where.id;
        const fd = new FormData();
        if (args.data.name) fd.append("name", args.data.name);
        if (args.data.code) fd.append("code", args.data.code);
        if (args.data.credits) fd.append("credits", args.data.credits.toString());
        if (args.data.gradeId) fd.append("grade_id", args.data.gradeId.toString());
        const teacherId = args.data.teachers?.set?.[0]?.id || "";
        if (teacherId) fd.append("teacher_id", teacherId);
        return await callApiMutate(`/subjects/${id}`, "PUT", fd, true);
      }
      if (method === "delete") {
        return await callApiMutate(`/subjects/${args.where.id}`, "DELETE");
      }
    }

    // Class Mutation
    if (model === "class") {
      if (method === "create") {
        const payload = {
          name: args.data.name,
          capacity: args.data.capacity || 30,
          grade_id: args.data.gradeId || 1,
          supervisor_id: args.data.supervisorId || "",
          section: "A",
          academic_year: "2025-26",
          is_active: true
        };
        return await callApiMutate("/classes", "POST", payload);
      }
      if (method === "update") {
        const payload: any = {
          name: args.data.name,
          capacity: args.data.capacity,
          is_active: true
        };
        if (args.data.gradeId) payload.grade_id = args.data.gradeId;
        if (args.data.supervisorId) payload.supervisor_id = args.data.supervisorId;
        return await callApiMutate(`/classes/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/classes/${args.where.id}`, "DELETE");
      }
    }

    // Teacher Mutation
    if (model === "teacher") {
      if (method === "create") {
        const fdUser = new FormData();
        fdUser.append("username", args.data.username);
        fdUser.append("email", args.data.email);
        fdUser.append("password", args.data.password || "teacher123");
        fdUser.append("role_id", "2"); // Instructor Role
        const userRes = await callApiMutate("/users", "POST", fdUser, true);
        if (!userRes?.id) return null;

        const fdProfile = new FormData();
        fdProfile.append("full_name", args.data.name + " " + args.data.surname);
        fdProfile.append("phone", args.data.phone || "");
        fdProfile.append("address", args.data.address || "");
        if (args.data.birthday) {
          fdProfile.append("date_of_birth", new Date(args.data.birthday).toISOString().split('T')[0]);
        }
        fdProfile.append("gender", args.data.sex || "MALE");
        fdProfile.append("blood_type", args.data.bloodType || "O+");
        fdProfile.append("department", "Computer Science");
        return await callApiMutate(`/profiles/${userRes.id}`, "POST", fdProfile, true);
      }
      if (method === "update") {
        const id = args.where.id;
        const fdProfile = new FormData();
        if (args.data.name || args.data.surname) {
          fdProfile.append("full_name", (args.data.name || "") + " " + (args.data.surname || ""));
        }
        if (args.data.phone) fdProfile.append("phone", args.data.phone);
        if (args.data.address) fdProfile.append("address", args.data.address);
        if (args.data.birthday) {
          fdProfile.append("date_of_birth", new Date(args.data.birthday).toISOString().split('T')[0]);
        }
        if (args.data.sex) fdProfile.append("gender", args.data.sex);
        if (args.data.bloodType) fdProfile.append("blood_type", args.data.bloodType);
        return await callApiMutate(`/profiles/${id}`, "PUT", fdProfile, true);
      }
      if (method === "delete") {
        return await callApiMutate(`/users/${args.where.id}`, "DELETE");
      }
    }

    // Student Mutation
    if (model === "student") {
      if (method === "create") {
        const fdUser = new FormData();
        fdUser.append("username", args.data.username);
        fdUser.append("email", args.data.email);
        fdUser.append("password", args.data.password || "student123");
        fdUser.append("role_id", "3"); // Student Role
        const userRes = await callApiMutate("/users", "POST", fdUser, true);
        if (!userRes?.id) return null;

        const fdProfile = new FormData();
        fdProfile.append("full_name", args.data.name + " " + args.data.surname);
        fdProfile.append("phone", args.data.phone || "");
        fdProfile.append("address", args.data.address || "");
        if (args.data.birthday) {
          fdProfile.append("date_of_birth", new Date(args.data.birthday).toISOString().split('T')[0]);
        }
        fdProfile.append("gender", args.data.sex || "MALE");
        fdProfile.append("blood_type", args.data.bloodType || "O+");
        fdProfile.append("student_id", "std-" + Date.now().toString().slice(-6));
        fdProfile.append("enrolment_date", new Date().toISOString().split('T')[0]);
        fdProfile.append("grade_level_id", String(args.data.gradeId || 1));
        return await callApiMutate(`/profiles/${userRes.id}`, "POST", fdProfile, true);
      }
      if (method === "update") {
        const id = args.where.id;
        const fdProfile = new FormData();
        if (args.data.name || args.data.surname) {
          fdProfile.append("full_name", (args.data.name || "") + " " + (args.data.surname || ""));
        }
        if (args.data.phone) fdProfile.append("phone", args.data.phone);
        if (args.data.address) fdProfile.append("address", args.data.address);
        if (args.data.birthday) {
          fdProfile.append("date_of_birth", new Date(args.data.birthday).toISOString().split('T')[0]);
        }
        if (args.data.sex) fdProfile.append("gender", args.data.sex);
        if (args.data.bloodType) fdProfile.append("blood_type", args.data.bloodType);
        if (args.data.gradeId) fdProfile.append("grade_level_id", String(args.data.gradeId));
        return await callApiMutate(`/profiles/${id}`, "PUT", fdProfile, true);
      }
      if (method === "delete") {
        return await callApiMutate(`/users/${args.where.id}`, "DELETE");
      }
    }

    // Parent Mutation
    if (model === "parent") {
      if (method === "create") {
        const fdUser = new FormData();
        fdUser.append("username", args.data.username);
        fdUser.append("email", args.data.email);
        fdUser.append("password", args.data.password || "parent123");
        fdUser.append("role_id", "4"); // Parent Role
        const userRes = await callApiMutate("/users", "POST", fdUser, true);
        if (!userRes?.id) return null;

        const fdProfile = new FormData();
        fdProfile.append("full_name", args.data.name + " " + args.data.surname);
        fdProfile.append("phone", args.data.phone || "");
        fdProfile.append("address", args.data.address || "");
        fdProfile.append("occupation", args.data.occupation || "Professional");
        fdProfile.append("relationship", args.data.relationship || "Guardian");
        fdProfile.append("emergency_phone", args.data.emergencyPhone || "");
        return await callApiMutate(`/profiles/${userRes.id}`, "POST", fdProfile, true);
      }
      if (method === "update") {
        const id = args.where.id;
        const fdProfile = new FormData();
        if (args.data.name || args.data.surname) {
          fdProfile.append("full_name", (args.data.name || "") + " " + (args.data.surname || ""));
        }
        if (args.data.phone) fdProfile.append("phone", args.data.phone);
        if (args.data.address) fdProfile.append("address", args.data.address);
        if (args.data.occupation) fdProfile.append("occupation", args.data.occupation);
        if (args.data.relationship) fdProfile.append("relationship", args.data.relationship);
        if (args.data.emergencyPhone) fdProfile.append("emergency_phone", args.data.emergencyPhone);
        return await callApiMutate(`/profiles/${id}`, "PUT", fdProfile, true);
      }
      if (method === "delete") {
        return await callApiMutate(`/users/${args.where.id}`, "DELETE");
      }
    }

    // Exam Mutation
    if (model === "exam") {
      if (method === "create") {
        const start = new Date(args.data.startTime);
        const end = new Date(args.data.endTime);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000) || 120;
        const payload = {
          lesson_id: args.data.lessonId || 1,
          title: args.data.title,
          description: args.data.description || null,
          created_by: "System",
          exam_date: start.toISOString(),
          start_time: start.toTimeString().split(' ')[0],
          end_time: end.toTimeString().split(' ')[0],
          duration: duration,
          total_marks: 100,
          pass_mark: 50
        };
        return await callApiMutate("/exams", "POST", payload);
      }
      if (method === "update") {
        const payload: any = {
          title: args.data.title,
        };
        if ("description" in args.data) {
          payload.description = args.data.description;
        }
        if (args.data.startTime) {
          const start = new Date(args.data.startTime);
          payload.exam_date = start.toISOString();
          payload.start_time = start.toTimeString().split(' ')[0];
        }
        if (args.data.endTime) {
          const end = new Date(args.data.endTime);
          payload.end_time = end.toTimeString().split(' ')[0];
        }
        return await callApiMutate(`/exams/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/exams/${args.where.id}`, "DELETE");
      }
    }

    // Lesson Mutation
    if (model === "lesson") {
      if (method === "create") {
        const start = new Date(args.data.startTime);
        const end = new Date(args.data.endTime);
        const duration = Math.round((end.getTime() - start.getTime()) / 60000) || 90;
        const payload = {
          title: args.data.name,
          day: args.data.day || "MONDAY",
          start_time: start.toTimeString().split(' ')[0],
          end_time: end.toTimeString().split(' ')[0],
          duration: duration.toString() + "min",
          module_id: 1 // fallback
        };
        return await callApiMutate("/lessons", "POST", payload);
      }
      if (method === "update") {
        const payload: any = {
          title: args.data.name,
          day: args.data.day,
        };
        if (args.data.startTime) {
          payload.start_time = new Date(args.data.startTime).toTimeString().split(' ')[0];
        }
        if (args.data.endTime) {
          payload.end_time = new Date(args.data.endTime).toTimeString().split(' ')[0];
        }
        return await callApiMutate(`/lessons/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/lessons/${args.where.id}`, "DELETE");
      }
    }

    // Assignment Mutation
    if (model === "assignment") {
      if (method === "create") {
        const payload = {
          title: args.data.title,
          start_date: new Date(args.data.startDate).toISOString(),
          due_date: new Date(args.data.dueDate).toISOString(),
          lesson_id: args.data.lessonId || null,
          description: args.data.description || null,
          attachment_file: args.data.attachmentFile || null
        };
        return await callApiMutate("/assignments", "POST", payload);
      }
      if (method === "update") {
        const payload: any = {
          title: args.data.title,
        };
        if (args.data.startDate) payload.start_date = new Date(args.data.startDate).toISOString();
        if (args.data.dueDate) payload.due_date = new Date(args.data.dueDate).toISOString();
        if ("lessonId" in args.data) payload.lesson_id = args.data.lessonId;
        if ("description" in args.data) payload.description = args.data.description;
        if ("attachmentFile" in args.data) payload.attachment_file = args.data.attachmentFile;
        return await callApiMutate(`/assignments/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/assignments/${args.where.id}`, "DELETE");
      }
    }

    // Announcement Mutation
    if (model === "announcement") {
      if (method === "create") {
        const payload = {
          title: args.data.title,
          message: args.data.message,
          type: args.data.type || "general",
          course_id: args.data.courseId || null,
          recipient_id: args.data.recipientId || null
        };
        return await callApiMutate("/announcements", "POST", payload);
      }
      if (method === "update") {
        const payload = {
          title: args.data.title,
          message: args.data.message,
          type: args.data.type
        };
        return await callApiMutate(`/announcements/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/announcements/${args.where.id}`, "DELETE");
      }
    }

    // Attendance Mutation
    if (model === "attendance") {
      if (method === "create") {
        const payload = {
          student_id: args.data.studentId,
          course_id: args.data.courseId || 1,
          date: new Date(args.data.date).toISOString().split('T')[0],
          status: args.data.status || "present",
          time: args.data.time || "09:00:00",
          note: args.data.note || ""
        };
        return await callApiMutate("/attendance", "POST", payload);
      }
      if (method === "update") {
        const payload = {
          status: args.data.status,
          note: args.data.note
        };
        return await callApiMutate(`/attendance/${args.where.id}`, "PUT", payload);
      }
      if (method === "delete") {
        return await callApiMutate(`/attendance/${args.where.id}`, "DELETE");
      }
    }
  }

  // Fallback defaults for safety
  if (method === "count") return 0;
  if (method === "findMany" || method === "groupBy") return [];
  if (method === "findUnique" || method === "findFirst") return null;
  return null;
};

const createSafePrismaStub = () => {
  const createModelProxy = (propertyName: string) =>
    new Proxy(
      {},
      {
        get(_target, methodName) {
          if (methodName === Symbol.toStringTag) {
            return "PrismaStub";
          }

          return async (args?: any) => {
            return await resolveLiveApiQuery(propertyName, String(methodName), args);
          };
        },
      }
    );

  return new Proxy(
    {},
    {
      get(_target, propertyName) {
        if (propertyName === Symbol.toStringTag) {
          return "PrismaStub";
        }

        if (propertyName === "$transaction") {
          return async (operations: Array<Promise<unknown>>) => {
            return Promise.all(operations);
          };
        }

        if (propertyName === "$disconnect") {
          return async () => undefined;
        }

        return createModelProxy(String(propertyName));
      },
    }
  ) as PrismaClient;
};

declare const globalThis: {
  prismaGlobal: PrismaClient | ReturnType<typeof createSafePrismaStub>;
} & typeof global;

// Always use the REST-API proxy stub — we have no Prisma-managed database.
// The old globalThis singleton pattern caused stale real-PrismaClient instances
// to survive HMR reloads and return empty results because the Prisma schema
// doesn't match the FastAPI postgres schema.
const prisma = createSafePrismaStub();

export default prisma;