"use client";
// HMR trigger update: expanded customer modal layout

import { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  User, 
  Wrench, 
  Calendar, 
  X, 
  Loader2, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import Link from "next/link";

type Address = {
  id?: number;
  address_type: "BILLING" | "SHIPPING";
  address_detail: string;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  created_date: string;
  addresses: Address[];
  _count?: {
    repair_requests: number;
  };
};

type RepairRequest = {
  id: number;
  request_no: string;
  customer_name: string;
  address: string;
  phone: string;
  status: number;
  created_date: string;
  service_tier: string;
};

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerRequests, setCustomerRequests] = useState<RepairRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Address split helpers
  const parseAddressDetail = (detail: string) => {
    const defaults = { number: "", soi: "", road: "", subdistrict: "", district: "", province: "", zipcode: "" };
    if (!detail) return defaults;
    const trimmed = detail.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return { ...defaults, ...JSON.parse(trimmed) };
      } catch {}
    }
    return { ...defaults, number: detail };
  };

  const formatAddressDetail = (detail: string): string => {
    if (!detail) return "";
    const trimmed = detail.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const p = JSON.parse(trimmed);
        const parts = [];
        if (p.number) parts.push(p.number);
        if (p.soi) parts.push(`ซ.${p.soi}`);
        if (p.road) parts.push(`ถ.${p.road}`);
        if (p.subdistrict) parts.push(`ต./แขวง ${p.subdistrict}`);
        if (p.district) parts.push(`อ./เขต ${p.district}`);
        if (p.province) parts.push(`จ.${p.province}`);
        if (p.zipcode) parts.push(p.zipcode);
        return parts.join(" ");
      } catch {
        return detail;
      }
    }
    return detail;
  };

  // Form State
  const [formId, setFormId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [shippingFields, setShippingFields] = useState({
    number: "",
    soi: "",
    road: "",
    subdistrict: "",
    district: "",
    province: "",
    zipcode: ""
  });
  const [billingFields, setBillingFields] = useState({
    number: "",
    soi: "",
    road: "",
    subdistrict: "",
    district: "",
    province: "",
    zipcode: ""
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch status info helper
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});

  useEffect(() => {
    // Check permissions
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        setIsAdmin(parsed.role === "ADMIN" || parsed.role === "ADMIN_GR");
      }
    } catch {}

    const fetchStatuses = async () => {
      try {
        const res = await fetch("/api/maintain?tab=status", { cache: "no-store" });
        // Standard check
      } catch {}
      
      // Fallback status map
      setStatusMap({
        10: "รับเครื่องเข้าระบบ",
        20: "กำลังส่งตรวจสอบ",
        30: "ตรวจเช็คเสร็จสิ้น (รอเสนอราคา)",
        40: "ส่งใบเสนอราคาแล้ว (รออนุมัติ)",
        50: "อนุมัติงานซ่อม (กำลังซ่อม)",
        60: "ซ่อมเสร็จสิ้น (รอส่งคืน)",
        70: "ส่งคืนสินค้าเรียบร้อย",
        90: "ปฏิเสธการซ่อม/ยกเลิก"
      });
    };

    fetchStatuses();
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?search=${encodeURIComponent(search)}&page=${page}&limit=10`);
      const data = await res.json();
      if (data.ok) {
        setCustomers(data.customers || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormId(null);
    setFormName("");
    setFormPhone("");
    setShippingFields({ number: "", soi: "", road: "", subdistrict: "", district: "", province: "", zipcode: "" });
    setBillingFields({ number: "", soi: "", road: "", subdistrict: "", district: "", province: "", zipcode: "" });
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormId(customer.id);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    
    const shipping = customer.addresses.find(a => a.address_type === "SHIPPING")?.address_detail || "";
    const billing = customer.addresses.find(a => a.address_type === "BILLING")?.address_detail || "";

    setShippingFields(parseAddressDetail(shipping));
    setBillingFields(parseAddressDetail(billing));
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/customer/${customer.id}`);
      const data = await res.json();
      if (data.ok && data.customer) {
        setSelectedCustomer(data.customer);
        setCustomerRequests(data.customer.repair_requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError("กรุณากรอกข้อมูลชื่อและเบอร์โทรศัพท์");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const hasShipping = Object.values(shippingFields).some(val => val.trim() !== "");
      const hasBilling = Object.values(billingFields).some(val => val.trim() !== "");

      const payload = {
        name: formName,
        phone: formPhone,
        addresses: [
          ...(hasShipping ? [{ address_type: "SHIPPING", address_detail: JSON.stringify(shippingFields) }] : []),
          ...(hasBilling ? [{ address_type: "BILLING", address_detail: JSON.stringify(billingFields) }] : [])
        ]
      };

      const url = formId ? `/api/customer/${formId}` : "/api/customer";
      const method = formId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok) {
        setIsFormOpen(false);
        fetchCustomers();
      } else {
        setFormError(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setFormError("เกิดข้อผิดพลาดทางเทคนิค");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบข้อมูลลูกค้ารายนี้ใช่หรือไม่? ข้อมูลประวัติการสั่งซ่อมจะถูกยกเลิกการผูกความสัมพันธ์ (แต่ไม่ลบประวัติงานซ่อม)")) {
      return;
    }

    try {
      const res = await fetch(`/api/customer/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        fetchCustomers();
      } else {
        alert(data.message || "ไม่สามารถลบข้อมูลลูกค้าได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " น.";
  };

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 10: return "bg-gray-100 text-gray-800";
      case 20: return "bg-blue-100 text-blue-800";
      case 30: return "bg-amber-100 text-amber-800";
      case 40: return "bg-amber-200 text-amber-900";
      case 50: return "bg-indigo-100 text-indigo-800";
      case 60: return "bg-green-100 text-green-800";
      case 70: return "bg-emerald-100 text-emerald-800";
      case 90: return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 select-none p-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/menu" className="btn btn-sm btn-ghost gap-1 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            <span>กลับเมนูหลัก</span>
          </Link>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-[#c8102e] text-white rounded-lg">
                <User className="w-5 h-5" />
              </span>
              จัดการข้อมูลลูกค้า (Customer Management)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              ฐานข้อมูลลูกค้าระบบสั่งซ่อม ค้นหาข้อมูล ประวัติการซ่อม และจัดการที่อยู่จัดส่ง/ใบกำกับภาษี
            </p>
          </div>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="btn btn-sm bg-[#c8102e] hover:bg-[#a00c24] text-white gap-1.5 border-none shadow-md font-bold px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Search & Actions Panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาด้วย ชื่อ หรือ เบอร์โทรศัพท์..."
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-[#c8102e]"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="text-xs text-slate-400 font-bold">
          พบข้อมูลลูกค้าทั้งหมด <span className="text-slate-800 font-extrabold">{totalCount}</span> รายการ
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#c8102e]" />
            <p className="text-xs text-slate-500 font-bold">กำลังโหลดข้อมูลลูกค้า...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <User className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-extrabold text-slate-600">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-xs text-slate-400 font-bold">ลองปรับเปลี่ยนคำค้นหา หรือกดเพิ่มข้อมูลลูกค้าใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-xs">
                  <th className="py-3 px-4">ชื่อลูกค้า</th>
                  <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-4">ที่อยู่ในระบบ</th>
                  <th className="py-3 px-4 text-center">ประวัติสั่งซ่อม</th>
                  <th className="py-3 px-4">ลงทะเบียนเมื่อ</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((c) => {
                  const shipping = formatAddressDetail(c.addresses.find(a => a.address_type === "SHIPPING")?.address_detail || "");
                  const billing = formatAddressDetail(c.addresses.find(a => a.address_type === "BILLING")?.address_detail || "");

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs">
                        <div className="space-y-0.5">
                          {shipping && (
                            <p className="truncate font-medium">
                              <span className="text-[10px] bg-sky-50 text-sky-700 px-1 py-0.2 rounded mr-1">ส่ง</span>
                              {shipping}
                            </p>
                          )}
                          {billing && (
                            <p className="truncate font-medium">
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1 py-0.2 rounded mr-1">ภาษี</span>
                              {billing}
                            </p>
                          )}
                          {!shipping && !billing && <span className="text-slate-400 italic">ไม่มีข้อมูลที่อยู่</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#c8102e] font-black text-[10px] border border-red-100">
                          {c._count?.repair_requests || 0} เคส
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {formatDate(c.created_date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(c)}
                            className="btn btn-xs btn-ghost text-slate-600 hover:text-[#c8102e] font-bold"
                            title="ดูรายละเอียดและประวัติซ่อม"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ดูประวัติ
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="btn btn-xs btn-outline btn-slate hover:bg-slate-100 text-slate-600 font-bold"
                            title="แก้ไขข้อมูลลูกค้า"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            แก้ไข
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="btn btn-xs btn-ghost text-red-500 hover:text-red-700"
                              title="ลบข้อมูลลูกค้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-semibold">
              หน้า {page} จากทั้งหมด {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                className="btn btn-xs btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                ก่อนหน้า
              </button>
              <button
                className="btn btn-xs btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ถัดไป
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Form Modal (Create/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6">
          <div className="bg-white rounded-2xl w-11/12 max-w-6xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col border border-slate-100 max-h-[92vh]">
            <div className="bg-[#c8102e] text-white px-6 py-4 flex items-center justify-between shadow-sm">
              <h3 className="font-bold text-base flex items-center gap-2">
                <User className="w-5 h-5" />
                {formId ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้าใหม่"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              {formError && (
                <div className="alert alert-error text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 shadow-sm font-semibold">
                  <span>⚠️ {formError}</span>
                </div>
              )}

              {/* General Customer Info Card */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#c8102e]" />
                  ข้อมูลพื้นฐานลูกค้า
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ-นามสกุลจริง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย รักดี"
                      className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-300 focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] font-medium"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 0812345678"
                      className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-300 focus:border-[#c8102e] focus:ring-1 focus:ring-[#c8102e] font-medium"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Addresses Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#c8102e]" />
                  ข้อมูลที่อยู่ลูกค้า (บันทึกเข้าระบบ)
                </h4>
                
                <div className="space-y-5">
                  {/* Shipping Address - Full Width */}
                  <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-100/80">
                      <span className="text-xs font-black text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
                        ที่อยู่สำหรับจัดส่งสินค้า (Shipping Address)
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Row 1: Number, Soi, Road (3 columns full width) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">บ้านเลขที่/อาคาร</label>
                          <input
                            type="text"
                            placeholder="เช่น 123/45 หมู่ 5"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.number}
                            onChange={e => setShippingFields(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">ซอย</label>
                          <input
                            type="text"
                            placeholder="เช่น ซอยสุขุมวิท 10"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.soi}
                            onChange={e => setShippingFields(prev => ({ ...prev, soi: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">ถนน</label>
                          <input
                            type="text"
                            placeholder="เช่น ถนนสุขุมวิท"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.road}
                            onChange={e => setShippingFields(prev => ({ ...prev, road: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Row 2: Subdistrict, District, Province, Zipcode (4 columns full width) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">แขวง/ตำบล</label>
                          <input
                            type="text"
                            placeholder="เช่น คลองเตย"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.subdistrict}
                            onChange={e => setShippingFields(prev => ({ ...prev, subdistrict: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">เขต/อำเภอ</label>
                          <input
                            type="text"
                            placeholder="เช่น คลองเตย"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.district}
                            onChange={e => setShippingFields(prev => ({ ...prev, district: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">จังหวัด</label>
                          <input
                            type="text"
                            placeholder="เช่น กรุงเทพมหานคร"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.province}
                            onChange={e => setShippingFields(prev => ({ ...prev, province: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">รหัสไปรษณีย์</label>
                          <input
                            type="text"
                            placeholder="เช่น 10110"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                            value={shippingFields.zipcode}
                            onChange={e => setShippingFields(prev => ({ ...prev, zipcode: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Address - Full Width */}
                  <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-100/80">
                      <span className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                        ที่อยู่ออกใบกำกับภาษี (Billing Address)
                      </span>
                      <button
                        type="button"
                        onClick={() => setBillingFields({ ...shippingFields })}
                        className="btn btn-xs bg-purple-100 hover:bg-purple-200 text-purple-800 border-none rounded-lg font-bold transition-all shadow-xs"
                      >
                        📋 คัดลอกจากที่อยู่จัดส่ง
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Row 1: Number, Soi, Road (3 columns full width) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">บ้านเลขที่/อาคาร</label>
                          <input
                            type="text"
                            placeholder="เช่น 123/45 หมู่ 5"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.number}
                            onChange={e => setBillingFields(prev => ({ ...prev, number: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">ซอย</label>
                          <input
                            type="text"
                            placeholder="เช่น ซอยสุขุมวิท 10"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.soi}
                            onChange={e => setBillingFields(prev => ({ ...prev, soi: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">ถนน</label>
                          <input
                            type="text"
                            placeholder="เช่น ถนนสุขุมวิท"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.road}
                            onChange={e => setBillingFields(prev => ({ ...prev, road: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Row 2: Subdistrict, District, Province, Zipcode (4 columns full width) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">แขวง/ตำบล</label>
                          <input
                            type="text"
                            placeholder="เช่น คลองเตย"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.subdistrict}
                            onChange={e => setBillingFields(prev => ({ ...prev, subdistrict: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">เขต/อำเภอ</label>
                          <input
                            type="text"
                            placeholder="เช่น คลองเตย"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.district}
                            onChange={e => setBillingFields(prev => ({ ...prev, district: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">จังหวัด</label>
                          <input
                            type="text"
                            placeholder="เช่น กรุงเทพมหานคร"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.province}
                            onChange={e => setBillingFields(prev => ({ ...prev, province: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">รหัสไปรษณีย์</label>
                          <input
                            type="text"
                            placeholder="เช่น 10110"
                            className="input input-bordered w-full rounded-xl text-sm h-10 bg-white border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                            value={billingFields.zipcode}
                            onChange={e => setBillingFields(prev => ({ ...prev, zipcode: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl font-bold text-slate-600 px-4"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-sm bg-[#c8102e] hover:bg-[#a00c24] text-white border-none rounded-xl font-bold px-6 shadow-md"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    "บันทึกข้อมูลลูกค้า"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail & Repair History Modal */}
      {isDetailOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col border border-slate-200 h-[85vh]">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/80 rounded-xl">
                  <User className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">เบอร์โทรศัพท์: {selectedCustomer.phone}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Profile card & Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Shipping address details */}
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <span>ที่อยู่จัดส่งสินค้า (Shipping Address)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-sky-50/30 p-3 rounded-xl border border-sky-100/60 min-h-16">
                    {formatAddressDetail(selectedCustomer.addresses.find(a => a.address_type === "SHIPPING")?.address_detail || "") || (
                      <span className="text-slate-400 italic">ไม่มีข้อมูลที่อยู่จัดส่ง</span>
                    )}
                  </p>
                </div>

                {/* Billing address details */}
                <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>ที่อยู่ออกใบกำกับภาษี (Billing Address)</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-purple-50/30 p-3 rounded-xl border border-purple-100/60 min-h-16">
                    {formatAddressDetail(selectedCustomer.addresses.find(a => a.address_type === "BILLING")?.address_detail || "") || (
                      <span className="text-slate-400 italic">ไม่มีข้อมูลที่อยู่ออกใบกำกับภาษี</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Repair Requests History */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Wrench className="w-4.5 h-4.5 text-[#c8102e]" />
                  ประวัติใบแจ้งสั่งซ่อม (Repair History)
                </h4>

                {loadingRequests ? (
                  <div className="flex items-center justify-center py-12 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c8102e]" />
                    <span className="text-xs text-slate-500 font-semibold">กำลังดึงข้อมูลประวัติ...</span>
                  </div>
                ) : customerRequests.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    ไม่พบประวัติการแจ้งซ่อมของลูกค้ารายนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table w-full text-slate-700">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs border-b border-slate-200/80">
                          <th className="py-3 px-4">เลขที่ใบแจ้งซ่อม</th>
                          <th className="py-3 px-4">ประเภทบริการ</th>
                          <th className="py-3 px-4">วันที่สั่งซ่อม</th>
                          <th className="py-3 px-4">สถานะ</th>
                          <th className="py-3 px-4 text-center">ดูงาน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {customerRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#c8102e]">
                              {req.request_no}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                req.service_tier === "VIP" ? "bg-amber-100 text-amber-800" :
                                req.service_tier === "EXPRESS" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"
                              }`}>
                                {req.service_tier}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-500">
                              {formatDate(req.created_date)}
                            </td>
                            <td className="py-3 px-4 font-semibold">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(req.status)}`}>
                                {statusMap[req.status] || `สถานะ ${req.status}`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Link
                                href={`/status?q=${req.request_no}`}
                                className="btn btn-ghost btn-xs text-[#c8102e] hover:bg-red-50 font-bold"
                                onClick={() => setIsDetailOpen(false)}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="btn btn-sm rounded-xl font-bold bg-white border-slate-300 hover:bg-slate-100 px-6 text-slate-700 shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
