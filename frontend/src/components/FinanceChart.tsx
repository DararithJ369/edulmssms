"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FinanceChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const [feesRes, expensesRes] = await Promise.all([
          api.get("/finance/fees?limit=500"),
          api.get("/finance/expenses?limit=500")
        ]);

        const feesList = feesRes.data.data || [];
        const expensesList = expensesRes.data.data || [];

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const monthlyAggregation: Record<string, { income: number; expense: number }> = {};
        months.forEach(m => {
          monthlyAggregation[m] = { income: 0, expense: 0 };
        });

        feesList.forEach((item: any) => {
          const rawDate = item.paid_date || item.created_at;
          if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              const monthName = months[dateObj.getMonth()];
              monthlyAggregation[monthName].income += Number(item.amount || 0);
            }
          }
        });

        expensesList.forEach((item: any) => {
          const rawDate = item.spent_date || item.created_at;
          if (rawDate) {
            const dateObj = new Date(rawDate);
            if (!isNaN(dateObj.getTime())) {
              const monthName = months[dateObj.getMonth()];
              monthlyAggregation[monthName].expense += Number(item.amount || 0);
            }
          }
        });

        const formattedData = months.map(m => ({
          name: m,
          income: monthlyAggregation[m].income,
          expense: monthlyAggregation[m].expense,
        }));

        setChartData(formattedData);
      } catch (err) {
        console.error("Failed to fetch finance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 flex items-center justify-center">
        <span className="text-gray-500 font-medium">Loading finance data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#d1d5db" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis axisLine={false} tick={{ fill: "#d1d5db" }} tickLine={false}  tickMargin={20}/>
          <Tooltip />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#C3EBFA"
            strokeWidth={5}
          />
          <Line type="monotone" dataKey="expense" stroke="#CFCEFF" strokeWidth={5}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
