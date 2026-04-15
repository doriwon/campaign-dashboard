import { create } from "zustand";
import dayjs from "dayjs";

type Platform = "Google" | "Meta" | "Naver";
type Status = "active" | "paused" | "ended";

interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;
}

interface FilterState {
    dateRange: DateRange;
    platforms: Platform[];
    statuses: Status[];
    setDateRange: (range: DateRange) => void;
    togglePlatform: (platform: Platform) => void;
    toggleStatus: (status: Status) => void;
    resetFilter: () => void;
}

const getInitialDateRange = (): DateRange => ({
    start: dayjs().startOf("month").format("YYYY-MM-DD"),
    end: dayjs().endOf("month").format("YYYY-MM-DD"),
});

export const useFilterStore = create<FilterState>((set) => ({
    dateRange: getInitialDateRange(),
    platforms: [], // 빈 배열 = 전체
    statuses: [], // 빈 배열 = 전체

    setDateRange: (range) => set({ dateRange: range }),

    togglePlatform: (platform) =>
        set((state) => ({
            platforms: state.platforms.includes(platform)
                ? state.platforms.filter((p) => p !== platform)
                : [...state.platforms, platform],
        })),

    toggleStatus: (status) =>
        set((state) => ({
            statuses: state.statuses.includes(status)
                ? state.statuses.filter((s) => s !== status)
                : [...state.statuses, status],
        })),

    resetFilter: () =>
        set({
            dateRange: getInitialDateRange(),
            platforms: [],
            statuses: [],
        }),
}));
