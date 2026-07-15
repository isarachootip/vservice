"use client";

import { use, useEffect, useState } from "react";
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
        try {
            const res = await fetch("/api/request/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Id: id, status: newStatus, updatedUser }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "อัปเดตไม่สำเร็จ");

            //* email process
            if (newStatus === 30 && sku && requestNo) {
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

    const labelCell ="w-56 pr-4 text-right align-top whitespace-nowrap";

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            รายละเอียดใบแจ้งซ่อม (GR)
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
                {reason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 mt-4">
                        <div className="font-semibold text-red-700">
                            เหตุผลการ Reject
                        </div>

                        <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                            {reason}
                        </div>

                        <div className="text-xs text-slate-500 mt-2">
                            โดย {rollbackBy} วันที่{" "}
                            {rollbackDt
                                ? new Date(rollbackDt).toLocaleString("th-TH")
                                : "-"}
                        </div>
                    </div>
                )}
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button 
                        type="button"
                        className="btn-dc"
                        onClick={() => {
                            if (!alrtFlg) {
                                setShowDcConfirm(true);
                                return;
                            }
                            onUpdateStatus(20);
                        }}
                    >
                        จัดส่งให้ DC
                    </button>
                    <button 
                        type="button" 
                        className="btn-vendor" 
                        onClick={() => onUpdateStatus(30)}>
                        จัดส่งให้ Vendor
                    </button>
                    <button
                        type="button"
                        className="btn-back"
                        onClick={() => history.back()}
                    >
                        ย้อนกลับ
                    </button>
                </div>
            </form>
        </div>
        {showDcConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl w-[420px] p-6">
                <h2 className="text-lg font-semibold text-slate-800">
                        ยืนยันการจัดส่ง
                    </h2>
                    <p className="mt-3 text-m text-slate-600 leading-relaxed">
                        สินค้าดังกล่าวไม่ได้อยู่ในรายการจัดส่งผ่าน DC
                        <br />
                        ยืนยันการจัดส่งใช่หรือไม่ ?
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                            onClick={() => setShowDcConfirm(false)}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            className="btn-submit"
                            onClick={() => {
                                setShowDcConfirm(false);
                                onUpdateStatus(20);
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
