"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

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

export default function RequestPage() {
    //* useState เป็นตัว render ค่าใน input แบบอัพเดทตามทันทีที่มีการเปลี่ยน
    //? ข้อมูลลูกค้า
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName]  = useState("");
    const [address, setAddress]    = useState("");
    const [phone, setPhone]        = useState("");

    //? ข้อมูลสินค้า
    const [productType, setProductType] = useState("");
    const [brand, setBrand]             = useState("");
    const [model, setModel]             = useState("");
    const [serial, setSerial]           = useState("");
    const [qty, setQty]                 = useState<number | "">("");

    //? ข้อมูลประกัน
    const [warranty, setWarranty]       = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo]   = useState("");

    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const nextErrors: Errors = {};

        if (!firstName.trim())   nextErrors.firstName   = "กรุณากรอกชื่อ";
        if (!lastName.trim())    nextErrors.lastName    = "กรุณากรอกนามสกุล";
        if (!phone.trim())       nextErrors.phone       = "กรุณากรอกโทรศัพท์";
        if (!productType.trim()) nextErrors.productType = "กรุณากรอกประเภทสินค้า";
        if (!brand.trim())       nextErrors.brand       = "กรุณากรอกยี่ห้อ";
        if (!qty || Number(qty) <= 0) nextErrors.qty    = "กรุณาระบุจำนวน (มากกว่า 0)";
        if (!warranty)           nextErrors.warranty    = "กรุณาเลือกสถานะการรับประกัน";
        if (warranty === "in" && !warrantyNo.trim()) nextErrors.warrantyNo = "กรุณากรอกเลขที่ใบประกัน";

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
        console.log("SUBMIT :", payload);
        alert("บันทึกแบบฟอร์มเรียบร้อย (mock)\nดู payload ใน console");

        try {
            const res = await fetch("/api/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
            alert(data?.message || "บันทึกไม่สำเร็จ");
            return;
            }

            alert("บันทึกสำเร็จ เลขที่ใบแจ้ง : " + (data.requestNo ?? data.id));
            router.push('/status')
            // router.push(`/status?q=${encodeURIComponent(data.requestNo ?? data.id)}`);
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    }

    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เปิดใบแจ้งซ่อม
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-8">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดลูกค้า</legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="form-label">ชื่อ<Req /></label>
                    <input
                    id="firstName"
                    className={inputClass(!!errors.firstName)}
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="ชื่อ"
                    />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                    <label htmlFor="lastName" className="form-label">นามสกุล<Req /></label>
                    <input
                    id="lastName"
                    className={inputClass(!!errors.lastName)}
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                </div>
                </div>

                <div>
                <label htmlFor="address" className="form-label">ที่อยู่</label>
                <textarea
                    id="address"
                    className="input-base min-h-24"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                />
                </div>

                <div>
                <label htmlFor="phone" className="form-label">โทรศัพท์<Req /></label>
                <input
                    id="phone"
                    className={inputClass(!!errors.phone)}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="0812345678"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="productType" className="form-label">ประเภทสินค้า<Req /></label>
                    <input
                    id="productType"
                    className={inputClass(!!errors.productType)}
                    value={productType}
                    onChange={e => setProductType(e.target.value)}
                    />
                    {errors.productType && <p className="text-red-600 text-sm mt-1">{errors.productType}</p>}
                </div>

                <div>
                    <label htmlFor="brand" className="form-label">ยี่ห้อ<Req /></label>
                    <input
                    id="brand"
                    className={inputClass(!!errors.brand)}
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    />
                    {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand}</p>}
                </div>

                <div>
                    <label htmlFor="model" className="form-label">รุ่น</label>
                    <input
                    id="model"
                    className="input-base"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="serial" className="form-label">เลขเครื่อง (Serial)</label>
                    <input
                    id="serial"
                    className="input-base"
                    value={serial}
                    onChange={e => setSerial(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="qty" className="form-label">จำนวน<Req /></label>
                    <input
                    id="qty"
                    type="number"
                    min={1}
                    className={inputClass(!!errors.qty)}
                    value={qty}
                    onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                    {errors.qty && <p className="text-red-600 text-sm mt-1">{errors.qty}</p>}
                </div>
                </div>

                <div className="space-y-2">
                <span className="form-label">ปัญหาที่เกิด<Req /></span>
                <div className="flex flex-wrap items-center gap-6">
                    <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="warranty"
                        value="in"
                        checked={warranty === "in"}
                        onChange={() => setWarranty("in")}
                    />
                    <span>อยู่ในประกัน</span>
                    </label>

                    <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="warranty"
                        value="out"
                        checked={warranty === "out"}
                        onChange={() => setWarranty("out")}
                    />
                    <span>ไม่อยู่ในประกัน</span>
                    </label>
                </div>
                {errors.warranty && <p className="text-red-600 text-sm">{errors.warranty}</p>}

                {warranty === "in" && (
                    <div className="pt-2">
                    <label htmlFor="warrantyNo" className="form-label">เลขที่ใบประกัน<Req /></label>
                    <input
                        id="warrantyNo"
                        className={inputClass(!!errors.warrantyNo)}
                        value={warrantyNo}
                        onChange={e => setWarrantyNo(e.target.value)}
                    />
                    {errors.warrantyNo && <p className="text-red-600 text-sm mt-1">{errors.warrantyNo}</p>}
                    </div>
                )}
                </div>
            </fieldset>

            <div className="flex items-center justify-end gap-3">
                <button
                type="button"
                className="btn-back"
                onClick={() => history.back()}
                >
                ย้อนกลับ
                </button>

                <button
                type="submit"
                className="btn-submit"
                >
                บันทึก
                </button>
            </div>
            </form>
        </div>
        </section>
    );
}
