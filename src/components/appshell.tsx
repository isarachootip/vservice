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
  Image,
  Grid,
  BookOpen
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";


type UserData = {
  user_name: string;
  user_full_name?: string | null;
  user_email?: string | null;
  role?: string;
  permissions?: string[];
  store_code?: string | null;
  location_name?: string | null;
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
                    ? "bg-[#c8102e] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:bg-red-50 hover:text-[#c8102e]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && (
                      <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive ? "bg-white text-[#c8102e]" : "bg-red-100 text-[#c8102e]"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.subItems && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          settingsExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                )}
              </Link>

              {/* Sub-menu rendering for settings */}
              {item.subItems && settingsExpanded && !collapsed && (
                <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-slate-200 pl-2">
                  {item.subItems.map((sub: any, subIdx: number) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === "/maintain" && (
                      sub.href.includes(`tab=${currentTab}`) || 
                      (!searchParams.get("tab") && sub.href.endsWith("status"))
                    );

                    return (
                      <Link
                        key={subIdx}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          isSubActive
                            ? "text-[#c8102e] bg-red-50 font-bold"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sub.label}</span>
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

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
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
    { href: "/dashboard", label: t("menu_dashboard"), icon: Home },
    { href: "/menu", label: language === "en" ? "Main Menu (VService)" : "เมนูหลัก (VService)", icon: Grid },
    { href: "/status", label: t("menu_track_status"), icon: ClipboardList },
    { href: "/request/add", label: t("menu_create_repair"), icon: Wrench, show: canAddRequest },
    { href: "/customer", label: language === "en" ? "Customers" : "ลูกค้า", icon: Users },
    { href: "/quotation", label: t("menu_quotations"), icon: FileText, badge: 8 },
    { href: "/chat", label: t("menu_staff_chat"), icon: MessageSquare },
    { href: "/chat/customer", label: t("menu_customer_chat"), icon: MessageSquare },
    { href: "/faq", label: t("menu_faq"), icon: BookOpen },
    { href: "/maintain?tab=location", label: language === "en" ? "Branches / Service Points" : "สาขา / จุดบริการ", icon: Store, show: isAdmin },
    { href: "#", label: language === "en" ? "Reports & Analytics" : "รายงาน / วิเคราะห์", icon: BarChart2 },
    { href: "#", label: language === "en" ? "Notifications" : "การแจ้งเตือน", icon: Bell, badge: 6 },
    { 
      href: "/maintain", 
      label: t("menu_settings"), 
      icon: Settings, 
      show: isAdmin,
      subItems: [
        { href: "/maintain?tab=status", label: "Status Info", icon: List },
        { href: "/maintain?tab=vendor", label: "Vendor Info", icon: Truck },
        { href: "/maintain?tab=user", label: "User & Access Info", icon: ShieldAlert },
        { href: "/maintain?tab=location", label: "Location Info", icon: Store },
        { href: "/maintain?tab=product", label: "Product Info", icon: Package },
        { href: "/maintain?tab=category", label: t("maintain_category_title"), icon: Layers },
        { href: "/maintain?tab=symptom", label: "Symptom Info", icon: AlertTriangle },
        { href: "/maintain?tab=announcement", label: language === "en" ? "Announcements" : "ตั้งค่าประกาศ", icon: Megaphone },
        { href: "/maintain?tab=diagnostic", label: "Diagnostic Fee Config", icon: Coins },
        { href: "/maintain?tab=margin", label: "Margin Config", icon: Percent },
        { href: "/maintain?tab=service_tier", label: "Service Tier Config", icon: Clock },
        { href: "/maintain?tab=example_images", label: language === "en" ? "Example Images Config" : "ตั้งค่ารูปภาพตัวอย่าง", icon: Image },
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
          {/* Sidebar Top Header Logo */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 h-16">
            <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-200 ${collapsed ? "lg:opacity-0 lg:w-0" : "w-auto"}`}>
              <div className="w-9 h-9 bg-[#c8102e] rounded-lg flex flex-col items-center justify-center p-0.5 relative shrink-0 shadow-md">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white stroke-[2.5] absolute inset-0 m-auto" style={{ top: '-1px' }}>
                  <polygon points="12,3 3,11 6,11 6,20 18,20 18,11 21,11" fill="white" stroke="white" />
                </svg>
                <span className="text-[#c8102e] font-extrabold text-[11px] z-10 select-none relative" style={{ top: '2px' }}>ไท</span>
              </div>
              <div className="flex flex-col select-none">
                <div className="flex items-baseline gap-1">
                  <span className="text-[#121212] font-black text-lg tracking-tight leading-none">ไทวัสดุ</span>
                  <span className="text-[#c8102e] font-bold text-xs">VService</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Service Center</span>
              </div>
            </div>

            <button
              onClick={handleToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 flex-grow overflow-y-auto">
            <Suspense fallback={<div className="p-2 text-xs text-slate-400">Loading menu...</div>}>
              <SidebarNav
                menuItems={menuItems}
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                pathname={pathname}
              />
            </Suspense>
          </div>

          {/* Language Switcher in Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between">
            {!collapsed && <span className="text-xs font-semibold text-slate-500">{t("language")}</span>}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage("th")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  language === "th"
                    ? "bg-[#c8102e] text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  language === "en"
                    ? "bg-[#c8102e] text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* User profile & logout section */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className={`flex items-center justify-between ${collapsed ? "flex-col gap-2" : ""}`}>
              <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
                <div className="w-9 h-9 rounded-full bg-red-100 text-[#c8102e] font-extrabold text-xs flex items-center justify-center shrink-0 border border-red-200 shadow-xs">
                  {userInitials}
                </div>
                {!collapsed && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 truncate" title={user?.user_full_name || user?.user_name}>
                      {user?.user_full_name || user?.user_name || "Guest"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold truncate">
                      {roleNameTH} {user?.store_code ? `(${user.store_code})` : ""}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-[#c8102e] hover:bg-red-50 rounded-lg transition"
                title={t("logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-6 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">VService System</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-slate-800">
              {menuItems.find(m => m.href === pathname || (m.href !== "/menu" && pathname.startsWith(m.href)))?.label || t("systemTitle")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* User Badges */}
            <div className="flex items-center gap-3">
              {user?.store_code && (
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">
                  <Store className="w-3.5 h-3.5 text-[#c8102e]" />
                  <span>{t("store")}: {user.store_code}</span>
                </div>
              )}
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <div className="flex flex-col text-right select-none">
                  <span className="text-xs font-bold text-slate-800">{user?.user_full_name || user?.user_name || "Admin"}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{roleNameTH}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 text-[#c8102e] border border-red-150 font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic banner alerts */}
        {activeAnnouncements
          .filter(ann => !closedAnnouncements[ann.id])
          .map(ann => {
            let bannerBg = "bg-[#aa7d39]";
            if (ann.severity === "danger") {
              bannerBg = "bg-[#c8102e]";
            } else if (ann.severity === "info") {
              bannerBg = "bg-sky-600";
            }

            return (
              <div 
                key={ann.id} 
                className={`${bannerBg} text-white px-6 py-2 flex items-center justify-between text-xs font-semibold border-b border-white/10 relative overflow-hidden`}
              >
                <div className="flex items-center w-full pr-8 overflow-hidden relative">
                  <span className={`${bannerBg} z-10 pr-4 py-0.5 font-extrabold flex items-center gap-1.5 shrink-0`}>
                    ⚠️ {t("warning")}
                  </span>
                  
                  <div className="flex-grow overflow-hidden relative h-5 flex items-center select-none">
                    <div className="animate-marquee whitespace-nowrap absolute">
                      📢 {ann.message}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setClosedAnnouncements(prev => ({ ...prev, [ann.id]: true }))}
                  className={`${bannerBg} pl-4 hover:opacity-85 text-white/80 z-10 cursor-pointer shrink-0`}
                  title="Close"
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

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AppShellContent>{children}</AppShellContent>
    </LanguageProvider>
  );
}
