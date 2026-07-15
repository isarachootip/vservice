"use client";

import { use, useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    vendorName: string;
    receiverName: string;
    sendDate: string;
    receiverTel: string;
    attachments?: string;
}>;

export default function RequestVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    const [issue,       setIssue]       = useState("");
    const [qty,         setQty]         = useState<number | "">("");
    const [sku,         setSku]         = useState<number | "">("");
    const [barcode,     setBarcode]     = useState("");

    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [updatedUser, setUpdatedUser] = useState("");
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    //* สำหรับ section Vendor ตีราคา
    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverTel, setReceiverTel] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

            setReceiveFromUserDt(r.receive_from_user_date ?? "");
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
        if (!receiverName.trim())    nextErrors.receiverName    = "กรุณากรอกผู้มารับสินค้า";
        if (!receiverTel.trim())       nextErrors.receiverTel   = "กรุณากรอกเบอร์ติดต่อ";
        if (!sendDate)  nextErrors.sendDate    = "กรุณากรอกวันที่ส่งสินค้า";
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
        formData.append("receiverTel", receiverTel);
        formData.append("sendDate", sendDateStr ?? "");
        formData.append("updatedUser", updatedUser);

        attachments.forEach((file) => {
            formData.append("files", file);
        });
        
        try {
            const res = await fetch("/api/request/update-vendor-info", {
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

    const labelCell ="w-56 pr-4 text-right align-top whitespace-nowrap";

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            เพิ่มรายละเอียดใบแจ้งซ่อม (GR)
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
                                <td className={labelCell}>จำนวน :</td>
                                <td>{qty}  ชิ้น</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>SKU :</td>
                                <td>  
                                    {sku !== null && sku !== undefined
                                        ? String(sku).padStart(7, "0")
                                        : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td className={labelCell}>Barcode :</td>
                                <td>{barcode}</td>
                            </tr>
                            <tr>
                                <td className={labelCell}>อาการที่พบ :</td>
                                <td>{issue}</td>
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
                        <label htmlFor="receiverTel" className="form-label">เบอร์ติดต่อ<Req /></label>
                        <input
                            id="receiverTel"
                            className={`${inputClass(!!errors.receiverTel)} w-50`}
                            value={receiverTel}
                            onChange={e => setReceiverTel(e.target.value)}
                        />
                        {errors.receiverTel && <p className="text-red-600 text-sm mt-1">{errors.receiverTel}</p>}
                    </div>
                    <div>
                        <label className="form-label">
                            ไฟล์แนบ<Req />
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
        </section>
    );
}
