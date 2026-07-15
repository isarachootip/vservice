"use client";

import { ReactNode, useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";

type UserData = {
  user_name: string;
  user_full_name?: string | null;
  user_email?: string | null;
  role?: string;
  permissions?: string[];
  store_code?: string | null;
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  // Exclude login and base customer-facing views from the staff sidebar layout
  const isAuthPage = pathname === "/login" || pathname === "/";

  useEffect(() => {
    if (isAuthPage) return;
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({
          ...parsed,
          permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        });
      }
    } catch (e) {
      console.error("Failed to parse userInfo:", e);
    }
  }, [pathname, isAuthPage]);

  // Fetch updated profile
  useEffect(() => {
    if (isAuthPage) return;
    let active = true;
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/current-user", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.authenticated && data.user) {
          const merged = { ...user, ...data.user };
          localStorage.setItem("userInfo", JSON.stringify(merged));
          setUser(merged);
        }
      } catch {}
    };
    fetchUser();
    return () => { active = false; };
  }, [isAuthPage]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("userInfo");
      router.push("/login");
    }
  };

  const perms = useMemo(() => (user?.permissions ?? []).map(p => String(p).trim()), [user]);
  const canAddRequest = perms.includes("add_request");
  const isAdmin = user?.role === "ADMIN" || user?.role === "ADMIN_GR";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Dark left sidebar */}
      <aside className="w-64 bg-[#0a0e17] text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col p-5 space-y-6">
          {/* Header logo / title */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white font-extrabold text-lg">
                V
              </span>
              <div className="flex flex-col">
                <span className="text-white font-extrabold text-sm tracking-wide leading-tight">Vibe Post</span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">MANAGEMENT HUB</span>
              </div>
            </Link>
            
            {/* Status indicator */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ready
            </span>
          </div>

          {/* Workspace Switcher */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition">
            <div className="flex items-center gap-2">
              <span className="flex w-5 h-5 rounded bg-purple-600/30 text-purple-400 items-center justify-center font-bold text-xs">
                M
              </span>
              <span className="text-xs font-semibold text-slate-200">Main Workspace</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 pt-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname === "/dashboard"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              ภาพรวมระบบ
            </Link>

            {canAddRequest && (
              <Link
                href="/request/add"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  pathname === "/request/add"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Wrench className="w-4 h-4" />
                เปิดใบแจ้งซ่อม
              </Link>
            )}

            <Link
              href="/status"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname === "/status"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              ติดตามงานซ่อม
            </Link>

            {isAdmin && (
              <Link
                href="/maintain"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  pathname === "/maintain"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Settings className="w-4 h-4" />
                จัดการระบบ
              </Link>
            )}
          </nav>
        </div>

        {/* Footer profile info & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center border border-slate-700">
              {(user?.user_full_name || user?.user_name || "U").substring(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-100 truncate">
                {user?.user_full_name || user?.user_name}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {user?.user_email || `${user?.user_name}@company.com`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
              {user?.role || "USER"} {user?.store_code ? `(${user.store_code})` : ""}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {pathname === "/dashboard" && "Dashboard / ภาพรวมระบบ"}
              {pathname === "/request/add" && "เปิดใบแจ้งซ่อมใหม่ (New Repair Ticket)"}
              {pathname === "/status" && "ติดตามและตรวจดูสถานะใบแจ้งซ่อม"}
              {pathname === "/maintain" && "จัดการตั้งค่าระบบ (Configuration Panel)"}
              {!["/dashboard", "/request/add", "/status", "/maintain"].includes(pathname) && "ระบบแจ้งซ่อมสินค้า"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {user?.store_code && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                สาขา: {user.store_code}
              </span>
            )}
          </div>
        </header>

        <main className="flex-grow p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
