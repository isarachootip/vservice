"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-slate-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-slate-800 tracking-tight">
          Repair Request
        </h2>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-slate-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              className="input-base focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
              disabled={loading}
              placeholder="กรอกชื่อผู้ใช้งาน"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="input-base focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
              disabled={loading}
              placeholder="กรอกรหัสผ่าน"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ (Log In)"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
