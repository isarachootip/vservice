"use client";

import { use, useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "react-datepicker";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    productType: string;
    brand: string;
    qty: string;
    sku: string;
    barcode: string;
    warranty: string;
    warrantyNo: string;
    issue: string;
    receiveFromUserDt: string;
    serialAttachments?: string;
    picAttachments?: string;
}>;

export default function RequestAddPage({ searchParams }: { searchParams: Promise<{ internal: string }> }) {
    //* useState เป็นตัว render ค่าใน input แบบอัพเดทตามทันทีที่มีการเปลี่ยน
    const { internal } = use(searchParams);
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
    const [issue, setIssue]             = useState("");
    const [symptoms, setSymptoms]       = useState<any[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);
    const [qty, setQty]                 = useState<number | "">("");
    const [sku, setSku]                 = useState<number | "">("");
    const [skuFlg, setSkuFlg]           = useState(true);
    const [skuLoading, setSkuLoading] = useState(false);
    const [skuError, setSkuError] = useState<string | null>(null);
    const [barcode, setBarcode]         = useState("");
    const [serialAttachments, setSerialAttachments] = useState<File[]>([]);
    const [picAttachments, setPicAttachments] = useState<File[]>([]);
    const serialFileInputRef = useRef<HTMLInputElement | null>(null);
    const picFileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetch("/api/maintain/symptoms")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setSymptoms(data.symptoms || []);
                }
            })
            .catch(console.error);
    }, []);

    //? ข้อมูลประกัน
    const [warranty, setWarranty]       = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo]   = useState("");

    const internalFlg = internal === "Y" ? "Y" : "N";
    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    //? class list (commodity)
    const [classList, setClassList] = useState<string[]>([]);
    const [classLoading, setClassLoading] = useState(false);
    const [classError, setClassError] = useState<string | null>(null);

    //? brand list (commodity)
    const [brandList, setBrandList] = useState<string[]>([]);
    const [brandLoading, setBrandLoading] = useState(false);
    const [brandError, setBrandError] = useState<string | null>(null);

    //*for productType
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            setClassLoading(true);
            setClassError(null);
            try {
                const res = await fetch("/api/commodity/class", {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const json = await res.json();

                setClassList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                    setClassError("โหลดรายการประเภทสินค้าไม่สำเร็จ");
            } finally {
                setClassLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    //*for brand
    useEffect(() => {
        if (!productType?.trim()) {
            setBrandList([]);
            return;
        }

        const controller = new AbortController();

        const t = setTimeout(async () => {
            setBrandLoading(true);
            setBrandError(null);

            try {
                const res = await fetch(
                    `/api/commodity/brand?class=${encodeURIComponent(productType)}`,
                    { signal: controller.signal, cache: "no-store" }
                );
                const json = await res.json();
                setBrandList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                    setBrandError("โหลดรายการยี่ห้อไม่สำเร็จ");
                    setBrandList([]);
            } finally {
                setBrandLoading(false);
            }
        }, 200); 

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [productType]);

    useEffect(() => {
        if (!skuFlg) {
            setSkuError(null);
            return;
        }

        if (!sku || Number(sku) <= 0) {
            setBarcode("");
            setProductType("")
            setBrand("");
            setModel("");
            setSkuError(null);
            return;
        }

        const t = setTimeout(async () => {
            const controller = new AbortController();
            setSkuLoading(true);
            setSkuError(null);

            try {
                const res = await fetch(`/api/commodity/lookup?sku=${encodeURIComponent(sku)}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });

                const json = await res.json();
                const found = json?.data;

                if (!found) {
                    setBarcode("");
                    setProductType("")
                    setBrand("");
                    setModel("");
                    setSkuError("ไม่พบ SKU ในระบบ");
                    return;
                }

                setBarcode(found.bar_code ?? "");
                setProductType(found.class_name ?? "");
                setBrand(found.brand ?? "");
                setModel(found.sku_name ?? "");
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                alert("lookup sku error");
            } finally {
                setSkuLoading(false);
            }
            return () => controller.abort();
        }, 300);

        return () => clearTimeout(t);
    }, [sku, skuFlg]);

    const toYMD = (v: unknown): string | null => {
        if (!v) return null;
        const d = v instanceof Date ? v : new Date(String(v));
        if (Number.isNaN(d.getTime())) return null;

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const nextErrors: Errors = {};
        if (submitting) return;

        if (!firstName.trim())   nextErrors.firstName   = "กรุณากรอกชื่อ";
        if (!lastName.trim())    nextErrors.lastName    = "กรุณากรอกนามสกุล";
        if (!phone.trim())       nextErrors.phone       = "กรุณากรอกโทรศัพท์";
        if (!qty || Number(qty) <= 0) nextErrors.qty    = "กรุณาระบุจำนวน";
        if (skuFlg) {
            if (!sku || Number(sku) <= 0) nextErrors.sku = "กรุณากรอก SKU";
        } else {
            if (!productType.trim()) nextErrors.productType = "กรุณากรอกประเภทสินค้า";
            if (!brand.trim())       nextErrors.brand       = "กรุณากรอกยี่ห้อ";
        }
        if (!barcode.trim())     nextErrors.barcode     = "กรุณากรอก Barcode";

        if (!receiveFromUserDt)     nextErrors.receiveFromUserDt    = "กรุณากรอกวันที่รับสินค้าจากลูกค้า";
        if (!warranty)     nextErrors.warranty    = "กรุณาเลือกสถานะการรับประกัน";
        if (warranty === "in" && !warrantyNo.trim()) {
            nextErrors.warrantyNo = "กรุณากรอกเลขที่รับประกัน";
        }

        if (!selectedSymptom) {
            nextErrors.issue = "กรุณาเลือกอาการเสีย";
        } else if (selectedSymptom === "other" && !issue.trim()) {
            nextErrors.issue = "กรุณากรอกรายละเอียดอาการเสีย";
        }
        
        if (!serialAttachments || serialAttachments.length === 0) nextErrors.serialAttachments = "กรุณาแนบไฟล์รูป Serial Number";
        if (!picAttachments || picAttachments.length === 0) nextErrors.picAttachments = "กรุณาแนบไฟล์";

        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        //* กรณีสินค้าไม่ได้อยู่ใน stock dummy sku
        let skuToSend: number;
        let skuFlgToSend: string;
        if (!skuFlg) {
            skuToSend = 999999999999;
            skuFlgToSend = "N"
        } else {
            skuToSend = Number(sku);
            skuFlgToSend = "Y"
        }

        //* แปลง date
        const receiveFromUserDtStr = toYMD(receiveFromUserDt);

        //* New
        const formData = new FormData();
        formData.append("customer", JSON.stringify({
            firstName,
            lastName,
            address,
            phone,
            receiveFromUserDtStr,
        }));
        formData.append("product", JSON.stringify({
            productType,
            brand,
            model,
            serial,
            qty: qty || 0,
            skuFlg: skuFlgToSend,
            sku: skuToSend,
            barcode,
            issue: selectedSymptom === "other" ? issue : (selectedSymptom + (issue.trim() ? ` (${issue.trim()})` : "")),
        }));
        formData.append("warranty", JSON.stringify({
            status: warranty,
            warrantyNo: warranty === "in" ? warrantyNo : null,
        }));
        //* flag check แจ้งซ่อมภายใน  
        formData.append("internalFlg", internalFlg);
        serialAttachments.forEach((file) => {
            formData.append("serialAttachments", file);
        });
        picAttachments.forEach((file) => {
            formData.append("picAttachments", file);
        });

        try {
            setSubmitting(true);
            const res = await fetch("/api/request/add", {
                method: "POST",
                body: formData,   
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.message || "บันทึกไม่สำเร็จ");
                setSubmitting(false);
                return;
            }
            alert("บันทึกสำเร็จ เลขที่ใบแจ้ง : " + (data.requestNo ?? data.id));
            router.push('/status');
        } catch {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            setSubmitting(false);
        }
    };

    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;

    return (
        <div className="w-full max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-between select-none">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-grow flex flex-col justify-between overflow-hidden">
                <form onSubmit={onSubmit} className="flex flex-col justify-between h-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1">
                        {/* Column 1: Customer & Basic Product */}
                        <div className="space-y-3.5">
                            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-1.5 h-3 bg-violet-600 rounded"></span>
                                รายละเอียดลูกค้า
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="firstName" className="block text-[11px] font-semibold text-slate-500 mb-1">ชื่อจริง<Req /></label>
                                    <input
                                        id="firstName"
                                        className={inputClass(!!errors.firstName)}
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="ระบุชื่อจริง"
                                    />
                                    {errors.firstName && <p className="text-red-600 text-[10px] mt-0.5">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-[11px] font-semibold text-slate-500 mb-1">นามสกุล<Req /></label>
                                    <input
                                        id="lastName"
                                        className={inputClass(!!errors.lastName)}
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="ระบุนามสกุล"
                                    />
                                    {errors.lastName && <p className="text-red-600 text-[10px] mt-0.5">{errors.lastName}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 items-end">
                                <div className="col-span-2">
                                    <label htmlFor="phone" className="block text-[11px] font-semibold text-slate-500 mb-1">เบอร์โทรศัพท์<Req /></label>
                                    <input
                                        id="phone"
                                        className={inputClass(!!errors.phone)}
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        inputMode="tel"
                                        placeholder="0812345678"
                                    />
                                    {errors.phone && <p className="text-red-600 text-[10px] mt-0.5">{errors.phone}</p>}
                                </div>
                                <div className="flex items-center pb-2">
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={skuFlg}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setSkuFlg(checked);
                                                if (!checked) {
                                                    setSku("");
                                                    setErrors(prev => ({ ...prev, sku: undefined }));
                                                }
                                            }}
                                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-300"
                                        />
                                        <span className="text-[11px] font-semibold text-slate-700">สินค้าในระบบ</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-[11px] font-semibold text-slate-500 mb-1">ที่อยู่ติดต่อ</label>
                                <textarea
                                    id="address"
                                    className="input-base text-xs py-1 h-12 resize-none"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด"
                                />
                            </div>

                            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 pt-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-1.5 h-3 bg-violet-600 rounded"></span>
                                รายละเอียดสินค้า
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="sku" className="block text-[11px] font-semibold text-slate-500 mb-1">SKU<Req /></label>
                                    <input
                                        id="sku"
                                        type="number"
                                        className={inputClass(!!errors.sku)}
                                        value={sku}
                                        onChange={(e) =>
                                            setSku(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        disabled={!skuFlg}
                                        placeholder="ระบุรหัส SKU"
                                    />
                                    {errors.sku && <p className="text-red-600 text-[10px] mt-0.5">{errors.sku}</p>}
                                    {skuLoading && <p className="text-[10px] text-slate-400 mt-0.5">กำลังค้นหา...</p>}
                                    {skuError && <p className="text-[10px] text-red-600 mt-0.5">{skuError}</p>}
                                </div>
                                <div>
                                    <label htmlFor="barcode" className="block text-[11px] font-semibold text-slate-500 mb-1">Barcode<Req /></label>
                                    <input
                                        id="barcode"
                                        className={inputClass(!!errors.barcode)}
                                        value={barcode}
                                        onChange={e => setBarcode(e.target.value)}
                                        disabled={skuFlg}
                                        placeholder="ระบุบาร์โค้ด"
                                    />
                                    {errors.barcode && <p className="text-red-600 text-[10px] mt-0.5">{errors.barcode}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ประเภทสินค้า<Req /></label>
                                    <select
                                        className="input-base text-xs py-1"
                                        value={productType}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setProductType(v);
                                            setBrand("");
                                            setBrandList([]);
                                        }}
                                        disabled={skuFlg}
                                    >
                                        <option value="">-- เลือกประเภท --</option>
                                        {classList.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">ยี่ห้อ</label>
                                    <select
                                        className="input-base text-xs py-1"
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        disabled={skuFlg || !productType || brandList.length === 0}
                                    >
                                        <option value="">-- เลือกยี่ห้อ --</option>
                                        {brandList.map((s) => (
                                            <option key={`${productType}-${s}`} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Specs, warranty, symptom */}
                        <div className="space-y-3.5">
                            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="w-1.5 h-3 bg-violet-600 rounded"></span>
                                การรับประกัน & อาการเสีย
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="model" className="block text-[11px] font-semibold text-slate-500 mb-1">รุ่นสินค้า</label>
                                    <input
                                        id="model"
                                        className="input-base text-xs py-1"
                                        value={model}
                                        onChange={e => setModel(e.target.value)}
                                        disabled={skuFlg}
                                        placeholder="ระบุรุ่นสินค้า"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="serial" className="block text-[11px] font-semibold text-slate-500 mb-1">Serial Number (เลขเครื่อง)</label>
                                    <input
                                        id="serial"
                                        className="input-base text-xs py-1"
                                        value={serial}
                                        onChange={e => setSerial(e.target.value)}
                                        placeholder="ระบุเลข Serial"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="qty" className="block text-[11px] font-semibold text-slate-500 mb-1">จำนวน<Req /></label>
                                    <input
                                        id="qty"
                                        type="number"
                                        min={1}
                                        className={inputClass(!!errors.qty)}
                                        value={qty}
                                        onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                                    />
                                    {errors.qty && <p className="text-red-600 text-[10px] mt-0.5">{errors.qty}</p>}
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">วันที่รับเครื่อง<Req /></label>
                                    <DatePicker
                                        id="receiveFromUserDt"
                                        selected={receiveFromUserDt}
                                        onChange={(date) => setReceiveFromUserDt(date)}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="วว/ดด/ปป"
                                        className={inputClass(!!errors.receiveFromUserDt)}
                                    />
                                    {errors.receiveFromUserDt && <p className="text-red-600 text-[10px] mt-0.5">{errors.receiveFromUserDt}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">การรับประกัน<Req /></label>
                                <div className="flex items-center gap-4 py-1 text-xs">
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="warranty"
                                            value="in"
                                            checked={warranty === "in"}
                                            onChange={() => setWarranty("in")}
                                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300"
                                        />
                                        <span className="font-semibold text-slate-700">อยู่ในประกัน</span>
                                    </label>
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="warranty"
                                            value="out"
                                            checked={warranty === "out"}
                                            onChange={() => setWarranty("out")}
                                            className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300"
                                        />
                                        <span className="font-semibold text-slate-700">ไม่อยู่ในประกัน</span>
                                    </label>
                                </div>
                                {errors.warranty && <p className="text-red-600 text-[10px] mt-0.5">{errors.warranty}</p>}
                                
                                {warranty === "in" && (
                                    <div className="mt-2">
                                        <label htmlFor="warrantyNo" className="block text-[11px] font-semibold text-slate-500 mb-1">เลขที่ใบประกัน<Req /></label>
                                        <input
                                            id="warrantyNo"
                                            className={inputClass(!!errors.warrantyNo)}
                                            value={warrantyNo}
                                            onChange={e => setWarrantyNo(e.target.value)}
                                            placeholder="ระบุเลขที่รับประกัน"
                                        />
                                        {errors.warrantyNo && <p className="text-red-600 text-[10px] mt-0.5">{errors.warrantyNo}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <label htmlFor="issueSymptom" className="block text-[11px] font-semibold text-slate-500 mb-1">อาการเสียที่พบ (จากระบบ)<Req /></label>
                                    <select
                                        id="issueSymptom"
                                        className="input-base text-xs py-1.5 bg-white border border-slate-300 rounded-lg w-full"
                                        value={selectedSymptom}
                                        onChange={e => setSelectedSymptom(e.target.value)}
                                    >
                                        <option value="">-- เลือกอาการเสีย --</option>
                                        {symptoms.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                        <option value="other">อื่นๆ (ระบุเอง)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="issue" className="block text-[11px] font-semibold text-slate-500 mb-1">
                                        {selectedSymptom === "other" ? "รายละเอียดอาการเสีย *" : "รายละเอียดอาการเสียเพิ่มเติม (ถ้ามี)"}
                                    </label>
                                    <textarea
                                        id="issue"
                                        className="input-base text-xs py-1 h-12 resize-none w-full"
                                        value={issue}
                                        onChange={e => setIssue(e.target.value)}
                                        placeholder="ระบุรายละเอียดอาการชำรุดเสียหายเพิ่มเติม"
                                    />
                                    {errors.issue && <p className="text-red-600 text-[10px] mt-0.5">{errors.issue}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">รูปถ่าย Serial Number<Req /></label>
                                    <input
                                        ref={serialFileInputRef}
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className={inputClass(!!errors.serialAttachments)}
                                        onChange={(e) => setSerialAttachments(Array.from(e.target.files ?? []))}
                                    />
                                    {errors.serialAttachments && <p className="text-red-600 text-[10px] mt-0.5">{errors.serialAttachments}</p>}
                                    
                                    {serialAttachments.length > 0 && (
                                        <div className="mt-1 text-[9px] text-slate-500 bg-slate-50 border border-slate-100 p-1 rounded-lg max-h-12 overflow-y-auto">
                                            {serialAttachments.map((f, idx) => (
                                                <div key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-1 py-0.5">
                                                    <span className="truncate flex-grow">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSerialAttachments((prev) => {
                                                                const next = prev.filter((_, i) => i !== idx);
                                                                if (next.length === 0 && serialFileInputRef.current) {
                                                                    serialFileInputRef.current.value = "";
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-700 font-bold"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">รูปถ่ายตัวสินค้า<Req /></label>
                                    <input
                                        ref={picFileInputRef}
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        className={inputClass(!!errors.picAttachments)}
                                        onChange={(e) => setPicAttachments(Array.from(e.target.files ?? []))}
                                    />
                                    {errors.picAttachments && <p className="text-red-600 text-[10px] mt-0.5">{errors.picAttachments}</p>}
                                    
                                    {picAttachments.length > 0 && (
                                        <div className="mt-1 text-[9px] text-slate-500 bg-slate-50 border border-slate-100 p-1 rounded-lg max-h-12 overflow-y-auto">
                                            {picAttachments.map((f, idx) => (
                                                <div key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-1 py-0.5">
                                                    <span className="truncate flex-grow">{f.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPicAttachments((prev) => {
                                                                const next = prev.filter((_, i) => i !== idx);
                                                                if (next.length === 0 && picFileInputRef.current) {
                                                                    picFileInputRef.current.value = "";
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        className="text-red-500 hover:text-red-700 font-bold"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 bg-white">
                        <button
                            type="button"
                            className="px-5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            onClick={() => history.back()}
                        >
                            ย้อนกลับ
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-1.5 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow transition"
                            disabled={submitting}
                        >
                            {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
