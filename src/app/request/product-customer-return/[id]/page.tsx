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
    
    // Outstanding balance & checkout states
    const [quotationTotal, setQuotationTotal] = useState(0);
    const [paidTotal, setPaidTotal] = useState(0);
    const [outstanding, setOutstanding] = useState(0);
    const [paymentsList, setPaymentsList] = useState<any[]>([]);

    const [payMethod, setPayMethod] = useState("CASH");
    const [payRef, setPayRef] = useState("");
    const [payReceipt, setPayReceipt] = useState("");
    const [isPaying, setIsPaying] = useState(false);

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const [customerName, setCustomerName] = useState("");
    const [sentName, setSentName] = useState("");
    const [sentProductReturnDate, setSentProductReturnDate] = useState<Date | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const sigRef = useRef<SignatureCanvas | null>(null);

    const refreshPayments = async () => {
        try {
            const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
            const data = await res.json();
            if (res.ok && data.request) {
                const r = data.request;
                const qList = r.quotation || [];
                const totalQuo = qList.reduce((sum: number, qItem: any) => sum + (qItem.net_price ? parseFloat(qItem.net_price) : 0), 0);
                
                const pList = r.payment_transaction || [];
                const repairPaid = pList
                    .filter((p: any) => p.payment_type !== "DIAGNOSTIC_FEE")
                    .reduce((sum: number, pItem: any) => sum + parseFloat(pItem.amount), 0);
                
                setQuotationTotal(totalQuo);
                setPaidTotal(repairPaid);
                setOutstanding(Math.max(0, totalQuo - repairPaid));
                setPaymentsList(pList);
            }
        } catch (e) {
            console.error("refresh payments error", e);
        }
    };

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
            if (!alive) return;

            setStatus(r.status);
            
            const qList = r.quotation || [];
            const totalQuo = qList.reduce((sum: number, qItem: any) => sum + (qItem.net_price ? parseFloat(qItem.net_price) : 0), 0);
            
            const pList = r.payment_transaction || [];
            const repairPaid = pList
                .filter((p: any) => p.payment_type !== "DIAGNOSTIC_FEE")
                .reduce((sum: number, pItem: any) => sum + parseFloat(pItem.amount), 0);
            
            setQuotationTotal(totalQuo);
            setPaidTotal(repairPaid);
            setOutstanding(Math.max(0, totalQuo - repairPaid));
            setPaymentsList(pList);
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
        if (outstanding > 0.01) {
            alert(`ไม่สามารถส่งมอบสินค้าคืนได้เนื่องจากยังมียอดค้างชำระ: ${outstanding.toFixed(2)} บาท\nกรุณาทำรายการชำระยอดคงเหลือให้ครบถ้วนก่อน`);
            return;
        }

        const nextErrors: Errors = {};
        if (!customerName.trim())   nextErrors.customerName   = "กรุณากรอกชื่อผู้รับสินค้าคืน"; // customerName is the recipient!
        if (!sentName.trim())    nextErrors.sentName    = "กรุณากรอกชื่อผู้ส่งมอบสินค้าคืน"; // sentName is the sender!
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
            {/* V2.0 Outstanding Balance Checkout Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-md font-bold text-slate-800">สรุปยอดชำระเงินและค้างจ่าย (Outstanding Balance Check)</h3>
                    {outstanding > 0.01 ? (
                        <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">⚠️ รอยอดค้างชำระ</span>
                    ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">✅ ชำระครบถ้วนแล้ว</span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-center">
                        <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">ยอดค่าซ่อมสุทธิ</span>
                        <span className="text-lg font-black text-slate-800 tabular-nums">{quotationTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 text-center">
                        <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">ยอดชำระแล้ว</span>
                        <span className="text-lg font-black text-emerald-700 tabular-nums">{paidTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                    </div>
                    <div className={`rounded-xl p-3 border text-center ${outstanding > 0.01 ? 'bg-red-50 border-red-150' : 'bg-slate-50 border-slate-150'}`}>
                        <span className={`text-[10px] font-bold block uppercase tracking-wider ${outstanding > 0.01 ? 'text-red-500' : 'text-slate-450'}`}>ยอดคงเหลือค้างชำระ</span>
                        <span className={`text-lg font-black tabular-nums ${outstanding > 0.01 ? 'text-red-600' : 'text-slate-800'}`}>{outstanding.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
                    </div>
                </div>

                {/* List of past payments */}
                {paymentsList.length > 0 && (
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">ประวัติการชำระเงิน :</span>
                        <div className="overflow-hidden border border-slate-150 rounded-xl">
                            <table className="w-full text-xs text-left bg-white">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-150">
                                    <tr>
                                        <th className="px-4 py-2">เลขที่ใบเสร็จ</th>
                                        <th className="px-4 py-2">ประเภท</th>
                                        <th className="px-4 py-2">วิธีชำระ</th>
                                        <th className="px-4 py-2">เลขอ้างอิง</th>
                                        <th className="px-4 py-2 text-right">จำนวนเงิน</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                    {paymentsList.map((p, idx) => (
                                        <tr key={p.payment_id || idx}>
                                            <td className="px-4 py-2 font-semibold text-slate-900">{p.receipt_no || "-"}</td>
                                            <td className="px-4 py-2">{p.payment_type}</td>
                                            <td className="px-4 py-2">{p.method}</td>
                                            <td className="px-4 py-2">{p.ref_no || "-"}</td>
                                            <td className="px-4 py-2 text-right tabular-nums">{(p.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Checkout form for remaining balance */}
                {outstanding > 0.01 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2 space-y-3">
                        <span className="text-xs font-black text-[#c8102e] block">💳 บันทึกรับชำระเงินยอดค้างจ่าย</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">วิธีการชำระเงิน</label>
                                <select
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-[#c8102e]"
                                    value={payMethod}
                                    onChange={e => setPayMethod(e.target.value)}
                                >
                                    <option value="CASH">เงินสด (CASH)</option>
                                    <option value="TRANSFER">โอนเงินธนาคาร (TRANSFER)</option>
                                    <option value="QR_PROMPTPAY">QR PromptPay</option>
                                    <option value="CREDIT_CARD">บัตรเครดิต (CREDIT CARD)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">เลขอ้างอิงสลิป / รูดบัตร (ถ้ามี)</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#c8102e]"
                                    placeholder="เช่น Ref-123456"
                                    value={payRef}
                                    onChange={e => setPayRef(e.target.value)}
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    disabled={isPaying}
                                    onClick={async () => {
                                        if (isPaying) return;
                                        try {
                                            setIsPaying(true);
                                            const res = await fetch("/api/payment/record", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    request_id: id,
                                                    payment_type: "FINAL",
                                                    amount: outstanding,
                                                    method: payMethod,
                                                    ref_no: payRef,
                                                    receipt_no: payReceipt || null,
                                                    updatedUser
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
                                            alert("ชำระเงินสำเร็จ!");
                                            setPayRef("");
                                            setPayReceipt("");
                                            await refreshPayments();
                                        } catch (e: any) {
                                            alert(e.message || "ไม่สามารถชำระเงินได้");
                                        } finally {
                                            setIsPaying(false);
                                        }
                                    }}
                                    className="w-full h-[38px] rounded-xl bg-slate-900 text-white hover:bg-black font-bold text-xs shadow-sm transition flex items-center justify-center"
                                >
                                    {isPaying ? "กำลังบันทึก..." : `บันทึกชำระ ${outstanding.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
