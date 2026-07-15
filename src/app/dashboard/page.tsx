"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowUpRight,
    FileSpreadsheet,
    Calendar,
    ChevronRight
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

export default function DashBoardPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [statuses, setStatuses] = useState<StatusDef[]>([]);
    const [period, setPeriod] = useState<PeriodFilter>("all");

    // Fetch dashboard summary
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
        };

        init();
    }, [period]);

    // Map status definitions to their counts
    const statusBreakdown = useMemo(() => {
        if (!summary?.statusCounts) return [];
        const countMap = new Map(summary.statusCounts.map((sc) => [sc.statusId, sc.count]));
        return statuses
            .map((s) => ({
                id: s.id,
                name: s.status,
                path: s.path,
                sla: s.sla,
                count: countMap.get(s.id) || 0,
            }))
            .sort((a, b) => a.id - b.id);
    }, [summary, statuses]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Stats Cards Row (6 Columns) */}
            {loading ? (
                <div className="text-center text-slate-500 py-20 font-medium">กำลังโหลดสถิติระบบ...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* 1. Total Tickets */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.totalRequest ?? 0}</span>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">Total Tickets</span>
                                <span className="text-[10px] text-slate-400 font-semibold">(ทั้งหมด) ตั้งแต่เปิดระบบ</span>
                            </div>
                        </div>

                        {/* 2. Open Tickets */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.inProgress ?? 0}</span>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">Open Tickets</span>
                                <span className="text-[10px] text-slate-400 font-semibold">กำลังดำเนินการ</span>
                            </div>
                        </div>

                        {/* 3. Resolved / Closed */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.returned ?? 0}</span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">Resolved / Closed</span>
                                <span className="text-[10px] text-slate-400 font-semibold">แก้ไขแล้ว (สะสม)</span>
                            </div>
                        </div>

                        {/* 4. Critical Open */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.pendingRepair ?? 0}</span>
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">Critical Open</span>
                                <span className="text-[10px] text-slate-400 font-semibold">งานค้างรอการซ่อม</span>
                            </div>
                        </div>

                        {/* 5. Escalated */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.pendingByRole.dc ?? 0}</span>
                                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">Escalated</span>
                                <span className="text-[10px] text-slate-400 font-semibold">ส่งต่อไปแผนกอื่น (DC)</span>
                            </div>
                        </div>

                        {/* 6. NEW (New requests) */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden hover:shadow transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-800">{summary?.pendingByRole.cs ?? 0}</span>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex flex-col mt-2">
                                <span className="text-xs font-bold text-slate-700">รอรับเรื่อง (NEW)</span>
                                <span className="text-[10px] text-slate-400 font-semibold">รอ CS ดำเนินการ</span>
                            </div>
                        </div>
                    </div>

                    {/* Mid Section: SVG Trend Chart */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-violet-600" />
                                    จำนวน Ticket รายวัน (Month to Date)
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                        Total <span className="font-bold text-slate-800">{summary?.totalRequest ?? 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                        Open <span className="font-bold text-slate-800">{summary?.inProgress ?? 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        Resolved/Closed <span className="font-bold text-slate-800">{summary?.returned ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart filter buttons */}
                            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 self-start">
                                {["Weekly", "MTD", "Yearly"].map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                                            item === "MTD"
                                                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Responsive SVG Chart */}
                        <div className="relative w-full h-64 bg-slate-50/50 border border-slate-100 rounded-xl overflow-hidden p-2">
                            <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis grid lines */}
                                <line x1="50" y1="30" x2="950" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="70" x2="950" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="110" x2="950" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="150" x2="950" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="50" y1="190" x2="950" y2="190" stroke="#e2e8f0" strokeWidth="1.5" />

                                {/* Chart paths: Total, Open, Resolved */}
                                {/* Total Curve (Blue) */}
                                <path
                                    d="M 50 190 Q 150 50, 200 40 T 350 190 T 500 190 T 650 110 T 800 190 T 950 190"
                                    fill="url(#blueGrad)"
                                />
                                <path
                                    d="M 50 190 Q 150 50, 200 40 T 350 190 T 500 190 T 650 110 T 800 190 T 950 190"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                />

                                {/* Open Curve (Amber) */}
                                <path
                                    d="M 50 190 Q 150 90, 200 80 T 350 190 T 500 190 T 650 150 T 800 190 T 950 190"
                                    fill="url(#amberGrad)"
                                />
                                <path
                                    d="M 50 190 Q 150 90, 200 80 T 350 190 T 500 190 T 650 150 T 800 190 T 950 190"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2.5"
                                    strokeDasharray="4 4"
                                />

                                {/* Resolved/Closed Curve (Emerald) */}
                                <path
                                    d="M 50 190 Q 150 130, 200 120 T 350 190 T 500 190 T 650 190 T 800 190 T 950 190"
                                    fill="url(#emeraldGrad)"
                                />
                                <path
                                    d="M 50 190 Q 150 130, 200 120 T 350 190 T 500 190 T 650 190 T 800 190 T 950 190"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2.5"
                                />

                                {/* Vertex Dots */}
                                <circle cx="200" cy="40" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                <circle cx="200" cy="80" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                                <circle cx="200" cy="120" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                                <circle cx="650" cy="110" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />

                                {/* X-axis labels */}
                                <text x="50" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">01 ก.ค.</text>
                                <text x="200" y="215" fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="bold">03 ก.ค. (Peak)</text>
                                <text x="350" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">05 ก.ค.</text>
                                <text x="500" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">07 ก.ค.</text>
                                <text x="650" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">09 ก.ค.</text>
                                <text x="800" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">12 ก.ค.</text>
                                <text x="950" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">15 ก.ค.</text>
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Split Layout: Status breakdown & department workload */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Tickets by Status table */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">ปริมาณงานแยกตามขั้นตอน (Tickets by Status)</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                    {statusBreakdown.length} ขั้นตอน
                                </span>
                            </div>

                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 w-12 text-center">รหัส</th>
                                            <th className="px-5 py-3">รายละเอียดสถานะซ่อม</th>
                                            <th className="px-5 py-3 w-20 text-center">ฝ่าย</th>
                                            <th className="px-5 py-3 w-20 text-center">SLA เป้าหมาย</th>
                                            <th className="px-5 py-3 w-20 text-center">จำนวนค้าง</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {statusBreakdown.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                                    ไม่พบข้อมูลสถานะซ่อม
                                                </td>
                                            </tr>
                                        ) : (
                                            statusBreakdown.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3 text-center font-semibold text-slate-400">
                                                        {row.id}
                                                    </td>
                                                    <td className="px-5 py-3 font-semibold text-slate-800">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                                                            row.path === "DC" ? "bg-purple-50 text-purple-600 border border-purple-200" :
                                                            row.path === "VENDOR" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                                            "bg-slate-50 text-slate-600 border border-slate-200"
                                                        }`}>
                                                            {row.path}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-mono text-slate-400">
                                                        {row.sla > 0 ? `${row.sla / 24} วัน` : "-"}
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
                                                            row.count > 0 ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"
                                                        }`}>
                                                            {row.count}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Department backlog workload list */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm">
                                งานค้างสะสมแยกตามฝ่าย
                            </h3>
                            <p className="text-[10px] text-slate-400 leading-normal">
                                งานแจ้งซ่อมคงค้างรอการตอบสนองสะสมแยกตามหน้าที่ความรับผิดชอบของพนักงาน
                            </p>

                            <div className="space-y-2 pt-1 text-xs">
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        <span className="font-bold text-slate-700">Customer Service (CS)</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{summary?.pendingByRole.cs ?? 0} เคส</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        <span className="font-bold text-slate-700">Goods Receive (GR)</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{summary?.pendingByRole.gr ?? 0} เคส</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        <span className="font-bold text-slate-700">Distribution Center (DC)</span>
                                    </div>
                                    <span className="font-bold text-slate-800">{summary?.pendingByRole.dc ?? 0} เคส</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <Link 
                                    href="/status" 
                                    className="w-full flex items-center justify-center gap-1 py-2 text-center text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg transition"
                                >
                                    ตรวจสอบตั๋วงานทั้งหมด
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
