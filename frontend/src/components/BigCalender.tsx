"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const localizer = momentLocalizer(moment);

// Custom Day Column Header (Google Calendar style)
const CustomHeader = ({ date }: { date: Date }) => {
  const dayName = moment(date).format("ddd").toUpperCase();
  const dayNumber = moment(date).format("D");
  const isToday = moment(date).isSame(moment(), "day");

  return (
    <div className="flex flex-col items-center gap-1 select-none py-2 bg-[#f8f9fa] w-full">
      <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
        {dayName}
      </span>
      <div
        className={`flex items-center justify-center text-sm font-black rounded-full transition-all duration-200 ${
          isToday
            ? "h-8 w-8 bg-[#0038A8] text-white shadow-md"
            : "h-8 w-8 hover:bg-slate-200 text-slate-700"
        }`}
      >
        {dayNumber}
      </div>
    </div>
  );
};

// Custom Toolbar (Google Calendar style)
const CustomToolbar = (toolbarProps: any) => {
  const { label, onNavigate, onView, view } = toolbarProps;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 select-none bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
      <div className="flex items-center gap-3">
        {/* Today Button */}
        <button
          onClick={() => onNavigate("TODAY")}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          TODAY
        </button>

        {/* Navigation Arrows */}
        <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <button
            onClick={() => onNavigate("PREV")}
            className="p-2 hover:bg-slate-50 border-r border-slate-200 text-slate-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onNavigate("NEXT")}
            className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Date Range Label */}
        <span className="text-sm font-black text-slate-800 ml-1">
          {label}
        </span>
      </div>

      {/* View Selectors */}
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
        <button
          onClick={() => onView(Views.WORK_WEEK)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            view === Views.WORK_WEEK
              ? "bg-[#0038A8] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-850 hover:bg-slate-250"
          }`}
        >
          Work Week
        </button>
        <button
          onClick={() => onView(Views.DAY)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            view === Views.DAY
              ? "bg-[#0038A8] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-855 hover:bg-slate-255"
          }`}
        >
          Day
        </button>
      </div>
    </div>
  );
};

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date | string; end: Date | string }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [date, setDate] = useState<Date>(new Date());

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const getLatestMonday = (refDate: Date): Date => {
    const dayOfWeek = refDate.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const latestMonday = new Date(refDate);
    latestMonday.setDate(refDate.getDate() - daysSinceMonday);
    return latestMonday;
  };

  const adjustEventsToWeek = (
    eventsList: { title: string; start: Date | string; end: Date | string }[],
    refDate: Date
  ) => {
    const latestMonday = getLatestMonday(refDate);
    return eventsList.map((event) => {
      const eventDayOfWeek = new Date(event.start).getDay();
      const daysFromMonday = eventDayOfWeek === 0 ? 6 : eventDayOfWeek - 1;

      const adjustedStartDate = new Date(latestMonday);
      adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
      adjustedStartDate.setHours(
        new Date(event.start).getHours(),
        new Date(event.start).getMinutes(),
        0,
        0
      );
      const adjustedEndDate = new Date(adjustedStartDate);
      adjustedEndDate.setHours(
        new Date(event.end).getHours(),
        new Date(event.end).getMinutes(),
        0,
        0
      );

      return {
        ...event,
        start: adjustedStartDate,
        end: adjustedEndDate,
      };
    });
  };

  const adjustedEvents = adjustEventsToWeek(data, date);

  // Google Calendar aesthetic event colors mapper
  const eventPropGetter = (event: any) => {
    const colors = [
      { bg: "#E8F0FE", text: "#1A73E8", border: "#1A73E8" }, // Blue
      { bg: "#E6F4EA", text: "#137333", border: "#137333" }, // Green
      { bg: "#FEF7E0", text: "#B06000", border: "#B06000" }, // Yellow/Amber
      { bg: "#FCE8E6", text: "#C5221F", border: "#C5221F" }, // Red/Pink
      { bg: "#F3E8FD", text: "#8430D9", border: "#8430D9" }, // Purple
    ];

    let hash = 0;
    const title = event.title || "";
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];

    return {
      style: {
        backgroundColor: color.bg,
        color: color.text,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: "8px",
        fontSize: "11px",
        fontWeight: "700",
        padding: "5px 10px",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        display: "block",
        lineHeight: "1.3",
      },
    };
  };

  const formats = {
    timeGutterFormat: (date: Date) => moment(date).format("h A"), // e.g. "9 AM"
  };

  return (
    <Calendar
      localizer={localizer}
      events={adjustedEvents}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WORK_WEEK, Views.DAY]}
      view={view}
      date={date}
      onNavigate={(newDate) => setDate(newDate)}
      style={{ height: "98%" }}
      onView={handleOnChangeView}
      min={new Date(2025, 1, 0, 8, 0, 0)}
      max={new Date(2025, 1, 0, 17, 0, 0)}
      eventPropGetter={eventPropGetter}
      components={{
        toolbar: CustomToolbar,
        header: CustomHeader,
      }}
      formats={formats}
    />
  );
};

export default BigCalendar;
