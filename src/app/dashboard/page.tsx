"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Bell,
  Clock,
  TrendingUp,
  Activity,
  Award,
  CheckCircle2,
  ClipboardList,
  Search,
  Printer,
  Box,
  FileText,
  ChevronRight,
  TrendingDown,
  Info,
  Map,
  PlusCircle,
  Truck,
  RotateCcw,
  Wrench
} from "lucide-react";

type DashboardSummary = {
  totalRequest: number;
  pendingRepair: number;
  inProgress: number;
  completed: number;
  returned: number;
  cancelled: number;
  pendingByRole: {
    cs: number;
    gr: number;
    dc: number;
  };
  completedBreakdown: {
    approve: number;
    notApprove: number;
  };
  cancelledBreakdown: {
    userCancelled: number;
    twCancelled: number;
  };
  statusCounts: Array<{ statusId: number; count: number }>;
};

type StatusDef = {
  id: number;
  path: string;
  status: string;
  sla: number;
};

type PeriodFilter = "all" | "day" | "week" | "month";

// Custom sparkline component
function Sparkline({ points, strokeColor }: { points: number[]; strokeColor: string }) {
  const width = 110;
  const height = 30;
  const xStep = width / (points.length - 1);
  const pathD = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${idx * xStep} ${p}`)
    .join(" ");

  return (
    <svg className="w-28 h-8 opacity-85 shrink-0" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashBoardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statuses, setStatuses] = useState<StatusDef[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [lastUpdated, setLastUpdated] = useState("10:30");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`/api/dashboard/summary?period=${period}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok) {
          setSummary(json.data);
        }
      } catch (err) {
        console.error("Dashboard summary fetch error:", err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const res = await fetch("/api/maintain/status-info", { cache: "no-store" });
        const json = await res.json();
        if (json.ok) {
          setStatuses(json.items || []);
        }
      } catch (err) {
        console.error("Status definitions fetch error:", err);
      }
    };

    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchStatuses()]);
      setLoading(false);
      const now = new Date();
      setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };

    init();
  }, [period]);

  // Sparkline data matching the trend in mockup
  const activeJobsSparkline = [22, 23, 20, 24, 22, 21, 23, 20, 18, 22, 21, 19];
  const pendingApprovalSparkline = [25, 24, 20, 22, 18, 19, 15, 17, 14, 16, 12, 10];
  const slaCriticalSparkline = [15, 18, 14, 20, 16, 18, 15, 22, 17, 19, 14, 16];
  const grossProfitSparkline = [24, 22, 23, 18, 19, 15, 16, 12, 13, 10, 8, 5];

  // SLA violation mock list matching the image
  const slaViolations = [
    { jobId: "R2405-0156", customer: "คุณสมชาย ใจดี", branch: "ไทวัสดุ บางนา", overdue: "2 วัน 6 ชม.", isCritical: true },
    { jobId: "R2405-0132", customer: "คุณวราภรณ์ แซ่ลิ้ม", branch: "ไทวัสดุ รังสิตคลอง 4", overdue: "1 วัน 8 ชม.", isCritical: false },
    { jobId: "R2405-0128", customer: "คุณวิชัย มั่นคง", branch: "ไทวัสดุ เชียงใหม่", overdue: "1 วัน 3 ชม.", isCritical: false },
    { jobId: "R2405-0114", customer: "คุณกิตติพงษ์ ศิริวัฒน์", branch: "ไทวัสดุ อุดรธานี", overdue: "9 ชม.", isCritical: false }
  ];

  // Stock alert mock list matching the image
  const stockAlerts = [
    { part: "Main Board (TV 55\")", remaining: 0, status: "ขาดสต๊อก", color: "red" },
    { part: "Power Supply (LG 65\")", remaining: 2, status: "ใกล้หมด", color: "orange" },
    { part: "LED Backlight Strip", remaining: 1, status: "ใกล้หมด", color: "orange" },
    { part: "Compressor (ตู้เย็น)", remaining: 0, status: "ขาดสต๊อก", color: "red" },
    { part: "แผงวงจรเครื่องซักผ้า", remaining: 3, status: "ใกล้หมด", color: "orange" }
  ];

  // Technician ranking mock list matching the image
  const techRankings = [
    { rank: 1, name: "Tech A", completed: 42, onTime: "97.6%", rework: "1.2%", score: 98.5, medal: "🥇" },
    { rank: 2, name: "Tech B", completed: 38, onTime: "95.1%", rework: "1.8%", score: 95.2, medal: "🥈" },
    { rank: 3, name: "Tech C", completed: 35, onTime: "93.2%", rework: "2.1%", score: 92.3, medal: "🥉" },
    { rank: 4, name: "Tech D", completed: 31, onTime: "91.0%", rework: "2.7%", score: 89.1 },
    { rank: 5, name: "Tech E", completed: 28, onTime: "89.6%", rework: "3.0%", score: 87.2 },
    { rank: 6, name: "Tech F", completed: 24, onTime: "87.4%", rework: "3.4%", score: 84.0 }
  ];

  // Job trend graph coordinates matching the 7-day trend
  // Dates: 8 พ.ค. - 14 พ.ค.
  // Inbox jobs (Red): [18, 22, 25, 28, 32, 35, 24]
  // Done jobs (Green): [15, 18, 20, 23, 25, 28, 21]
  const dates = ["8 พ.ค.", "9 พ.ค.", "10 พ.ค.", "11 พ.ค.", "12 พ.ค.", "13 พ.ค.", "14 พ.ค."];
  const inboxJobs = [18, 22, 25, 28, 32, 35, 24];
  const doneJobs = [15, 18, 20, 23, 25, 28, 21];

  // Calculate SVG coordinates for Trend Lines
  // SVG Width: 600, Height: 200
  // X values: 40 + idx * 80
  // Y values: 180 - (value * 4) (scaled)
  const redPathD = inboxJobs
    .map((v, idx) => `${idx === 0 ? "M" : "L"} ${40 + idx * 85} ${180 - (v * 4.5)}`)
    .join(" ");

  const greenPathD = doneJobs
    .map((v, idx) => `${idx === 0 ? "M" : "L"} ${40 + idx * 85} ${180 - (v * 4.5)}`)
    .join(" ");

  return (
    <div className="space-y-6 max-w-full mx-auto select-none">
      
      {/* Header section with page title & filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">ภาพรวมการดำเนินงานศูนย์บริการ</p>
        </div>

        {/* Filters and Refresh button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>ทุกสาขา (All Branches)</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>14 พฤษภาคม 2567</span>
          </div>

          {/* Refresh Timestamp */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-100/80 border border-slate-200/50 px-3 py-2 rounded-xl">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            <span>อัปเดตล่าสุด {lastUpdated} น.</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-24 font-bold flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#c8102e] animate-spin" />
          <span>กำลังโหลดข้อมูลสถิติ...</span>
        </div>
      ) : (
        <>
          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: ACTIVE JOBS */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[155px] relative overflow-hidden hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-[#777] tracking-wider uppercase">ACTIVE JOBS (TODAY)</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">งานที่เข้ามาในวันนี้</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight mt-1">
                    {summary?.totalRequest ?? 24}
                    <span className="text-xs font-bold text-slate-450 ml-1.5 font-sans">งาน</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#c8102e] shrink-0 border border-red-100 shadow-sm group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
                  <span>▲ 14%</span>
                  <span className="text-slate-400 font-semibold">จากเมื่อวาน</span>
                </div>
                <Sparkline points={activeJobsSparkline} strokeColor="#c8102e" />
              </div>
            </div>

            {/* Card 2: PENDING APPROVAL */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[155px] relative overflow-hidden hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-[#777] tracking-wider uppercase">PENDING APPROVAL</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">รออนุมัติใบเสนอราคา (LON)</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight mt-1">
                    {summary?.pendingRepair ?? 8}
                    <span className="text-xs font-bold text-slate-450 ml-1.5">งาน</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100 shadow-sm group-hover:scale-105 transition-transform">
                  <Clock className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1 animate-pulse">
                  <span>⚠️ ต้องติดตาม</span>
                </div>
                <Sparkline points={pendingApprovalSparkline} strokeColor="#d69e2e" />
              </div>
            </div>

            {/* Card 3: SLA CRITICAL */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[155px] relative overflow-hidden hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-[#777] tracking-wider uppercase">SLA CRITICAL</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">งานเกินกำหนด SLA</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight mt-1">
                    {4}
                    <span className="text-xs font-bold text-slate-450 ml-1.5">งาน</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#c8102e] shrink-0 border border-red-100 shadow-sm group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
                  <span>🚨 เร่งดำเนินการ</span>
                </div>
                <Sparkline points={slaCriticalSparkline} strokeColor="#c8102e" />
              </div>
            </div>

            {/* Card 4: GROSS PROFIT */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-[155px] relative overflow-hidden hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-[#777] tracking-wider uppercase">TODAY'S GROSS PROFIT</span>
                  <span className="text-xs font-bold text-slate-500 mt-0.5">กำไรขั้นต้นวันนี้</span>
                  <span className="text-4xl font-black text-slate-800 tracking-tight mt-1">
                    32,500
                    <span className="text-xs font-bold text-slate-450 ml-1.5 font-sans">THB</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5.5 h-5.5" />
                </div>
              </div>
              <div className="flex items-end justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50 border border-green-100 rounded-lg px-2 py-1">
                  <span>▲ 18%</span>
                  <span className="text-slate-400 font-semibold">จากเมื่อวาน</span>
                </div>
                <Sparkline points={grossProfitSparkline} strokeColor="#10b981" />
              </div>
            </div>

          </div>

          {/* Middle Row: Operational Pipeline & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Operational Pipeline */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">OPERATIONAL PIPELINE</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">สถานะงานซ่อมทั้งหมดในระบบ</p>
              </div>

              {/* Progress Stepper flow layout */}
              <div className="grid grid-cols-5 gap-2 my-6 relative">
                
                {/* 1. Intake */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-[#c8102e] flex items-center justify-center">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                    </div>
                    {/* Connecting Chevron Arrow */}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute -right-2 top-4 hidden md:block" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-800 mt-2 uppercase tracking-wide">INTAKE</span>
                  <span className="text-[9px] font-bold text-slate-400">รับเครื่อง</span>
                  <span className="text-sm font-black text-slate-800 mt-1">7 <span className="text-[10px] font-bold text-slate-450">งาน</span></span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-0.5">11%</span>
                </div>

                {/* 2. Waiting Approval */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute -right-2 top-4 hidden md:block" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-800 mt-2 uppercase tracking-wide">WAITING APPROVAL</span>
                  <span className="text-[9px] font-bold text-slate-400">รออนุมัติราคา</span>
                  <span className="text-sm font-black text-slate-800 mt-1">8 <span className="text-[10px] font-bold text-slate-450">งาน</span></span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-0.5">13%</span>
                </div>

                {/* 3. Repair In-Progress */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Wrench className="w-4 h-4" />
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute -right-2 top-4 hidden md:block" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-800 mt-2 uppercase tracking-wide">REPAIR</span>
                  <span className="text-[9px] font-bold text-slate-400">กำลังซ่อม</span>
                  <span className="text-sm font-black text-slate-800 mt-1">10 <span className="text-[10px] font-bold text-slate-450">งาน</span></span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-0.5">17%</span>
                </div>

                {/* 4. QA & Logistics */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-655 text-purple-600 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute -right-2 top-4 hidden md:block" />
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-800 mt-2 uppercase tracking-wide">QA & LOGISTICS</span>
                  <span className="text-[9px] font-bold text-slate-400">รอส่งคืน</span>
                  <span className="text-sm font-black text-slate-800 mt-1">4 <span className="text-[10px] font-bold text-slate-455">งาน</span></span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-0.5">7%</span>
                </div>

                {/* 5. Ready for Pickup */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-800 mt-2 uppercase tracking-wide">READY FOR PICKUP</span>
                  <span className="text-[9px] font-bold text-slate-400">พร้อมรับเครื่อง</span>
                  <span className="text-sm font-black text-slate-800 mt-1">3 <span className="text-[10px] font-bold text-slate-450">งาน</span></span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-0.5">5%</span>
                </div>

              </div>

              {/* Progress Summary bar */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>รวมทั้งหมด 32 งาน</span>
                  <span className="text-slate-400">ประสิทธิผลดำเนินงาน: 82%</span>
                </div>
                {/* Segmented color progress bar */}
                <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200 shadow-inner">
                  <div className="bg-[#c8102e]" style={{ width: "22%" }}></div>
                  <div className="bg-orange-500" style={{ width: "25%" }}></div>
                  <div className="bg-blue-500" style={{ width: "31%" }}></div>
                  <div className="bg-purple-500" style={{ width: "12%" }}></div>
                  <div className="bg-green-500" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>

            {/* Right: Alert & Performance Center */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">ALERT & PERFORMANCE CENTER</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">ศูนย์เตือนภัยและการตรวจสอบการดำเนินงาน</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                
                {/* SLA Violation List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-red-600 tracking-wider">SLA VIOLATION LIST (งานเกิน SLA)</span>
                    <span className="text-[9px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">ดูทั้งหมด</span>
                  </div>

                  <div className="space-y-1.5">
                    {slaViolations.map((v, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-650 mt-0.5 shrink-0" />
                        <div className="flex flex-col min-w-0 text-[10px] flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-700 truncate">{v.jobId}</span>
                            <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shrink-0">{v.overdue}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-450 font-bold mt-0.5">
                            <span className="truncate text-slate-500">{v.customer}</span>
                            <span className="shrink-0 text-slate-400">{v.branch}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Alert list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-700 tracking-wider">STOCK ALERT (อะไหล่ขาดสต๊อก)</span>
                    <span className="text-[9px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">ดูทั้งหมด</span>
                  </div>

                  <div className="space-y-1.5">
                    {stockAlerts.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition text-[10px] font-bold">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.color === "red" ? "bg-red-650 animate-pulse" : "bg-orange-500"}`}></span>
                          <span className="text-slate-700 truncate">{s.part}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500">{s.remaining} ชิ้น</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] border font-black ${
                            s.color === "red" 
                              ? "bg-red-50 text-red-605 border-red-100" 
                              : "bg-orange-50 text-orange-655 border-orange-100"
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom section: Donut Chart, Ranking Table, Trend Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Gross Profit Breakdown Donut Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">GROSS PROFIT BREAKDOWN</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">สัดส่วนกำไรขั้นต้น</p>
              </div>

              {/* Pie/Donut Chart Area */}
              <div className="flex items-center justify-center gap-6 my-4">
                
                {/* SVG Donut */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Circle Background */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                    
                    {/* Labor segment (Blue) 65% - Circumference is 251.2. 65% is 163.28 */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="#3b82f6" 
                      strokeWidth="15" 
                      strokeDasharray="163.28 251.2" 
                      strokeDashoffset="0"
                      className="transition-all duration-500"
                    />
                    
                    {/* Parts segment (Green) 35% - 35% is 87.92 */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="15" 
                      strokeDasharray="87.92 251.2" 
                      strokeDashoffset="-163.28"
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Inside hole text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black text-slate-800">32,500</span>
                    <span className="text-[9px] font-extrabold text-slate-500">THB</span>
                    <span className="text-[7px] font-semibold text-slate-400 leading-none mt-0.5">กำไรขั้นต้นวันนี้</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="flex flex-col gap-2.5 text-[10px] font-bold">
                  {/* Labor */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                      <span>ค่าแรง (Labor)</span>
                      <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] ml-1 font-bold">65%</span>
                    </div>
                    <span className="text-slate-500 pl-4 font-black">21,125 THB</span>
                  </div>
                  {/* Parts */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      <span>ค่าอะไหล่ (Parts)</span>
                      <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] ml-1 font-bold">35%</span>
                    </div>
                    <span className="text-slate-500 pl-4 font-black">11,375 THB</span>
                  </div>
                </div>

              </div>

              {/* Mini status indicator footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>อัตรากำไรโดยเฉลี่ย: 48.5%</span>
                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">ผ่านเกณฑ์ขั้นต่ำ</span>
              </div>
            </div>

            {/* 2. Technician Performance Ranking */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">TECHNICIAN PERFORMANCE</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">จัดอันดับประสิทธิภาพช่าง (Top 6)</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer">ดูทั้งหมด</span>
              </div>

              {/* Table list of rankings */}
              <div className="overflow-x-auto my-3">
                <table className="w-full text-left border-collapse text-[10px] font-bold">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-450 uppercase">
                      <th className="py-1.5 pr-2 w-10">อันดับ</th>
                      <th className="py-1.5 pr-2">ช่างเทคนิค</th>
                      <th className="py-1.5 pr-2 text-center">งานเสร็จ</th>
                      <th className="py-1.5 pr-2 text-center">On-time</th>
                      <th className="py-1.5 pr-2 text-center">Re-work</th>
                      <th className="py-1.5 text-right">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-750">
                    {techRankings.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-1.5 pr-2 text-slate-400">
                          {r.medal ? <span className="text-xs">{r.medal}</span> : r.rank}
                        </td>
                        <td className="py-1.5 pr-2 font-black text-slate-800">{r.name}</td>
                        <td className="py-1.5 pr-2 text-center text-slate-500 font-black">{r.completed}</td>
                        <td className="py-1.5 pr-2 text-center text-slate-500">{r.onTime}</td>
                        <td className="py-1.5 pr-2 text-center text-slate-400 font-medium">
                          <span className={`${parseFloat(r.rework) > 2.1 ? "text-red-500 font-bold" : "text-slate-500"}`}>
                            {r.rework}
                          </span>
                        </td>
                        <td className="py-1.5 text-right font-black text-slate-800">{r.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ranking footer constraint comment */}
              <div className="pt-2 border-t border-slate-100 text-[8.5px] font-bold text-slate-400 leading-normal">
                * เกณฑ์ Re-work Rate พึงปฏิบัติ ต้องต่ำกว่า 2.1%
              </div>
            </div>

            {/* 3. Job Trend Dual-line Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">JOB TREND</h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">แนวโน้มงานซ่อม</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-black text-slate-500 outline-none focus:ring-1 focus:ring-red-200 cursor-pointer">
                  <option>7 วันล่าสุด</option>
                  <option>30 วันล่าสุด</option>
                </select>
              </div>

              {/* Double line SVG Chart */}
              <div className="relative w-full h-[150px] my-3">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="20" y1="40" x2="580" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="90" x2="580" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="20" y1="180" x2="580" y2="180" stroke="#e2e8f0" strokeWidth="2" />

                  {/* Draw Lines */}
                  <path d={redPathD} fill="none" stroke="#c8102e" strokeWidth="3" />
                  <path d={greenPathD} fill="none" stroke="#10b981" strokeWidth="3" />

                  {/* Red Dots & Values */}
                  {inboxJobs.map((v, idx) => {
                    const cx = 40 + idx * 85;
                    const cy = 180 - (v * 4.5);
                    return (
                      <g key={`red-${idx}`}>
                        <circle cx={cx} cy={cy} r="4.5" fill="#c8102e" stroke="#fff" strokeWidth="2" />
                        <text x={cx} y={cy - 8} fill="#c8102e" fontSize="9" fontWeight="black" textAnchor="middle">{v}</text>
                      </g>
                    );
                  })}

                  {/* Green Dots & Values */}
                  {doneJobs.map((v, idx) => {
                    const cx = 40 + idx * 85;
                    const cy = 180 - (v * 4.5);
                    return (
                      <g key={`green-${idx}`}>
                        <circle cx={cx} cy={cy} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                        <text x={cx} y={cy - 8} fill="#10b981" fontSize="9" fontWeight="black" textAnchor="middle">{v}</text>
                      </g>
                    );
                  })}

                  {/* X Axis Labels */}
                  {dates.map((d, idx) => (
                    <text key={`lbl-${idx}`} x={40 + idx * 85} y="196" fill="#94a3b8" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {d}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Legends list */}
              <div className="flex items-center justify-center gap-5 text-[9px] font-black text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 bg-[#c8102e] rounded-full"></span>
                  <span>งานที่เข้ามา</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1.5 bg-[#10b981] rounded-full"></span>
                  <span>งานที่เสร็จสิ้น</span>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Actions & Service Network Footer row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Quick Actions */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">QUICK ACTIONS</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">เมนูทางลัดด่วนเพื่อการจัดการงานที่รวดเร็วขึ้น</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                
                {/* 1. Receive */}
                <Link href="/request/add" className="flex flex-col items-center justify-center p-3 bg-red-50 hover:bg-[#c8102e]/10 border border-red-100 rounded-xl transition duration-200 text-center font-bold text-[#c8102e] text-[10px] group shadow-sm">
                  <PlusCircle className="w-5 h-5 mb-1.5 group-hover:scale-105 transition-transform" />
                  <span>รับเครื่องใหม่</span>
                </Link>

                {/* 2. Find */}
                <Link href="/status" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition duration-200 text-center font-bold text-slate-700 text-[10px] group shadow-sm">
                  <Search className="w-5 h-5 mb-1.5 group-hover:scale-105 transition-transform text-slate-450" />
                  <span>ค้นหางานซ่อม</span>
                </Link>

                {/* 3. Quotation */}
                <Link href="#" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition duration-200 text-center font-bold text-slate-700 text-[10px] group shadow-sm">
                  <Printer className="w-5 h-5 mb-1.5 group-hover:scale-105 transition-transform text-slate-450" />
                  <span>พิมพ์ใบเสนอราคา</span>
                </Link>

                {/* 4. Stock check */}
                <Link href="#" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition duration-200 text-center font-bold text-slate-700 text-[10px] group shadow-sm">
                  <Box className="w-5 h-5 mb-1.5 group-hover:scale-105 transition-transform text-slate-450" />
                  <span>เช็คสต๊อกอะไหล่</span>
                </Link>

                {/* 5. Daily report */}
                <Link href="#" className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition duration-200 text-center font-bold text-slate-700 text-[10px] group shadow-sm">
                  <FileText className="w-5 h-5 mb-1.5 group-hover:scale-105 transition-transform text-slate-450" />
                  <span>รายงานประจำวัน</span>
                </Link>

              </div>
            </div>

            {/* Right: Service Network */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">SERVICE NETWORK</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">โครงข่ายสาขาการบริการไทวัสดุ</p>
              </div>

              <div className="flex items-center justify-between gap-4 mt-4 text-[10.5px] font-bold text-slate-700 bg-slate-50 border border-slate-150 p-3 rounded-2xl relative overflow-hidden">
                <div className="flex flex-col min-w-0">
                  <span>สาขาทั่วประเทศ <span className="text-[#c8102e] text-sm font-black pl-0.5">66</span> สาขา</span>
                  <span className="text-slate-400 mt-0.5">ออนไลน์อยู่ <span className="text-[#10b981] font-extrabold">64</span> สาขา (97%)</span>
                </div>
                
                {/* Red map button */}
                <button className="bg-[#c8102e] text-white hover:bg-[#b00d25] transition active:scale-95 px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 font-extrabold text-[10px] shadow-sm cursor-pointer">
                  <Map className="w-3.5 h-3.5" />
                  <span>ดูแผนที่สาขา</span>
                </button>

                {/* Small abstract map decoration (Thailand outline representation) */}
                <div className="absolute right-0.5 top-0 opacity-10 pointer-events-none w-14 h-14">
                  <svg viewBox="0 0 100 150" className="w-full h-full fill-slate-800">
                    <path d="M50,10 L55,20 L60,15 L52,40 L65,55 L58,75 L62,90 L50,110 L45,95 L48,70 L35,60 L42,40 L38,25 Z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
