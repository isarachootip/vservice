"use client";

import { useEffect, useState, useMemo } from "react";
import {
    ClipboardList,
    MonitorX,
    Wrench,
    Hammer,
    Handshake,
    XCircle,
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
};

type BreakdownItem = {
    label: string;
    value: number;
};

type StatCardProps = {
    title: string;
    value: number;
    icon: React.ReactNode;
    breakdown?: BreakdownItem[];
};

type PeriodFilter = "all" | "day" | "week" | "month";

function StatCard({ title, value, icon, breakdown }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {title}
        </div>
        <div className="flex items-center justify-between px-4 py-5">
          <div className="text-slate-500">{icon}</div>
          <div className="text-3xl font-bold text-slate-800">{value}</div>
        </div>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashBoardPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [period, setPeriod] = useState<PeriodFilter>("all");

    useEffect(() => {
      const init = async () => {
        try {
          const res = await fetch(`/api/dashboard/summary?period=${period}`, {
            cache: "no-store",
          });

          const json = await res.json();

          if (!res.ok) {
            throw new Error(json?.message || "โหลด dashboard ไม่สำเร็จ");
          }
          setSummary(json.data);
        } catch (err) {
          console.error("dashboard error:", err);
        } finally {
          setLoading(false);
        }
      };

      setLoading(true);
      init();
    }, [period]);

  const stats: StatCardProps[] = useMemo(() => [
    {
      title: "สินค้าส่งซ่อมทั้งหมด",
      value: summary?.totalRequest ?? 0,
      icon: <ClipboardList className="h-10 w-10" />,
    },
    {
      title: "สินค้าที่รอการซ่อม",
      value: summary?.pendingRepair ?? 0,
      icon: <MonitorX className="h-10 w-10" />,
      breakdown: [
        { label: "CS", value: summary?.pendingByRole.cs ?? 0 },
        { label: "GR", value: summary?.pendingByRole.gr ?? 0 },
        { label: "DC", value: summary?.pendingByRole.dc ?? 0 },
      ],
    },
    {
      title: "สินค้าที่กำลังดำเนินการซ่อม",
      value: summary?.inProgress ?? 0,
      icon: <Wrench className="h-10 w-10" />,
    },
    {
      title: "สินค้าที่รอลูกค้ารับคืน",
      value: summary?.completed ?? 0,
      icon: <Hammer className="h-10 w-10" />,
      breakdown: [
        {
          label: "อนุมัติซ่อม",
          value: summary?.completedBreakdown.approve ?? 0,
        },
        {
          label: "ไม่อนุมัติซ่อม",
          value: summary?.completedBreakdown.notApprove ?? 0,
        },
      ],
    },
    {
      title: "สินค้าที่ลูกค้ามารับแล้ว / จัดส่งคืนแล้ว",
      value: summary?.returned ?? 0,
      icon: <Handshake className="h-10 w-10" />,
    },
    {
      title: "สินค้าที่ปฏิเสธการซ่อม",
      value: summary?.cancelled ?? 0,
      icon: <XCircle className="h-10 w-10" />,
      breakdown: [
        {
          label: "ลูกค้า",
          value: summary?.cancelledBreakdown.userCancelled ?? 0,
        },
        {
          label: "ร้านค้า",
          value: summary?.cancelledBreakdown.twCancelled ?? 0,
        },
      ],
    },
  ], [summary]);

  return (
    <main className="w-full flex items-start justify-start md:justify-center md:h-[calc(100vh-3.5rem)] px-4 py-10 overflow-x-hidden scrollbar-hide">
      <div className="w-full max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
          ติดตามการซ่อม (Repair tracking system)
        </h1>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { label: "ทั้งหมด", value: "all" },
            { label: "รายวัน", value: "day" },
            { label: "รายสัปดาห์", value: "week" },
            { label: "รายเดือน", value: "month" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value as PeriodFilter)}
              className={`rounded-md px-4 py-2 text-sm font-medium border ${
                period === item.value
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-10">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                breakdown={stat.breakdown}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
