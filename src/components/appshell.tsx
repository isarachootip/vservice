"use client";

import { ReactNode, useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  List,
  Truck,
  ShieldAlert,
  MapPin,
  Layers,
  AlertTriangle,
  Megaphone,
  Coins,
  Percent,
  Clock,
  MessageSquare,
  Image
} from "lucide-react";


type UserData = {
  user_name: string;
  user_full_name?: string | null;
  user_email?: string | null;
  role?: string;
  permissions?: string[];
  store_code?: string | null;
};


function SidebarNav({
  menuItems,
  collapsed,
  mobileOpen,
  pathname
}: {
  menuItems: any[];
  collapsed: boolean;
  mobileOpen: boolean;
  pathname: string;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "status";
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    setSettingsExpanded(pathname.startsWith("/maintain"));
  }, [pathname]);


  return (
    <nav className="flex flex-col gap-1">
      {menuItems
        .filter((item) => item.show !== false)
        .map((item, idx) => {
          const Icon = item.icon;
          const isParentActive = pathname === item.href;
          
          const isActive = item.href === "/maintain" 
            ? pathname.startsWith("/maintain")
            : isParentActive;

          const handleParentClick = (e: React.MouseEvent) => {
            if (item.subItems) {
              e.preventDefault();
              // Toggle settingsExpanded
              setSettingsExpanded(!settingsExpanded);
            }
          };

          return (
            <div key={idx} className="flex flex-col">
              <Link
                href={item.href}
                onClick={handleParentClick}
                title={collapsed ? item.label : undefined}
                className={`flex items-center transition-all duration-150 py-2 text-sm font-semibold rounded-lg ${
                  collapsed ? "lg:justify-center lg:px-2" : "justify-between px-3"
                } ${
                  isActive
                    ? "bg-[#c8102e] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {(!collapsed || mobileOpen) && (
                    <span className="animate-fadeIn">{item.label}</span>
                  )}
                </div>
                {(!collapsed || mobileOpen) && (
                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && (
                      <span className="bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${settingsExpanded ? "rotate-180" : ""}`} />
                    )}
                  </div>
                )}
              </Link>

              {item.subItems && settingsExpanded && (!collapsed || mobileOpen) && (
                <div className="flex flex-col gap-0.5 pl-6 mt-1 border-l border-slate-200 ml-5 animate-fadeIn">
                  {item.subItems.map((sub: any, sIdx: number) => {
                    const SubIcon = sub.icon;
                    const subTab = sub.href.split("=")[1];
                    const isSubActive = pathname.startsWith("/maintain") && currentTab === subTab;
                    return (
                      <Link
                        key={sIdx}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
                          isSubActive
                            ? "text-[#c8102e] bg-[#c8102e]/5 font-extrabold"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState<Record<number, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const menuItems = [
    { href: "/dashboard", label: "หน้าหลัก", icon: Home },
    { href: "/status", label: "งานซ่อมทั้งหมด", icon: ClipboardList },
    { href: "/request/add", label: "รับเครื่อง / สร้างงาน", icon: Wrench, show: canAddRequest },
    { href: "#", label: "ลูกค้า", icon: Users },
    { href: "/quotation", label: "ใบเสนอราคา", icon: FileText, badge: 8 },
    { href: "/chat", label: "ห้องสนทนาทีมงาน", icon: MessageSquare },
    { href: "/chat/customer", label: "แชตกับลูกค้า (LINE)", icon: MessageSquare },
    { href: "/maintain?tab=location", label: "สาขา / จุดบริการ", icon: Store, show: isAdmin },
    { href: "#", label: "รายงาน / วิเคราะห์", icon: BarChart2 },
    { href: "#", label: "การแจ้งเตือน", icon: Bell, badge: 6 },
    { 
      href: "/maintain", 
      label: "ตั้งค่า", 
      icon: Settings, 
      show: isAdmin,
      subItems: [
        { href: "/maintain?tab=status", label: "Status Info", icon: List },
        { href: "/maintain?tab=vendor", label: "Vendor Info (ผู้รับเหมา)", icon: Truck },
        { href: "/maintain?tab=user", label: "User & Access Info", icon: ShieldAlert },
        { href: "/maintain?tab=location", label: "Location Info (สาขา)", icon: Store },
        { href: "/maintain?tab=product", label: "Product Info (สินค้า & ทุน)", icon: Package },
        { href: "/maintain?tab=category", label: "Category Info (หมวดหมู่)", icon: Layers },
        { href: "/maintain?tab=symptom", label: "Symptom Info (อาการเสีย)", icon: AlertTriangle },
        { href: "/maintain?tab=announcement", label: "ตั้งค่าประกาศ", icon: Megaphone },
        { href: "/maintain?tab=diagnostic", label: "Diagnostic Fee Config", icon: Coins },
        { href: "/maintain?tab=margin", label: "Margin Config", icon: Percent },
        { href: "/maintain?tab=service_tier", label: "Service Tier Config", icon: Clock },
        { href: "/maintain?tab=example_images", label: "ตั้งค่ารูปภาพตัวอย่าง", icon: Image },
      ]
    },
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm w-full">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
          title="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-8 h-8 bg-[#c8102e] rounded flex flex-col items-center justify-center p-0.5 relative shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[2.5] absolute inset-0 m-auto" style={{ top: '-1px' }}>
              <polygon points="12,3 3,11 6,11 6,20 18,20 18,11 21,11" fill="white" stroke="white" />
            </svg>
            <span className="text-[#c8102e] font-extrabold text-[10px] z-10 select-none relative" style={{ top: '2px' }}>ไท</span>
          </div>
          <span className="text-[#121212] font-black text-base tracking-tight leading-none">วัสดุ</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-red-50 text-[#c8102e] border border-red-150 font-extrabold text-xs flex items-center justify-center shadow-sm">
          {userInitials}
        </div>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Red/White themed sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between shrink-0 z-50 shadow-xl lg:shadow-sm
        transition-all duration-300 transform lg:translate-x-0 lg:static lg:h-screen lg:z-20
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full"}
        ${collapsed ? "lg:w-16" : "lg:w-64"}
      `}>
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
          {/* Sidebar Top Header Logo (Thai Watsadu Brand Replica) */}
          <div className={`flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 ${collapsed ? "lg:px-2 lg:justify-center" : ""}`}>
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
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col select-none animate-fadeIn">
                  <span className="text-[#121212] font-black text-xl tracking-tight leading-none">วัสดุ</span>
                  <span className="text-[#555] text-[9px] font-bold tracking-wider leading-none mt-1">SERVICE CENTER</span>
                </div>
              )}
            </div>

            {/* Toggle Button for Desktop */}
            <button
              onClick={handleToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Close Button on Mobile Drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3">
            {/* Navigation Links */}
            <Suspense fallback={<div className="h-40" />}>
              <SidebarNav menuItems={menuItems} collapsed={collapsed} mobileOpen={mobileOpen} pathname={pathname} />
            </Suspense>

            {/* CALL CENTER Banner Card */}
            {/* CALL CENTER Banner Card */}
            {(!collapsed || mobileOpen) && (
              <div className="mt-4 mx-1.5 p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col items-center text-center relative overflow-hidden shadow-sm animate-fadeIn">
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
            )}
          </div>
        </div>

        {/* Footer profile info & Logout */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50 flex flex-col gap-2 ${collapsed ? "lg:items-center" : ""}`}>
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center text-slate-600 hover:text-[#c8102e] hover:bg-red-50 rounded-lg transition duration-150 py-2 text-sm font-semibold ${
              collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"
            }`}
          >
            <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
            {(!collapsed || mobileOpen) && <span className="animate-fadeIn">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex sticky top-0 bg-white border-b border-slate-200/80 px-6 py-3.5 items-center justify-between z-10 shadow-sm">
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
