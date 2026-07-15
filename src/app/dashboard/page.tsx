"use client";

import { useEffect, useState, useMemo } from "react";
import {
    ClipboardList,
    Wrench,
    CheckCircle2,
    Archive,
    Clock,
    AlertCircle
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
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Top Banner section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        ภาพรวมระบบแจ้งซ่อมสินค้า
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        ติดตามปริมาณงานซ่อมสะสมและสถานะขั้นตอนการทำงานภายในสาขา
                    </p>
                </div>

                {/* Period filters */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 self-start">
                    {[
                        { label: "ทั้งหมด", value: "all" },
                        { label: "วันนี้", value: "day" },
                        { label: "สัปดาห์นี้", value: "week" },
                        { label: "เดือนนี้", value: "month" },
                    ].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setPeriod(item.value as PeriodFilter)}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                                period === item.value
                                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-20 font-medium">กำลังโหลดข้อมูล...</div>
            ) : (
                <>
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-500">ใบแจ้งซ่อมสะสม</span>
                                <span className="text-2xl font-bold text-slate-800">{summary?.totalRequest ?? 0}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Wrench className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-500">อยู่ระหว่างการซ่อม</span>
                                <span className="text-2xl font-bold text-slate-800">{summary?.inProgress ?? 0}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-500">ซ่อมเสร็จ/รอลูกค้ารับ</span>
                                <span className="text-2xl font-bold text-slate-800">{summary?.completed ?? 0}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <Archive className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-500">รับคืนแล้ว/ปิดงาน</span>
                                <span className="text-2xl font-bold text-slate-800">{summary?.returned ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main content split */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column: detailed status list */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">ปริมาณงานแยกตามขั้นตอน (Status Breakdown)</h3>
                                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-semibold">
                                    ขั้นตอนทั้งหมด ({statusBreakdown.length})
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-6 py-3.5 w-16 text-center">รหัส</th>
                                            <th className="px-6 py-3.5">ชื่อสถานะ</th>
                                            <th className="px-6 py-3.5 w-24 text-center">ฝ่าย/ขั้นตอน</th>
                                            <th className="px-6 py-3.5 w-24 text-center">เป้าหมาย (SLA)</th>
                                            <th className="px-6 py-3.5 w-24 text-center">จำนวนงาน</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {statusBreakdown.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                                    ไม่พบข้อมูลสถานะ
                                                </td>
                                            </tr>
                                        ) : (
                                            statusBreakdown.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-center font-semibold text-slate-400 text-xs">
                                                        {row.id}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            row.path === "DC" ? "bg-purple-100 text-purple-800" :
                                                            row.path === "VENDOR" ? "bg-amber-100 text-amber-800" :
                                                            "bg-slate-100 text-slate-700"
                                                        }`}>
                                                            {row.path}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-slate-500 text-xs">
                                                        {row.sla > 0 ? `${row.sla / 24} วัน` : "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                            row.count > 0 ? "bg-red-500 text-white shadow-sm" : "bg-slate-100 text-slate-400"
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

                        {/* Right column: Role Backlog & Breakdown summaries */}
                        <div className="space-y-6">
                            {/* Role pending workload card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-slate-500" />
                                    งานค้างสะสมแยกตามแผนก (Workload)
                                </h3>
                                <p className="text-xs text-slate-400 leading-normal">
                                    ปริมาณงานแจ้งซ่อมที่อยู่ระหว่างรอการดำเนินการแยกตามหน้าที่ความรับผิดชอบ
                                </p>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                            <span className="text-xs font-bold text-slate-700">Customer Service (CS)</span>
                                        </div>
                                        <span className="font-bold text-sm text-slate-800">{summary?.pendingByRole.cs ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-xs font-bold text-slate-700">Goods Receive (GR)</span>
                                        </div>
                                        <span className="font-bold text-sm text-slate-800">{summary?.pendingByRole.gr ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                            <span className="text-xs font-bold text-slate-700">Distribution Center (DC)</span>
                                        </div>
                                        <span className="font-bold text-sm text-slate-800">{summary?.pendingByRole.dc ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Completed Breakdown Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-slate-500" />
                                    วิเคราะห์การรับประกัน / อนุมัติซ่อม
                                </h3>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">อนุมัติซ่อม</span>
                                        <span className="text-xl font-bold text-emerald-600 mt-1 block">
                                            {summary?.completedBreakdown.approve ?? 0}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ไม่อนุมัติซ่อม</span>
                                        <span className="text-xl font-bold text-red-600 mt-1 block">
                                            {summary?.completedBreakdown.notApprove ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
