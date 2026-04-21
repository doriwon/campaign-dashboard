export default function LoadingSpinner() {
    return (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-sm text-gray-400">LOADING...</p>
        </div>
    );
}
