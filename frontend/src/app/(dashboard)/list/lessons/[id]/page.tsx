import { serverFetch } from "@/lib/server-api";
import { ArrowLeft, BookOpen, Clock, FileText, Video, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

const SingleLessonPage = async ({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  let lesson: any = null;
  let fetchError: string | null = null;

  const courseId = searchParams?.courseId || "";
  const moduleId = searchParams?.moduleId || "";

  try {
    lesson = await serverFetch<any>(`/lessons/${id}`);
  } catch (err: any) {
    console.error("FAILED to fetch lesson detail:", err);
    fetchError = err.message || String(err);
  }

  if (!lesson) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-md m-6">
        <h1 className="text-xl font-semibold">Lesson Not Found</h1>
        <p className="text-sm mt-1">We couldn&apos;t retrieve the lesson with ID: <code>{id}</code></p>
        {fetchError && <p className="text-xs font-mono mt-2 bg-white p-2 border rounded">{fetchError}</p>}
        <Link href={courseId ? `/list/courses/${courseId}${moduleId ? `?expandedModuleId=${moduleId}` : ""}` : "/list/lessons"} className="mt-4 inline-block text-sm text-blue-600 underline font-semibold">
          {courseId ? "Back to Course Syllabus" : "Back to Lessons List"}
        </Link>
      </div>
    );
  }

  // Construct URLs correctly
  const backendBase = "http://localhost:8000";
  
  const getResourceUrl = (urlOrFile: string | null | undefined) => {
    if (!urlOrFile) return "";
    if (urlOrFile.startsWith("http://") || urlOrFile.startsWith("https://")) {
      return urlOrFile;
    }
    // If it's a relative local file path, point it to the backend uploads serve
    return `${backendBase}/uploads/${urlOrFile}`;
  };

  const fileUrl = getResourceUrl(lesson.material_file);
  const linkUrl = getResourceUrl(lesson.material_url);
  const isVideo = lesson.material_type?.toLowerCase() === "video" || fileUrl.endsWith(".mp4") || fileUrl.includes("youtube.com") || fileUrl.includes("youtu.be");
  const isPdf = lesson.material_type?.toLowerCase() === "pdf" || fileUrl.endsWith(".pdf") || linkUrl.endsWith(".pdf");

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-[#121212] min-h-screen flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1c1c1c] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href={courseId ? `/list/courses/${courseId}${moduleId ? `?expandedModuleId=${moduleId}` : ""}` : "/list/lessons"}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-semibold text-[#0038A8] uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Lesson {lesson.order || 1}
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 text-[#0038A8]" />
          <span>{lesson.duration || "90min"}</span>
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT / CENTER - MEDIA WORKSPACE */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* VISUAL WORKSPACE */}
          <div className="bg-black rounded-3xl overflow-hidden aspect-video relative shadow-lg flex items-center justify-center text-white">
            {isVideo && (fileUrl || linkUrl) ? (
              // Video Player
              <video
                src={fileUrl || linkUrl}
                controls
                className="w-full h-full object-contain"
                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200"
              />
            ) : isPdf && (fileUrl || linkUrl) ? (
              // PDF Frame
              <iframe
                src={fileUrl || linkUrl}
                className="w-full h-full border-none rounded-3xl"
                title={lesson.title}
              />
            ) : (
              // Beautiful CS Art/Placeholder Workspace if no media
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center text-[#0038A8] mb-4">
                  {lesson.material_type?.toLowerCase() === "quiz" ? <FileText className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Academic Lecture Content Workspace
                </h3>
                <p className="text-sm text-gray-400 max-w-md">
                  This lesson covers essential curriculum material. See the description panel for course content and links to study slides.
                </p>
                {(fileUrl || linkUrl) && (
                  <a
                    href={fileUrl || linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex items-center gap-2 bg-[#0038A8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#002D86] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Material in New Tab
                  </a>
                )}
              </div>
            )}
          </div>

          {/* DESCRIPTION PANEL */}
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Lecture Notes & Curriculum
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line font-medium">
              {lesson.content || lesson.description || "No description provided for this lesson module. Please consult with the supervisor or reference the course handbook."}
            </div>
          </div>
        </div>

        {/* RIGHT - COURSE RESOURCES AND FILES */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Lesson Resources
            </h2>

            {/* RESOURCE DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500">Material Type</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase bg-[#0038A8]/10 px-2 py-0.5 rounded text-[#0038A8]">
                  {lesson.material_type || "Article"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500">Duration</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {lesson.duration || "90min"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500">Order</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {lesson.order || 1}
                </span>
              </div>
            </div>

            {/* DOWNLOAD OR LINK ACTIONS */}
            <div className="space-y-3 pt-2">
              {fileUrl && (
                <a
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-lamaYellow text-black py-4 rounded-2xl font-bold hover:bg-[#d9b83b] transition-all shadow-md shadow-lamaYellow/10 text-center"
                >
                  <Download className="w-5 h-5" />
                  Download Local File Resource
                </a>
              )}
              
              {linkUrl && (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-all text-center"
                >
                  <ExternalLink className="w-5 h-5 text-[#0038A8]" />
                  Open External Study Link
                </a>
              )}

              {!fileUrl && !linkUrl && (
                <p className="text-xs text-center text-gray-500 italic py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  No attachments or download links are registered for this lesson.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleLessonPage;
