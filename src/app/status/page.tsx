"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Pencil, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Inbox, 
  ShieldAlert, 
  Share2, 
  Layers
} from "lucide-react";
import Link from "next/link";
import {
  canHandle,
  optionRoute,
  labelFor,
  statusText,
  type Role,
  type RepairRow,
} from "@/lib/repair-status";

type Row = {
  id: string;
  request_id: number;
  request_no: string | null;
  customer_name: string;
  product_type: string;
  brand: string;
  model: string;
  serial_no: string | null;
  qty: number;
  in_warranty: string;
  store_code: string;    
  store_nick: string;      
  status: number; 
  created_date: string | null;  
  created_user: string | null;
  updated_date: string | null;
  receive_from_user_date: string | null;
  send_to_vendor_date: string | null;
  customer_receive_date: string | null;
  user_approve_date: string | null;
  num_of_repair_day: string | null;
  arrive_to_dc_date: string | null;
  reject_flg: string | null;
  reject_from_status: string | null;
  status_updated_date: string | null;
  sla: number | null; 
};

type UserInfo = {
  user_name: string;
  role?: string;
  permissions?: string[];
};

export default function StatusPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  //* pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / pageSize);

  //* filter
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [locationsList, setLocationsList] = useState<any[]>([]);

  //* คล้ายๆ onInit
  useEffect(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      setUserInfo({
        user_name: u.user_name,
        role: u.role,
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      });
    } catch {}

    const fetchLocations = async () => {
      try {
        const res = await fetch("/api/maintain/locations", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) {
          setLocationsList(data.locations || []);
        }
      } catch (e) {
        console.error("Failed to load locations:", e);
      }
    };
    fetchLocations();

    onSearch();
  }, []);

  const role = (userInfo?.role ?? "") as Role;

  const roleActionInsteadMap = {
    GR: [234, 235] as number[],
    DC: [34, 35] as number[],
  };
  const canActAsGR = () =>
    role === "GR" || role === "ADMIN" || role === "ADMIN_GR";
  const canActAsDC = () =>
    role === "DC" || role === "ADMIN" || role === "ADMIN_DC";

  const onSearch = async (searchQuery = q, statusF = statusFilter, locationF = locationFilter) => {
    setErr(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusF) params.set("status", statusF);
      if (locationF) params.set("locationId", locationF);

      const res = await fetch(`/api/status/search?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ค้นหาไม่สำเร็จ");

      setRows(data.items || []);
      setTotal(data.items?.length || 0);
      setPage(1);
    } catch (e) {
      setErr("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const grAction = (router: ReturnType<typeof useRouter>, id: number | string) => {
    router.push(`/request/product-vendor-to-gr/${id}`);
  };

  const dcAction = (router: ReturnType<typeof useRouter>, id: number | string) => {
    router.push(`/request/product-vendor-to-dc-instead/${id}`);
  };

  const cancelAction = async (id: number | string) => {
    const confirmed = window.confirm("ต้องการยกเลิกใบแจ้งซ่อมนี้ใช่หรือไม่?");
    if (!confirmed) return;
    try {
      let updatedUser = "";
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const u = JSON.parse(raw);
        updatedUser = u.user_name || "";
      }
      const res = await fetch("/api/request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Id: id, updatedUser }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ยกเลิกไม่สำเร็จ");
      alert("ยกเลิกใบแจ้งซ่อมเรียบร้อย");
      await onSearch();
    } catch {
      alert("เกิดข้อผิดพลาดในการยกเลิก");
    }
  };

  function toDateOnly(d: string | Date) {
    const x = new Date(d);
    return new Date(x.getFullYear(), x.getMonth(), x.getDate()); 
  }

  function diffDays(from: string | Date, to: string | Date) {
    const a = toDateOnly(from).getTime();
    const b = toDateOnly(to).getTime();
    return Math.max(0, Math.floor((b - a) / 86400000)); 
  }

  const formatDateTH = (date?: string | Date | null, shortYear = false) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543; // BE Year
    const yy = String(yyyy).slice(-2);
    return `${dd}/${mm}/${shortYear ? yy : yyyy}`;
  };

  const formatDateWithTime = (date?: string | Date | null) => {
    if (!date) return "-";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hours}:${mins}`;
  };

  //* SLA percentage
  function getSlaPercent(updatedDate: string, slaHours: number) {
    if (!updatedDate || !slaHours) return 0;
    const now = new Date();
    const passedHours = (now.getTime() - new Date(updatedDate).getTime()) / (1000 * 60 * 60);
    const percent = (passedHours / slaHours) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  }

  //* Get ticket priority level dynamically based on SLA hours
  const getPriority = (row: Row) => {
    const sla = row.sla ?? 0;
    if (sla === 0) return "LOW";
    if (sla <= 2) return "CRITICAL";
    if (sla <= 5) return "HIGH";
    if (sla <= 10) return "MEDIUM";
    return "LOW";
  };

  //* Get type badge (SW or HW)
  const getTicketType = (row: Row) => {
    const pt = String(row.product_type || "").toLowerCase();
    const brand = String(row.brand || "").toLowerCase();
    const model = String(row.model || "").toLowerCase();
    if (
      pt.includes("sw") || pt.includes("software") || pt.includes("system") || pt.includes("line") || 
      pt.includes("app") || pt.includes("web") || brand.includes("sw") || brand.includes("system") ||
      model.includes("software") || model.includes("app")
    ) {
      return "SW";
    }
    return "HW";
  };

  //* Get Tier Assignment mocks matching Image 2
  const getTiers = (row: Row) => {
    const status = row.status;
    if (status === 0) return { t1: "-", t2: "-", t3: "-" };
    if (status === 237 || status === 37) {
      return { t1: "Support Team 1", t2: "Warut", t3: "-" };
    }
    if (status === 10 || status === 11) {
      return { t1: "System Admin", t2: "-", t3: "-" };
    }
    return { t1: "Support Team 1", t2: "Pakorn", t3: "-" };
  };

  //* Dynamic counts for top cards and ribbon
  const stats = useMemo(() => {
    const totalCount = rows.length;
    let openCount = 0;
    let closedCount = 0;
    let criticalCount = 0;
    let escalatedCount = 0;
    let newCount = 0;

    rows.forEach(r => {
      const p = getPriority(r);
      const isClosed = r.status === 237 || r.status === 37;
      const isCancelled = r.status === 0;

      if (!isClosed && !isCancelled) {
        openCount++;
        if (p === "CRITICAL") criticalCount++;
        if ([21, 22, 23, 232, 233, 234, 235, 30, 31, 32, 33, 34, 35].includes(r.status)) {
          escalatedCount++;
        }
        if (r.status === 10 || r.status === 11) {
          newCount++;
        }
      } else if (isClosed) {
        closedCount++;
      }
    });

    return {
      total: totalCount,
      open: openCount,
      closed: closedCount,
      critical: criticalCount,
      escalated: escalatedCount,
      newCount: newCount
    };
  }, [rows]);

  //* Today's date in Thai BE
  const thaiTodayStr = useMemo(() => {
    const d = new Date();
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const yearBE = d.getFullYear() + 543;
    return `วันนี้ (${d.getDate()} ${monthNames[d.getMonth()]} ${yearBE})`;
  }, []);

  //* Filtered Rows (including client-side priority filter)
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (priorityFilter && getPriority(r) !== priorityFilter) return false;
      return true;
    });
  }, [rows, priorityFilter]);

  //* Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  return (
    <main className="space-y-6">
      {/* Alert Banner / ประกาศด่วน */}
      <div className="bg-[#bd5e00] text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 animate-pulse text-amber-200" />
          <span>ประกาศด่วน</span>
          <span className="opacity-40">|</span>
          <AlertTriangle className="w-4 h-4 text-amber-200" />
          <span>ทดสอบระบบ</span>
          <AlertTriangle className="w-4 h-4 text-amber-200" />
        </div>
        <button className="text-white/80 hover:text-white font-bold text-xs px-2 py-1 rounded hover:bg-white/10 transition">
          ✕
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="bg-red-50 border border-red-150 text-[#c8102e] px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm font-bold gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#c8102e] animate-pulse"></span>
          <span>{thaiTodayStr}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>เปิดใหม่: <strong className="text-[#c8102e] font-extrabold text-sm">{stats.newCount}</strong></span>
          <span className="opacity-30">|</span>
          <span>แก้ไขแล้ว: <strong className="text-amber-700 font-extrabold text-sm">{stats.open}</strong></span>
          <span className="opacity-30">|</span>
          <span>ปิดงาน: <strong className="text-slate-700 font-extrabold text-sm">{stats.closed}</strong></span>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">Total Tickets</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.open}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">Open Tickets</span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.closed}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">Resolved/Closed</span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c8102e] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.critical}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">Critical Open</span>
          </div>
        </div>
        {/* Card 5 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c8102e] flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.escalated}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">Escalated</span>
          </div>
        </div>
        {/* Card 6 */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow-md transition duration-200">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#c8102e] flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-slate-800">{stats.newCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold truncate leading-tight uppercase">รอรับเรื่อง (NEW)</span>
          </div>
        </div>
      </div>

      {/* Ticket List Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header and Add Button */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-800">All Tickets</h3>
            <span className="text-xs text-slate-400 mt-0.5">รายการ Ticket ทั้งหมด ({total} รายการ)</span>
          </div>
          <button 
            onClick={() => router.push("/request/add")}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#c8102e] hover:bg-[#b00d25] active:bg-[#900a1c] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            แจ้งซ่อมใหม่
          </button>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-44">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะ</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  onSearch(q, e.target.value);
                }}
                className="select-custom bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
              >
                <option value="">ทั้งหมด</option>
                <option value="10">ส่งซ่อม</option>
                <option value="11">GR รับสินค้า</option>
                <option value="20">GR เปิด log DC</option>
                <option value="201">รอ DC รับสินค้า</option>
                <option value="21">DC รับสินค้าแล้ว</option>
                <option value="22">DC รอ Vendor</option>
                <option value="23">DC รอตีราคา</option>
                <option value="232">ขออนุมัติราคา</option>
                <option value="233">แจ้งผลการอนุมัติ</option>
                <option value="234">รอ Vendor ส่งคืน (ไม่อนุมัติ)</option>
                <option value="235">รอ Vendor ส่งคืน (เสร็จ)</option>
                <option value="236">CS รอลูกค้ารับคืน</option>
                <option value="237">ลูกค้ารับของแล้ว</option>
                <option value="0">ใบซ่อมถูกยกเลิก</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-44">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ความเร่งด่วน</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="select-custom bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
              >
                <option value="">ทั้งหมด</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Location Filter */}
            {role === "ADMIN" && (
              <div className="flex flex-col gap-1 w-full sm:w-44">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">พื้นที่ดูแล / สาขาหลัก</label>
                <select
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    onSearch(q, statusFilter, e.target.value);
                  }}
                  className="select-custom bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
                >
                  <option value="">ทั้งหมด</option>
                  {locationsList.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Job No., Subject, Symptom..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
              />
            </div>
            <button
              onClick={() => onSearch()}
              className="px-3.5 py-1.5 bg-[#c8102e] hover:bg-[#b00d25] text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Loading and Error */}
        {loading && (
          <div className="p-12 text-center text-slate-500 font-semibold text-sm">
            <span className="loading loading-spinner loading-md mr-2 align-middle text-[#c8102e]"></span>
            กำลังโหลดข้อมูลรายการ...
          </div>
        )}

        {err && (
          <div className="p-8 text-center text-rose-600 font-medium text-sm">
            ❌ {err}
          </div>
        )}

        {!loading && !err && total === 0 && (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            ไม่พบข้อมูลรายการแจ้งซ่อม
          </div>
        )}

        {/* Table List */}
        {!loading && !err && total > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-28">JOB NO.</th>
                  <th className="px-4 py-3">ลูกค้า</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3">รุ่นสินค้า (Model)</th>
                  <th className="px-4 py-3">เลขเครื่อง (S/N)</th>
                  <th className="px-3 py-3 text-center">สาขา</th>
                  <th className="px-3 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3">ผู้บันทึก</th>
                  <th className="px-4 py-3 text-center">วันที่แจ้งซ่อม</th>
                  <th className="px-4 py-3 text-center w-24">การดำเนินงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {paginatedRows.map((r) => {
                  const repairRow: RepairRow = {
                    id: r.request_id,
                    status: r.status,
                    reject_flg: r.reject_flg,
                    reject_from_status: r.reject_from_status,
                  };

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Job No. */}
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                        {r.request_no ?? "-"}
                      </td>
                      
                      {/* Customer Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {r.customer_name || "-"}
                      </td>
                      
                      {/* Product (Type & Brand) */}
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {r.product_type} ({r.brand})
                      </td>
                      
                      {/* Model */}
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {r.model || "-"}
                      </td>
                      
                      {/* Serial No. */}
                      <td className="px-4 py-3.5 text-slate-700 font-semibold font-mono text-[11px]">
                        {r.serial_no || "-"}
                      </td>

                      {/* Store Nick (Branch) */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-500">
                        {r.store_nick || "-"}
                      </td>
                      
                      {/* Status Badge */}
                      <td className="px-3 py-3.5 text-center">
                        {r.status === 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-bold text-[10px]">
                            ยกเลิก
                          </span>
                        ) : r.status === 237 || r.status === 37 ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            ปิดงาน
                          </span>
                        ) : r.status === 10 || r.status === 11 ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px]">
                            เปิดใหม่
                          </span>
                        ) : r.status === 20 || r.status === 201 || r.status === 21 || r.status === 22 ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[10px]">
                            รอรับเรื่อง
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                            กำลังดำเนินการ
                          </span>
                        )}
                      </td>
                      
                      {/* Creator */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {r.created_user || "-"}
                      </td>
                      
                      {/* Date Created */}
                      <td className="px-4 py-3.5 text-center text-slate-500 font-medium whitespace-nowrap">
                        {formatDateWithTime(r.created_date)}
                      </td>
                      
                      {/* Actions Column */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/request/view/${r.request_id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-[#c8102e] hover:border-red-200 transition"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {canHandle(role, repairRow) && (
                            <Link
                              href={optionRoute(repairRow)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#c8102e] bg-[#c8102e] text-white hover:bg-[#b00d25] transition"
                              title="ดำเนินการขั้นตอนถัดไป"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginator */}
        {!loading && !err && total > pageSize && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">
              หน้า {page} จาก {totalPages} (แสดง {paginatedRows.length} จาก {total} แถว)
            </span>
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ก่อนหน้า
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      page === p
                        ? "bg-[#c8102e] text-white"
                        : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
