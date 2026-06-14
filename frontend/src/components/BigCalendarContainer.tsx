import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId" | "studentId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : type === "studentId"
        ? { studentId: id as string }
        : { classId: id as number }),
    } as any,
  });

  // prisma.ts already maps lesson startTime/endTime to the current calendar week —
  // do NOT pass through adjustScheduleToCurrentWeek again or it double-shifts the dates.
  const data = dataRes.map((lesson: any) => ({
    title: lesson.name || lesson.title,
    start: lesson.startTime,
    end: lesson.endTime,
  }));

  return (
    <div className="h-full w-full">
      <BigCalendar data={data} />
    </div>
  );
};

export default BigCalendarContainer;
