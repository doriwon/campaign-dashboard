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
                    캠페인 등록 폼
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
                <div className="text-sm text-gray-500"></div>
            </div>
        </div>
    );
}
