"use client";

import { use, useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { notifyVendor } from "@/lib/service/vendor-notify.service";

type Warranty = "in" | "out" | null;

export default function RequestChangeStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    const [productType, setProductType] = useState("");
    const [brand,       setBrand]       = useState("");
    const [model,       setModel]       = useState("");
    const [serial,      setSerial]      = useState("");
    const [qty,         setQty]         = useState<number | "">("");
    const [sku,         setSku]         = useState<number | "">("");
    const [barcode,     setBarcode]     = useState("");
    const [issue,       setIssue]       = useState("");
    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);

    const [alrtFlg, setAlrtFlg] = useState(false);
    const [showDcConfirm, setShowDcConfirm] = useState(false);

    //*rollback
    const [reason,     setReason]     = useState("");
    const [rollbackBy, setRollbackBy] = useState("");
    const [rollbackDt, setRollbackDt] = useState<Date | null>(null);

    // GR Serial verification states
    const [verifySerial, setVerifySerial] = useState("");
    const [serialMismatchReason, setSerialMismatchReason] = useState("");

    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [loading, setLoading] = useState(true);

    const [status,      setStatus]      = useState<number | "">("");
    const [updatedUser, setUpdatedUser] = useState("");
    const [vendorName,  setVendorName]  = useState("");
    const [requestNo,   setRequestNo]   = useState("");

    useEffect(() => {
        let alive = true;
        (async () => {
        try {
            setLoading(true);

            //* get current_user from localStorage
            const raw = localStorage.getItem("userInfo");
            if (raw) {
                const u = JSON.parse(raw);
                if (alive) setUpdatedUser(u.user_name);
            }
        
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
            setReceiveFromUserDt(r.receive_from_user_date ?? "");

            //*rollback
            setReason(r.rollback_reason ?? "");
            setRollbackBy(r.rollback_by ?? "");
            setRollbackDt(r.rollback_date ?? "");

            const it = r.item || {};
            setProductType(it.product_type ?? "");
            setBrand(it.brand ?? "");
            setModel(it.model ?? "");
            setSerial(it.serial_no ?? "");
            setQty(typeof it.qty === "number" ? it.qty : "");
            setIssue(it.issue ?? "");
            setSku(typeof it.sku_code === "number" ? it.sku_code : "");
            setBarcode(it.bar_code ?? "");
            setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
            setWarrantyNo(it.warranty_no ?? "");
            setStatus(r.status);
            setVendorName(r.vendor_name ?? "");
            setRequestNo(r.request_no ?? "");
        } catch (e) {
            alert((e as Error).message);
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => { alive = false; };
    }, [id]);

    useEffect(() => {
        if (!sku) return;
        let alive = true;

        (async () => {
            try {
                const res = await fetch(
                    `/api/commodity/find-by-sku?sku=${encodeURIComponent(String(sku))}`,
                    { cache: "no-store" }
                );

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.message || "โหลดข้อมูล SKU ไม่สำเร็จ");
                }
                if (!alive) return;

                const distrmcode = Number(data?.data?.distrmcode);
                if ([2, 3, 4].includes(distrmcode)) {
                    setAlrtFlg(true);
                } else {
                    setAlrtFlg(false);
                }
            } catch (err) {
                console.error(err);
            }
        })();
        return () => {
            alive = false;
        };
    }, [sku]);


    const onUpdateStatus = async (newStatus: number) => {
        if (!verifySerial.trim()) {
            alert("กรุณากรอกเลขเครื่องเพื่อตรวจสอบ (Verify Serial)");
            return;
        }

        const isMismatch = serial.trim().toLowerCase() !== verifySerial.trim().toLowerCase();
        if (isMismatch && !serialMismatchReason.trim()) {
            alert("เลขเครื่องไม่ตรงกัน กรุณาระบุเหตุผลกรณีเลขเครื่องไม่ตรงกัน (Serial Mismatch Reason)");
            return;
        }

        if (attachments.length === 0) {
            alert("กรุณาแนบรูปถ่ายสินค้าอย่างน้อย 1 รูปเพื่อเป็นหลักฐานการรับสินค้า");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("Id", String(id));
            formData.append("status", String(newStatus));
            formData.append("updatedUser", updatedUser);
            formData.append("newSerial", verifySerial);
            if (isMismatch) {
                formData.append("serialMismatchReason", serialMismatchReason);
            }
            attachments.forEach((file) => {
                formData.append("files", file);
            });

            const res = await fetch("/api/request/update-status", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "อัปเดตไม่สำเร็จ");

            //* email process
            if (newStatus === 300 && sku && requestNo) {
                const notifyResult = await notifyVendor({
                    sku: Number(sku),
                    requestNo,
                    requestId: Number(id),
                });
                if (!notifyResult.ok) {
                    console.warn("⚠️ Vendor email notification failed:", notifyResult.message);
                }
            }

            alert("อัปเดตสถานะเรียบร้อย");
            setStatus(newStatus);
            router.push('/status')
        } catch {
            alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
    };

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    return (
        <section className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <span>VService System</span>
                <span>/</span>
                <span>รับเครื่อง</span>
                <span>/</span>
                <span className="text-[#c8102e]">ตรวจสอบและจัดส่ง</span>
            </div>

            {/* Page Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                    ตรวจสอบและจัดส่งสินค้าซ่อม (GR Verification)
                </h1>
                <p className="text-xs text-slate-400 font-medium pl-3.5">
                    ตรวจสอบข้อมูลการแจ้งซ่อม ตรวจสอบความถูกต้องของบาร์โค้ด/เลขเครื่อง และเลือกเส้นทางจัดส่งสินค้าซ่อม
                </p>
            </div>

            <div className="bg-white border border-slate-200/80 border-t-4 border-t-[#c8102e] rounded-2xl p-6 md:p-8 shadow-sm">
                <form className="space-y-8">
                    {/* Section 1: Customer Details */}
                    <div>
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-6">
                            <span className="w-1 h-4 bg-[#c8102e] rounded-full inline-block"></span>
                            <h3 className="text-sm font-bold text-slate-800">
                                👤 รายละเอียดลูกค้าและเบอร์ติดต่อ (Customer Details)
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">ชื่อจริง</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold">{firstName || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">นามสกุล</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold">{lastName || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">เบอร์โทรศัพท์</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold">{phone || "-"}</div>
                            </div>
                            <div className="sm:col-span-3">
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">ที่อยู่ออกใบกำกับภาษี / จัดส่ง</label>
                                <div className="px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold leading-relaxed">{address || "-"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Product Details */}
                    <div>
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-6">
                            <span className="w-1 h-4 bg-[#c8102e] rounded-full inline-block"></span>
                            <h3 className="text-sm font-bold text-slate-800">
                                📦 รายละเอียดสินค้า (Product Details)
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">ประเภทสินค้า</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate" title={productType}>{productType || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">ยี่ห้อ</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate" title={brand}>{brand || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">SKU</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate">{sku === 0 || sku == null ? "-" : sku}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Barcode</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate" title={barcode}>{barcode || "-"}</div>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">รุ่นสินค้า (Model)</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold break-words">{model || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">เลขเครื่อง (Serial)</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate">{serial || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">จำนวน</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold">{qty} ชิ้น</div>
                            </div>
                            <div className="col-span-2 sm:col-span-3">
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">อาการที่พบ</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold break-words">{issue || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">สถานะรับประกัน</label>
                                <div className="px-3.5 py-1.5 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                                    {warranty === "in" ? (
                                        <>
                                            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                                            <span className="text-green-700 font-bold">ในประกัน</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldX className="w-4 h-4 text-red-600 shrink-0" />
                                            <span className="text-red-700 font-bold">นอกประกัน</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {warranty === "in" && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">เลขที่ใบประกัน</label>
                                    <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate">{warrantyNo || "-"}</div>
                                </div>
                            )}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">วันที่รับสินค้าจากลูกค้า</label>
                                <div className="px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50/50 text-slate-700 text-xs font-semibold truncate">
                                    {receiveFromUserDt ? new Date(receiveFromUserDt).toLocaleDateString('th-TH') : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Verification */}
                    <div>
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-6">
                            <span className="w-1 h-4 bg-[#c8102e] rounded-full inline-block"></span>
                            <h3 className="text-sm font-bold text-slate-800">
                                🔍 ตรวจสอบความถูกต้องสินค้า (GR Verification)
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    สแกน / กรอกเลขเครื่องเพื่อตรวจสอบ (Verify Serial) <span className="text-red-600 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#c8102e] bg-white font-mono text-slate-800 transition duration-150"
                                    placeholder="สแกนบาร์โค้ดเครื่อง หรือคีย์เลขเครื่อง"
                                    value={verifySerial}
                                    onChange={(e) => setVerifySerial(e.target.value)}
                                />
                                {verifySerial.trim() !== "" && (
                                    <div className="mt-2 text-xs font-bold animate-fade-in">
                                        {serial.trim().toLowerCase() === verifySerial.trim().toLowerCase() ? (
                                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">✅ เลขเครื่องตรงกัน</span>
                                        ) : (
                                            <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full inline-block">⚠️ เลขเครื่องไม่ตรงกับที่ CS บันทึก ({serial})</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {verifySerial.trim() !== "" && serial.trim().toLowerCase() !== verifySerial.trim().toLowerCase() && (
                                <div className="flex flex-col animate-fade-in">
                                    <label className="block text-xs font-bold text-red-800 mb-1.5">
                                        เหตุผลการแก้ไขเลขเครื่อง (Serial Mismatch Reason) <span className="text-red-600 ml-0.5">*</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="w-full rounded-xl border border-red-300 px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 bg-red-50/20 text-slate-800"
                                        placeholder="ระบุสาเหตุที่เลขเครื่องไม่ตรงกัน เช่น CS คีย์ผิด / กล่องสลับเครื่อง..."
                                        value={serialMismatchReason}
                                        onChange={(e) => setSerialMismatchReason(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                อัปโหลดรูปภาพสินค้าเพื่อเป็นหลักฐานการรับของ <span className="text-red-600 ml-0.5">*</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png"
                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-[#c8102e] hover:file:bg-red-100 border border-slate-200 rounded-xl p-2 bg-slate-50 transition duration-150 cursor-pointer"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    const oversized = files.some(f => f.size > 800 * 1024);
                                    if (oversized) {
                                        alert("พบไฟล์ที่มีขนาดเกิน 800 KB กรุณาเลือกไฟล์ใหม่ที่มีขนาดไม่เกิน 800 KB ครับ");
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                        return;
                                    }
                                    setAttachments(files);
                                }}
                            />
                            {attachments.length > 0 && (
                                <ul className="mt-3 text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    {attachments.map((f, idx) => (
                                        <li
                                            key={`${f.name}-${f.size}`}
                                            className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100"
                                        >
                                            <span className="truncate">{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAttachments((prev) => {
                                                        const next = prev.filter((_, i) => i !== idx);
                                                        if (next.length === 0 && fileInputRef.current) {
                                                            fileInputRef.current.value = "";
                                                        }
                                                        return next;
                                                    });
                                                }}
                                                className="ml-3 text-red-500 hover:text-red-700 text-[11px] font-bold"
                                            >
                                                ลบ
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Reject Reason Alert */}
                    {reason && (
                        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-1.5">
                            <div className="font-bold text-red-800 text-xs sm:text-sm">
                                ⚠️ เหตุผลการตีกลับ (Reject Reason)
                            </div>
                            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {reason}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                                ดำเนินการโดย {rollbackBy} เมื่อวันที่ {rollbackDt ? new Date(rollbackDt).toLocaleString("th-TH") : "-"}
                            </div>
                        </div>
                    )}

                    {/* Button Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-8">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e] animate-pulse"></span>
                            <span>ตรวจสอบความถูกต้องของข้อมูลและแนบรูปภาพก่อนกดส่งงาน</span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                type="button"
                                className="px-5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition duration-150 cursor-pointer text-center flex-1 sm:flex-initial"
                                onClick={() => history.back()}
                            >
                                ย้อนกลับ
                            </button>
                            <button
                                type="button"
                                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition duration-150 cursor-pointer text-center flex-1 sm:flex-initial"
                                onClick={() => {
                                    if (alrtFlg) {
                                        setShowDcConfirm(true);
                                    } else {
                                        onUpdateStatus(200);
                                    }
                                }}
                            >
                                จัดส่งให้ DC
                            </button>
                            <button
                                type="button"
                                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#c8102e] hover:bg-[#b00d25] text-white transition duration-150 cursor-pointer text-center flex-1 sm:flex-initial"
                                onClick={() => onUpdateStatus(300)}
                            >
                                จัดส่งให้ Vendor
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* DC Confirmation Modal */}
            {showDcConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-100 flex flex-col space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <h2 className="text-base font-black text-slate-800">
                                ⚠️ ยืนยันการจัดส่ง
                            </h2>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            สินค้าดังกล่าวไม่ได้อยู่ในรายการจัดส่งผ่าน DC
                            <br />
                            ยืนยันการจัดส่งใช่หรือไม่ ?
                        </p>
                        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                                onClick={() => setShowDcConfirm(false)}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#c8102e] text-white hover:bg-[#b00d25] cursor-pointer shadow-sm"
                                onClick={() => {
                                    setShowDcConfirm(false);
                                    onUpdateStatus(200);
                                }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
