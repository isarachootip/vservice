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
    const id = sp.get("id") 

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    const [productType, setProductType] = useState("");
    const [brand,       setBrand]       = useState("");
    const [model,       setModel]       = useState("");
    const [serial,      setSerial]      = useState("");
    const [qty,         setQty]         = useState<number | "">("");

    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    const [errors,  setErrors]  = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);

    const inputClass = (err?: boolean) =>
        `input-base ${err ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;

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
        if (!firstName.trim())   next.firstName   = "กรุณากรอกชื่อ";
        if (!lastName.trim())    next.lastName    = "กรุณากรอกนามสกุล";
        if (!phone.trim())       next.phone       = "กรุณากรอกโทรศัพท์";
        if (!productType.trim()) next.productType = "กรุณากรอกประเภทสินค้า";
        if (!brand.trim())       next.brand       = "กรุณากรอกยี่ห้อ";
        if (!qty || Number(qty) <= 0) next.qty    = "กรุณาระบุจำนวน (มากกว่า 0)";
        if (!warranty)           next.warranty    = "กรุณาเลือกสถานะรับประกัน";
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
        product:  { productType, brand, model, serial, qty: qty || 0 },
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
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            แก้ไขใบแจ้งซ่อม
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-8">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดลูกค้า</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="form-label">ชื่อ<Req/></label>
                    <input className={inputClass(!!errors.firstName)} value={firstName} onChange={e=>setFirstName(e.target.value)} />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                    <label className="form-label">นามสกุล<Req/></label>
                    <input className={inputClass(!!errors.lastName)} value={lastName} onChange={e=>setLastName(e.target.value)} />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                </div>
                </div>

                <div>
                <label className="form-label">ที่อยู่</label>
                <textarea className="input-base min-h-24" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>

                <div>
                <label className="form-label">โทรศัพท์<Req/></label>
                <input className={inputClass(!!errors.phone)} value={phone} onChange={e=>setPhone(e.target.value)} />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="form-label">ประเภทสินค้า<Req/></label>
                    <input className={inputClass(!!errors.productType)} value={productType} onChange={e=>setProductType(e.target.value)} />
                    {errors.productType && <p className="text-red-600 text-sm mt-1">{errors.productType}</p>}
                </div>
                <div>
                    <label className="form-label">ยี่ห้อ<Req/></label>
                    <input className={inputClass(!!errors.brand)} value={brand} onChange={e=>setBrand(e.target.value)} />
                    {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand}</p>}
                </div>
                <div>
                    <label className="form-label">รุ่น</label>
                    <input className="input-base" value={model} onChange={e=>setModel(e.target.value)} />
                </div>
                <div>
                    <label className="form-label">เลขเครื่อง (Serial)</label>
                    <input className="input-base" value={serial} onChange={e=>setSerial(e.target.value)} />
                </div>
                <div>
                    <label className="form-label">จำนวน<Req/></label>
                    <input
                    id="qty" type="number" min={1}
                    className={inputClass(!!errors.qty)}
                    value={qty}
                    onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    {errors.qty && <p className="text-red-600 text-sm mt-1">{errors.qty}</p>}
                </div>
                </div>

                <div className="space-y-2">
                <span className="form-label">ปัญหาที่เกิด<Req/></span>
                <div className="flex flex-wrap items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                    <input type="radio" name="warranty" value="in" checked={warranty === "in"} onChange={() => setWarranty("in")} />
                    <span>อยู่ในประกัน</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                    <input type="radio" name="warranty" value="out" checked={warranty === "out"} onChange={() => setWarranty("out")} />
                    <span>ไม่อยู่ในประกัน</span>
                    </label>
                </div>
                {errors.warranty && <p className="text-red-600 text-sm">{errors.warranty}</p>}

                {warranty === "in" && (
                    <div className="pt-2">
                    <label className="form-label">เลขที่ใบประกัน<Req/></label>
                    <input className={inputClass(!!errors.warrantyNo)} value={warrantyNo} onChange={e=>setWarrantyNo(e.target.value)} />
                    {errors.warrantyNo && <p className="text-red-600 text-sm mt-1">{errors.warrantyNo}</p>}
                    </div>
                )}
                </div>
            </fieldset>

            <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn-back" onClick={() => history.back()}>
                ย้อนกลับ
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>
            </form>
        </div>
        </section>
    );
}
