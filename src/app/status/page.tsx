"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Pencil, 
  Eye, 
  Trash2, 
  FolderOutput,
  Gauge, 
  AlertTriangle, 
  Siren, } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
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
  in_warranty: boolean;
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
  sla: number; 
};

type apiResp = {
  items: Row[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type UserInfo = {
  user_name: string;
  role?: string;
  permissions?: string[];
};

export default function StatusPage() {
  const router = useRouter();
  // const goView = (id: string) => router.push(`/request/view/${id}`);
  // const goEdit = (id: string) => router.push(`/request/edit/${id}`);

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [updatedUser, setUpdatedUser] = useState("");
  const [createUser, setCreateUser] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [estiRepairDays, setEstiRepairDays] = useState<Date | null>(null);

  //* pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / pageSize);

  //* filter
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dcReceiveDateFilter, setDcReceiveDateFilter] = useState("");
  const [dcReceiveDateFrom, setDcReceiveDateFrom] = useState("");
  const [dcReceiveDateTo, setDcReceiveDateTo] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [slaPercentFilter, setSlaPercentFilter] = useState<"ontrack" | "atrisk" | "critical" | null>(null);

  //* sort
  const [sortBy, setSortBy] = useState<"asc" | "desc" | null>(null);
  
  //* คล้ายๆ onInit
  useEffect(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return;
    try {
      const u = JSON.parse(raw);
      setUserInfo({
        user_name: u.user_name,
        role: u.role,
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      });
    } catch {}

    onSearch();
  }, []);

  type Role = "CS" | "GR" | "DC"| "ADMIN" | "ADMIN_GR" | "ADMIN_DC"
  const role = (userInfo?.role ?? "") as Role
  const roleActionMap: Record<Role, number[]> = {
    CS: [10,23,232,233,236,31,32,33,36],
    GR: [20,2360,30,34,35,360],
    DC: [21,22,234,235],
    ADMIN_GR: [20,2360,30,34,35,360],
    ADMIN_DC: [10,23,232,233,236,31,32,33,36],
    ADMIN: [10,20,21,22,23,232,233,234,235,2360,236,30,31,32,33,34,35,360,36],
  };
  // const canHandle = (status:number) => {
  //   const list = roleActionMap[role] ?? [];
  //   return list.includes(status);
  // }

  //* for GR ทำงาน แทน DC จังหวะ Vendor คืนของกลับ DC
  //* for DC รับของจาก Vendor แทน HO
  const roleActionInsteadMap = {
    GR: [234, 235] as number[],
    DC: [34, 35] as number[],
  };
  const canActAsGR = () =>
    role === "GR" || role === "ADMIN" || role === "ADMIN_GR";
  const canActAsDC = () =>
    role === "DC" || role === "ADMIN" || role === "ADMIN_DC";

  const can = useMemo(() => {
  const perms = (userInfo?.permissions ?? []).map((p: string) => p.trim());
  return {
      edit: perms.includes("edit_request"),
      view: perms.includes("view_request"),
      del: perms.includes("delete_request"),
    };
  }, [userInfo]);

  const onSearch = async () => {
    setErr(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (q.trim()) params.set("q", q.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (dcReceiveDateFrom) params.append("dcFrom", dcReceiveDateFrom);
      if (dcReceiveDateTo) params.append("dcTo", dcReceiveDateTo);
      // if (dcReceiveDateFilter) params.set("receiveDate", dcReceiveDateFilter);
      // if (storeFilter) params.set("store", storeFilter);
      const res = await fetch(`/api/status/search?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ค้นหาไม่สำเร็จ");

      setRows(data.items || []);
      setTotal(data.items?.length || 0);
      setPage(1);
    } catch (e) {
      setErr("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };
  
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  // const handleAction = (router: ReturnType<typeof useRouter>, id: number | string, status: number) => {
  //   router.push(optionRoute(id, status));
  // };

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

  const handleStatusSort = () => {
    let newSort: "asc" | "desc" | null = null;
    if (sortBy === null) {
      newSort = "asc";
    } else if (sortBy === "asc") {
      newSort = "desc";
    } else {
      newSort = null;
    }
    setSortBy(newSort);

    // Sort rows by status text
    const sorted = [...rows];
    if (newSort) {
      sorted.sort((a, b) => {
        const textA = statusText({ id: a.id, status: a.status, reject_flg: a.reject_flg, reject_from_status: a.reject_from_status });
        const textB = statusText({ id: b.id, status: b.status, reject_flg: b.reject_flg, reject_from_status: b.reject_from_status });
        return newSort === "asc" ? textA.localeCompare(textB, 'th') : textB.localeCompare(textA, 'th');
      });
    }
    setRows(sorted);
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

  const formatDateTH = (date?: string | Date | null,shortYear = false) => 
  {
    if (!date) return "-";
    const d = date instanceof Date
      ? date
      : new Date(date);

    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const yy = String(yyyy).slice(-2);

    return `${dd}/${mm}/${shortYear ? yy : yyyy}`;
  }

  //*  กำหนดระยะเวลาการซ่อม
  function getScheduleRepairDays(row: {
    status: number | null;
    user_approve_date: string | null;
    num_of_repair_day: string | null;
  }) {
    if (!row.user_approve_date || !row.num_of_repair_day) return null;
    //* ระยะเวลาการซ่อมประมาณ
    const days = Number(row.num_of_repair_day);
    if (!Number.isFinite(days)) return null;
    //* วันที่ลูกค้าอนุมัติซ่อม
    const base = new Date(row.user_approve_date);
    if (Number.isNaN(base.getTime())) return null;
    //* คำนวณ
    const result = new Date(base);
    result.setDate(result.getDate() + days);

    return formatDateTH(result,false);
  }

  //*  ประมาณการวันที่ซ่อมเสร็จ
  function getEstiRepairDays(row: {
    receive_from_user_date: string | null;
    send_to_vendor_date: string | null;
    num_of_repair_day: string | null;
  }): Date | null  {

    if (!row.receive_from_user_date || !row.send_to_vendor_date || !row.num_of_repair_day) return null;

    //* ระยะเวลาการซ่อมประมาณ
    const repairDays = Number(row.num_of_repair_day);
    if (!Number.isFinite(repairDays)) return null;

    const receiveDate = new Date(row.receive_from_user_date);
    const vendorDate = new Date(row.send_to_vendor_date);

    if (Number.isNaN(receiveDate.getTime()) || Number.isNaN(vendorDate.getTime())) return null;

    //* step 1 วันที่ vendor รับสินค้า - วันที่ลูกค้าส่งซ่อม
    const diffDays = Math.floor(
      (vendorDate.getTime() - receiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    //* step 2 + ระยะเวลาประมาณการซ่อม
    const totalDays = diffDays + repairDays;
    //* STEP 3 + วันที่ลูกค้าส่งซ่อม
    const resultDate = new Date(receiveDate);
    resultDate.setDate(resultDate.getDate() + totalDays);
    
    return resultDate;
  }

  //*  overdue
  function getOverdue(row: {
  status: number | null;
  customer_receive_date: string | null;
  }, estiDate: Date | null) {

    if (!estiDate) return null;
    if (row.status === 37 || row.status === 237) {
      if (!row.customer_receive_date) return null;

      return diffDays(
        estiDate,
        new Date(row.customer_receive_date)
      );
    }
    return diffDays(estiDate, new Date());
  }

  //*  จำนวนวันหลังจากตัดสินใจซ่อม
  function getDays(row: {
    status: number | null;
    user_approve_date: string | null;
    customer_receive_date: string | null;
  }) {
    if (!row.user_approve_date || row.status == null) return null;

    if (row.status === 237 || row.status === 37) {
      if (!row.customer_receive_date) return null;
      return diffDays(row.user_approve_date, row.customer_receive_date); 
    }else{
      return diffDays(row.user_approve_date, new Date()); 
    }
  }

  //*  จำนวนวันทั้งหมด
  function getAllDays(row: {
    status: number | null;
    created_date: string | null;
    customer_receive_date: string | null;
  }) {
    if (!row.created_date || row.status == null) return null;

    if (row.status === 237 || row.status === 37) {
      if (!row.customer_receive_date) return null;
      return diffDays(row.created_date, row.customer_receive_date); 
    }else{
      return diffDays(row.created_date, new Date()); 
    }
  }

  function getSlaPercent(
    updatedDate: string,
    slaHours: number
  ) {
    if (!updatedDate || !slaHours) return 0;

    const now = new Date();

    const passedHours =
      (now.getTime() - new Date(updatedDate).getTime())
      / (1000 * 60 * 60);

    const percent = (passedHours / slaHours) * 100;

    return Math.min(
      100,
      Math.max(0, Math.round(percent))
    );
  }

  function getSlaColor(percent: number) {
    if (percent <= 40)
      return "bg-green-500";

    if (percent <= 79)
      return "bg-yellow-500";

    return "bg-red-500";
  }

  const exportExcel = () => {
    if (!rows || rows.length === 0) {
      alert("ไม่มีข้อมูล");
      return;
    }

    const excelData = rows.map((r) => {
      const schedule = getScheduleRepairDays(r);          
      const estiDate = getEstiRepairDays(r);              
      const estiText = estiDate ? formatDateTH(estiDate,false) : "-";

      const overdueNum = getOverdue(r, estiDate);         
      const overdueText = overdueNum == null ? "-" : `${overdueNum} วัน`;

      const daysNum = getDays(r);                         
      const daysText = daysNum == null ? "-" : `${daysNum} วัน`;

      const allDaysNum = getAllDays(r);                   
      const allDaysText = allDaysNum == null ? "-" : `${allDaysNum} วัน`;

      return {
        "เลขที่ใบแจ้ง": r.request_no ?? "-",
        "สาขา": r.store_nick ?? "-",
        "ชื่อลูกค้า": r.customer_name ?? "-",
        "ประเภท": r.product_type ?? "-",
        "ยี่ห้อ": r.brand ?? "-",
        "Serial": r.serial_no ?? "-",
        "ประกัน": r.in_warranty,
        "วันแจ้งซ่อม": formatDateTH(r.receive_from_user_date),
        "DC รับสินค้าเข้า": formatDateTH(r.arrive_to_dc_date),
        "กำหนดระยะเวลาการซ่อม": schedule ?? "-",
        "ประมาณการวันที่ซ่อมเสร็จ": estiText,
        "overdue": overdueText,
        "จำนวนวันหลังซ่อม": daysText,
        "จำนวนวันทั้งหมด": allDaysText,
        "สถานะ": statusTextToExcel(r.status),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "List ใบแจ้งซ่อม");
    XLSX.writeFile(workbook, "ระบบแจ้งซ่อม report.xlsx");
  };

  const statusTextToExcel = (status: number) => {
    switch (status) {
      case 10: return "ส่งซ่อม";
      case 20: return "รอ DC มารับสินค้า";
      case 21: return "DC รับสินค้าจากสาขาแล้ว";
      case 22: return "DC รอ Vendor มารับสินค้า";
      case 23: return "DC รอ Vendor ตีราคา";
      case 232: return "ขออนุมัติราคาจากลูกค้า";
      case 233: return "แจ้งผลการอนุมัติ";
      case 234: return "รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)";
      case 235: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
      case 2360: return "DC รอส่งสินค้าเข้าสาขา";
      case 236: return "รอลูกค้ารับสินค้าคืน";
      case 237: return "ลูกค้ารับสินค้าแล้ว";
      case 30: return "รอ Vendor มารับสินค้า";
      case 31: return "รอ Vendor ตีราคา";
      case 32: return "ขออนุมัติราคาจากลูกค้า";
      case 33: return "แจ้งผลการอนุมัติ";
      case 34: return "รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)";
      case 35: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
      case 360: return "DC รอส่งสินค้าเข้าสาขา";
      case 36: return "รอลูกค้ารับสินค้าคืน";
      case 37: return "ลูกค้ารับสินค้าแล้ว";
      case 0: return "ใบแจ้งซ่อมถูกยกเลิก";
      default: return "-";
    }
  };

  const filteredRows = rows.filter((row) => {
    const matchQ =
      !q.trim() ||
      row.request_no?.includes(q) ||
      row.customer_name?.includes(q) ||
      row.serial_no?.includes(q);

    const matchStatus =
      !statusFilter || String(row.status) === statusFilter;

    const matchDate =
      !dcReceiveDateFilter || row.receive_from_user_date?.slice(0, 10) === dcReceiveDateFilter;

    const percent = row.reject_flg === "Y" ? 0 : getSlaPercent(
      row.status_updated_date || row.created_date || "",
      row.sla * 24
    );

    let matchSlaPercent = true;
    if (slaPercentFilter === "ontrack") matchSlaPercent = percent < 40;
    else if (slaPercentFilter === "atrisk") matchSlaPercent = percent >= 40 && percent < 80;
    else if (slaPercentFilter === "critical") matchSlaPercent = percent >= 80;

    return matchQ && matchStatus && matchDate && matchSlaPercent;
  });

  const slaCounts = useMemo(() => {
    let ontrackCount = 0;
    let atriskCount = 0;
    let criticalCount = 0;

    rows.forEach((row) => {
      const matchQ =
        q.trim() === "" ||
        row.request_no?.includes(q) ||
        row.customer_name?.includes(q) ||
        row.serial_no?.includes(q);

      const matchStatus =
        !statusFilter || String(row.status) === statusFilter;

      const matchDate =
        !dcReceiveDateFilter || row.receive_from_user_date?.slice(0, 10) === dcReceiveDateFilter;

      if (!matchQ || !matchStatus || !matchDate) return;

      const percent = row.reject_flg === "Y" ? 0 : getSlaPercent(
        row.status_updated_date || row.created_date || "",
        row.sla * 24
      );

      if (percent < 40) ontrackCount++;
      else if (percent >= 40 && percent < 80) atriskCount++;
      else if (percent >= 80) criticalCount++;
    });

    return { ontrackCount, atriskCount, criticalCount };
  }, [rows, q, statusFilter, dcReceiveDateFilter]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredRows.slice(start, end);
  }, [filteredRows, page, pageSize]);

  return (
    <main className="w-full flex items-start justify-start md:justify-center md:h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="w-full max-w-full md:max-w-8xl">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">ตรวจสอบสถานะใบแจ้งซ่อม</h1>

        <div className="bg-slate-50 rounded-xl shadow px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              className="w-full rounded-md border border-slate-300 px-5 py-2 outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="พิมพ์คำค้นหา เช่น เลขที่ใบแจ้ง, สาขา, ชื่อลูกค้า, ประเภท, ยี่ห้อ, Serial"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {/* <button
              type="button"
              onClick={() => setShowFilter(true)}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2 hover:bg-slate-100"
            >
              Filter
            </button> */}
            <button
              type="button"
              onClick={onSearch}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2 hover:bg-slate-100 disabled:opacity-60"
              aria-label="ค้นหา"
              title="ค้นหา"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        </div>

        {showFilter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">กรองข้อมูล</h2>
                <button
                  type="button"
                  onClick={() => setShowFilter(false)}
                  className="rounded-md px-4 py-1 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    สถานะ
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-5 py-2"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="0">ใบแจ้งซ่อมถูกยกเลิก</option>
                    <option value="10">ส่งซ่อม</option>
                    {/* <optgroup label="ทั่วไป">
                      <option value="0">ใบแจ้งซ่อมถูกยกเลิก</option>
                      <option value="10">ส่งซ่อม</option>
                    </optgroup> */}
                    <optgroup label="DC">
                      <option value="20">รอ DC มารับสินค้า</option>
                      <option value="21">DC รับสินค้าจากสาขาแล้ว</option>
                      <option value="22">DC รอ Vendor มารับสินค้า</option>
                      <option value="23">DC รอ Vendor ตีราคา</option>
                      <option value="232">ขออนุมัติราคาจากลูกค้า</option>
                      <option value="233">แจ้งผลการอนุมัติ</option>
                      <option value="234">รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)</option>
                      <option value="235">รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ</option>
                      <option value="2360">DC รอส่งสินค้าเข้าสาขา</option>
                      <option value="236">รอลูกค้ารับสินค้าคืน</option>
                      <option value="237">ลูกค้ารับสินค้าแล้ว</option>
                    </optgroup>

                    <optgroup label="Vendor">
                      <option value="30">รอ Vendor มารับสินค้า</option>
                      <option value="31">รอ Vendor ตีราคา</option>
                      <option value="32">ขออนุมัติราคาจากลูกค้า</option>
                      <option value="33">แจ้งผลการอนุมัติ</option>
                      <option value="34">รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)</option>
                      <option value="35">รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ</option>
                      <option value="360">*DC รอส่งสินค้าเข้าสาขา</option>
                      <option value="36">รอลูกค้ารับสินค้าคืน</option>
                      <option value="37">ลูกค้ารับสินค้าแล้ว</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    วันที่สินค้าเข้า DC
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-300 px-5 py-2"
                      value={dcReceiveDateFrom}
                      onChange={(e) => setDcReceiveDateFrom(e.target.value)}
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="date"
                      className="w-full rounded-md border border-slate-300 px-5 py-2"
                      value={dcReceiveDateTo}
                      onChange={(e) => setDcReceiveDateTo(e.target.value)}
                    />
                  </div>
                </div>
                {/* <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    สาขา
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-5 py-2 outline-none focus:ring-2 focus:ring-slate-400"
                    value={storeFilter}
                    onChange={(e) => setStoreFilter(e.target.value)}
                  >
                    {storeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div> */}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setDcReceiveDateFrom("");
                    setDcReceiveDateTo("");
                    // setStoreFilter("");
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100"
                >
                  ล้างค่า
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFilter(false);
                    onSearch();
                  }}
                  className="rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSlaPercentFilter(slaPercentFilter === "ontrack" ? null : "ontrack")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              slaPercentFilter === "ontrack"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            }`}
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">On Track ({slaCounts.ontrackCount})</span>
          </button>

          <button
            onClick={() => setSlaPercentFilter(slaPercentFilter === "atrisk" ? null : "atrisk")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              slaPercentFilter === "atrisk"
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">At Risk ({slaCounts.atriskCount})</span>
          </button>

          <button
            onClick={() => setSlaPercentFilter(slaPercentFilter === "critical" ? null : "critical")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
              slaPercentFilter === "critical"
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            <Siren className="h-4 w-4" />
            <span className="hidden sm:inline">Critical ({slaCounts.criticalCount})</span>
          </button>

          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 ml-auto"
          >
            <FolderOutput className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        <div className="mt-7 overflow-x-auto bg-white rounded-xl shadow px-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-center px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">เลขที่ใบแจ้ง</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">สาขา</th>
                <th className="text-center px-2 sm:px-3 lg:px-2 py-2 sm:py-4 text-xs sm:text-sm">ชื่อลูกค้า</th>
                <th className="text-left px-2 sm:px-3 lg:px-2 py-2 sm:py-4 text-xs sm:text-sm">ประเภท</th>
                <th className="hidden lg:table-cell text-left px-2 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">ยี่ห้อ</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">Serial</th>
                <th className="text-center px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">ประกัน</th>
                <th className="text-center px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">วันแจ้งซ่อม</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">DC รับสินค้าเข้า</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-1 py-2 sm:py-3 text-xs sm:text-sm">กำหนดระยะเวลาการซ่อม</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-1 py-2 sm:py-3 text-xs sm:text-sm">ประมาณการวันที่ซ่อมเสร็จ</th>
                <th className="text-center px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">overdue</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-1 py-2 sm:py-3 text-xs sm:text-sm">จำนวนวันหลังซ่อม</th>
                <th className="hidden lg:table-cell text-center px-2 lg:px-1 py-2 sm:py-3 text-xs sm:text-sm">จำนวนวันทั้งหมด</th>
                <th
                  className="text-center px-2 py-2 sm:py-3 w-24 lg:w-28 cursor-pointer hover:bg-slate-100 text-xs sm:text-sm"
                  onClick={handleStatusSort}
                  title="เรียงลำดับ ก-ฮ"
                >
                  สถานะ {sortBy === "asc" && "↑"} {sortBy === "desc" && "↓"}
                </th>
                {/* <th className="text-center px-5 py-3">View</th> */}
                <th className="hidden lg:table-cell text-center px-2 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm">Edit</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={18} className="px-4 py-6 text-center text-slate-500">
                    {loading ? "กำลังค้นหา..." : "ยังไม่พบข้อมูล"}
                  </td>
                </tr>
              )}
              {paginatedRows.map((r) => {
                const row: RepairRow = {
                  id: r.request_id,
                  status: Number(r.status),
                  reject_flg: r.reject_flg,
                  reject_from_status: r.reject_from_status,
                };
                const percent = r.reject_flg === "Y" ? 0 : getSlaPercent(
                  r.status_updated_date || r.created_date || "",
                  r.sla * 24
                );
                return (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      <div className="flex items-center justify-center gap-1">
                        {percent >= 100 && (
                          <div title="SLA เกินกำหนด">
                            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                          </div>
                        )}
                        <span className="truncate">{r.request_no ?? "-"}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">{r.store_nick}</td>
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-4 text-xs sm:text-sm">{r.customer_name}</td>
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-4 text-xs sm:text-sm">{r.product_type}</td>
                    <td className="hidden lg:table-cell px-2 lg:px-2 py-2 sm:py-3 text-xs sm:text-sm">{r.brand}</td>
                    <td className="hidden lg:table-cell px-2 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">{r.serial_no ?? "-"}</td>
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {r.in_warranty}
                    </td>
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {r.receive_from_user_date ?
                        new Date(r.receive_from_user_date).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {r.arrive_to_dc_date ?
                        new Date(r.arrive_to_dc_date).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-1 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {(() => {
                        const d = getScheduleRepairDays(r);
                        return d ?? "-";
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-1 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {(() => {
                        const estiDate = getEstiRepairDays(r);
                        return estiDate ? formatDateTH(estiDate,false) : "-";
                      })()}
                    </td>
                    <td className="px-2 sm:px-3 lg:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {(() => {
                        const estiDate = getEstiRepairDays(r);
                        const overdue = getOverdue(r, estiDate);
                        return overdue == null ? "-" : `${overdue} วัน`;
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-1 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {(() => {
                        const d = getDays(r);
                        return d == null ? "-" : `${d} วัน`;
                      })()}
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-1 py-2 sm:py-3 text-center text-xs sm:text-sm">
                      {(() => {
                        const d = getAllDays(r);
                        return d == null ? "-" : `${d} วัน`;
                      })()}
                    </td>
                    <td className="px-2 py-2 sm:py-3 text-center w-24 lg:w-28">
                      <Link
                        href={`/request/view/${r.request_id}`}
                        className="hover:underline cursor-pointer text-xs sm:text-sm line-clamp-2"
                        title="ดูรายละเอียด"
                      >
                        {statusText(row)}
                      </Link>
                      {row.status !== 0 && row.status !== 37 && row.status !== 237 && (
                        <>
                          <div className="mt-1 w-full h-1 sm:h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full transition-all ${getSlaColor(percent)}`}
                              style={{
                                width: `${percent}%`,
                              }}
                            />
                          </div>
                          <div className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5">
                            {percent}%
                          </div>
                        </>
                      )}
                    </td>
                    {/* <td className="px-5 py-3">
                      <div className="flex justify-center">
                        <Link
                          href={`/request/view/${r.request_id}`}
                          className="icon-data-table"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td> */}
                    <td className="hidden lg:table-cell px-2 sm:px-5 py-2 sm:py-3">
                      {(userInfo?.role === "CS" || userInfo?.role === "ADMIN" ) ? (
                        <div className="flex justify-center">
                          <Link
                            href={`/request/edit/${r.request_id}`}
                            className="icon-data-table"
                            title="แก้ไขข้อมูล"
                          >
                            <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="sr-only">แก้ไข</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className="text-slate-400">-</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex justify-center">
                        {(r.status === 0 || r.status === 37 || r.status === 237) ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <>
                            {canHandle(role, row) && (
                              <button
                                type="button"
                                className="btn-action-list"
                                onClick={() => router.push(optionRoute(row))}
                                title={labelFor(row)}
                              >
                                {labelFor(row)}
                              </button>
                            )}
                            {canActAsGR() && roleActionInsteadMap.GR.includes(r.status) && (
                              <button
                                type="button"
                                className="btn-action-instead-list ml-2"
                                onClick={() => grAction(router, r.request_id)}
                                title="จัดการแทน"
                              >
                                จัดการแทน
                              </button>
                            )}
                            {canActAsDC() && roleActionInsteadMap.DC.includes(r.status) && (
                              <button
                                type="button"
                                className="btn-action-instead-list ml-2"
                                onClick={() => dcAction(router, r.request_id)}
                                title="จัดการแทน"
                              >
                                จัดการแทน
                              </button>
                            )}
                            {(userInfo?.user_name === r.created_user || userInfo?.role === "ADMIN") && (
                              <button
                                type="button"
                                className="btn-action-cancel ml-2"
                                onClick={() => cancelAction(r.request_id)}
                                title="ยกเลิก"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}           
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginator */}
        {total > pageSize && (
          <div className="flex items-center justify-center gap-2 mt-6 pb-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              ← ก่อนหน้า
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-5 py-2 rounded ${
                    page === p
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              ถัดไป →
            </button>

            <span className="ml-4 text-slate-600">
              หน้า {page} จาก {totalPages} (แสดง {paginatedRows.length} จาก {total} แถว)
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
