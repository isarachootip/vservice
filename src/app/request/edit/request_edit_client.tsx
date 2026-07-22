"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

type Warranty = "in" | "out" | null;
type Errors = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    productType: string;
    brand: string;
    qty: string;
    warranty: string;
    warrantyNo: string;
}>;

export default function RequestEditPage() {
    const sp = useSearchParams();
    const id = sp.get("id");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");

    const [productType, setProductType] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [serial, setSerial] = useState("");
    const [qty, setQty] = useState<number | "">("");

    const [warranty, setWarranty] = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const inputClass = (hasError?: boolean) =>
        `block w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-800 transition shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            hasError
                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                : "border-slate-300 hover:border-slate-400 focus:ring-red-500/20 focus:border-[#c8102e]"
        }`;

    const Req = () => <span className="text-red-600 font-bold ml-1">*</span>;

    // --- load data ---
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");

                const r = data.request;
                const [fn = "", ln = ""] = String(r.customer_name || "").split(" ", 2);
                if (!alive) return;

                setFirstName(fn);
                setLastName(ln);
                setAddress(r.address ?? "");
                setPhone(r.phone ?? "");

                const it = r.item || {};
                setProductType(it.product_type ?? "");
                setBrand(it.brand ?? "");
                setModel(it.model ?? "");
                setSerial(it.serial_no ?? "");
                setQty(typeof it.qty === "number" ? it.qty : "");
                setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
                setWarrantyNo(it.warranty_no ?? "");
            } catch (e) {
                alert((e as Error).message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]);

    const validate = (): Errors => {
        const next: Errors = {};
        if (!firstName.trim()) next.firstName = "กรุณากรอกชื่อ";
        if (!lastName.trim()) next.lastName = "กรุณากรอกนามสกุล";
        if (!phone.trim()) next.phone = "กรุณากรอกโทรศัพท์";
        if (!productType.trim()) next.productType = "กรุณากรอกประเภทสินค้า";
        if (!brand.trim()) next.brand = "กรุณากรอกยี่ห้อ";
        if (!qty || Number(qty) <= 0) next.qty = "กรุณาระบุจำนวน (มากกว่า 0)";
        if (!warranty) next.warranty = "กรุณาเลือกสถานะรับประกัน";
        if (warranty === "in" && !warrantyNo.trim()) next.warrantyNo = "กรุณากรอกเลขที่ใบประกัน";
        return next;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const nextErrors = validate();
        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const payload = {
            customer: { firstName, lastName, address, phone },
            product: { productType, brand, model, serial, qty: qty || 0 },
            warranty: { status: warranty, warrantyNo: warranty === "in" ? warrantyNo : undefined },
        };

        try {
            setSaving(true);
            const res = await fetch(`/api/request/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");

            alert("บันทึกสำเร็จ");
            history.back();
        } catch (err) {
            alert((err as Error).message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-5xl mx-auto py-12 px-4 flex flex-col items-center justify-center space-y-3">
                <span className="loading loading-spinner loading-lg text-[#c8102e]"></span>
                <p className="text-sm font-semibold text-slate-600">กำลังโหลดข้อมูลใบแจ้งซ่อม...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-6 px-4 pb-28 select-none">
            {/* Header Title */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                        แก้ไขใบแจ้งซ่อม (Edit Repair Ticket #{id})
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        ปรับปรุงแก้ไขรายละเอียดข้อมูลลูกค้า สินค้า หรือสถานะประกัน
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* SECTION 1: CUSTOMER DETAILS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                            👤 รายละเอียดลูกค้า (Customer Details)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ<Req /></label>
                            <input
                                className={inputClass(!!errors.firstName)}
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="ระบุชื่อจริง"
                            />
                            {errors.firstName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.firstName}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">นามสกุล<Req /></label>
                            <input
                                className={inputClass(!!errors.lastName)}
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="ระบุนามสกุล"
                            />
                            {errors.lastName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.lastName}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์<Req /></label>
                            <input
                                className={inputClass(!!errors.phone)}
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="0812345678"
                            />
                            {errors.phone && <p className="text-red-600 text-xs mt-1 font-medium">{errors.phone}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">ที่อยู่ลูกค้า</label>
                        <textarea
                            className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 transition shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#c8102e] h-20 resize-none"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="ระบุที่อยู่จัดส่ง / ออกใบกำกับภาษี"
                        />
                    </div>
                </div>

                {/* SECTION 2: PRODUCT & WARRANTY DETAILS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                            📦 ข้อมูลสินค้า และการรับประกัน (Product & Warranty)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทสินค้า<Req /></label>
                            <input
                                className={inputClass(!!errors.productType)}
                                value={productType}
                                onChange={e => setProductType(e.target.value)}
                                placeholder="ระบุประเภทสินค้า"
                            />
                            {errors.productType && <p className="text-red-600 text-xs mt-1 font-medium">{errors.productType}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ยี่ห้อ<Req /></label>
                            <input
                                className={inputClass(!!errors.brand)}
                                value={brand}
                                onChange={e => setBrand(e.target.value)}
                                placeholder="ระบุยี่ห้อ"
                            />
                            {errors.brand && <p className="text-red-600 text-xs mt-1 font-medium">{errors.brand}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">รุ่น / Model</label>
                            <input
                                className={inputClass()}
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                placeholder="ระบุรุ่นสินค้า"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">เลขเครื่อง (Serial Number)</label>
                            <input
                                className={inputClass()}
                                value={serial}
                                onChange={e => setSerial(e.target.value)}
                                placeholder="ระบุเลข Serial"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวน<Req /></label>
                            <input
                                id="qty"
                                type="number"
                                min={1}
                                className={inputClass(!!errors.qty)}
                                value={qty}
                                onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="ระบุจำนวน"
                            />
                            {errors.qty && <p className="text-red-600 text-xs mt-1 font-medium">{errors.qty}</p>}
                        </div>
                    </div>

                    {/* Warranty choices */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                        <label className="block text-xs font-bold text-slate-700">การรับประกัน (Warranty Status)<Req /></label>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                            <button
                                type="button"
                                onClick={() => setWarranty("in")}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                    warranty === "in"
                                        ? "bg-red-50 border-[#c8102e] text-[#c8102e] font-extrabold ring-2 ring-red-500/20"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                                }`}
                            >
                                <span className="text-xs">🛡️ อยู่ในประกัน</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setWarranty("out")}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                    warranty === "out"
                                        ? "bg-red-50 border-[#c8102e] text-[#c8102e] font-extrabold ring-2 ring-red-500/20"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                                }`}
                            >
                                <span className="text-xs">⚠️ ไม่อยู่ในประกัน</span>
                            </button>
                        </div>
                        {errors.warranty && <p className="text-red-600 text-xs mt-1 font-medium">{errors.warranty}</p>}

                        {warranty === "in" && (
                            <div className="mt-2 max-w-md animate-fadeIn">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    เลขที่ใบประกัน<Req />
                                </label>
                                <input
                                    className={inputClass(!!errors.warrantyNo)}
                                    value={warrantyNo}
                                    onChange={e => setWarrantyNo(e.target.value)}
                                    placeholder="ระบุเลขที่รับประกัน"
                                />
                                {errors.warrantyNo && <p className="text-red-600 text-xs mt-1 font-medium">{errors.warrantyNo}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                    <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
                        <button
                            type="button"
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            onClick={() => history.back()}
                        >
                            ย้อนกลับ
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 rounded-xl text-xs font-bold bg-[#c8102e] hover:bg-[#b00d25] text-white shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="loading loading-spinner loading-xs text-white"></span>
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <span>บันทึกการแก้ไข</span>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
