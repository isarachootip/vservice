"use client";

import { use, useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldX, ArrowRight, Eye, Undo2 } from "lucide-react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    vendorName: string;
    receiverName: string;
    sendDate: string;
    vendorReceiverTel: string;
    attachments: string;
}>;

export default function DcToVendorPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [updatedUser, setUpdatedUser] = useState("");
    const [status,      setStatus]      = useState<number | "">("");

    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);
    const [vendorReceiverTel, setVendorReceiverTel] = useState("");

    // 4 Photo Upload Slots states
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

    // Product info fields
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

    // Preview URL generation
    useEffect(() => {
        if (!fileSlot1) { setPreviewSlot1(""); return; }
        const url = URL.createObjectURL(fileSlot1);
        setPreviewSlot1(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot1]);

    useEffect(() => {
        if (!fileSlot2) { setPreviewSlot2(""); return; }
        const url = URL.createObjectURL(fileSlot2);
        setPreviewSlot2(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot2]);

    useEffect(() => {
        if (!fileSlot3) { setPreviewSlot3(""); return; }
        const url = URL.createObjectURL(fileSlot3);
        setPreviewSlot3(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot3]);

    useEffect(() => {
        if (!fileSlot4) { setPreviewSlot4(""); return; }
        const url = URL.createObjectURL(fileSlot4);
        setPreviewSlot4(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot4]);

    useEffect(() => {
        fetch("/api/maintain/example-images?flow=dc_to_vendor")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setExampleImages(data.data);
            })
            .catch(console.error);
    }, []);

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `w-full px-3.5 py-2 border rounded-xl text-xs font-semibold outline-none transition focus:ring-2 focus:ring-[#c8102e]/20 ${
            hasError ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#c8102e]"
        }`;

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");

                const raw = localStorage.getItem("userInfo");
                if (raw) {
                    const u = JSON.parse(raw);
                    if (alive) setUpdatedUser(u.user_name);
                }

                const r = data.request;
                const [fn = "", ln = ""] = String(r.customer_name || "").split(" ", 2);
                if (!alive) return;

                setFirstName(fn);
                setLastName(ln);
                setAddress(r.address ?? "");
                setPhone(r.phone ?? "");
                setReceiveFromUserDt(r.receive_from_user_date ?? "");
                setStatus(r.status);

                const it = r.item || {};
                setProductType(it.product_type ?? "");
                setBrand(it.brand ?? "");
                setModel(it.model ?? "");
                setSerial(it.serial_no ?? "");
                setQty(typeof it.qty === "number" ? it.qty : "");
                setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
                setWarrantyNo(it.warranty_no ?? "");
                setIssue(it.issue ?? "");
                setSku(typeof it.sku_code === "number" ? it.sku_code : "");
                setBarcode(it.bar_code ?? "");
            } catch (e) {
                alert((e as Error).message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
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
        const nextErrors: Errors = {};
        if (!vendorName.trim())   nextErrors.vendorName   = "กรุณากรอกชื่อผู้ขาย";
        if (!receiverName.trim())    nextErrors.receiverName    = "กรุณากรอกชื่อผู้มารับสินค้า";
        if (!sendDate)  nextErrors.sendDate    = "กรุณาเลือกวันที่ส่งสินค้า";
        if (!vendorReceiverTel.trim())   nextErrors.vendorReceiverTel   = "กรุณากรอกเบอร์ติดต่อ";
        
        // Validation for mandatory photo slots (Slot 1 and Slot 4)
        if (!fileSlot1) {
            nextErrors.attachments = "กรุณาแนบรูปภาพภาพด้านบน (Slot 1)";
        }
        if (!fileSlot4) {
            nextErrors.attachments = (nextErrors.attachments ? nextErrors.attachments + "\n" : "") + "กรุณาแนบรูปภาพป้าย Serial Number (Slot 4)";
        }

        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const dateStr = toYMD(sendDate);
        const formData = new FormData();
        formData.append("requestId", String(id));
        formData.append("vendorName", vendorName);
        formData.append("receiverName", receiverName);
        formData.append("sendDate", dateStr ?? "");
        formData.append("vendorReceiverTel", vendorReceiverTel);
        formData.append("updatedUser", updatedUser);

        const selectedFiles = [fileSlot1, fileSlot2, fileSlot3, fileSlot4].filter(Boolean) as File[];
        selectedFiles.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await fetch("/api/request/update-dc-vendor-info", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");
            alert("บันทึกข้อมูลสำเร็จ");
            router.push('/status');
        } catch (e) {
            alert((e as Error).message);
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
                    {previewUrl ? (
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                            {file && file.type === "application/pdf" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-bold text-xs p-3">
                                    <ShieldCheck className="w-10 h-10 text-red-500 mb-1" />
                                    <span className="truncate max-w-full text-xs">{file.name}</span>
                                </div>
                            ) : (
                                <img src={previewUrl} alt={title} className="w-full h-full object-cover" />
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
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
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
                <span>คลัง DC</span>
                <span>/</span>
                <span className="text-[#c8102e]">จัดส่งสินค้าให้ Vendor</span>
            </div>

            {/* Page Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                    บันทึกการส่งสินค้าซ่อมให้ผู้ผลิต (DC to Vendor)
                </h1>
                <p className="text-xs text-slate-400 font-medium pl-3.5">
                    ลงบันทึกการจัดส่งสินค้ามอบงานซ่อมให้แก่ผู้ผลิต/ร้านค้าส่งเพื่อทำการวิเคราะห์ซ่อมแซม
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

                    {/* Section 3: DC To Vendor info */}
                    <div>
                        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-6">
                            <span className="w-1 h-4 bg-[#c8102e] rounded-full inline-block"></span>
                            <h3 className="text-sm font-bold text-slate-800">
                                🚚 บันทึกข้อมูลการจัดส่งให้แก่ Vendor
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vendorName" className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ Vendor<Req /></label>
                                <input
                                    id="vendorName"
                                    className={inputClass(!!errors.vendorName)}
                                    value={vendorName}
                                    onChange={e => setVendorName(e.target.value)}
                                />
                                {errors.vendorName && <p className="text-red-600 text-[10px] font-bold mt-1">{errors.vendorName}</p>}
                            </div>
                            <div>
                                <label htmlFor="receiverName" className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อผู้มารับสินค้า (ตัวแทน Vendor/ขนส่ง)<Req /></label>
                                <input
                                    id="receiverName"
                                    className={inputClass(!!errors.receiverName)}
                                    value={receiverName}
                                    onChange={e => setReceiverName(e.target.value)}
                                />
                                {errors.receiverName && <p className="text-red-600 text-[10px] font-bold mt-1">{errors.receiverName}</p>}
                            </div>
                            <div>
                                <label htmlFor="sendDate" className="block text-xs font-bold text-slate-700 mb-1.5">วันที่ส่งสินค้าซ่อม<Req /></label>
                                <DatePicker
                                    id="sendDate"
                                    selected={sendDate}
                                    onChange={(date) => setSendDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="วว/ดด/ปป"
                                    className={inputClass(!!errors.sendDate)}
                                />
                                {errors.sendDate && <p className="text-red-600 text-[10px] font-bold mt-1">{errors.sendDate}</p>}
                            </div>
                            <div>
                                <label htmlFor="vendorReceiverTel" className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์ผู้รับของ<Req /></label>
                                <input
                                    id="vendorReceiverTel"
                                    className={inputClass(!!errors.vendorReceiverTel)}
                                    value={vendorReceiverTel}
                                    onChange={e => setVendorReceiverTel(e.target.value)}
                                />
                                {errors.vendorReceiverTel && <p className="text-red-600 text-[10px] font-bold mt-1">{errors.vendorReceiverTel}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Attachments */}
                    <div>
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-4 bg-[#c8102e] rounded-full inline-block"></span>
                                <h3 className="text-sm font-bold text-slate-800">
                                    📷 ถ่ายภาพตอนมอบกล่องซ่อมให้ Vendor (Attachments)*
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {renderUploadSlot('slot1', 'ภาพถ่ายสินค้าประกอบ (ด้านบน)*', true, fileSlot1, previewSlot1, setFileSlot1, slot1Ref)}
                            {renderUploadSlot('slot2', 'ภาพถ่ายสินค้าประกอบ (ด้านข้าง)', false, fileSlot2, previewSlot2, setFileSlot2, slot2Ref)}
                            {renderUploadSlot('slot3', 'ภาพถ่ายป้าย Serial ยืนยัน', false, fileSlot3, previewSlot3, setFileSlot3, slot3Ref)}
                            {renderUploadSlot('slot4', 'ใบรับของจาก Vendor/เอกสารแนบ*', true, fileSlot4, previewSlot4, setFileSlot4, slot4Ref)}
                        </div>
                        {errors.attachments && (
                            <p className="text-red-600 text-xs font-bold mt-3">{errors.attachments}</p>
                        )}
                    </div>
                </form>
            </div>

            {/* Bottom floating button bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                <button
                    type="button"
                    onClick={() => history.back()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition font-bold text-xs shadow-inner"
                >
                    ย้อนกลับ
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:inline-block">ขั้นตอนปัจจุบัน: DC to Vendor</span>
                    <button
                        type="button"
                        onClick={onSave}
                        className="flex items-center gap-1.5 px-6 py-2.5 bg-[#c8102e] hover:bg-[#b00d25] text-white rounded-xl transition font-bold text-xs shadow-md shadow-red-900/30"
                    >
                        บันทึกส่งมอบให้ Vendor <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Examples Guideline Popup Modal */}
            {exampleModal && exampleModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn flex flex-col border border-slate-200">
                        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-900">
                            <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                                💡 ภาพตัวอย่าง: {exampleModal.title}
                            </span>
                            <button onClick={() => setExampleModal(null)} className="text-slate-400 hover:text-white transition cursor-pointer">
                                <ShieldX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 flex flex-col items-center justify-center space-y-4">
                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-inner">
                                <img src={exampleModal.imageUrl} alt={exampleModal.title} className="w-full h-full object-contain" />
                            </div>
                            <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {exampleModal.desc}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white border-t border-slate-100 px-5 py-3 flex justify-end">
                            <button
                                onClick={() => setExampleModal(null)}
                                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                            >
                                ปิดคำแนะนำ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
