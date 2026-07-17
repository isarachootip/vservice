"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, FileText, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

type QuotationItem = {
  id: number;
  repair_order: string;
  part_cost: number;
  part_warranty_flg: string;
  labor_cost: number;
  labor_warranty_flg: string;
  total_part_cost: number;
  total_labor_cost: number;
  total_cost: number;
};

type QuotationGroup = {
  quotation_no: string;
  request_id: number;
  ticket_no: string;
  customer_name: string;
  vendor_name: string;
  review_price_date: string | null;
  user_approve_flg: string;
  user_approve_date: string | null;
  num_of_repair_day: string | null;
  num_of_guarantee_day: string | null;
  created_date: string | null;
  created_user: string | null;
  items: QuotationItem[];
  total_part_cost: number;
  total_labor_cost: number;
  grand_total: number;
};

export default function QuotationListPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [quotations, setQuotations] = useState<QuotationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  
  // Modal details state
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationGroup | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async (searchQuery = q) => {
    try {
      setLoading(true);
      setErr(null);
      const url = searchQuery.trim() 
        ? `/api/quotation?q=${encodeURIComponent(searchQuery.trim())}` 
        : "/api/quotation";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ดึงข้อมูลล้มเหลว");
      setQuotations(data.data || []);
      setPage(1);
    } catch (e) {
      console.error(e);
      setErr("เกิดข้อผิดพลาดในการโหลดข้อมูลใบเสนอราคา");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchQuotations();
  };

  const formatDateTH = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  };

  const money = (n: number) =>
    n.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Filter & Paginate
  const paginatedRows = quotations.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(quotations.length / pageSize);

  return (
    <main className="space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="ย้อนกลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              การจัดการใบเสนอราคา (Quotation Management)
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              ตรวจสอบใบเสนอราคา, สิทธิ์การอนุมัติ, และพิมพ์เอกสารเสนอราคา
            </p>
          </div>
        </div>
      </div>

      {/* Main List Box */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              รายการใบเสนอราคาทั้งหมด
            </h3>
            <span className="text-xs text-slate-400 mt-0.5 font-medium">
              พบข้อมูลทั้งหมด {quotations.length} รายการ
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหา เลขใบเสนอราคา, เลขใบสั่งซ่อม, ลูกค้า..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e]"
              />
            </div>
            <button
              onClick={() => fetchQuotations()}
              className="px-4 py-1.5 bg-[#c8102e] hover:bg-[#b00d25] text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* Data Loader */}
        {loading && (
          <div className="p-12 text-center text-slate-500 font-semibold text-sm">
            <span className="loading loading-spinner loading-md mr-2 align-middle text-[#c8102e]"></span>
            กำลังโหลดข้อมูลใบเสนอราคา...
          </div>
        )}

        {err && (
          <div className="p-8 text-center text-rose-600 font-medium text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{err}</span>
          </div>
        )}

        {!loading && !err && quotations.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-semibold text-sm">
            ไม่มีข้อมูลใบเสนอราคาในระบบ
          </div>
        )}

        {/* Table Content */}
        {!loading && !err && quotations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">เลขใบเสนอราคา</th>
                  <th className="px-5 py-3.5">เลขใบซ่อม (Job No.)</th>
                  <th className="px-5 py-3.5">ชื่อลูกค้า</th>
                  <th className="px-5 py-3.5">ผู้ขาย (Vendor)</th>
                  <th className="px-5 py-3.5 text-right">ยอดรวมสุทธิ</th>
                  <th className="px-5 py-3.5 text-center">วันที่เสนอราคา</th>
                  <th className="px-5 py-3.5 text-center">สถานะอนุมัติ</th>
                  <th className="px-5 py-3.5 text-center w-36">การดำเนินงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {paginatedRows.map((item) => {
                  const isApproved = item.user_approve_flg === "Y";
                  const isRejected = item.user_approve_flg === "N" && item.user_approve_date !== null; // user_approve_flg is N and reason/date filled means rejected
                  const isWaiting = item.user_approve_flg === "N" && item.user_approve_date === null;

                  return (
                    <tr key={item.quotation_no} className="hover:bg-slate-50/50 transition-colors">
                      {/* Quotation No */}
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {item.quotation_no}
                      </td>

                      {/* Ticket No */}
                      <td className="px-5 py-4 font-semibold text-[#c8102e]">
                        {item.ticket_no}
                      </td>

                      {/* Customer Name */}
                      <td className="px-5 py-4 font-bold text-slate-700">
                        {item.customer_name}
                      </td>

                      {/* Vendor Name */}
                      <td className="px-5 py-4 font-medium text-slate-500">
                        {item.vendor_name}
                      </td>

                      {/* Grand Total */}
                      <td className="px-5 py-4 text-right font-extrabold text-slate-800 tabular-nums">
                        {money(item.grand_total)}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-center font-medium text-slate-500">
                        {formatDateTH(item.review_price_date)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            อนุมัติแล้ว
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                            <XCircle className="w-3 h-3" />
                            ไม่อนุมัติ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 animate-pulse" />
                            รออนุมัติ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedQuotation(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-[#c8102e] hover:border-red-200 transition"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <Link
                            href={`/quotation/user-approve/${item.request_id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-[#c8102e] hover:border-red-200 transition"
                            title="จัดการการอนุมัติราคา"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/quotation/vendor-report/${item.request_id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="รายงานการเสนอราคา"
                            target="_blank"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>
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
        {!loading && !err && quotations.length > pageSize && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">
              หน้า {page} จาก {totalPages} (แสดง {paginatedRows.length} จาก {quotations.length} แถว)
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

      {/* Quotation Details Overlay Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c8102e]" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm md:text-base">
                    รายละเอียดใบเสนอราคา {selectedQuotation.quotation_no}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    สำหรับใบแจ้งซ่อมเลขที่: {selectedQuotation.ticket_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-grow">
              {/* Header metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4.5 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block">ชื่อลูกค้า</span>
                  <span className="text-xs font-bold text-slate-700">{selectedQuotation.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block">ผู้ขาย (Vendor)</span>
                  <span className="text-xs font-bold text-slate-700">{selectedQuotation.vendor_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block">วันที่เสนอราคา</span>
                  <span className="text-xs font-bold text-slate-700">{formatDateTH(selectedQuotation.review_price_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold uppercase block">ผู้บันทึกข้อมูล</span>
                  <span className="text-xs font-bold text-slate-700">{selectedQuotation.created_user || "-"}</span>
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
                  รายการเสนอราคาอะไหล่และค่าแรง
                </h4>
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-500">
                        <th className="px-4 py-2.5 text-center w-10">#</th>
                        <th className="px-4 py-2.5">รายการซ่อม/รายละเอียด</th>
                        <th className="px-4 py-2.5 text-right w-24">ค่าอะไหล่</th>
                        <th className="px-4 py-2.5 text-center w-16">รับประกัน</th>
                        <th className="px-4 py-2.5 text-right w-24">ค่าแรง</th>
                        <th className="px-4 py-2.5 text-center w-16">รับประกัน</th>
                        <th className="px-4 py-2.5 text-right w-24">ยอดรวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {selectedQuotation.items.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50/20">
                          <td className="px-4 py-2.5 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-700">{line.repair_order}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{money(line.part_cost)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {line.part_warranty_flg === "Y" ? (
                              <span className="text-[10px] font-bold text-emerald-600">ใช่</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">ไม่ใช่</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{money(line.labor_cost)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {line.labor_warranty_flg === "Y" ? (
                              <span className="text-[10px] font-bold text-emerald-600">ใช่</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">ไม่ใช่</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-extrabold text-slate-800">
                            {money(line.total_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Aggregate block */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <div className="rounded-xl border border-slate-150 bg-slate-50 px-4 py-2 text-right min-w-[130px]">
                  <div className="text-[10px] text-slate-500 font-bold">ค่าอะไหล่ทั้งหมด</div>
                  <div className="text-xs font-bold text-slate-700 tabular-nums">
                    {money(selectedQuotation.total_part_cost)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-150 bg-slate-50 px-4 py-2 text-right min-w-[130px]">
                  <div className="text-[10px] text-slate-500 font-bold">ค่าแรงทั้งหมด</div>
                  <div className="text-xs font-bold text-slate-700 tabular-nums">
                    {money(selectedQuotation.total_labor_cost)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-150 bg-red-50/50 px-4 py-2 text-right min-w-[150px]">
                  <div className="text-[10px] text-[#c8102e] font-extrabold">รวมสุทธิทั้งสิ้น</div>
                  <div className="text-base font-black text-[#c8102e] tabular-nums">
                    {money(selectedQuotation.grand_total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
              >
                ปิดหน้าต่าง
              </button>

              <Link
                href={`/quotation/user-approve/${selectedQuotation.request_id}`}
                className="px-4 py-2 rounded-xl bg-[#c8102e] hover:bg-[#b00d25] text-white text-xs font-bold transition flex items-center gap-1.5"
                onClick={() => setSelectedQuotation(null)}
              >
                <FileText className="w-3.5 h-3.5" />
                จัดการการอนุมัติราคา
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
