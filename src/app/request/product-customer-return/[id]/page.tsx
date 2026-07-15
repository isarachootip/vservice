"use client";

import { use, useEffect, useState, useRef } from "react";
import { DatePicker } from "react-datepicker";
import { SignatureCanvas } from "react-signature-canvas";
import { useRouter } from "next/navigation";

type Errors = Partial<{
    sentName: string;
    customerName : string;
    sentProductReturnDate: string;
    attachments?: string;
}>;

export default function RequestVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [status,   setStatus]   = useState<number | "">("");
    const [updatedUser, setUpdatedUser] = useState("");
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const [customerName, setCustomerName] = useState("");
    const [sentName, setSentName] = useState("");
    const [sentProductReturnDate, setSentProductReturnDate] = useState<Date | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const sigRef = useRef<SignatureCanvas | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");

            //* get current user
            const raw = localStorage.getItem("userInfo");
            if (raw) {
                const u = JSON.parse(raw);
                if (alive) setUpdatedUser(u.user_name);
            }

            const r = data.request;
            const [fn = "", ln = ""] = String(r.customer_name || "").split(" ", 2);
            if (!alive) return;

            setStatus(r.status);

            // setFirstName(fn);
            // setLastName(ln);
            // setAddress(r.address ?? "");
            // setPhone(r.phone ?? "");

            // const it = r.item || {};
            // setProductType(it.product_type ?? "");
            // setBrand(it.brand ?? "");
            // setModel(it.model ?? "");
            // setSerial(it.serial_no ?? "");
            // setQty(typeof it.qty === "number" ? it.qty : "");
            // setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
            // setWarrantyNo(it.warranty_no ?? "");
        } catch (e) {
            alert((e as Error).message);
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => { alive = false; };
    }, [id]);

    const toYMD = (v: Date): string => {
        const d = v instanceof Date ? v : new Date(String(v));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const clearFileInput = () => {
        if (fileRef.current) fileRef.current.value = "";
    };

    const onSave = async () => {

        const nextErrors: Errors = {};
        if (!customerName.trim())   nextErrors.customerName   = "กรุณากรอกชื่อผู้ส่งมอบสินค้าคืน";
        if (!sentName.trim())    nextErrors.sentName    = "กรุณากรอกชื่อผู้รับสินค้าคืน";
        if (!sentProductReturnDate)  nextErrors.sentProductReturnDate    = "กรุณาเลือกวันที่ลูกค้ารับสินค้าคืน";
        if (!attachments || attachments.length === 0) nextErrors.attachments = "กรุณาแนบไฟล์";
        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        let signatureBase64 = "";
        if (sigRef.current && !sigRef.current.isEmpty()) {
            const canvas = sigRef.current.getTrimmedCanvas();

            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;
            const ctx = newCanvas.getContext('2d');

            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
                ctx.drawImage(canvas, 0, 0);
                signatureBase64 = newCanvas.toDataURL("image/jpeg", 0.9);
            }
        }

        try {

            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = statusNum === 236 ? "DC" : "VEN";
            const sentProductReturnDateStr = sentProductReturnDate ? toYMD(sentProductReturnDate) : "";

            const formData = new FormData();
            formData.append("action", "ProductCustomerReturn");
            formData.append("requestId", String(id));
            formData.append("sentName", sentName);
            formData.append("customerName", customerName);
            formData.append("sentProductReturnDate", sentProductReturnDateStr);
            formData.append("updatedUser", updatedUser ?? "");
            formData.append("mode", mode);
            formData.append("signatureSign", signatureBase64);
            
            if (attachments?.length) {
                attachments.forEach((file) => {
                    formData.append("attachments", file);
                });
            }
            const res = await fetch("/api/request/update-product-return", {
                method: "POST",
                body: formData, 
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");

            alert("บันทึกข้อมูลสำเร็จ");
            router.push("/status");
        } catch (e) {
            alert((e as Error).message);
        }
    }

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เพิ่มรายละเอียดการส่งคืนสินค้า (CS)
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">
                    รายละเอียดบันทึกการส่งคืนสินค้าให้ลูกค้า
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sentName" className="form-label">ผู้ส่งมอบสินค้าคืน<Req /></label>
                        <input
                            id="sentName"
                            className={inputClass(!!errors.sentName)}
                            value={sentName}
                            onChange={e => setSentName(e.target.value)}
                        />
                        {errors.sentName && <p className="text-red-600 text-sm mt-1">{errors.sentName}</p>}
                    </div>
                    <div>
                        <label htmlFor="customerName" className="form-label">ผู้รับสินค้าคืน<Req /></label>
                        <input
                            id="customerName"
                            className={inputClass(!!errors.customerName)}
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                        {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
                    </div>
                    <div className="col-span-2" >
                        <label htmlFor="sentProductReturnDate" className="form-label block mb-1">วันที่ลูกค้ารับสินค้าคืน<Req /></label>
                            <DatePicker
                                id="sentProductReturnDate"
                                selected={sentProductReturnDate}
                                onChange={(date) => setSentProductReturnDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.sentProductReturnDate)}
                            />
                            {errors.sentProductReturnDate && <p className="text-red-600 text-sm mt-1">{errors.sentProductReturnDate}</p>}
                    </div>
                </div>
                <div className="pt-2">
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>

                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.attachments)} w-60`}
                        onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                            setAttachments(files);
                        }}
                    />

                    {errors.attachments && (
                        <p className="text-red-600 text-sm mt-1">{errors.attachments}</p>
                    )}

                    {attachments.length > 0 && (
                         <ul className="mt-2 text-sm text-slate-700 space-y-1">
                            {attachments.map((f, idx) => (
                                <li
                                key={`${f.name}-${f.size}`}
                                className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded"
                                >
                                <span className="truncate">{f.name}</span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAttachments((prev) => {
                                            const next = prev.filter((_, i) => i !== idx);
                                            if (next.length === 0) clearFileInput();
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
                <div className="space-y-2">
                    <label className="block font-medium">ลายเซ็นผู้รับสินค้า</label>

                    <div className="rounded-xl border border-slate-300 bg-white p-2">
                        <div style={{ width: "100%", height: "192px" }}>
                            <SignatureCanvas
                                ref={sigRef}
                                penColor="black"
                                canvasProps={{
                                    className: "w-full h-full rounded-lg bg-white touch-none",
                                    style: { display: "block", background: "white" }
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => sigRef.current?.clear()}
                        className="btn-back"
                    >
                        Clear
                    </button>
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
                    type="button"
                    className="btn-submit"
                    onClick={onSave}
                >
                    บันทึก
                </button>
            </div>
            </form>
        </div>
        </section>
    );
}
