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
  Bell,
  HelpCircle
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
  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState<Record<number, boolean>>({});

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
      } else {
        router.replace("/login");
      }
    } catch (e) {
      console.error("Failed to parse userInfo:", e);
      router.replace("/login");
    }
  }, [pathname, isAuthPage, router]);

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

  useEffect(() => {
    if (isAuthPage) return;
    const fetchActiveAnnouncements = async () => {
      try {
        const res = await fetch("/api/maintain/announcements?active=true", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setActiveAnnouncements(data.announcements || []);
        }
      } catch (e) {
        console.error("fetch active announcements error", e);
      }
    };
    fetchActiveAnnouncements();
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

  const userInitials = useMemo(() => {
    const name = user?.user_full_name || user?.user_name || "US";
    return name.substring(0, 2).toUpperCase();
  }, [user]);

  const roleNameTH = useMemo(() => {
    const role = user?.role;
    if (role === "ADMIN" || role === "ADMIN_GR") return "Administrator";
    if (role === "CS") return "Customer Service";
    if (role === "GR") return "Goods Receive";
    if (role === "DC") return "Distribution Center";
    return "User";
  }, [user]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Dark indigo sidebar */}
      <aside className="w-64 bg-[#121224] text-slate-300 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          {/* Sidebar Top Header Logo */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#0e0e1c] border-b border-slate-800/40">
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-700/30">
              <img src="/images/logo_vrepair.png" alt="VService Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-sm tracking-wide">VService</span>
              <span className="text-[9px] text-slate-500 font-semibold tracking-wider">ระบบใบแจ้งซ่อมสินค้า</span>
            </div>
          </div>

          <div className="p-4">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider px-3 uppercase block mb-3">
              Main Menu
            </span>
            
            {/* Navigation Links */}
            <nav className="flex flex-col gap-0.5">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4 ${
                  pathname === "/dashboard"
                    ? "bg-[#252542] text-white border-violet-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a33]/50 border-transparent"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-violet-400" />
                Dashboard
              </Link>

              {canAddRequest && (
                <Link
                  href="/request/add"
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4 ${
                    pathname === "/request/add"
                      ? "bg-[#252542] text-white border-violet-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a33]/50 border-transparent"
                  }`}
                >
                  <Wrench className="w-4 h-4 text-violet-400" />
                  แจ้งซ่อมใหม่
                </Link>
              )}

              <Link
                href="/status"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4 ${
                  pathname === "/status"
                    ? "bg-[#252542] text-white border-violet-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a33]/50 border-transparent"
                }`}
              >
                <ClipboardList className="w-4 h-4 text-violet-400" />
                ติดตามงานซ่อม
              </Link>

              {isAdmin && (
                <Link
                  href="/maintain"
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4 ${
                    pathname === "/maintain"
                      ? "bg-[#252542] text-white border-violet-500"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a33]/50 border-transparent"
                  }`}
                >
                  <Settings className="w-4 h-4 text-violet-400" />
                  จัดการระบบ
                </Link>
              )}

              <Link
                href="/faq"
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-l-4 ${
                  pathname === "/faq"
                    ? "bg-[#252542] text-white border-violet-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1a33]/50 border-transparent"
                }`}
              >
                <HelpCircle className="w-4 h-4 text-violet-400" />
                คู่มือการใช้งาน & FAQ
              </Link>
            </nav>
          </div>
        </div>

        {/* Footer profile info & Logout */}
        <div className="p-4 border-t border-slate-800/40 bg-[#0e0e1c] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">
                {user?.user_full_name || user?.user_name}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {user?.user_email || `${user?.user_name}@company.com`}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1e1e38] border border-slate-800 text-slate-400 uppercase">
              {roleNameTH} {user?.store_code ? `(${user.store_code})` : ""}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-violet-600 font-extrabold">VService</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-500 font-semibold text-xs">ระบบรับแจ้งซ่อมและบริการลูกค้า</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-violet-600 border-2 border-white"></span>
            </button>

            {/* Profile badge info */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{user?.user_full_name || user?.user_name}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{roleNameTH}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic banner alerts */}
        {activeAnnouncements
          .filter(ann => !closedAnnouncements[ann.id])
          .map(ann => {
            let bannerBg = "bg-[#aa7d39]"; // warning brown
            if (ann.severity === "danger") {
              bannerBg = "bg-red-700";
            } else if (ann.severity === "info") {
              bannerBg = "bg-indigo-600";
            }

            return (
              <div key={ann.id} className={`${bannerBg} text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold border-b border-white/10`}>
                <div className="flex items-center gap-6">
                  <span>⚠️ ประกาศด่วน</span>
                  <span>📢 {ann.message}</span>
                </div>
                <button 
                  onClick={() => setClosedAnnouncements(prev => ({ ...prev, [ann.id]: true }))}
                  className="hover:opacity-85 text-white/80"
                >
                  ×
                </button>
              </div>
            );
          })}

        <main className="flex-grow p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
