"use client";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function CampaignModal({ open, onClose }: Props) {
    const onSubmit = () => {
        console.log("등록");
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">캠페인 등록</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* 캠페인명 */}
                    <Field label="캠페인명">
                        <input placeholder="2자 ~ 100자" className="input" />
                    </Field>

                    {/* 광고 매체 */}
                    <Field label="광고 매체">
                        <select className="input">
                            <option value="">선택해주세요</option>
                            <option value="Google">Google</option>
                            <option value="Meta">Meta</option>
                            <option value="Naver">Naver</option>
                        </select>
                    </Field>

                    {/* 예산 */}
                    <Field label="예산 (원)">
                        <input type="number" placeholder="100 ~ 1,000,000,000" className="input" />
                    </Field>

                    {/* 집행 금액 */}
                    <Field label="집행 금액 (원)">
                        <input type="number" placeholder="0 ~ 예산 이하" className="input" />
                    </Field>

                    {/* 시작일 */}
                    <Field label="시작일">
                        <input type="date" className="input" />
                    </Field>

                    {/* 종료일 */}
                    <Field label="종료일">
                        <input type="date" className="input" />
                    </Field>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// 필드 컴포넌트
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
