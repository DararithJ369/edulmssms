"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Microscope, Code, Award, Globe, Loader2 } from "lucide-react";

const Stats = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        setStats({
          totalStudents: 12500,
          totalInstructors: 450,
          totalCourses: 280,
          hireRate: 98,
          researchLabs: 250,
          techHubs: 15,
          globalPartners: 50,
        });

        const years = Array.from({ length: 6 }, (_, i) => 2019 + i);
        const generatedData = years.map((year) => ({
          year: year.toString(),
          graduates: Math.floor(1200 + (year - 2019) * 430 + Math.random() * 300),
          research: Math.floor(85 + (year - 2019) * 31 + Math.random() * 50),
        }));
        setChartData(generatedData);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats({
          totalStudents: 12500,
          totalInstructors: 450,
          totalCourses: 280,
          hireRate: 98,
          researchLabs: 250,
          techHubs: 15,
          globalPartners: 50,
        });
        setChartData([
          { year: "2019", graduates: 1200, research: 85 },
          { year: "2020", graduates: 1500, research: 92 },
          { year: "2021", graduates: 1800, research: 105 },
          { year: "2022", graduates: 2400, research: 140 },
          { year: "2023", graduates: 3100, research: 185 },
          { year: "2024", graduates: 3800, research: 240 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  return (
    <section id="stats" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[#0038A8] font-bold tracking-widest uppercase text-sm">
            Our Impact
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-foreground">
            Excellence in Mathematics, Statistics & Data Science
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We do more than teach formulas — we develop analytical thinkers, researchers, and innovators equipped to solve real-world problems through mathematics and data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1c1c1c] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Enrollment & Research Growth
            </h4>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-[#0038A8] animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0038A8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0038A8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-[#2a2a2a]"
                  />
                  <XAxis dataKey="year" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tw-bg-opacity, white)",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#0038A8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="graduates"
                    stroke="#0038A8"
                    fillOpacity={1}
                    fill="url(#colorGrad)"
                    strokeWidth={3}
                  />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 gap-6">
            {[
              {
                icon: Microscope,
                title: `${stats?.researchLabs}+ Research Labs`,
                desc: "World-class facilities for breakthrough innovation.",
                color: "text-green-500",
              },
              {
                icon: Code,
                title: `${stats?.techHubs} Tech Hubs`,
                desc: "Dedicated spaces for startups and coding marathons.",
                color: "text-purple-500",
              },
              {
                icon: Globe,
                title: `${stats?.globalPartners}+ Global Partners`,
                desc: "Study exchange programs with Ivy League universities.",
                color: "text-[#0038A8]",
              },
              {
                icon: Award,
                title: `${stats?.hireRate}% Hire Rate`,
                desc: "Recognized globally for educational excellence.",
                color: "text-yellow-500",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#1c1c1c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-start space-x-4 hover:border-[#0038A8]/30 transition-all cursor-default shadow-sm hover:shadow-md"
              >
                <div
                  className={`p-3 rounded-lg bg-gray-50 dark:bg-[#121212] ${item.color}`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-gray-900 dark:text-white font-bold">
                    {item.title}
                  </h5>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
