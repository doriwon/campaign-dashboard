import { useMemo } from "react";
import { useCampaigns } from "./useCampaigns";
import { useDailyStats } from "./useDailyStats";
import { useFilterStore } from "@/store/filterStore";
import { safeNumber } from "@/utils/safe";
import { calcCTR, calcCPC, calcROAS } from "@/lib/metrics";
import { Campaign, DailyStat } from "@/types";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

// 테이블 행 1개의 타입
export interface CampaignTableRow {
    id: string;
    name: string;
    platform: Campaign["platform"];
    status: Campaign["status"];
    startDate: string;
    endDate: string | null;
    totalCost: number;
    ctr: number;
    cpc: number;
    roas: number;
}

// 차트 1개 포인트의 타입
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
};

export function useFilteredData() {
    const { dateRange, platforms, statuses } = useFilterStore();
    const { data: campaigns = [] } = useCampaigns();
    const { data: dailyStats = [] } = useDailyStats();

    // 1단계: 필터 조건에 맞는 캠페인 추출
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((c) => {
            // 매체 필터 (빈 배열 = 전체 허용)
            if (platforms.length > 0 && !platforms.includes(c.platform)) return false;

            // 상태 필터 (빈 배열 = 전체 허용)
            if (statuses.length > 0 && !statuses.includes(c.status)) return false;

            // 날짜 필터: 캠페인 집행 기간이 선택 기간과 겹치는지
            // 캠페인 startDate가 필터 end 이전이고,
            // 캠페인 endDate가 null이거나 필터 start 이후이면 겹침
            const campaignStart = dayjs(c.startDate);
            const campaignEnd = c.endDate ? dayjs(c.endDate) : null;
            const filterStart = dayjs(dateRange.start);
            const filterEnd = dayjs(dateRange.end);

            if (campaignStart.isAfter(filterEnd)) return false;
            if (campaignEnd && campaignEnd.isBefore(filterStart)) return false;

            return true;
        });
    }, [campaigns, platforms, statuses, dateRange]);

    // 2단계: 필터된 캠페인 ID 셋
    const filteredIds = useMemo(() => new Set(filteredCampaigns.map((c) => c.id)), [filteredCampaigns]);

    // 3단계: 해당 캠페인의 daily_stats 중 날짜 범위 내 것만
    const filteredStats = useMemo(() => {
        return dailyStats.filter((s) => {
            if (!filteredIds.has(s.campaignId)) return false;
            const statDate = dayjs(s.date);
            return statDate.isSameOrAfter(dayjs(dateRange.start)) && statDate.isSameOrBefore(dayjs(dateRange.end));
        });
    }, [dailyStats, filteredIds, dateRange]);

    // 4단계: 날짜별 합산 → 차트 데이터
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

        // 날짜 오름차순 정렬
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredStats]);

    // 5단계: 캠페인별 집계 + 파생지표 → 테이블 데이터
    const tableData = useMemo((): CampaignTableRow[] => {
        // campaignId별로 stats 합산
        const statsByCampaign = new Map<string, StatsAccumulator>();

        for (const s of filteredStats) {
            const existing = statsByCampaign.get(s.campaignId) ?? {
                impressions: 0,
                clicks: 0,
                cost: 0,
                conversionsValue: 0,
            };

            statsByCampaign.set(s.campaignId, {
                impressions: existing.impressions + safeNumber(s.impressions),
                clicks: existing.clicks + safeNumber(s.clicks),
                cost: existing.cost + safeNumber(s.cost),
                // conversionsValue는 null일 수 있으므로 safeNumber로 처리
                conversionsValue: existing.conversionsValue + safeNumber(s.conversionsValue),
            });
        }

        return filteredCampaigns.map((c) => {
            const stats = statsByCampaign.get(c.id) ?? {
                impressions: 0,
                clicks: 0,
                cost: 0,
                conversionsValue: 0,
            };

            return {
                id: c.id,
                name: c.name,
                platform: c.platform,
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate,
                totalCost: stats.cost,
                ctr: calcCTR(stats.clicks, stats.impressions),
                cpc: calcCPC(stats.cost, stats.clicks),
                roas: calcROAS(stats.conversionsValue, stats.cost),
            };
        });
    }, [filteredCampaigns, filteredStats]);

    return {
        filteredCampaigns,
        chartData,
        tableData,
    };
}
