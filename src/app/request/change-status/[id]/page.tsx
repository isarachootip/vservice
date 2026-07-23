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

    const [fileSlot1, setFileSlot1] = useState<File | null>(null);
    const [fileSlot2, setFileSlot2] = useState<File | null>(null);
    const [fileSlot3, setFileSlot3] = useState<File | null>(null);
    const [fileSlot4, setFileSlot4] = useState<File | null>(null);

    const [previewSlot1, setPreviewSlot1] = useState<string>("");
    const [previewSlot2, setPreviewSlot2] = useState<string>("");
    const [previewSlot3, setPreviewSlot3] = useState<string>("");
    const [previewSlot4, setPreviewSlot4] = useState<string>("");

    const slot1Ref = useRef<HTMLInputElement | null>(null);
    const slot2Ref = useRef<HTMLInputElement | null>(null);
    const slot3Ref = useRef<HTMLInputElement | null>(null);
    const slot4Ref = useRef<HTMLInputElement | null>(null);

    const [exampleImages, setExampleImages] = useState<any>(null);
    const [exampleModal, setExampleModal] = useState<{ isOpen: boolean; title: string; imageUrl: string; desc: string } | null>(null);

    useEffect(() => {
        if (!fileSlot1) {
            setPreviewSlot1("");
            return;
        }
        const url = URL.createObjectURL(fileSlot1);
        setPreviewSlot1(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot1]);

    useEffect(() => {
        if (!fileSlot2) {
            setPreviewSlot2("");
            return;
        }
        const url = URL.createObjectURL(fileSlot2);
        setPreviewSlot2(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot2]);

    useEffect(() => {
        if (!fileSlot3) {
            setPreviewSlot3("");
            return;
        }
        const url = URL.createObjectURL(fileSlot3);
        setPreviewSlot3(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot3]);

    useEffect(() => {
        if (!fileSlot4) {
            setPreviewSlot4("");
            return;
        }
        const url = URL.createObjectURL(fileSlot4);
        setPreviewSlot4(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot4]);

    useEffect(() => {
        fetch("/api/maintain/example-images?flow=create_repair")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setExampleImages(data.data);
                }
            })
            .catch(console.error);
    }, []);

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

        if (!fileSlot1) {
            alert("กรุณาแนบรูปถ่ายด้านบน (Top View) ของสินค้า");
            return;
        }

        if (!fileSlot4) {
            alert("กรุณาแนบรูปถ่าย Serial Number ของสินค้า");
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
            if (fileSlot1) formData.append("files", fileSlot1);
            if (fileSlot2) formData.append("files", fileSlot2);
            if (fileSlot3) formData.append("files", fileSlot3);
            if (fileSlot4) formData.append("files", fileSlot4);

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

    const renderUploadSlot = (
        slotId: 'slot1' | 'slot2' | 'slot3' | 'slot4',
        title: string,
        isRequired: boolean,
        file: File | null,
        previewUrl: string,
        setFile: (f: File | null) => void,
        ref: React.RefObject<HTMLInputElement | null>
    ) => {
        const slotConfig = exampleImages?.[slotId];
        const hasExample = slotConfig?.url;

        return (
            <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{title}</span>
                    {isRequired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                            * จำเป็น
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium text-slate-400">ถ้ามี</span>
                    )}
                </div>
                
                <input
                    type="file"
                    ref={ref as any}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                            if (selectedFile.size > 800 * 1024) {
                                alert("ขนาดไฟล์รูปภาพต้องไม่เกิน 800 KB ครับ");
                                return;
                            }
                            setFile(selectedFile);
                        }
                    }}
                />

                <div className="space-y-2">
                    {/* Preview Box or Upload Box */}
                    {previewUrl ? (
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                            {file && file.type === "application/pdf" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-bold text-xs p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500 mb-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <span className="truncate max-w-full text-xs">{file.name}</span>
                                </div>
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 gap-2">
                                <button
                                    type="button"
                                    onClick={() => ref.current?.click()}
                                    className="px-3 py-1.5 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow text-xs font-bold transition cursor-pointer"
                                >
                                    เปลี่ยนรูป
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        if (ref.current) ref.current.value = "";
                                    }}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow text-xs font-bold transition cursor-pointer"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => ref.current?.click()}
                            className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50/50 hover:bg-red-50/20 flex flex-col items-center justify-center cursor-pointer transition p-3 text-center group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-[#c8102e]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#c8102e]">คลิกเพื่ออัปโหลด</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (ไม่เกิน 800KB)</span>
                        </div>
                    )}

                    {/* Example Image Trigger Button */}
                    {hasExample && (
                        <button
                            type="button"
                            onClick={() => setExampleModal({
                                isOpen: true,
                                title: title,
                                imageUrl: slotConfig.url,
                                desc: slotConfig.desc || "ไม่มีคำอธิบายเพิ่มเติม"
                            })}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <span>ดูรูปตัวอย่าง</span>
                        </button>
                    )}
                </div>
            </div>
        );
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

                        {/* Image upload slots */}
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700">
                                📸 รูปถ่ายเครื่องและป้าย Serial เพื่อตรวจสอบสินค้า (Required Photos & Serial)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {renderUploadSlot('slot1', '1. ภาพด้านบน (Top View)', true, fileSlot1, previewSlot1, setFileSlot1, slot1Ref)}
                                {renderUploadSlot('slot2', '2. ภาพด้านข้าง (Side View)', false, fileSlot2, previewSlot2, setFileSlot2, slot2Ref)}
                                {renderUploadSlot('slot3', '3. ภาพมุมอื่น (Other View)', false, fileSlot3, previewSlot3, setFileSlot3, slot3Ref)}
                                {renderUploadSlot('slot4', '4. ภาพ Serial Number', true, fileSlot4, previewSlot4, setFileSlot4, slot4Ref)}
                            </div>
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
            {/* Example Image Modal */}
            {exampleModal && exampleModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative animate-scaleUp">
                        <button
                            type="button"
                            onClick={() => setExampleModal(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="ปิด"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                                รูปตัวอย่างสำหรับ: {exampleModal.title}
                            </h3>
                        </div>

                        <div className="w-full aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                            <img
                                src={exampleModal.imageUrl}
                                alt={exampleModal.title}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5">
                            <h4 className="text-xs font-bold text-slate-600 mb-1">💡 คำแนะนำในการถ่ายภาพ:</h4>
                            <p className="text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                                {exampleModal.desc}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setExampleModal(null)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                            ตกลง เข้าใจแล้ว
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
