"use client";

import { useState } from "react";
import CampaignTable from "@/components/dashboard/CampaignTable";
import DailyTrendChart from "@/components/dashboard/DailyTrendChart";
import GlobalFilter from "@/components/dashboard/GlobalFilter";
import CampaignModal from "@/components/dashboard/CampaignModal";

export default function DashboardPage() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">캠페인 대시보드</h1>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                    캠페인 등록
                </button>
            </div>

            <GlobalFilter />
            <DailyTrendChart />
            <CampaignTable />
            <CampaignModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </main>
    );
}
