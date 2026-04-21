import { useMemo } from "react";
import { useCampaigns } from "./useCampaigns";
import { useDailyStats } from "./useDailyStats";
import { useFilterStore } from "@/store/filterStore";
import { safeNumber } from "@/utils/safe";
import { calcCTR, calcCPC, calcROAS } from "@/lib/metrics";
import { Campaign } from "@/types";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

export interface CampaignTableRow {
    id: string;
    name: string;
    platform: Campaign["platform"];
    status: Campaign["status"];
    startDate: string;
    endDate: string | null;
    totalCost: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    ctr: number;
    cpc: number;
    roas: number;
}

export interface ChartDataPoint {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
}

type StatsAccumulator = {
    impressions: number;
    clicks: number;
    cost: number;
    conversionsValue: number;
    conversions: number;
};

const EMPTY_STATS: StatsAccumulator = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversionsValue: 0,
    conversions: 0,
};

export function useFilteredData() {
    const { dateRange, platforms, statuses } = useFilterStore();
    const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
    const { data: dailyStats = [], isLoading: statsLoading } = useDailyStats();

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((c) => {
            if (platforms.length > 0 && !platforms.includes(c.platform)) return false;
            if (statuses.length > 0 && !statuses.includes(c.status)) return false;

            const campaignStart = dayjs(c.startDate);
            const campaignEnd = c.endDate ? dayjs(c.endDate) : null;
            const filterStart = dayjs(dateRange.start);
            const filterEnd = dayjs(dateRange.end);

            if (campaignStart.isAfter(filterEnd)) return false;
            if (campaignEnd && campaignEnd.isBefore(filterStart)) return false;

            return true;
        });
    }, [campaigns, platforms, statuses, dateRange]);

    const filteredIds = useMemo(() => new Set(filteredCampaigns.map((c) => c.id)), [filteredCampaigns]);

    const filteredStats = useMemo(() => {
        return dailyStats.filter((s) => {
            if (!filteredIds.has(s.campaignId)) return false;
            const statDate = dayjs(s.date);
            return statDate.isSameOrAfter(dayjs(dateRange.start)) && statDate.isSameOrBefore(dayjs(dateRange.end));
        });
    }, [dailyStats, filteredIds, dateRange]);

    const chartData = useMemo((): ChartDataPoint[] => {
        const map = new Map<string, ChartDataPoint>();

        for (const s of filteredStats) {
            const existing = map.get(s.date) ?? {
                date: s.date,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                cost: 0,
            };

            map.set(s.date, {
                date: s.date,
                impressions: existing.impressions + safeNumber(s.impressions),
                clicks: existing.clicks + safeNumber(s.clicks),
                conversions: existing.conversions + safeNumber(s.conversions),
                cost: existing.cost + safeNumber(s.cost),
            });
        }

        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredStats]);

    const tableData = useMemo((): CampaignTableRow[] => {
        const statsByCampaign = new Map<string, StatsAccumulator>();

        for (const s of filteredStats) {
            const existing = statsByCampaign.get(s.campaignId) ?? { ...EMPTY_STATS };

            statsByCampaign.set(s.campaignId, {
                impressions: existing.impressions + safeNumber(s.impressions),
                clicks: existing.clicks + safeNumber(s.clicks),
                cost: existing.cost + safeNumber(s.cost),
                conversionsValue: existing.conversionsValue + safeNumber(s.conversionsValue),
                conversions: existing.conversions + safeNumber(s.conversions),
            });
        }

        return filteredCampaigns.map((c) => {
            const stats = statsByCampaign.get(c.id) ?? { ...EMPTY_STATS };

            return {
                id: c.id,
                name: c.name,
                platform: c.platform,
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate,
                totalCost: stats.cost,
                totalImpressions: stats.impressions,
                totalClicks: stats.clicks,
                totalConversions: stats.conversions,
                ctr: calcCTR(stats.clicks, stats.impressions),
                cpc: calcCPC(stats.cost, stats.clicks),
                roas: calcROAS(stats.conversionsValue, stats.cost),
            };
        });
    }, [filteredCampaigns, filteredStats]);

    return { filteredCampaigns, chartData, tableData, isLoading: campaignsLoading || statsLoading };
}
