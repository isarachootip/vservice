"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus, CircleMinus } from "lucide-react";
import { DatePicker } from "react-datepicker";

type Row = {
    id: number;
    desc: string;          
    parts: number;         
    labor: number;        
    warrantyParts: boolean; 
    warrantyLabor: boolean; 
};

type Errors = Partial<{
    quotationNo: string;
    previewPriceDate: string;
    avgRepairDay: string;
    guaranteeDay: string;
}>;

export default function QuotationAddPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [quotationNo, setQuotationNo] = useState("");
    const [previewPriceDate, setPreviewPriceDate] = useState<Date | null>(null);
    const [avgRepairDay, setAvgRepairDay] = useState("");
    const [guaranteeDay, setGuaranteeDay] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [rows, setRows] = useState<Row[]>([
        {
        id: 1,
        desc: "",
        parts: 0,
        labor: 0,
        warrantyParts: false,
        warrantyLabor: false,
        },
    ]);

    const [vendorName, setVendorName] = useState("");
    const [status,      setStatus]    = useState<number | "">("");
    const [commodityInfo, setCommodityInfo] = useState<any | null>(null);

    const parseNum = (v: string) =>
        v.trim() === "" ? 0 : Number(v.replace(/,/g, "")) || 0;

    const money = (n: number) =>
        n.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const effectiveParts = (r: Row) =>
        r.warrantyParts ? 0 : (r.parts || 0);

    const effectiveLabor = (r: Row) =>
        r.warrantyLabor ? 0 : (r.labor || 0);

    const lineTotal = (r: Row) =>
        effectiveParts(r) + effectiveLabor(r);

    const totalParts = rows.reduce((s, r) => s + effectiveParts(r), 0);
    const totalLabor = rows.reduce((s, r) => s + effectiveLabor(r), 0);
    const grandTotal = totalParts + totalLabor;

    const warrantyPartsTotal = rows.reduce((s, r) => s + (r.warrantyParts ? (r.parts || 0) : 0),0);
    const warrantyLaborTotal = rows.reduce((s, r) => s + (r.warrantyLabor ? (r.labor || 0) : 0),0);

    const addRow = () =>
        setRows(prev => [
        ...prev,
        {
            id: prev.length + 1,
            desc: "",
            parts: 0,
            labor: 0,
            warrantyParts: false,
            warrantyLabor: false,
        },
    ]);

    const deleteRow = (rowId: number) =>
        setRows(prev => {
            if (prev.length === 1) return prev; 
            return prev
                .filter(r => r.id !== rowId)
                .map((r, idx) => ({ ...r, id: idx + 1 }));
    });

    const updateRow = (rowId: number, patch: Partial<Row>) =>
        setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, ...patch } : r)),
    );

  const baseInput =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c8102e] focus:border-[#c8102e] bg-white";

  const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

  const Req = () => <span className="text-red-600 ml-0.5">*</span>;

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");
                const r = data.request;
                setVendorName(r.vendor_name || "");
                setStatus(r.status || "");

                // If request has a repair item with sku_code, fetch its commodity details
                if (r.item && r.item.sku_code) {
                    const comRes = await fetch(`/api/commodity/lookup?sku=${r.item.sku_code}`, { cache: "no-store" });
                    const comData = await comRes.json();
                    if (comRes.ok && comData.data) {
                        const commodity = comData.data;
                        if (alive) {
                            setCommodityInfo(commodity);
                            // Pre-populate the first row with SKU details and cost price (ราคาทุน)
                            setRows([
                                {
                                    id: 1,
                                    desc: commodity.sku_name || `${r.item.brand} ${r.item.model}`,
                                    parts: commodity.sku_cost || 0, // ราคาทุน
                                    labor: 0,
                                    warrantyParts: false,
                                    warrantyLabor: false,
                                }
                            ]);
                        }
                    } else if (alive) {
                        setRows([
                            {
                                id: 1,
                                desc: `${r.item.brand || ""} ${r.item.model || ""} (${r.item.product_type || ""})`,
                                parts: 0,
                                labor: 0,
                                warrantyParts: false,
                                warrantyLabor: false,
                            }
                        ]);
                    }
                } else if (r.item && alive) {
                    setRows([
                        {
                            id: 1,
                            desc: `${r.item.brand || ""} ${r.item.model || ""} (${r.item.product_type || ""})`,
                            parts: 0,
                            labor: 0,
                            warrantyParts: false,
                            warrantyLabor: false,
                        }
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [id]);

    const toYMD = (v: unknown): string | null => {
        if (!v) return null;
        const d = v instanceof Date ? v : new Date(String(v));
        if (Number.isNaN(d.getTime())) return null;

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const onSave = async () => {
        setSaving(true);
        setErrors({});

        try {
            const newErrors: Errors = {};
            if (!quotationNo.trim()) newErrors.quotationNo = "กรุณากรอกเลขที่ใบเสนอราคา";
            if (!previewPriceDate) newErrors.previewPriceDate = "กรุณาเลือกวันที่เสนอราคา";
            if (!avgRepairDay.trim()) newErrors.avgRepairDay = "กรุณาระบุระยะเวลาการซ่อมประมาณ";
            if (!guaranteeDay.trim()) newErrors.guaranteeDay = "กรุณาระบุระยะเวลารับประกันงานซ่อม";

            if (rows.length === 0) {
                alert("กรุณากรอกอย่างน้อย 1 รายการซ่อม");
                setSaving(false);
                return;
            }

            if(Object.keys(newErrors).length > 0){
                setErrors(newErrors);
                setSaving(false);
                return;
            }
            
            //* check id
            const requestId = Number(id);
            if (Number.isNaN(requestId)) {
                throw new Error("request id ไม่ถูกต้อง");
            }

            const reviewPriceDateStr = toYMD(previewPriceDate);

            let updatedUser = "";
            const raw = localStorage.getItem("userInfo");
            if (raw) {
                const u = JSON.parse(raw);
                updatedUser = u.user_name || "";
            }    
            
            const items = rows
                .filter(r => r.desc.trim() !== "")
                .map(r => {
                const partWarrantyFlg = r.warrantyParts ? "Y" : "N";
                const laborWarrantyFlg = r.warrantyLabor ? "Y" : "N";

                const rawPartCost = Number((r.parts || 0).toFixed(2));
                const rawLaborCost = Number((r.labor || 0).toFixed(2));

                const partCost = r.warrantyParts ? 0 : rawPartCost;
                const laborCost = r.warrantyLabor ? 0 : rawLaborCost;
                const lineTotalCost = Number((partCost + laborCost).toFixed(2));

                return {
                    request_id: requestId,
                    review_price_date: reviewPriceDateStr,
                    repair_order: r.desc || "",
                    part_cost: rawPartCost,
                    part_warranty_flg: partWarrantyFlg,
                    labor_cost: rawLaborCost,
                    labor_warranty_flg: laborWarrantyFlg,
                    total_part_cost: partCost,   
                    total_labor_cost: laborCost,  
                    total_cost: lineTotalCost,
                    user_approve_flg: "N",
                    num_of_repair_day: avgRepairDay,
                    num_of_guarantee_day: guaranteeDay,
                    quotation_no: quotationNo
                };
            });

            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = statusNum === 23 ? "DC" : "VEN";
            console.log("mode :",mode)
            const res = await fetch("/api/quotation/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, updatedUser, mode }),
            });

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.message || "บันทึกใบเสนอราคาล้มเหลว");
            }

            alert(data?.message || "บันทึกใบเสนอราคาสำเร็จ");
            router.push("/status");
        } catch (err) {
            alert(
                (err as Error).message ||
                "เกิดข้อผิดพลาดในการบันทึกใบเสนอราคา",
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <section className="max-w-5xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;

    return (
        <section className="max-w-5xl mx-auto py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เปิดใบเสนอราคา (CS)
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm p-6 md:p-8">
            <form className="space-y-8">
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    รายละเอียดใบเสนอราคา
                </h2>

                {commodityInfo && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold text-[#777] tracking-wider uppercase">ข้อมูลสินค้า/อะไหล่จากฐานข้อมูล (Commodity Info)</span>
                            <div className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                <span className="text-[#c8102e]">SKU: {commodityInfo.sku}</span>
                                <span className="text-slate-300">|</span>
                                <span>{commodityInfo.sku_name}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">ยี่ห้อ: {commodityInfo.brand} | หมวดหมู่: {commodityInfo.class_name}</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-50 border border-slate-150 px-4 py-2 rounded-xl text-right min-w-[120px]">
                                <span className="text-[10px] text-slate-450 block font-bold">ราคาทุน (Cost)</span>
                                <span className="text-sm font-extrabold text-slate-700 tabular-nums">{money(commodityInfo.sku_cost || 0)} บาท</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-150 px-4 py-2 rounded-xl text-right min-w-[120px]">
                                <span className="text-[10px] text-slate-450 block font-bold">ราคาแนะนำ (Price)</span>
                                <span className="text-sm font-extrabold text-slate-700 tabular-nums">{money(commodityInfo.sku_price || 0)} บาท</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 ml-8">
                            ผู้ขาย (Vendor) :
                        </span>
                        <span className="text-sm text-slate-900">
                            {vendorName || "-"}
                        </span>
                    </div>
                    <div>
                        
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                            เลขที่ใบเสนอราคา <Req />
                        </label>
                        <input
                            id="avgRepairTime"
                            className={`${inputClass(!!errors.quotationNo)} w-45`}
                            value={quotationNo}
                            onChange={e => setQuotationNo(e.target.value)}
                        />
                        {errors.quotationNo && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.quotationNo}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                            วันที่เสนอราคา <Req />
                        </label>
                        <DatePicker
                            id="previewPriceDate"
                            selected={previewPriceDate}
                            onChange={(date) => setPreviewPriceDate(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="วว/ดด/ปป"
                            className={inputClass(!!errors.previewPriceDate)}
                        />
                        {errors.previewPriceDate && (
                            <p className="text-red-600 text-xs mt-1">
                            {errors.previewPriceDate}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                            ระยะเวลาการซ่อมประมาณ (วัน) <Req />
                        </label>
                        <input
                            id="avgRepairTime"
                            className={`${inputClass(!!errors.avgRepairDay)} w-45`}
                            value={avgRepairDay}
                            onChange={e => setAvgRepairDay(e.target.value)}
                            placeholder="จำนวนวัน"
                        />
                        {errors.avgRepairDay && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.avgRepairDay}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                            ระยะเวลารับประกันงานซ่อม (วัน) <Req />
                        </label>
                        <input
                            id="avgRepairTime"
                            className={`${inputClass(!!errors.guaranteeDay)} w-49`}
                            value={guaranteeDay}
                            onChange={e => setGuaranteeDay(e.target.value)}
                            placeholder="จำนวนวัน"
                        />
                        {errors.guaranteeDay && (
                            <p className="text-red-600 text-xs mt-1">
                                {errors.guaranteeDay}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ตารางรายการซ่อม */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-y-3 border-spacing-x-3">
                <thead>
                    <tr className="text-xs font-semibold text-slate-700">
                    <th className="w-10 text-right pr-1">#</th>
                    <th className="text-left">รายการซ่อม</th>
                    <th className="w-28 text-right">ค่าอะไหล่</th>
                    <th className="w-24 text-center">ในประกัน</th>
                    <th className="w-4"></th>
                    <th className="w-28 text-right">ค่าแรง</th>
                    <th className="w-24 text-center">ในประกัน</th>
                    <th className="w-28 text-right">รวม</th>
                    <th className="w-10"></th>
                    <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                    <tr key={r.id} className="align-middle">
                        <td className="text-right pr-1 text-slate-500 whitespace-nowrap">
                        {r.id})
                        </td>

                        {/* รายการซ่อม */}
                        <td>
                        <input
                            value={r.desc}
                            onChange={e =>
                            updateRow(r.id, { desc: e.target.value })
                            }
                            // placeholder="รายละเอียดงานซ่อม"
                            className={baseInput}
                        />
                        </td>

                        {/* ค่าอะไหล่ */}
                        <td>
                        <input
                            type="number"
                            step="0.01"
                            className={`${baseInput} text-right`}
                            value={r.parts || ""}
                            onChange={e =>
                            updateRow(r.id, { parts: parseNum(e.target.value) })
                            }
                            placeholder="0.00"
                        />
                        </td>

                        {/* อยู่ในประกัน (อะไหล่) */}
                        <td>
                        <div className="flex justify-center">
                            <input
                            type="checkbox"
                            checked={r.warrantyParts}
                            onChange={e =>
                                updateRow(r.id, {
                                warrantyParts: e.target.checked,
                                })
                            }
                            className="h-5 w-5 accent-[#c8102e]"
                            />
                        </div>
                        </td>

                        {/* + */}
                        <td className="text-center text-slate-500 align-middle">
                        +
                        </td>

                        {/* ค่าแรง */}
                        <td>
                        <input
                            type="number"
                            step="0.01"
                            className={`${baseInput} text-right`}
                            value={r.labor || ""}
                            onChange={e =>
                            updateRow(r.id, { labor: parseNum(e.target.value) })
                            }
                            placeholder="0.00"
                        />
                        </td>

                        {/* อยู่ในประกัน (ค่าแรง) */}
                        <td>
                        <div className="flex justify-center">
                            <input
                            type="checkbox"
                            checked={r.warrantyLabor}
                            onChange={e =>
                                updateRow(r.id, {
                                warrantyLabor: e.target.checked,
                                })
                            }
                            className="h-5 w-5 accent-[#c8102e]"
                            />
                        </div>
                        </td>

                        {/* รวมต่อแถว */}
                        <td className="text-right font-semibold text-slate-800 tabular-nums pr-2">
                        {money(lineTotal(r))}
                        </td>

                        {/* ปุ่มเพิ่ม (เฉพาะแถวสุดท้าย) */}
                        <td className="text-center">
                        {r.id === rows.length && (
                            <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[#c8102e] text-[#c8102e] bg-white shadow-sm hover:bg-red-50 hover:shadow-md transition"
                            title="เพิ่มรายการ"
                            >
                            <CirclePlus className="h-4 w-4" />
                            </button>
                        )}
                        </td>

                        {/* ปุ่มลบ */}
                        <td className="text-center">
                        {rows.length > 1 && (
                            <button
                            type="button"
                            onClick={() => deleteRow(r.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-rose-400 text-rose-500 bg-white shadow-sm hover:bg-rose-50 hover:shadow-md transition"
                            title="ลบรายการ"
                            >
                            <CircleMinus className="h-4 w-4" />
                            </button>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* รวมค่าอะไหล่ / ค่าแรง / รวมสุทธิ */}
            <div className="flex flex-wrap justify-end gap-3 pt-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[170px]">
                    <div className="text-xs text-slate-500">ค่าอะไหล่ที่อยู่ในประกัน</div>
                    <div className="text-sm font-semibold tabular-nums text-emerald-700">
                    {money(warrantyPartsTotal)}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[170px]">
                    <div className="text-xs text-slate-500">ค่าแรงที่อยู่ในประกัน</div>
                    <div className="text-sm font-semibold tabular-nums text-emerald-700">
                    {money(warrantyLaborTotal)}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                    <div className="text-xs text-slate-500">ค่าอะไหล่ทั้งหมด</div>
                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                        {money(totalParts)}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                    <div className="text-xs text-slate-500">ค่าแรงทั้งหมด</div>
                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                        {money(totalLabor)}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[160px]">
                    <div className="text-xs text-slate-500">รวมสุทธิ</div>
                    <div className="text-lg font-semibold tabular-nums text-slate-900">
                        {money(grandTotal)}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    className="btn-back"
                    onClick={() => history.back()}
                >
                    ย้อนกลับ
                </button>
                <button
                    type="button"
                    className="btn-submit"
                    onClick={onSave}
                >
                    {saving ? "กำลังบันทึก..." : "บันทึกใบเสนอราคา"}
                </button>
            </div>
            </form>
        </div>
        </section>
    );
}
