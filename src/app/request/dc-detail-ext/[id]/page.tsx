"use client";

import { use, useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Undo2 } from "lucide-react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    dcArriveDate: string;
}>;

type UserInfo = {
    user_name: string;
    role?: string;
    permissions?: string[];
};

export default function RequestDCDetailExtPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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

    //* สำหรับ DC
    const [sentToDCName, setSentToDCName] = useState("");
    const [dcReceiveDate, setDcReceiveDate] = useState<string>("");
    const [approvelogID, setApprovelogID] = useState("");
    const [dcArriveDate, setDcArriveDate] = useState<Date | null>(null);
    const [receiverTel, setReceiverTel] = useState("");
    //* กรณี GR ตีกลับสินค้าคืนสาขา
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
            setStatus(r.status);
            setReceiveFromUserDt(r.receive_from_user_date ?? "");

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

            //* dc
            setSentToDCName(r.dc_receiver_name);
            setApprovelogID(r.approvelog_id);
            setDcReceiveDate(r.dc_receive_date);
            setReceiverTel(r.dc_receiver_tel);

            //* GR reject (DC คืนสินค้าให้สาขา)
            setDcSentReturnName(r.dc_rej_return_send_by ?? "");
            setReceiveReturnName(r.dc_rej_return_receive_by ?? "");
            setDcSentReturnDate(r.dc_rej_return_date ?? "");
            setDcSentReturnTel(r.dc_rej_return_tel ?? "");

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
            next.dcArriveDate = "กรุณากรอกวันที่";
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
        if (!dcArriveDate)  nextErrors.dcArriveDate = "กรุณาเลือกวันที่ DC รับสินค้าเข้าที่ DC";

        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const dateStr = toYMD(dcArriveDate);
        const formData = new FormData();
        formData.append("requestId", String(id));
        formData.append("dcArriveDate", dateStr ?? "");
        formData.append("updatedUser", updatedUser);
        formData.append("status", String(status ?? ""));

        try {
            const res = await fetch("/api/request/update-dc-info", {
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

    const formatDate = (v: unknown) => {
        if (!v) return "-";
        const d = new Date(v as string);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH");
    };
    
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
                    <table className="min-w-[560px] table-fixed">
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
                                {formatDate(receiveFromUserDt)}
                            </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
            </fieldset>
            {dcSentReturnName && (
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC ตีกลับสินค้าคืนสาขา</legend>
                        <div className="flex justify-center">
                            <table className="min-w-[560px]">
                                <tbody>
                                    <tr>
                                        <td className={labelCell}>ผู้ส่งมอบ :</td>
                                        <td>{dcSentReturnName || "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className={labelCell}>ผู้รับ :</td>
                                        <td>{receiveReturnName || "-"}</td>
                                    </tr>
                                    <tr>
                                        <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                        <td>{dcSentReturnTel || "-"}</td>
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
                        </tbody>
                    </table>
                </div>
            </fieldset>
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC รับสินค้าเข้าที่ DC</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2" >
                        <label htmlFor="dcArriveDate" className="form-label block mb-1">วันที่ DC รับสินค้าเข้าที่ DC<Req /></label>
                            <DatePicker
                                id="dcArriveDate"
                                selected={dcArriveDate}
                                onChange={(date) => setDcArriveDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.dcArriveDate)}
                            />
                            {errors.dcArriveDate && <p className="text-red-600 text-sm mt-1">{errors.dcArriveDate}</p>}
                    </div>
                </div>
            </fieldset>
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
            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    className="btn-back"
                    onClick={() => history.back()}
                >
                    ย้อนกลับ
                </button>
                <>
                    {((userInfo?.role === "ADMIN" || userInfo?.role === "ADMIN DC" || userInfo?.role === "DC") 
                        && (statusNum === 21) ) && (
                        <button
                            type="button"
                            className="btn-danger"
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
        </section>
    );
}
