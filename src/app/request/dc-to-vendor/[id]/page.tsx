"use client";

import { use, useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldX, X } from "lucide-react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    vendorName: string;
    receiverName : string;
    sendDate: string;
    vendorReceiverTel: string;
    attachments?: string;
}>;

export default function RequestDCDetailExtPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    const [productType, setProductType] = useState("");
    const [brand,       setBrand]       = useState("");
    const [model,       setModel]       = useState("");
    const [serial,      setSerial]      = useState("");
    const [qty,         setQty]         = useState<number | "">("");
    const [issue,       setIssue]       = useState("");
    const [sku,         setSku]         = useState<number | "">("");
    const [barcode,     setBarcode]     = useState("");
    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [updatedUser, setUpdatedUser] = useState("");
    const [status,      setStatus]      = useState<number | "">("");
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    //* สำหรับ section Vendor ตีราคา
    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);
    const [vendorReceiverTel, setVendorReceiverTel] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Example Images states
    const [exampleImages, setExampleImages] = useState<any>(null);
    const [exampleModal, setExampleModal] = useState({
        isOpen: false,
        title: "",
        imageUrl: "",
        desc: ""
    });

    useEffect(() => {
        fetch("/api/maintain/example-images?flow=dc_to_vendor")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setExampleImages(data.data);
            })
            .catch(console.error);
    }, []);

    //* สำหรับ DC
    const [sentToDCName, setSentToDCName] = useState("");
    const [dcReceiveDate, setDcReceiveDate] = useState<string>("");
    const [approvelogID, setApprovelogID] = useState("");
    const [dcArriveDate, setDcArriveDate] = useState<string>("");
    const [receiverTel, setReceiverTel] = useState("");

    //*กรณี GR ตีกลับสินค้าคืนสาขา
    const [dcSentReturnName, setDcSentReturnName] = useState("");
    const [receiveReturnName, setReceiveReturnName] = useState("");
    const [dcSentReturnDate, setDcSentReturnDate] = useState<string>("");
    const [dcSentReturnTel, setDcSentReturnTel] = useState(""); 

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

            //* dc
            setSentToDCName(r.dc_receiver_name);
            setApprovelogID(r.approvelog_id);
            setDcReceiveDate(r.dc_receive_date);
            setReceiverTel(r.dc_receiver_tel);
            setDcArriveDate(r.arrive_to_dc_date);

            //* GR reject (DC คืนสินค้าให้สาขา)
            setDcSentReturnName(r.dc_rej_return_send_by || "");
            setReceiveReturnName(r.dc_rej_return_receive_by || "");
            setDcSentReturnDate(r.dc_rej_return_date || "");
            setDcSentReturnTel(r.dc_rej_return_tel || "");
            
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
        if (!dcArriveDate || isNaN(new Date(dcArriveDate).getTime())) {
        }
        return next;
    };

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
        if (!attachments || attachments.length === 0) nextErrors.attachments = "กรุณาแนบไฟล์";

        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const sendDateStr = toYMD(sendDate);
        const formData = new FormData();
        formData.append("requestId", String(id));
        formData.append("vendorName", vendorName);
        formData.append("receiverName", receiverName);
        formData.append("vendorReceiverTel", vendorReceiverTel);
        formData.append("sendDate", sendDateStr ?? "");
        formData.append("updatedUser", updatedUser);

        attachments.forEach((file) => {
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
            router.push('/status')
        } catch (e) {
            alert((e as Error).message);
        }
    }

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    //* CSS
    const labelCell = "w-56 pr-4 text-right align-top whitespace-nowrap";

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เพิ่มรายละเอียดใบแจ้งซ่อม (DC)
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">ข้อมูลลูกค้า</legend>
                <div className="flex justify-center">
                    <table className="min-w-[560px]">
                        <tbody>
                            <tr>
                                <td className={labelCell}>ชื่อ :</td>
                                <td>{firstName}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>นามสกุล :</td>
                                <td>{lastName}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>ที่อยู่ :</td>
                                <td>{address}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>โทรศัพท์ :</td>
                                <td>{phone}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
                <div className="flex justify-center">
                    <table className="min-w-[560px]">
                        <tbody>
                            <tr>
                                <td className={labelCell}>ประเภทสินค้า :</td>
                                <td>{productType}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>ยี่ห้อ :</td>
                                <td>{brand}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>SKU :</td>
                                <td>{sku === 0 || sku == null ? "-" : sku}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>Barcode :</td>
                                <td>{barcode}</td>
                            </tr>
                            <tr>
                                <td className="pr-4 text-right align-top whitespace-nowrap"
                                    style={{ width: "220px" }}>
                                    รุ่น :
                                </td>
                                <td style={{
                                    maxWidth: "300px",
                                    wordBreak: "break-word",
                                    whiteSpace: "normal",
                                }}>
                                    {model}
                                </td>
                            </tr>
                            <tr>
                                <td className={labelCell}>เลขเครื่อง (Serial) :</td>
                                <td>{serial}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>อาการที่พบ :</td>
                                <td>{issue}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>จำนวน :</td>
                                <td>{qty}  ชิ้น</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>สถานะรับประกัน :</td>
                                <td>
                                    {warranty === "in" ? (
                                        <>
                                            <ShieldCheck className="inline-block text-green-600" />
                                        </>
                                    ) : (
                                        <>
                                            <ShieldX className="inline-block text-red-600" />
                                        </>
                                    )}
                                </td>
                            </tr>
                            {warranty === "in" ? (
                                <>
                                    <tr>
                                        <td className={labelCell}>เลขที่ใบประกัน :</td>
                                        <td>{warrantyNo}</td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                </>
                            )}
                            <tr>
                                <td className={labelCell}>วันที่รับสินค้าจากลูกค้า :</td>
                                <td> 
                                    {receiveFromUserDt ?
                                    new Date(receiveFromUserDt).toLocaleDateString('th-TH') : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </fieldset>
            {dcSentReturnName?.trim() && (
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC ตีกลับสินค้าคืนสาขา</legend>
                    <div className="flex justify-center">
                        <table className="min-w-[560px]">
                            <tbody>
                                <tr>
                                    <td className={labelCell}>ผู้ส่งมอบ :</td>
                                    <td>{dcSentReturnName}</td>
                                </tr>
                                <tr>
                                    <td className={labelCell}>ผู้รับ :</td>
                                    <td>{receiveReturnName}</td>
                                </tr>
                                <tr>
                                    <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                    <td>{dcSentReturnTel}</td>
                                </tr>
                                <tr>
                                    <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                    <td>
                                        {dcSentReturnDate ?
                                         new Date(dcSentReturnDate).toLocaleDateString('th-TH') : '-'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </fieldset>
            )}
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC รับสินค้าจากสาขา</legend>
                <div className="flex justify-center">
                    <table className="min-w-[560px]">
                        <tbody>
                            <tr>
                                <td className={labelCell}>ผู้มารับสินค้า :</td>
                                <td>{sentToDCName}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>เบอร์ติดต่อ :</td>
                                <td>{receiverTel}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>วันที่รับสินค้าจากสาขา :</td>
                                <td>
                                    {dcReceiveDate ?
                                    new Date(dcReceiveDate).toLocaleDateString('th-TH') : '-'}
                                </td>
                            </tr>
                            <tr>
                                <td className={labelCell}>เลขที่ขออนุมัติ :</td>
                                <td>{approvelogID}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>วันที่ DC รับสินค้าเข้าที่ DC :</td>
                                <td>
                                    {dcArriveDate ?
                                    new Date(dcArriveDate).toLocaleDateString('th-TH') : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </fieldset>
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดผู้รับมาสินค้า</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="vendorName" className="form-label">ผู้ขาย (Vendor)<Req /></label>
                        <input
                            id="vendorName"
                            className={inputClass(!!errors.vendorName)}
                            value={vendorName}
                            onChange={e => setVendorName(e.target.value)}
                        />
                        {errors.vendorName && <p className="text-red-600 text-sm mt-1">{errors.vendorName}</p>}
                    </div>
                    <div>
                        <label htmlFor="receiverName" className="form-label">ผู้มารับสินค้า<Req /></label>
                        <input
                            id="receiverName"
                            className={inputClass(!!errors.receiverName)}
                            value={receiverName}
                            onChange={e => setReceiverName(e.target.value)}
                        />
                        {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
                    </div>
                    <div>
                        <label htmlFor="vendorReceiverTel" className="form-label">เบอร์ติดต่อ<Req /></label>
                        <input
                            id="vendorReceiverTel"
                            className={`${inputClass(!!errors.vendorReceiverTel)} w-50`}
                            value={vendorReceiverTel}
                            onChange={e => setVendorReceiverTel(e.target.value)}
                        />
                        {errors.vendorReceiverTel && <p className="text-red-600 text-sm mt-1">{errors.vendorReceiverTel}</p>}
                    </div>
                    <div >
                        <label htmlFor="sendDate" className="form-label block mb-1">วันที่ส่งสินค้า<Req /></label>
                            <DatePicker
                                id="sendDate"
                                selected={sendDate}
                                onChange={(date) => setSendDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.sendDate)}
                            />
                            {errors.sendDate && <p className="text-red-600 text-sm mt-1">{errors.sendDate}</p>}
                    </div>
                                        <div>
                        <label className="form-label flex items-center justify-between">
                            <span>ไฟล์แนบ<Req /></span>
                            {exampleImages && Object.values(exampleImages).some((img: any) => img?.url) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setExampleModal({
                                            isOpen: true,
                                            title: "ตัวอย่างรูปถ่ายการส่งมอบให้ช่างซ่อม",
                                            imageUrl: "",
                                            desc: ""
                                        });
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-0.5 cursor-pointer transition duration-150 font-bold"
                                >
                                    💡 ดูตัวอย่างการถ่ายภาพ
                                </button>
                            )}
                        </label>

                        <input
                            ref={fileInputRef}
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
                                                if (next.length === 0 && fileInputRef.current) {
                                                    fileInputRef.current.value = "";
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

        {/* Example Images Modal */}
        {exampleModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden animate-zoomIn flex flex-col border border-slate-200 h-[80vh]">
                    <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between shadow-sm">
                        <span className="font-bold text-sm flex items-center gap-1.5">
                            📷 {exampleModal.title}
                        </span>
                        <button 
                            onClick={() => setExampleModal(prev => ({ ...prev, isOpen: false }))} 
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto bg-slate-50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {["slot1", "slot2", "slot3", "slot4"].map((slot) => {
                                const img = exampleImages?.[slot];
                                if (!img || !img.url) return null;
                                
                                let slotTitle = "";
                                if (slot === "slot1") slotTitle = "1. ภาพถ่ายตัวเครื่องส่งมอบช่าง";
                                else if (slot === "slot2") slotTitle = "2. ภาพถ่ายเอกสารส่งมอบช่าง";
                                else if (slot === "slot3") slotTitle = "3. ภาพถ่ายป้าย Serial";
                                else slotTitle = "4. ภาพสภาพภายนอกเพิ่มเติม";

                                return (
                                    <div key={slot} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col space-y-2">
                                        <span className="text-[11px] font-bold text-slate-800 border-b border-slate-100 pb-1">{slotTitle}</span>
                                        <div className="aspect-video relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                                            <img src={img.url} alt={slotTitle} className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 min-h-[40px]">
                                            {img.desc || "ไม่มีคำอธิบายประกอบ"}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white border-t border-slate-100 px-5 py-3 flex justify-end">
                        <button
                            onClick={() => setExampleModal(prev => ({ ...prev, isOpen: false }))}
                            className="btn btn-sm btn-ghost rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                </div>
            </div>
        )}
        </section>
    );
}
