import { LoaderCircle } from "lucide-react";
import { useLoadingStore } from "../store/loadingStore.js";

export default function GlobalLoader() {
  const activeRequests = useLoadingStore((state) => state.activeRequests);
  const loading = activeRequests > 0;

  if (!loading) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-blue-100 dark:bg-slate-800">
        <div className="global-loader-bar h-full w-1/3 bg-brand" />
      </div>
      <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <LoaderCircle className="animate-spin text-brand" size={18} />
        Loading...
      </div>
    </>
  );
}
