export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}
