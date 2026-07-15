"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      
      localStorage.setItem("userInfo", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      console.error("Login connection error", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-slate-200/80 flex flex-col items-center">
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center mb-4">
            <Image
              src="/images/logo_vrepair.png"
              alt="VService Logo"
              width={70}
              height={70}
              priority
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            VService
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            ระบบใบแจ้งซ่อมสินค้า
          </p>
        </div>

        <form className="space-y-5 w-full" onSubmit={handleLogin}>
          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              name="username"
              className="input-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              required
              disabled={loading}
              placeholder="กรอกชื่อผู้ใช้งาน"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="input-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              required
              disabled={loading}
              placeholder="กรอกรหัสผ่าน"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-lg p-2.5 text-center">{error}</p>
          )}

          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Log In)"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
