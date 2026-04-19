import { useEffect, useState } from "react";
import { Cpu, Brain, Database, Palette, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";

const Programs = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback default programs
  const defaultPrograms = [
    {
      title: "Computer Science",
      icon: Cpu,
      desc: "Master the foundations of software engineering and scalable systems.",
      tags: ["AI", "Systems", "Mobile"],
      enrollment: 2400,
    },
    {
      title: "Neural Engineering",
      icon: Brain,
      desc: "The intersection of neuroscience and computational modeling.",
      tags: ["Biotech", "BCI", "Research"],
      enrollment: 580,
    },
    {
      title: "Data Architecture",
      icon: Database,
      desc: "Design complex data systems for global enterprises.",
      tags: ["Big Data", "Cloud", "SQL"],
      enrollment: 1250,
    },
    {
      title: "Digital Arts",
      icon: Palette,
      desc: "Bridge the gap between technology and creative expression.",
      tags: ["UI/UX", "3D", "VFX"],
      enrollment: 890,
    },
    {
      title: "Cyber Security",
      icon: ShieldCheck,
      desc: "Protect the digital frontier with advanced offensive/defensive tactics.",
      tags: ["Ethical Hacking", "Crypto"],
      enrollment: 1150,
    },
  ];

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${API.COURSES.GET_ALL}?limit=50`);
        const courses = response.data?.data || [];

        if (courses.length > 0) {
          // Transform courses into program format
          const transformedPrograms = courses.slice(0, 5).map((course: any, idx: number) => ({
            title: course.course_name || course.title || "Program",
            icon: [Cpu, Brain, Database, Palette, ShieldCheck][idx % 5],
            desc: course.description || "Explore this innovative program.",
            tags: (course.category || "").split(",").map((t: string) => t.trim()).filter(Boolean) || ["Core", "Advanced"],
            enrollment: course.student_enrolled || 0,
          }));
          setPrograms(transformedPrograms);
        } else {
          setPrograms(defaultPrograms);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        setPrograms(defaultPrograms);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);
  return (
    <section id="programs" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <h2 className="text-[#3ecf8e] font-bold tracking-widest uppercase text-sm">
              Academic Programs
            </h2>
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
              Find Your Domain
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Our curriculum is designed in partnership with industry giants to
            ensure our graduates are day-one ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#3ecf8e] animate-spin" />
            </div>
          ) : (
            programs.map((program, idx) => (
            <div
              key={idx}
              className="group relative bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 p-8 rounded-2xl hover:border-[#3ecf8e]/50 transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-10">
                <program.icon
                  size={80}
                  className="text-gray-300 dark:text-white"
                />
              </div>

              <div className="bg-white dark:bg-[#1c1c1c] w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm border border-gray-100 dark:border-gray-700">
                <program.icon className="text-[#3ecf8e] w-7 h-7" />
              </div>

              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {program.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {program.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                {program.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-3 py-1 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button className="mt-8 flex items-center text-[#3ecf8e] font-bold group-hover:translate-x-2 transition-transform">
                Learn More <Cpu className="ml-2 w-4 h-4" />
              </button>
            </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Programs;
