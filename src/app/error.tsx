"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to console or error reporter
    console.error("Unhandled client-side exception caught by root boundary:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg p-8 rounded-2xl shadow-xl bg-white border border-red-200 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            เกิดข้อผิดพลาดในการแสดงผล
          </h2>
          <p className="text-slate-500 text-sm">
            ระบบพบข้อผิดพลาดในการประมวลผลข้อมูลหน้าเว็บนี้ ขออภัยในความไม่สะดวก
          </p>
        </div>

        {error.message && (
          <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono p-3 rounded-lg max-h-40 overflow-y-auto text-left whitespace-pre-wrap">
            {error.toString()}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition-colors duration-200"
          >
            ลองใหม่อีกครั้ง (Retry)
          </button>
          <button
            onClick={() => {
              router.push("/menu");
              reset();
            }}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors duration-200"
          >
            กลับไปหน้าเมนูหลัก
          </button>
        </div>
      </div>
    </main>
  );
}
