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
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);
    const [qty, setQty]                 = useState<number | "">("");
    const [sku, setSku]                 = useState<number | "">("");
    const [skuFlg, setSkuFlg]           = useState(false);
    const [skuLoading, setSkuLoading] = useState(false);
    const [skuError, setSkuError] = useState<string | null>(null);
    const [barcode, setBarcode]         = useState("");
    const [serialAttachments, setSerialAttachments] = useState<File[]>([]);
    const [picAttachments, setPicAttachments] = useState<File[]>([]);
    const serialFileInputRef = useRef<HTMLInputElement | null>(null);
    const picFileInputRef = useRef<HTMLInputElement | null>(null);

    // const [attachments, setAttachments] = useState<File[]>([]);
    // const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        if (!productType.trim()) nextErrors.productType = "กรุณากรอกประเภทสินค้า";
        if (!brand.trim())       nextErrors.brand       = "กรุณากรอกยี่ห้อ";
        if (!qty || Number(qty) <= 0) nextErrors.qty    = "กรุณาระบุจำนวน";
        if (skuFlg && (!sku || Number(sku) <= 0)) nextErrors.sku    = "กรุณากรอก SKU";
        if (!barcode.trim())     nextErrors.barcode     = "กรุณากรอก Barcode";

        if (!issue.trim()) nextErrors.issue = "กรุณาระบุอาการที่พบ";
        if (!receiveFromUserDt)     nextErrors.receiveFromUserDt    = "กรุณากรอกวันที่รับสินค้าจากลูกค้า";
        if (!warranty)     nextErrors.warranty    = "กรุณาเลือกสถานะการรับประกัน";
        if (warranty === "in" && !warrantyNo.trim()) nextErrors.warrantyNo = "กรุณากรอกเลขที่ใบประกัน";

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
            skuToSend = 0;
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
            issue,
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
        //* End
        try {
            setSubmitting(true); // ← LOCK THE FORM
            //* New
            const res = await fetch("/api/request/add", {
                method: "POST",
                body: formData,   
            });
            const data = await res.json();
            //* End
            if (!res.ok) {
                alert(data?.message || "บันทึกไม่สำเร็จ");
                return;
            }
            alert("บันทึกสำเร็จ เลขที่ใบแจ้ง : " + (data.requestNo ?? data.id));
            router.push('/status')
        } catch {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            setSubmitting(false)
        }
    }

    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เปิดใบแจ้งซ่อม (CS)
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
                    <label className="inline-flex items-center gap-2">
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
                            />
                        <span className="form-label mb-0">สินค้าอยู่ในระบบ</span>
                    </label>
                    <div />
                    <div>
                        <label htmlFor="sku" className="form-label">
                            SKU<Req />
                        </label>
                        <input
                            id="sku"
                            type="number"
                            className={`${inputClass(!!errors.sku)} w-50`}
                            value={sku}
                            onChange={(e) =>
                                setSku(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            disabled={!skuFlg} 
                        />
                            {errors.sku && (
                                <p className="text-red-600 text-sm mt-1">{errors.sku}</p>
                            )}
                            {skuLoading && <p className="text-xs text-slate-500 mt-1">กำลังค้นหา...</p>}
                            {skuError && <p className="text-xs text-red-600 mt-1">{skuError}</p>}
                    </div>
                    <div>
                        <label htmlFor="barcode" className="form-label">Barcode<Req /></label>
                        <input
                            id="barcode"
                            className={`${inputClass(!!errors.barcode)} w-60`}
                            value={barcode}
                            onChange={e => setBarcode(e.target.value)}
                            disabled={skuFlg} 
                        />
                        {errors.barcode && <p className="text-red-600 text-sm mt-1">{errors.barcode}</p>}
                    </div>
                    <div>
                        <label className="form-label">ประเภทสินค้า<Req /></label>
                        <select
                            className="input-base"
                            value={productType}
                            onChange={(e) => {
                                const v = e.target.value;
                                setProductType(v);
                                setBrand("");
                                setBrandList([]);
                            }}
                            disabled={skuFlg} 
                        >
                            <option value="">-- เลือกประเภทสินค้า --</option>
                            {classList.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">ยี่ห้อ</label>
                        <select
                            className="input-base"
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

                        {!skuFlg && productType && !brandLoading && !brandError && brandList.length === 0 && (
                            <p className="text-slate-500 text-sm mt-1">ไม่พบยี่ห้อในประเภทนี้</p>
                        )}
                        {brandError && <p className="text-red-600 text-sm mt-1">{brandError}</p>}
                    </div>
                    <div>
                        <label htmlFor="model" className="form-label">รุ่น</label>
                        <input
                            id="model"
                            className="input-base"
                            value={model}
                            onChange={e => setModel(e.target.value)}
                            disabled={skuFlg}
                        />
                    </div>
                    <div />                    
                    <div>
                        <label htmlFor="serial" className="form-label">เลขเครื่อง (Serial Number)</label>
                        <input
                            id="serial"
                            className="input-base"
                            value={serial}
                            onChange={e => setSerial(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="form-label">
                            ไฟล์รูป (Serial Number)<Req />
                        </label>

                        <input
                            ref={serialFileInputRef}
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            className={`${inputClass(!!errors.serialAttachments)} w-60`}
                            onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                                setSerialAttachments(files);
                            }}
                        />

                        {errors.serialAttachments && (
                            <p className="text-red-600 text-sm mt-1">{errors.serialAttachments}</p>
                        )}

                        {serialAttachments.length > 0 && (
                            <ul className="mt-2 text-sm text-slate-700 space-y-1">
                                {serialAttachments.map((f, idx) => (
                                    <li
                                        key={`${f.name}-${f.size}`}
                                        className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded"
                                    >
                                    <span className="truncate">{f.name}</span>
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
                                        className="ml-3 text-red-500 hover:text-red-700 text-sm font-bold"
                                    >
                                        ลบ
                                    </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label htmlFor="qty" className="form-label">จำนวน<Req /></label>
                        <input
                            id="qty"
                            type="number"
                            min={1}
                            className={`${inputClass(!!errors.qty)} w-60`}
                            value={qty}
                            onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                        {errors.qty && <p className="text-red-600 text-sm mt-1">{errors.qty}</p>}
                    </div>

                    <div className="flex flex-col">
                        <label className="form-label">
                            วันที่รับสินค้าจากลูกค้า<Req />
                        </label>

                        <DatePicker
                            id="receiveFromUserDt"
                            selected={receiveFromUserDt}
                            onChange={(date) => setReceiveFromUserDt(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="วว/ดด/ปป"
                            className={`${inputClass(!!errors.receiveFromUserDt)} w-60`}
                        />
                            {errors.receiveFromUserDt && <p className="text-red-600 text-sm mt-1">{errors.receiveFromUserDt}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <label htmlFor="issue" className="form-label">อาการที่พบ<Req /></label>
                        <textarea
                            id="issue"
                            className="input-base min-h-24"
                            value={issue}
                            onChange={e => setIssue(e.target.value)}
                            />
                            {errors.issue && <p className="text-red-600 text-sm mt-1">{errors.issue}</p>}
                    </div>

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
                            className={`${inputClass(!!errors.warrantyNo)} w-60`}
                            value={warrantyNo}
                            onChange={e => setWarrantyNo(e.target.value)}
                        />
                        {errors.warrantyNo && <p className="text-red-600 text-sm mt-1">{errors.warrantyNo}</p>}
                        </div>
                    )}
                </div>
                
                <div className="pt-2">
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>

                    <input
                        ref={picFileInputRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.picAttachments)} w-60`}
                        onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                            setPicAttachments(files);
                        }}
                    />

                    {errors.picAttachments && (
                        <p className="text-red-600 text-sm mt-1">{errors.picAttachments}</p>
                    )}

                    {picAttachments.length > 0 && (
                            <ul className="mt-2 text-sm text-slate-700 space-y-1">
                                {picAttachments.map((f, idx) => (
                                    <li
                                    key={`${f.name}-${f.size}`}
                                    className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded"
                                    >
                                    <span className="truncate">{f.name}</span>

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
                                        className="ml-3 text-red-500 hover:text-red-700 text-sm font-bold"
                                    >
                                        ลบ
                                    </button>
                                    </li>
                                ))}
                            </ul>
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
                    disabled={submitting}
                >
                    {submitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
            </div>
            </form>
        </div>
        </section>
    );
}
