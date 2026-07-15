"use client";

import { use, useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldX, Undo2 } from "lucide-react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    openLogBy: string;
    approvelogID: string;
    openLogDate: string;
    // attachments?: string;
}>;

type UserInfo = {
  user_name: string;
  role?: string;
  permissions?: string[];
};


export default function GrToDcLogPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");
    const [requestNo, setRequestNo] = useState("");

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

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [showRollbackModal, setShowRollbackModal] = useState(false);
    const [rollbackReason, setRollbackReason] = useState("");
    const [updatedUser, setUpdatedUser] = useState("");
    const [status,      setStatus]      = useState<number | "">("");
    const statusNum =
        typeof status === "number"
            ? status
            : Number(status || 0);
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;
    
    //* สำหรับ GR
    const [openLogBy, setOpenLogBy] = useState("");
    const [approvelogID, setApprovelogID] = useState("");
    const [openLogDate, setOpenLogDate] = useState<Date | null>(null);

    //* สำหรับ DC
    // const [sentToDCName, setSentToDCName] = useState("");
    // const [approvelogID, setApprovelogID] = useState("");
    // const [dcReceiveDate, setDcReceiveDate] = useState<Date | null>(null);
    // const [receiverTel, setReceiverTel] = useState("");
    // const [attachments, setAttachments] = useState<File[]>([]);
    // const fileInputRef = useRef<HTMLInputElement | null>(null);
    
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
                setUserInfo({
                    user_name: u.user_name,
                    role: u.role,
                    permissions: Array.isArray(u.permissions) ? u.permissions : [],
                });
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
            setRequestNo(r.request_no); 

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
        if (!openLogBy.trim())   nextErrors.openLogBy   = "กรุณากรอกชื่อผู้เปิด Log";
        if (!openLogDate)  nextErrors.openLogDate    = "กรุณาเลือกวันที่วันที่เปิด Log";
        if (!approvelogID.trim())   nextErrors.approvelogID   = "กรุณากรอกเลขที่ขออนุมัติ";
        // if (!attachments || attachments.length === 0) nextErrors.attachments = "กรุณาแนบไฟล์";
        
        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const dateStr = toYMD(openLogDate);
        const formData = new FormData();
        formData.append("requestId", String(id));
        formData.append("openLogBy", openLogBy);
        formData.append("openLogDate", dateStr ?? "");
        formData.append("approvelogID", approvelogID);
        // formData.append("receiverTel", receiverTel ?? "");
        formData.append("updatedUser", updatedUser);
        formData.append("status", String(status ?? ""));

        // attachments.forEach((file) => {
        //     formData.append("files", file);
        // });

        try {
            const res = await fetch("/api/request/update-gr-log", {
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

    const handleRollback = async () => {
        if (!rollbackReason.trim()) {
            alert("กรุณาระบุเหตุผล");
            return;
        }
        try {
            const res = await fetch(
                `/api/request/rollback?id=${encodeURIComponent(id!)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reason: rollbackReason,
                        updatedUser: userInfo?.user_name ?? "",
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message);

            alert("Reject สำเร็จ");
            setShowRollbackModal(false);
            router.push("/status");
        } catch (err) {
            alert((err as Error).message);
        }
    };

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    const labelCell ="w-80 pr-4 text-right align-top whitespace-nowrap";

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
            </fieldset>
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
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
            </fieldset>
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">
                    รายละเอียด GR เปิด Log ให้ DC ( เลขที่ใบแจ้ง : {requestNo} )
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="openLogBy" className="form-label">
                            ผู้เปิด Log<Req />
                        </label>
                        <input
                            id="openLogBy"
                            className={inputClass(!!errors.openLogBy)}
                            value={openLogBy}
                            onChange={e => setOpenLogBy(e.target.value)}
                        />
                        {errors.openLogBy && <p className="text-red-600 text-sm mt-1">{errors.openLogBy}</p>}
                    </div>
                    <div>
                        <label htmlFor="openLogDate" className="form-label block mb-1">
                            วันที่เปิด Log<Req />
                        </label>
                            <DatePicker
                                id="openLogDate"
                                selected={openLogDate}
                                onChange={(date) => setOpenLogDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.openLogDate)}
                            />
                            {errors.openLogDate && <p className="text-red-600 text-sm mt-1">{errors.openLogDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="approvelogID" className="form-label block mb-1">
                            เลขที่ Log<Req />
                        </label>
                        <input
                            id="approvelogID"
                            className={`${inputClass(!!errors.approvelogID)} w-50`}
                            value={approvelogID}
                            onChange={e => setApprovelogID(e.target.value)}
                        />
                            {errors.approvelogID && <p className="text-red-600 text-sm mt-1">{errors.approvelogID}</p>} 
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
                <>
                    {((userInfo?.role === "ADMIN" || userInfo?.role === "ADMIN GR" || userInfo?.role === "GR") 
                        && (statusNum === 20) ) && (
                        <button
                            type="button"
                            className="btn-danger"
                            // onClick={handleRollback}
                            onClick={() => setShowRollbackModal(true)}
                        >
                            Reject
                            <Undo2 className="h-4 w-4 ml-2" />
                        </button>
                    )}
                </>
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
        {showRollbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    ยืนยันการย้อนขั้นตอน
                </h2>

                <div className="space-y-2">
                    <label className="form-label">
                        กรุณาระบุเหตุผล :
                    </label>

                    <textarea
                        className="input-base min-h-[120px] w-full mt-4"
                        value={rollbackReason}
                        onChange={(e) => setRollbackReason(e.target.value)}
                        placeholder="ระบุเหตุผล..."
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        className="btn-back"
                        onClick={() => {
                            setShowRollbackModal(false);
                            setRollbackReason("");
                        }}
                    >
                        ยกเลิก
                    </button>

                    <button
                        type="button"
                        className="btn-danger"
                        onClick={handleRollback}
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
