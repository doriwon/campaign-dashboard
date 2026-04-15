"use client";

import { useCampaigns } from "@/hooks/useCampaigns";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useFilteredData } from "@/hooks/useFilteredData";

export default function DashboardPage() {
    const { data: campaigns, isLoading, isError } = useCampaigns();
    const { data: dailyStats } = useDailyStats();
    const { filteredCampaigns, chartData, tableData } = useFilteredData();

    if (isLoading) return <p>불러오는 중...</p>;
    if (isError) return <p>데이터를 불러올 수 없습니다.</p>;

    return (
        <main>
            <p>캠페인 수: {campaigns?.length}</p>
            <p>일별 데이터 수: {dailyStats?.length}</p>

            <p>필터된 캠페인: {filteredCampaigns.length}개</p>
            <p>차트 포인트: {chartData.length}일</p>
            <p>테이블 행: {tableData.length}개</p>
            <pre className="text-xs mt-4">{JSON.stringify(tableData[0], null, 2)}</pre>
        </main>
    );
}
