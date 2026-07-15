"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) {
      router.replace("/login");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 font-medium text-sm">กำลังนำทางไปยังหน้าระบบ...</div>
    </div>
  );
}
