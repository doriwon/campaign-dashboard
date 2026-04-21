"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useFilterStore } from "@/store/filterStore";
import LoadingSpinner from "../LoadingSpinner";

type MetricKey = "totalCost" | "totalImpressions" | "totalClicks" | "totalConversions";
type Platform = "Google" | "Meta" | "Naver";

const METRICS: { key: MetricKey; label: string }[] = [
    { key: "totalCost", label: "비용" },
    { key: "totalImpressions", label: "노출수" },
    { key: "totalClicks", label: "클릭수" },
    { key: "totalConversions", label: "전환수" },
];

const PLATFORM_COLORS: Record<Platform, string> = {
    Google: "#6366f1",
    Meta: "#3b82f6",
    Naver: "#10b981",
};

const PLATFORMS: Platform[] = ["Google", "Meta", "Naver"];

type DonutItem = {
    name: Platform;
    value: number;
    percent: number;
};

export default function PlatformChart() {
    const [metric, setMetric] = useState<MetricKey>("totalCost");
    const { tableData, isLoading } = useFilteredData();
    const { platforms, togglePlatform } = useFilterStore();

    const donutData = useMemo((): DonutItem[] => {
        const totals: Record<Platform, number> = { Google: 0, Meta: 0, Naver: 0 };

        for (const row of tableData) {
            const p = row.platform as Platform;
            if (PLATFORMS.includes(p)) {
                totals[p] += row[metric] ?? 0;
            }
        }

        const total = Object.values(totals).reduce((a, b) => a + b, 0);

        return PLATFORMS.map((p) => ({
            name: p,
            value: totals[p],
            // total이 0이면 percent도 0으로 → NaN 방지
            percent: total === 0 ? 0 : (totals[p] / total) * 100,
        }));
    }, [tableData, metric]);

    const total = donutData.reduce((a, b) => a + b.value, 0);

    // Pie onClick: PieSectorDataItem 타입
    const handlePieClick = (data: PieSectorDataItem) => {
        if (!data.name) return;
        togglePlatform(data.name as Platform);
    };

    // 수치 표 onClick: DonutItem 타입 (별도 분리)
    const handleLabelClick = (name: Platform) => {
        togglePlatform(name);
    };

    if (isLoading)
        return (
            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">플랫폼별 성과</h2>
                <LoadingSpinner />
            </section>
        );

    return (
        <section className="rounded-lg border p-4 space-y-4">
            {/* 헤더 + 토글 — 항상 표시 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">플랫폼별 성과</h2>
                <div className="flex gap-2 flex-wrap">
                    {METRICS.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setMetric(key)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all
                                ${
                                    metric === key ? "bg-blue-600 border-blue-600 text-white" : "bg-white text-gray-500"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 데이터 없을 때 — 토글 버튼은 위에 유지됨 */}
            {total === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    해당 기간의 데이터가 없습니다.
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={handlePieClick}
                                style={{ cursor: "pointer" }}
                            >
                                {donutData.map((entry) => (
                                    <Cell
                                        key={entry.name}
                                        fill={PLATFORM_COLORS[entry.name]}
                                        opacity={platforms.length === 0 || platforms.includes(entry.name) ? 1 : 0.3}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: unknown) =>
                                    typeof value === "number" ? value.toLocaleString("ko-KR") : "-"
                                }
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* 수치 + 비중 표 */}
                    <div className="w-full md:min-w-[170px] space-y-3">
                        {donutData.map((d) => (
                            <div key={d.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: PLATFORM_COLORS[d.name] }}
                                    />
                                    <span
                                        className="cursor-pointer hover:underline"
                                        onClick={() => handleLabelClick(d.name)}
                                    >
                                        {d.name}
                                    </span>
                                </div>
                                <div className="text-right ">
                                    <p className="font-medium">{d.value.toLocaleString("ko-KR")}</p>
                                    <p className="text-xs text-gray-400">{d.percent.toFixed(1)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
