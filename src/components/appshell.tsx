"use client";

import { ReactNode, useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  ClipboardList,
  Wrench,
  Users,
  FileText,
  Package,
  UserCheck,
  Store,
  BarChart2,
  Bell,
  Settings,
  LogOut,
  HelpCircle,
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
    if (role === "ADMIN" || role === "ADMIN_GR") return "Service Manager";
    if (role === "CS") return "Customer Service";
    if (role === "GR") return "Goods Receive";
    if (role === "DC") return "Distribution Center";
    return "User";
  }, [user]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      {/* Red/White themed sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20 shadow-sm">
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
          {/* Sidebar Top Header Logo (Thai Watsadu Brand Replica) */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-1.5">
              {/* Red House Box */}
              <div className="w-11 h-11 bg-[#c8102e] rounded flex flex-col items-center justify-center p-0.5 relative shrink-0 shadow-sm">
                <svg viewBox="0 0 24 24" className="w-9 h-9 fill-none stroke-white stroke-[2.5] absolute inset-0 m-auto" style={{ top: '-1.5px' }}>
                  <polygon points="12,3 3,11 6,11 6,20 18,20 18,11 21,11" fill="white" stroke="white" />
                </svg>
                {/* Red "ไท" text inside the white house cutout */}
                <span className="text-[#c8102e] font-extrabold text-[15px] z-10 select-none relative" style={{ top: '3.5px' }}>ไท</span>
              </div>
              {/* Black "วัสดุ" and subtext */}
              <div className="flex flex-col select-none">
                <span className="text-[#121212] font-black text-xl tracking-tight leading-none">วัสดุ</span>
                <span className="text-[#555] text-[9px] font-bold tracking-wider leading-none mt-1">SERVICE CENTER</span>
              </div>
            </div>
          </div>

          <div className="p-3">
            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  pathname === "/dashboard"
                    ? "bg-[#c8102e] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className={`w-4.5 h-4.5 ${pathname === "/dashboard" ? "text-white" : "text-slate-400"}`} />
                  <span>หน้าหลัก</span>
                </div>
              </Link>

              <Link
                href="/status"
                className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                  pathname === "/status"
                    ? "bg-[#c8102e] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className={`w-4.5 h-4.5 ${pathname === "/status" ? "text-white" : "text-slate-400"}`} />
                  <span>งานซ่อมทั้งหมด</span>
                </div>
              </Link>

              {canAddRequest && (
                <Link
                  href="/request/add"
                  className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                    pathname === "/request/add"
                      ? "bg-[#c8102e] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className={`w-4.5 h-4.5 ${pathname === "/request/add" ? "text-white" : "text-slate-400"}`} />
                    <span>รับเครื่อง / สร้างงาน</span>
                  </div>
                </Link>
              )}

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4.5 h-4.5 text-slate-400" />
                  <span>ลูกค้า</span>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4.5 h-4.5 text-slate-400" />
                  <span>ใบเสนอราคา</span>
                </div>
                <span className="bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                  8
                </span>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4.5 h-4.5 text-slate-400" />
                  <span>สินค้าคงคลัง / อะไหล่</span>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4.5 h-4.5 text-slate-400" />
                  <span>ช่างเทคนิค</span>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4.5 h-4.5 text-slate-400" />
                  <span>สาขา / จุดบริการ</span>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4.5 h-4.5 text-slate-400" />
                  <span>รายงาน / วิเคราะห์</span>
                </div>
              </Link>

              <Link
                href="#"
                className="flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4.5 h-4.5 text-slate-400" />
                  <span>การแจ้งเตือน</span>
                </div>
                <span className="bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                  6
                </span>
              </Link>

              {isAdmin && (
                <Link
                  href="/maintain"
                  className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                    pathname === "/maintain"
                      ? "bg-[#c8102e] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className={`w-4.5 h-4.5 ${pathname === "/maintain" ? "text-white" : "text-slate-400"}`} />
                    <span>ตั้งค่า</span>
                  </div>
                </Link>
              )}
            </nav>

            {/* CALL CENTER Banner Card */}
            <div className="mt-4 mx-1.5 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col items-center text-center relative overflow-hidden shadow-sm">
              <span className="text-[10px] font-extrabold text-[#777] tracking-wider">CALL CENTER</span>
              <span className="text-[#c8102e] text-2xl font-black mt-0.5">1308</span>
              <span className="text-[9px] text-slate-400 font-semibold mt-1">บริการทุกวัน 07.00 - 20.00 น.</span>
              
              <div className="mt-2 w-28 h-28 relative overflow-hidden flex items-center justify-center">
                <img 
                  src="/images/mascot_twd.png" 
                  alt="Thai Watsadu Mascot" 
                  className="w-full h-full object-contain filter drop-shadow-sm hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer profile info & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-[#c8102e] hover:bg-red-50 rounded-lg transition duration-150"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-[#c8102e] font-black">VService</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-500 font-bold text-[11px] tracking-wide uppercase">Thai Watsadu Service Center</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="p-2 text-slate-450 hover:text-[#c8102e] rounded-full hover:bg-slate-50 transition relative">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-[#c8102e] text-white text-[9px] font-bold rounded-full flex items-center justify-center">6</span>
            </button>

            {/* Profile badge info */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="flex flex-col text-right select-none">
                <span className="text-xs font-bold text-slate-800">{user?.user_full_name || user?.user_name || "Admin"}</span>
                <span className="text-[10px] text-slate-400 font-bold">{roleNameTH}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-50 text-[#c8102e] border border-red-150 font-extrabold text-xs flex items-center justify-center shadow-sm">
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
              bannerBg = "bg-[#c8102e]";
            } else if (ann.severity === "info") {
              bannerBg = "bg-sky-600";
            }

            return (
              <div key={ann.id} className={`${bannerBg} text-white px-6 py-2 flex items-center justify-between text-xs font-semibold border-b border-white/10`}>
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
