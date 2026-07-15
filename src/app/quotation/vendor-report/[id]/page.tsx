"use client";

import { use, useEffect, useState } from "react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";
import { BadgeCheck, BadgeX, CircleCheck, CircleX } from "lucide-react";

type quotationList = {
    review_price_date?: string | Date | null;
    repair_order?: string | null;
    part_cost?: number | string | null;
    part_warranty_flg?: "Y" | "N" | null;
    labor_cost?: number | string | null;
    labor_warranty_flg?: "Y" | "N" | null;
    user_approve_date?: string | Date | null;
    user_approve_flg?: "Y" | "N" | null;
    ticket_no?: string | null;
    user_repair_flg?: "Y" | "N" | null;
    user_repair_reason?: string | null;
    quotation_no?: string | null;
};

type Row = {
    id: number;
    desc: string;
    parts: number;
    labor: number;
    warrantyParts: boolean;
    warrantyLabor: boolean;
    repairCheck: boolean;
    repairReason: string;
};

type approval = "Y" | "N" | null;

type Errors = Partial<{
    notifierName: string;
    notifieDate: string;
}>;

export default function VendorReportPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    //* section ข้อมูลลูกค้า
    // const [firstName, setFirstName] = useState("");
    // const [lastName,  setLastName]  = useState("");
    // const [address,   setAddress]   = useState("");
    // const [phone,     setPhone]     = useState("");

    //* section รายละเอียดสินค้า
    // const [productType, setProductType] = useState("");
    // const [brand,       setBrand]       = useState("");
    // const [model,       setModel]       = useState("");
    // const [serial,      setSerial]      = useState("");
    // const [qty,         setQty]         = useState<number | "">("");
    // const [status,      setStatus]    = useState<number | "">("");

    //* section Vendor ตีราคา
    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);
    const [status,   setStatus]   = useState<number | "">("");

    //* section Quotation
    const [rows, setRows] = useState<Row[]>([]);
    //* ผู้รับแจ้ง
    const [quotationNo, setQuotationNo] = useState("");
    const [reviewPriceDate, setReviewPriceDate] = useState<string>("");
    const [approveFlg, setApproveFlg] = useState<approval>(null);
    const [approveDate, setApproveDate] = useState<string>("");
    const [ticketNum, setTicketNum] = useState("");
    const [notifierName, setNotifierName] = useState("");
    const [notifieDate, setNotifieDate] = useState<Date | null>(null);

    const money = (n: number) =>
        n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const effectiveParts = (r: Row) => (r.warrantyParts ? 0 : (r.parts || 0));
    const effectiveLabor = (r: Row) => (r.warrantyLabor ? 0 : (r.labor || 0));
    const lineTotal = (r: Row) => effectiveParts(r) + effectiveLabor(r);

    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [updatedUser, setUpdatedUser] = useState("");

    const Req = () => <span className="text-red-600 ml-0.5">*</span>;
    const inputClass = (hasError?: boolean) =>
        `input-base ${hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;

    //* CSS
    const labelCell = "w-56 pr-4 text-right align-top whitespace-nowrap";

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
            // console.log("data :",r)
            setVendorName(r.vendor_name ?? "");
            setReceiverName(r.send_to_vendor_by ?? "");
            setSendDate(r.send_to_vendor_date ?? "");
            setStatus(r.status);

            const q: quotationList[] = Array.isArray(r?.quotation)
            ? (r.quotation as quotationList[])
            : [];
            if (q.length > 0) {
                setQuotationNo(q[0]?.quotation_no ?? "");
                setReviewPriceDate(String(q[0]?.review_price_date));
                setApproveDate(String(q[0]?.user_approve_date));
                setTicketNum(q[0]?.ticket_no ?? "");
                setApproveFlg(q[0]?.user_approve_flg === "Y" || q[0]?.user_approve_flg === "N"
                    ? q[0].user_approve_flg
                    : null
                );
                setRows(
                    q.map((row, idx) => ({
                        id: idx + 1,
                        desc: String(row.repair_order ?? ""),
                        parts: Number(row.part_cost ?? 0),
                        labor: Number(row.labor_cost ?? 0),
                        warrantyParts: (row.part_warranty_flg ?? "") === "Y",
                        warrantyLabor: (row.labor_warranty_flg ?? "") === "Y",
                        repairCheck : (row.user_repair_flg ?? "") === "Y",
                        repairReason : String(row.user_repair_reason ?? ""),
                    }))
                );
            } else {
            }
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
        if (!notifierName.trim())   nextErrors.notifierName   = "กรุณากรอกชื่อผู้ขาย";
        if (!notifieDate)  nextErrors.notifieDate    = "กรุณาเลือกวันที่บันทึกการแจ้ง Vendor";
        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        try {
            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = statusNum === 233 ? "DC" : "VEN";

            const notifieDateStr = toYMD(notifieDate);
            const payload = {
                requestId: id,               
                notifierName,
                notifieDate: notifieDateStr,   
                approveFlg,    
                updatedUser,   
                mode,              
            };
            const res = await fetch("/api/request/update-notified", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            รายละเอียดใบเสนอราคา (CS)
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายการซ่อม</legend>
                    <table className="ml-[11em]">
                        <tbody className="text-sm">
                            <tr>
                                <td className="pr-4 text-right text-base text-slate-900 align-top">
                                    ผู้ขาย (Vender) :
                                </td>
                                <td className="pb-2 text-slate-900 text-base">
                                    {vendorName}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-4 text-right text-base text-slate-900 align-top">
                                    เลขที่ใบเสนอราคา :
                                </td>
                                <td className="pb-2 text-slate-900 text-base">
                                    {quotationNo}
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-4 text-right text-base text-slate-900 align-top">
                                    วันที่เสนอราคา :
                                </td>
                                <td className="pb-2 text-slate-900 text-base">
                                    {reviewPriceDate
                                    ? new Date(reviewPriceDate).toLocaleDateString("th-TH")
                                    : "-"}
                                </td>
                            </tr>

                            {rows.map(r => (
                            <tr key={r.id} className="align-top">
                                <td className="pr-4 text-right text-slate-500 whitespace-nowrap">{r.id})</td>
                                <td className="py-1">
                                    <div className="mb-1">
                                        <span className="text-slate-600 inline-block w-28">รายการซ่อม :</span>
                                        <span className="text-slate-900">{r.desc || "-"}</span>
                                    </div>

                                    <div className="mb-1">
                                        <span className="text-slate-600 inline-block w-28">ค่าอะไหล่ :</span>
                                        <span className="tabular-nums">{money(r.parts || 0)}</span>
                                        {r.warrantyParts && (
                                        <span className="ml-2 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-700 align-middle">
                                            ในประกัน
                                        </span>
                                        )}

                                        <span className="mx-2 text-slate-500">+</span>

                                        <span className="text-slate-600 inline-block w-28">ค่าแรง :</span>
                                        <span className="tabular-nums">{money(r.labor || 0)}</span>
                                        {r.warrantyLabor && (
                                        <span className="ml-2 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-700 align-middle">
                                            ในประกัน
                                        </span>
                                        )}
                                    </div>

                                    <div>
                                        <span className="text-slate-600 inline-block w-28">รวม :</span>
                                        <span className="font-semibold tabular-nums text-slate-900">
                                            {money(lineTotal(r))}
                                        </span>
                                    </div>

                                     <div>
                                        <span className="text-slate-600 inline-block">สถานะซ่อม :</span>
                                        {r.repairCheck ? (
                                            <>
                                                <CircleCheck className="inline-block text-green-500 w-4 h-4 ml-1" />
                                            </>
                                        ) : (
                                            <>
                                                <CircleX className="inline-block text-red-500 w-4 h-4 ml-1" />
                                                <span className="text-red-500 text-xs ml-1">{r.repairReason || ""}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            ))}

                            {/* สรุป */}
                            <tr>
                            <td />
                            <td className="pt-4">
                                <div className="flex flex-wrap gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                                    <div className="text-xs text-slate-500">ค่าอะไหล่ทั้งหมด</div>
                                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                                        {money(
                                            rows
                                                .filter(r => r.repairCheck)
                                                .reduce((s, r) => s + effectiveParts(r), 0)
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                                    <div className="text-xs text-slate-500">ค่าแรงทั้งหมด</div>
                                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                                        {money(
                                            rows
                                                .filter(r => r.repairCheck)
                                                .reduce((s, r) => s + effectiveLabor(r), 0)
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[160px]">
                                    <div className="text-xs text-slate-500">รวมสุทธิ</div>
                                    <div className="text-lg font-semibold tabular-nums text-slate-900">
                                        {money(
                                            rows
                                                .filter(r => r.repairCheck)
                                                .reduce((s, r) => s + lineTotal(r), 0)
                                        )}
                                    </div>
                                </div>
                                </div>
                            </td>
                            </tr>
                        </tbody>
                    </table>
                </fieldset>
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการอนุมัติจากลูกค้า</legend>
                    <table className="ml-[5em]">
                        <tbody>
                            <tr>
                                <td className={labelCell}>ผลการอนุมัติ :</td>
                                <td>
                                    {approveFlg === "Y" ? (
                                        <>
                                            <BadgeCheck className="inline-block text-green-600" />
                                        </>
                                    ) : (
                                        <>
                                            <BadgeX className="inline-block text-red-600" />
                                        </>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className={labelCell}>วันที่บันทึกผลการอนุมัติ :</td>
                                <td>
                                    {approveDate
                                    ? new Date(approveDate).toLocaleDateString("th-TH")
                                    : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td className={labelCell}>Ticket No. :</td>
                                <td>
                                    {ticketNum}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </fieldset>
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการแจ้ง Vendor</legend>
                    <div className="ml-3 sm:ml-6 space-y-4">
                        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
                            <span className="form-label whitespace-nowrap">ชื่อผู้รับทราบ<Req /></span>
                            <div className="flex flex-wrap items-center gap-4">
                                <input
                                    id="notifierName"
                                    className={`${inputClass(!!errors.notifierName)} w-100`}
                                    value={notifierName}
                                    onChange={e => setNotifierName(e.target.value)}
                                />
                            </div>
                            {errors.notifierName && <p className="text-red-600 text-sm">{errors.notifierName}</p>}
                        </div>
                        <div className="mt-1">
                            <label
                                htmlFor="notifieDate"
                                className="form-label block mb-1"
                            >
                                วันที่บันทึกการแจ้ง Vendor<Req />
                            </label>
                            <DatePicker
                                id="notifieDate"
                                selected={notifieDate}
                                onChange={(date) => setNotifieDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.notifieDate)}
                            />
                            {errors.notifieDate && (
                                <p className="text-red-600 text-sm mt-1">
                                {errors.notifieDate}
                                </p>
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
