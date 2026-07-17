"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CirclePlus, CircleMinus } from "lucide-react";
import { DatePicker } from "react-datepicker";

type Row = {
    id: number;
    desc: string;          
    costParts: number;
    costLabor: number;
    costLogistics: number;
    marginPercent: number;
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
    
    // Cost-Plus config states
    const [marginConfigs, setMarginConfigs] = useState<any[]>([]);
    const [defaultMargin, setDefaultMargin] = useState(30);
    const [defaultFloor, setDefaultFloor] = useState(15);
    const [ticketDiagnosticFee, setTicketDiagnosticFee] = useState(0);

    const [discountAmt, setDiscountAmt] = useState("0");
    const [discountReason, setDiscountReason] = useState("");

    // Admin bypass states for margin floor
    const [bypassAdmin, setBypassAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState("");
    const [adminPass, setAdminPass] = useState("");

    const [rows, setRows] = useState<Row[]>([
        {
            id: 1,
            desc: "",
            costParts: 0,
            costLabor: 0,
            costLogistics: 0,
            marginPercent: 30,
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
            costParts: 0,
            costLabor: 0,
            costLogistics: 0,
            marginPercent: defaultMargin,
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
        prev.map(r => {
            if (r.id !== rowId) return r;
            const updated = { ...r, ...patch };
            const m = typeof updated.marginPercent === 'number' ? updated.marginPercent : parseFloat(String(updated.marginPercent || "0")) || 0;
            updated.parts = (updated.costParts || 0) * (1 + m / 100);
            updated.labor = ((updated.costLabor || 0) + (updated.costLogistics || 0)) * (1 + m / 100);
            return updated;
        }),
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
                setTicketDiagnosticFee(r.diagnostic_fee ? parseFloat(r.diagnostic_fee) : 0);

                // Fetch margin config
                const marginRes = await fetch("/api/maintain/config?type=margin", { cache: "no-store" });
                const marginData = await marginRes.json();
                let marginPct = 30;
                let marginFl = 15;
                if (marginRes.ok && marginData.data) {
                    setMarginConfigs(marginData.data);
                    const matched = marginData.data.find((m: any) => 
                        r.item?.product_type?.toLowerCase().includes(m.product_type.toLowerCase()) ||
                        m.product_type.toLowerCase().includes(r.item?.product_type?.toLowerCase())
                    );
                    if (matched) {
                        marginPct = parseFloat(matched.margin_percent);
                        marginFl = parseFloat(matched.margin_floor);
                    } else {
                        const gen = marginData.data.find((m: any) => m.product_type.includes("General"));
                        if (gen) {
                            marginPct = parseFloat(gen.margin_percent);
                            marginFl = parseFloat(gen.margin_floor);
                        }
                    }
                }
                setDefaultMargin(marginPct);
                setDefaultFloor(marginFl);

                // If request has a repair item with sku_code, fetch its commodity details
                if (r.item && r.item.sku_code) {
                    const comRes = await fetch(`/api/commodity/lookup?sku=${r.item.sku_code}`, { cache: "no-store" });
                    const comData = await comRes.json();
                    if (comRes.ok && comData.data) {
                        const commodity = comData.data;
                        if (alive) {
                            setCommodityInfo(commodity);
                            const partsSell = (commodity.sku_cost || 0) * (1 + marginPct / 100);
                            setRows([
                                {
                                    id: 1,
                                    desc: commodity.sku_name || `${r.item.brand} ${r.item.model}`,
                                    costParts: commodity.sku_cost || 0,
                                    costLabor: 0,
                                    costLogistics: 0,
                                    marginPercent: marginPct,
                                    parts: partsSell,
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
                                costParts: 0,
                                costLabor: 0,
                                costLogistics: 0,
                                marginPercent: marginPct,
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
                            costParts: 0,
                            costLabor: 0,
                            costLogistics: 0,
                            marginPercent: marginPct,
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

            // Verify margin floor constraint
            const hasLowMargin = rows.some(r => r.desc.trim() !== "" && r.marginPercent < defaultFloor);
            if (hasLowMargin && !bypassAdmin) {
                alert(`ไม่สามารถส่งเสนอราคาได้เนื่องจากบางรายการมี Margin ต่ำกว่าขีดจำกัดขั้นต่ำ (${defaultFloor}%)\nกรุณากรอกรหัสผ่านผู้อนุมัติ (Admin Bypass) เพื่อดำเนินการต่อ`);
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

            const globalDiscount = parseFloat(discountAmt) || 0;
            
            const items = rows
                .filter(r => r.desc.trim() !== "")
                .map(r => {
                const partWarrantyFlg = r.warrantyParts ? "Y" : "N";
                const laborWarrantyFlg = r.warrantyLabor ? "Y" : "N";

                const partCostVal = r.warrantyParts ? 0 : r.parts;
                const laborCostVal = r.warrantyLabor ? 0 : r.labor;
                const itemSellPrice = partCostVal + laborCostVal;

                // Allocate global discount proportionally
                const ratio = grandTotal > 0 ? (itemSellPrice / grandTotal) : (1 / rows.length);
                const itemDiscount = Number((globalDiscount * ratio).toFixed(2));
                const itemTaxable = Math.max(0, itemSellPrice - itemDiscount);
                const itemVat = Number((itemTaxable * 0.07).toFixed(2));
                const itemNetPrice = Number((itemTaxable + itemVat).toFixed(2));

                return {
                    request_id: requestId,
                    review_price_date: reviewPriceDateStr,
                    repair_order: r.desc || "",
                    part_cost: r.parts,
                    part_warranty_flg: partWarrantyFlg,
                    labor_cost: r.labor,
                    labor_warranty_flg: laborWarrantyFlg,
                    total_part_cost: partCostVal,   
                    total_labor_cost: laborCostVal,  
                    total_cost: itemSellPrice,
                    user_approve_flg: "N",
                    num_of_repair_day: avgRepairDay,
                    num_of_guarantee_day: guaranteeDay,
                    quotation_no: quotationNo,

                    cost_parts: r.costParts,
                    cost_labor: r.costLabor,
                    cost_logistics: r.costLogistics,
                    margin_percent: r.marginPercent,
                    sell_price: r.parts + r.labor,
                    discount: itemDiscount,
                    vat: itemVat,
                    net_price: itemNetPrice
                };
            });

            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = statusNum === 23 ? "DC" : "VEN";
            console.log("mode :",mode)
            const res = await fetch("/api/quotation/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    items, 
                    updatedUser, 
                    mode,
                    adminUser: hasLowMargin ? adminUser : null,
                    adminPass: hasLowMargin ? adminPass : null,
                    discountReason
                }),
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
                <table className="w-full text-sm border-separate border-spacing-y-2 border-spacing-x-2">
                <thead>
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left border-b border-slate-100">
                        <th className="w-8 text-right pr-1">#</th>
                        <th>รายการซ่อม</th>
                        <th className="w-24 text-right">ต้นทุนอะไหล่</th>
                        <th className="w-24 text-right">ต้นทุนค่าแรง</th>
                        <th className="w-24 text-right">ต้นทุนเดินทาง</th>
                        <th className="w-28 text-center">Margin (%)</th>
                        <th className="w-32 text-center">ในประกัน</th>
                        <th className="w-28 text-right">ราคาขายสุทธิ</th>
                        <th className="w-10"></th>
                        <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                    <tr key={r.id} className="align-middle">
                        <td className="text-right pr-1 text-slate-450 font-bold whitespace-nowrap">
                            {r.id})
                        </td>

                        {/* รายการซ่อม */}
                        <td>
                            <input
                                value={r.desc}
                                onChange={e => updateRow(r.id, { desc: e.target.value })}
                                placeholder="เช่น เปลี่ยนแบตเตอรี่ / เปลี่ยนบอร์ดควบคุม"
                                className={baseInput}
                            />
                        </td>

                        {/* ต้นทุนอะไหล่ */}
                        <td>
                            <input
                                type="number"
                                step="0.01"
                                className={`${baseInput} text-right font-semibold text-slate-800`}
                                value={r.costParts || ""}
                                onChange={e => updateRow(r.id, { costParts: parseNum(e.target.value) })}
                                placeholder="0.00"
                            />
                        </td>

                        {/* ต้นทุนค่าแรง */}
                        <td>
                            <input
                                type="number"
                                step="0.01"
                                className={`${baseInput} text-right font-semibold text-slate-800`}
                                value={r.costLabor || ""}
                                onChange={e => updateRow(r.id, { costLabor: parseNum(e.target.value) })}
                                placeholder="0.00"
                            />
                        </td>

                        {/* ต้นทุนค่าขนส่ง */}
                        <td>
                            <input
                                type="number"
                                step="0.01"
                                className={`${baseInput} text-right font-semibold text-slate-800`}
                                value={r.costLogistics || ""}
                                onChange={e => updateRow(r.id, { costLogistics: parseNum(e.target.value) })}
                                placeholder="0.00"
                            />
                        </td>

                        {/* Margin % */}
                        <td>
                            <div className="flex items-center gap-1.5 justify-center">
                                <input
                                    type="number"
                                    step="0.1"
                                    className={`${baseInput} text-right font-bold w-20 ${r.marginPercent < defaultFloor ? 'border-red-500 text-red-600 focus:ring-red-500' : 'text-slate-850'}`}
                                    value={r.marginPercent}
                                    onChange={e => updateRow(r.id, { marginPercent: parseNum(e.target.value) })}
                                    placeholder="30.0"
                                />
                                <span className="text-xs font-semibold text-slate-500">%</span>
                            </div>
                        </td>

                        {/* ในประกัน (อะไหล่/ค่าแรง) */}
                        <td>
                            <div className="flex items-center justify-center gap-2">
                                <label className="flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 select-none">
                                    <input
                                        type="checkbox"
                                        checked={r.warrantyParts}
                                        onChange={e => updateRow(r.id, { warrantyParts: e.target.checked })}
                                        className="h-3 w-3 accent-[#c8102e]"
                                    />
                                    <span>อะไหล่</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 select-none">
                                    <input
                                        type="checkbox"
                                        checked={r.warrantyLabor}
                                        onChange={e => updateRow(r.id, { warrantyLabor: e.target.checked })}
                                        className="h-3 w-3 accent-[#c8102e]"
                                    />
                                    <span>ค่าแรง</span>
                                </label>
                            </div>
                        </td>

                        {/* ราคาขายคำนวณสุทธิ */}
                        <td className="text-right font-black text-slate-900 tabular-nums pr-2">
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

            {/* V2.0 Global Cost-Plus Summary & Overrides */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Discount section */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ส่วนลดพิเศษ & เหตุผล (Discount & Promotion)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">จำนวนส่วนลด (บาท)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#c8102e] bg-white text-slate-800 font-semibold"
                                    value={discountAmt}
                                    onChange={e => setDiscountAmt(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">เหตุผลส่วนลด / โปรโมชั่น</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#c8102e] bg-white text-slate-800"
                                    value={discountReason}
                                    onChange={e => setDiscountReason(e.target.value)}
                                    placeholder="เช่น ลูกค้า VIP / แคมเปญวันเกิด"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Admin Bypass Creds (Visible only if low margin exists) */}
                    {rows.some(r => r.desc.trim() !== "" && r.marginPercent < defaultFloor) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                                <span>⚠️ มีรายการที่ Margin ต่ำกว่าเกณฑ์ขั้นต่ำ ({defaultFloor}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="bypassCheck"
                                    checked={bypassAdmin}
                                    onChange={e => setBypassAdmin(e.target.checked)}
                                    className="rounded border-slate-300 text-[#c8102e] focus:ring-[#c8102e] h-4 w-4"
                                />
                                <label htmlFor="bypassCheck" className="text-xs text-red-800 font-bold cursor-pointer">ขอยกเว้นและอนุมัติโดยสิทธิ์ผู้ดูแลระบบ (Admin Bypass)</label>
                            </div>
                            {bypassAdmin && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <input
                                        type="text"
                                        className="px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                                        placeholder="Username ผู้ดูแลระบบ"
                                        value={adminUser}
                                        onChange={e => setAdminUser(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        className="px-2.5 py-1 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                                        placeholder="รหัสผ่านผู้ดูแลระบบ"
                                        value={adminPass}
                                        onChange={e => setAdminPass(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* รวมค่าอะไหล่ / ค่าแรง / รวมสุทธิ */}
            <div className="flex flex-wrap justify-end gap-3 pt-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                    <div className="text-xs text-slate-500 font-semibold">ค่าเปิดเครื่องที่ชำระแล้ว (หักออก)</div>
                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                        {money(ticketDiagnosticFee)} บาท
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                    <div className="text-xs text-slate-500 font-semibold">ส่วนลดใบเสนอราคา</div>
                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                        {money(parseFloat(discountAmt) || 0)} บาท
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                    <div className="text-xs text-slate-500 font-semibold">ยอดเสนอราคาก่อนภาษี</div>
                    <div className="text-sm font-bold tabular-nums text-slate-900">
                        {money(Math.max(0, grandTotal - ticketDiagnosticFee - (parseFloat(discountAmt) || 0)))} บาท
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[130px]">
                    <div className="text-xs text-slate-500 font-semibold">ภาษีมูลค่าเพิ่ม (VAT 7%)</div>
                    <div className="text-sm font-bold tabular-nums text-slate-950">
                        {money(Math.max(0, grandTotal - ticketDiagnosticFee - (parseFloat(discountAmt) || 0)) * 0.07)} บาท
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white px-5 py-2.5 text-right min-w-[170px] shadow-sm">
                    <div className="text-xs text-slate-350 font-black">ยอดสุทธิที่เสนอลูกค้า (Net Price)</div>
                    <div className="text-xl font-black tabular-nums text-white">
                        {money(Math.max(0, grandTotal - ticketDiagnosticFee - (parseFloat(discountAmt) || 0)) * 1.07)} บาท
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
