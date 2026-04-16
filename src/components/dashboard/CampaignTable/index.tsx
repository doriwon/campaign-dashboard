"use client";

import { useFilteredData } from "@/hooks/useFilteredData";
import { useMemo, useState } from "react";

type SortKey = "startDate" | "totalCost" | "ctr" | "cpc" | "roas";

export default function CampaignTable() {
    const { tableData } = useFilteredData();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<{
        key: "startDate" | "totalCost" | "ctr" | "cpc" | "roas";
        dir: "asc" | "desc";
    } | null>(null);

    const searchedData = useMemo(() => {
        return tableData.filter((row) => (row.name ?? "").toLowerCase().includes(search.toLowerCase()));
    }, [tableData, search]);

    const sortedData = useMemo(() => {
        if (!sort) return searchedData;

        return [...searchedData].sort((a, b) => {
            const aVal = a[sort.key];
            const bVal = b[sort.key];

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sort.dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }

            return sort.dir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [searchedData, sort]);

    // 정렬 토글
    const handleSort = (key: SortKey) => {
        setSort((prev) =>
            prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
        );
    };

    // 정렬 아이콘 표시
    const sortIcon = (key: SortKey) => {
        if (sort?.key !== key) return "↕";
        return sort.dir === "asc" ? "↑" : "↓";
    };

    return (
        <section className="rounded-lg border p-4">
            <h2 className="mb-4 text-lg font-semibold">캠페인 목록</h2>
            <input
                type="text"
                placeholder="캠페인명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-2 py-1 text-sm"
            />
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th className="pb-2 pr-3">캠페인명</th>
                        <th className="pb-2 pr-3">상태</th>
                        <th className="pb-2 pr-3">매체</th>
                        <th
                            className="pb-2 pr-3 cursor-pointer hover:text-blue-600"
                            onClick={() => handleSort("startDate")}
                        >
                            집행기간 {sortIcon("startDate")}
                        </th>
                        <th
                            className="pb-2 pr-3 cursor-pointer hover:text-blue-600"
                            onClick={() => handleSort("totalCost")}
                        >
                            총 집행금액 {sortIcon("totalCost")}
                        </th>
                        <th className="pb-2 pr-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort("ctr")}>
                            CTR(%) {sortIcon("ctr")}
                        </th>
                        <th className="pb-2 pr-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort("cpc")}>
                            CPC(원) {sortIcon("cpc")}
                        </th>
                        <th className="pb-2 pr-3 cursor-pointer hover:text-blue-600" onClick={() => handleSort("roas")}>
                            ROAS(%) {sortIcon("roas")}
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={8}>데이터 없음</td>
                        </tr>
                    ) : (
                        sortedData.map((row) => (
                            <tr key={row.id}>
                                <td>{row.name ?? "-"}</td>
                                <td>{row.status}</td>
                                <td>{row.platform}</td>
                                <td>
                                    {row.startDate} ~ {row.endDate ?? "-"}
                                </td>
                                <td>{row.totalCost}</td>
                                <td>{row.ctr}</td>
                                <td>{row.cpc}</td>
                                <td>{row.roas}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </section>
    );
}
