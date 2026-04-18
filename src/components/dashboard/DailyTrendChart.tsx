"use client";

import { useFilteredData } from "@/hooks/useFilteredData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts";

export default function DailyTrendChart() {
    const { chartData } = useFilteredData();
    console.log("chartData", chartData);
    return (
        <section className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">일별 추이</h2>
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                    <CartesianGrid />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="impressions"
                        name="노출수"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line type="monotone" dataKey="clicks" name="클릭수" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </section>
    );
}
