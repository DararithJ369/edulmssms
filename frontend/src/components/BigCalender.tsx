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
            ? "h-8 w-8 bg-slate-800 text-white shadow-md"
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
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          Work Week
        </button>
        <button
          onClick={() => onView(Views.DAY)}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            view === Views.DAY
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
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

  // Parse events — data already has correct dates from the server
  const adjustedEvents = data.map((event) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));


  // Colorful event style for better readability
  const eventPropGetter = (event: any) => {
    const shades = [
      { bg: "#EFF6FF", text: "#1E40AF", border: "#3B82F6" }, // blue
      { bg: "#F0FDF4", text: "#166534", border: "#22C55E" }, // green
      { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" }, // amber
      { bg: "#EDE9FE", text: "#5B21B6", border: "#8B5CF6" }, // violet
      { bg: "#FFF1F2", text: "#9F1239", border: "#F43F5E" }, // rose
      { bg: "#ECFEFF", text: "#155E75", border: "#06B6D4" }, // cyan
    ];

    let hash = 0;
    const title = event.title || "";
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const shade = shades[Math.abs(hash) % shades.length];

    return {
      style: {
        backgroundColor: shade.bg,
        color: shade.text,
        borderLeft: `3px solid ${shade.border}`,
        borderRadius: "6px",
        fontSize: "10px",
        fontWeight: "800",
        padding: "3px 6px",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        display: "block",
        lineHeight: "1.4",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
      },
    };
  };

  const formats = {
    timeGutterFormat: (date: Date) => moment(date).format("h A"), // e.g. "9 AM"
  };

  return (
    <div style={{height:'100%',minHeight:'500px',position:'relative'}}>
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
        min={new Date(2025, 1, 0, 7, 0, 0)}
        max={new Date(2025, 1, 0, 17, 0, 0)}
        step={60}
        timeslots={1}
        eventPropGetter={eventPropGetter}
        components={{
          toolbar: CustomToolbar,
          header: CustomHeader,
        }}
        formats={formats}
      />
    </div>
  );
};

export default BigCalendar;
