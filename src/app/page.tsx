"use client";

import CampaignTable from "@/components/dashboard/CampaignTable";
import DailyTrendChart from "@/components/dashboard/DailyTrendChart";
import GlobalFilter from "@/components/dashboard/GlobalFilter";
import { useFilteredData } from "@/hooks/useFilteredData";

export default function DashboardPage() {
    const { filteredCampaigns, chartData, tableData } = useFilteredData();

    return (
        <main className="p-6 space-y-6">
            <GlobalFilter />
            <DailyTrendChart />
            <CampaignTable />
        </main>
    );
}
