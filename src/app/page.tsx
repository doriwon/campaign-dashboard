"use client";

import GlobalFilter from "@/components/dashboard/GlobalFilter";
import { useFilteredData } from "@/hooks/useFilteredData";

export default function DashboardPage() {
    const { filteredCampaigns, chartData, tableData } = useFilteredData();

    return (
        <main className="p-6 space-y-6">
            <GlobalFilter />

            <section className="rounded-lg border p-4">
                <p>필터된 캠페인: {filteredCampaigns.length}개</p>
                <p>차트 포인트: {chartData.length}개</p>
                <p>테이블 행: {tableData.length}개</p>

                <pre className="mt-4 overflow-auto rounded bg-gray-50 p-3 text-xs">
                    {JSON.stringify(tableData[0] ?? null, null, 2)}
                </pre>
            </section>
        </main>
    );
}
