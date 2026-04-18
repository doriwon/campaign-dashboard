"use client";

import { useFilteredData } from "@/hooks/useFilteredData";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts";
import dayjs from "dayjs";

type MetricKey = "impressions" | "clicks" | "conversions" | "cost";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
    { key: "impressions", label: "노출수", color: "#6366f1" },
    { key: "clicks", label: "클릭수", color: "#f59e0b" },
    { key: "conversions", label: "전환수", color: "#10b981" },
    { key: "cost", label: "비용", color: "#ef4444" },
];

export default function DailyTrendChart() {
    const { chartData } = useFilteredData();

    // 초기값: 노출수 + 클릭수
    const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(new Set(["impressions", "clicks"]));

    const toggleMetric = (key: MetricKey) => {
        setActiveMetrics((prev) => {
            if (prev.has(key) && prev.size === 1) return prev; // 최소 1개 선택 강제
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // X축 날짜 포맷 (MM/DD)
    const formattedData = useMemo(
        () =>
            chartData.map((d) => ({
                ...d,
                dateLabel: dayjs(d.date).format("MM/DD"),
            })),
        [chartData],
    );

    // 빈 데이터 처리
    if (formattedData.length === 0) {
        return (
            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">일별 추이</h2>
                <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
                    해당 기간의 데이터가 없습니다.
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">일별 추이</h2>

                {/* 메트릭 토글 버튼 */}
                <div className="flex gap-2 flex-wrap">
                    {METRICS.map(({ key, label, color }) => {
                        const isActive = activeMetrics.has(key);
                        const isLast = isActive && activeMetrics.size === 1;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleMetric(key)}
                                disabled={isLast}
                                title={isLast ? "최소 1개 이상 선택해야 합니다" : undefined}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all
                  ${isActive ? "text-white" : "bg-white text-gray-500"}
                  ${isLast ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                `}
                                style={isActive ? { backgroundColor: color, borderColor: color } : {}}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(v) => v.toLocaleString("ko-KR")} />
                    <Tooltip
                        formatter={(value, name) => [
                            typeof value === "number" ? value.toLocaleString("ko-KR") : "-",
                            name,
                        ]}
                        labelFormatter={(label) => `날짜: ${label}`}
                    />
                    <Legend />
                    {METRICS.filter(({ key }) => activeMetrics.has(key)).map(({ key, label, color }) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={label}
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </section>
    );
}
