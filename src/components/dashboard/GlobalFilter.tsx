"use client";

import { useState, useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";

const PLATFORM_OPTIONS = ["Google", "Meta", "Naver"] as const;
const STATUS_OPTIONS = ["active", "paused", "ended"] as const;

const STATUS_LABEL: Record<(typeof STATUS_OPTIONS)[number], string> = {
    active: "진행중",
    paused: "일시중지",
    ended: "종료",
};

const isValidDate = (str: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    return !isNaN(new Date(str).getTime());
};

const hasInvalidYear = (str: string): boolean => str.split("-")[0].length > 4;

export default function GlobalFilter() {
    const { dateRange, platforms, statuses, setDateRange, togglePlatform, toggleStatus, resetFilter } =
        useFilterStore();

    const [localStart, setLocalStart] = useState(dateRange.start);
    const [localEnd, setLocalEnd] = useState(dateRange.end);
    const [dateError, setDateError] = useState("");

    useEffect(() => {
        setLocalStart(dateRange.start);
        setLocalEnd(dateRange.end);
        setDateError("");
    }, [dateRange.start, dateRange.end]);

    const handleStartChange = (value: string) => {
        if (!value || hasInvalidYear(value)) return;
        setLocalStart(value);

        if (!isValidDate(value)) {
            setDateError("올바른 시작일을 입력해주세요");
            return;
        }
        if (value > localEnd) {
            setDateError("종료일이 시작일 이후여야 합니다");
            return;
        }
        setDateError("");
        setDateRange({ start: value, end: localEnd });
    };

    const handleEndChange = (value: string) => {
        if (!value || hasInvalidYear(value)) return;
        setLocalEnd(value);

        if (!isValidDate(value)) {
            setDateError("올바른 종료일을 입력해주세요");
            return;
        }
        if (value < localStart) {
            setDateError("종료일이 시작일 이후여야 합니다");
            return;
        }
        setDateError("");
        setDateRange({ start: localStart, end: value });
    };

    return (
        <section className="rounded-lg border p-4 space-y-4">
            <div>
                <h2 className="text-lg font-semibold">글로벌 필터</h2>
                <p className="text-sm text-gray-500">필터 변경 시 차트와 테이블이 함께 갱신됩니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <p className="text-sm font-medium">집행 기간</p>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => handleStartChange(e.target.value)}
                            className="min-w-0 w-full rounded border px-2 py-2 text-sm"
                        />
                        <span className="shrink-0 text-sm text-gray-500">~</span>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => handleEndChange(e.target.value)}
                            className="min-w-0 w-full rounded border px-2 py-2 text-sm"
                        />
                    </div>
                    {dateError && <p className="text-xs text-red-500">{dateError}</p>}
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">상태</p>
                    <div className="flex flex-wrap gap-3">
                        {STATUS_OPTIONS.map((status) => (
                            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={statuses.includes(status)}
                                    onChange={() => toggleStatus(status)}
                                    className="cursor-pointer"
                                />
                                <span>{STATUS_LABEL[status]}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">매체</p>
                    <div className="flex flex-wrap gap-3">
                        {PLATFORM_OPTIONS.map((platform) => (
                            <label key={platform} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={platforms.includes(platform)}
                                    onChange={() => togglePlatform(platform)}
                                    className="cursor-pointer"
                                />
                                <span>{platform}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={resetFilter}
                    className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
                >
                    초기화
                </button>
            </div>
        </section>
    );
}
