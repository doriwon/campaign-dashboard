"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFilteredData } from "@/hooks/useFilteredData";
import LoadingSpinner from "../LoadingSpinner";

type MetricKey = "roas" | "ctr" | "cpc";

const METRICS: { key: MetricKey; label: string }[] = [
    { key: "roas", label: "ROAS" },
    { key: "ctr", label: "CTR" },
    { key: "cpc", label: "CPC" },
];

export default function CampaignRanking() {
    const [metric, setMetric] = useState<MetricKey>("roas");
    const { tableData, isLoading } = useFilteredData();

    const top3 = useMemo(() => {
        const sorted = [...tableData]
            .filter((row) => row[metric] > 0)
            .sort((a, b) => (metric === "cpc" ? a[metric] - b[metric] : b[metric] - a[metric]));

        return sorted.slice(0, 3).map((row, i) => {
            const fullName = row.name ?? "-";
            const shortName = fullName.length > 10 ? fullName.slice(0, 10) + "…" : fullName;
            return {
                rank: i + 1,
                id: row.id,
                shortName,
                value: row[metric],
                fullName,
            };
        });
    }, [tableData, metric]);

    const formatValue = (v: number) => {
        if (metric === "cpc") return `${Math.round(v).toLocaleString("ko-KR")}원`;
        return `${v.toFixed(2)}%`;
    };

    if (isLoading)
        return (
            <section className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">캠페인 랭킹 Top3</h2>
                <LoadingSpinner />
            </section>
        );

    return (
        <section className="rounded-lg border p-4 space-y-4">
            {/* 헤더 + 토글 — 항상 표시 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">캠페인 랭킹 Top3</h2>
                <div className="flex gap-2">
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

            {top3.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    해당 기간의 데이터가 없습니다.
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={top3} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="shortName"
                                width={110}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: unknown) => {
                                    if (typeof value !== "number") return "-";
                                    return [formatValue(value), METRICS.find((m) => m.key === metric)?.label];
                                }}
                                labelFormatter={(label) => top3.find((d) => d.shortName === label)?.fullName ?? label}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                {top3.map((d, i) => (
                                    <Cell key={d.id} fill={i === 0 ? "#6366f1" : i === 1 ? "#818cf8" : "#a5b4fc"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="space-y-2">
                        {top3.map((d) => (
                            <div key={d.rank} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-bold w-5 text-center
                                            ${
                                                d.rank === 1
                                                    ? "text-yellow-500"
                                                    : d.rank === 2
                                                      ? "text-gray-400"
                                                      : "text-amber-600"
                                            }`}
                                    >
                                        {d.rank}
                                    </span>
                                    <span className="truncate max-w-[160px]" title={d.fullName}>
                                        {d.fullName}
                                    </span>
                                </div>
                                <span className="font-medium tabular-nums">{formatValue(d.value)}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
