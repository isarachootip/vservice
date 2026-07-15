"use client";

import { use, useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import { useRouter } from "next/navigation";

type Errors = Partial<{
    vendorSentName: string;
    receiverName : string;
    vendorReturnDate: string;
    vendorSentTel: string;
    attachments?: string;
}>;

type Row = {
    id: number;
    request_no: string;
    store_code: string;
    product_type: string;
    brand: string;
    serial_no: string;
    arrive_to_dc_date: string;
};

function ListTable(
    { 
        brand, status, exId, receiverName, vendorSentName,
        vendorReturnDate, vendorSentTel, updatedUser, attachments, onClose, 
    } : 
    { 
        brand: string; status: number | null; exId: string; receiverName: string; vendorSentName: string;
        vendorReturnDate: Date | null; vendorSentTel: string; updatedUser: string; attachments: File[]; 
        onClose: () => void;
    }) {
    const [rows, setRows] = useState<Row[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const routers = useRouter();

    useEffect(() => {
        if (!brand || status === null) return;
            
        const params = new URLSearchParams();
        if (brand) params.set("brand", brand);
        if (status !== null) {
            params.set("status", String(status));
        }
        if (exId !== null ) params.set("id", exId);

        fetch(`/api/request/find-by-brand?${params.toString()}`)
            .then(res => res.json())
            .then(data => setRows(data.items || []));
    }, [brand, status, exId]);

    const toggle = (id: number) => {
        setSelected(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };
    //* for use on Pop-Up
    const toYMD = (date: Date | null): string => {
        if (!date) return "";

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");

        return `${y}-${m}-${d}`;
    };

    const confirmSave = async () => {
        if (selected.length === 0) {
            alert("กรุณาเลือกรายการ");
            return;
        }
        if (!vendorSentName.trim()) {
            alert("กรุณากรอกชื่อผู้ส่งมอบ");
            return;
        }
        if (!receiverName.trim()) {
            alert("กรุณากรอกชื่อผู้รับ");
            return;
        }
        if (!vendorReturnDate) {
            alert("กรุณาเลือกวันที่รับสินค้าคืน");
            return;
        }
        if (!vendorSentTel.trim()) {
            alert("กรุณากรอกเบอร์ติดต่อผู้ส่งมอบ");
            return;
        }
        if (!attachments || attachments.length === 0) {
            alert("กรุณาแนบไฟล์ก่อน");
            return;
        }
        //* id ตัวปัจจุบัน
        const baseId = Number(exId);
        const allIds = Array.from(new Set([baseId, ...selected]));

        const vendorReturnDateStr = toYMD(vendorReturnDate);
        const formData = new FormData();
        formData.append("action", "ProductVendorToDcReturn");
        formData.append("requestIds", JSON.stringify(allIds));
        formData.append("receiverName", receiverName);
        formData.append("vendorSentName", vendorSentName);
        formData.append("vendorReturnDate", vendorReturnDateStr);
        formData.append("vendorSentTel", vendorSentTel);
        formData.append("updatedUser", updatedUser ?? "");
        formData.append("mode", "DC");

        attachments.forEach((file) => {
            formData.append("attachments", file);
        });

        const res = await fetch("/api/request/update-product-return-multi", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data?.message || "บันทึกไม่สำเร็จ");
            return;
        }

        alert("บันทึกข้อมูลร่วมสำเร็จ");
        onClose();
        routers.push("/status");
    };

    return (
        <>
            <table className="w-full text-sm border border-slate-300 table-fixed">
                <thead className="bg-slate-100">
                        <tr className="text-center">
                        <th className="w-10 px-2 py-2"></th>
                        <th className="px-3 py-2">เลขที่ใบแจ้งซ่อม</th>
                        <th className="px-3 py-2">สาขา</th>
                        <th className="px-3 py-2">ประเภท</th>
                        <th className="px-3 py-2">ยี่ห้อ</th>
                        <th className="px-3 py-2">Serial No.</th>
                        <th className="px-3 py-2 w-40">วันที่ DC รับสินค้าเข้า</th>
                    </tr>
                </thead>
                <tbody>
                {rows.length > 0 ? (
                    rows.map(r => (
                        <tr key={r.id} className="border-t hover:bg-slate-50 text-center">
                            <td className="px-2 py-2">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(r.id)}
                                    onChange={() => toggle(r.id)}
                                />
                            </td>
                            <td className="px-3 py-2">{r.request_no}</td>
                            <td className="px-3 py-2">{r.store_code}</td>
                            <td className="px-3 py-2">{r.product_type}</td>
                            <td className="px-3 py-2">{r.brand}</td>
                            <td className="px-3 py-2 break-all">{r.serial_no}</td>
                            <td className="px-3 py-2">
                                {r.arrive_to_dc_date
                                    ? new Date(r.arrive_to_dc_date).toLocaleDateString("th-TH")
                                    : "-"}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                            ไม่พบรายการยี่ห้อเดียวกันในสถานะนี้
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <div className="flex justify-end items-center gap-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-100"
                    >
                    ยกเลิก
                </button>

                <button
                    onClick={confirmSave}
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                    ยืนยัน
                </button>
            </div>
        </>
    );
}

export default function VendorReturnDcDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [status,   setStatus]   = useState<number | null>(null);
    const [updatedUser, setUpdatedUser] = useState("");
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const [receiverName, setReceiverName] = useState("");
    const [vendorSentName, setVendorSentName] = useState("");
    const [vendorReturnDate, setVendorReturnDate] = useState<Date | null>(null);
    const [vendorSentTel, setVendorSentTel] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    //* กรณีบันทึกข้อมูลร่วม
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [brand, setBrand] = useState("");
    // const [productType, setProductType] = useState("");
    // const [model, setModel]             = useState("");
    // const [serial, setSerial]           = useState("");

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
            const it = r.item || {};
            setStatus(r.status ?? null);
            setBrand(it.brand ?? "");
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

    const onSave = async () => {

        const nextErrors: Errors = {};
        if (!vendorSentName.trim())   nextErrors.vendorSentName   = "กรุณากรอกชื่อผู้ส่งมอบ";
        if (!receiverName.trim())    nextErrors.receiverName    = "กรุณากรอกชื่อผู้รับ";
        if (!vendorReturnDate)  nextErrors.vendorReturnDate    = "กรุณาเลือกวันที่รับสินค้าคืน";
        if (!vendorSentTel.trim())   nextErrors.vendorSentTel   = "กรุณากรอกเบอร์ติดต่อผู้ส่งมอบ";
        if (!attachments || attachments.length === 0) nextErrors.attachments = "กรุณาแนบไฟล์";
        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        try {
            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = "DC";
            const vendorReturnDateStr = vendorReturnDate ? toYMD(vendorReturnDate) : "";

            const formData = new FormData();
            formData.append("action", "ProductVendorToDcReturn");
            formData.append("requestId", String(id));
            formData.append("receiverName", receiverName);
            formData.append("vendorSentName", vendorSentName);
            formData.append("vendorReturnDate", vendorReturnDateStr);
            formData.append("vendorSentTel", vendorSentTel);
            formData.append("updatedUser", updatedUser ?? "");
            formData.append("mode", mode);

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
            เพิ่มรายละเอียดการส่งคืนสินค้า (DC)
        </h1>

        {showBulkModal && (
            <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-xl w-[900px] max-h-[80vh] overflow-auto">
                
                <h2 className="text-lg font-semibold mb-4">เลือกรายการ</h2>

                <ListTable 
                    brand={brand} 
                    status={status} 
                    exId={id}
                    receiverName={receiverName}
                    vendorSentName={vendorSentName}
                    vendorReturnDate={vendorReturnDate}
                    vendorSentTel={vendorSentTel}
                    updatedUser={updatedUser}
                    attachments={attachments} 
                    onClose={() => setShowBulkModal(false)} 
                />

                </div>
            </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">
                    รายละเอียดบันทึกการส่งคืนสินค้าจาก Vendor
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="vendorSentName" className="form-label">ผู้ส่งมอบ<Req /></label>
                        <input
                            id="vendorSentName"
                            className={inputClass(!!errors.vendorSentName)}
                            value={vendorSentName}
                            onChange={e => setVendorSentName(e.target.value)}
                        />
                        {errors.vendorSentName && <p className="text-red-600 text-sm mt-1">{errors.vendorSentName}</p>}
                    </div>
                    <div>
                        <label htmlFor="receiverName" className="form-label">ผู้รับ<Req /></label>
                        <input
                            id="receiverName"
                            className={inputClass(!!errors.receiverName)}
                            value={receiverName}
                            onChange={e => setReceiverName(e.target.value)}
                        />
                        {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
                    </div>
                    <div>
                        <label htmlFor="vendorReturnDate" className="form-label block mb-1">วันที่รับสินค้าคืน<Req /></label>
                            <DatePicker
                                id="vendorReturnDate"
                                selected={vendorReturnDate}
                                onChange={(date) => setVendorReturnDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.vendorReturnDate)}
                            />
                            {errors.vendorReturnDate && <p className="text-red-600 text-sm mt-1">{errors.vendorReturnDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="vendorSentTel" className="form-label">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                        <input
                            id="vendorSentTel"
                            className={`${inputClass(!!errors.vendorSentTel)} w-50`}
                            value={vendorSentTel}
                            onChange={e => setVendorSentTel(e.target.value)}
                        />
                        {errors.vendorSentTel && <p className="text-red-600 text-sm mt-1">{errors.vendorSentTel}</p>}
                    </div>
                </div>
                <div className="pt-2">
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
                    className="btn-all-submit"
                    onClick={() => setShowBulkModal(true)}
                >
                    บันทึกข้อมูลร่วม
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
