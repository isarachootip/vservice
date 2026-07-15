"use client";

import { use, useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import { useRouter } from "next/navigation";

type Errors = Partial<{
    grSentName: string;
    receiverName : string;
    grReturnDate: string;
    grSentTel: string;
    location: string;
    attachments?: string;
}>;

export default function GrReturnCsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Errors>({});

    const [status,   setStatus]   = useState<number | "">("");
    const [updatedUser, setUpdatedUser] = useState("");
    
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    const [grSentName, setGrSentName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [grReturnDate, setGrReturnDate] = useState<Date | null>(null);
    const [grSentTel, setGrSentTel] = useState("");
    const [location, setLocation] = useState("");
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
            setStatus(r.status);
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
        if (!grSentName.trim())   nextErrors.grSentName   = "กรุณากรอกชื่อผู้ส่งมอบ";
        if (!receiverName.trim())    nextErrors.receiverName    = "กรุณากรอกชื่อผู้รับ";
        if (!grSentTel.trim())    nextErrors.grSentTel    = "กรุณากรอกเบอร์ผู้ส่งมอบ";
        if (!location.trim())    nextErrors.location    = "กรุณากรอก Location";
        if (!grReturnDate)  nextErrors.grReturnDate    = "กรุณาเลือกวันที่รับสินค้าคืน";
        if (!attachments || attachments.length === 0) nextErrors.attachments = "กรุณาแนบไฟล์";
        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        try {
            const statusNum = typeof status === "number" ? status : Number(status || 0);
            let mode = "";
            if(statusNum === 2361){
                mode = "DC"
            }else{
                mode = "VEN"
            }
            const grReturnDateStr = grReturnDate ? toYMD(grReturnDate) : "";

            const formData = new FormData();
            formData.append("action", "ProductGrReturnToCs");
            formData.append("requestId", String(id));
            formData.append("receiverName", receiverName);
            formData.append("grSentName", grSentName);
            formData.append("grReturnDate", grReturnDateStr);
            formData.append("grSentTel", grSentTel);
            formData.append("location", location);
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
            เพิ่มรายละเอียดการส่งคืนสินค้า (CS)
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">
                    รายละเอียดบันทึกการส่งคืนสินค้าจาก GR
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="grSentName" className="form-label">ผู้ส่งมอบ<Req /></label>
                        <input
                            id="grSentName"
                            className={inputClass(!!errors.grSentName)}
                            value={grSentName}
                            onChange={e => setGrSentName(e.target.value)}
                        />
                        {errors.grSentName && <p className="text-red-600 text-sm mt-1">{errors.grSentName}</p>}
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
                        <label htmlFor="grReturnDate" className="form-label block mb-1">วันที่รับสินค้าคืน<Req /></label>
                            <DatePicker
                                id="grReturnDate"
                                selected={grReturnDate}
                                onChange={(date) => setGrReturnDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.grReturnDate)}
                            />
                            {errors.grReturnDate && <p className="text-red-600 text-sm mt-1">{errors.grReturnDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="grSentTel" className="form-label">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                        <input
                            id="grSentTel"
                            className={`${inputClass(!!errors.grSentTel)} w-50`}
                            value={grSentTel}
                            onChange={e => setGrSentTel(e.target.value)}
                        />
                        {errors.grSentTel && <p className="text-red-600 text-sm mt-1">{errors.grSentTel}</p>}
                    </div>
                    <div>
                        <label htmlFor="location" className="form-label">Location<Req /></label>
                        <input
                            id="location"
                            className={`${inputClass(!!errors.location)} w-50`}
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                        />
                        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
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
