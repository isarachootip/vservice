"use client";

import { use, useEffect, useState } from "react";
import { DatePicker } from "react-datepicker";
import { useRouter } from "next/navigation";

type quotationList = {
    id: number;
    review_price_date?: string | Date | null;
    repair_order?: string | null;
    part_cost?: number | string | null;
    part_warranty_flg?: "Y" | "N" | null;
    labor_cost?: number | string | null;
    labor_warranty_flg?: "Y" | "N" | null;
    user_repair_flg?: "Y" | "N" | null;
    user_repair_reason?: string | null;
    num_of_repair_day?: string | null;
    num_of_guarantee_day?: string | null;
    quotation_no?: string | null;
};

type Row = {
    id: number;
    quotationId: number;
    desc: string;
    parts: number;
    labor: number;
    warrantyParts: boolean;
    warrantyLabor: boolean;
};

type approval = "Y" | "N" | null;
type repairOption = "Y" | "N";

type Errors = Partial<{
    approveFlg: string;
    approveDate: string;
    ticketNum: string;
}>;

// const toYMD = (v: unknown): string => {
//     if (!v) return "";
//     const d = new Date(String(v));
//     return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
// };

export default function RequestViewPage({ params }: { params: Promise<{ id: string }> }) {
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
    const [status,      setStatus]    = useState<number | "">("");

    //* section Quotation
    const [rows, setRows] = useState<Row[]>([]);
    const [quotationNo, setQuotationNo] = useState("");
    const [reviewPriceDate, setReviewPriceDate] = useState<string>("");
    const [avgRepairDay, setAvgRepairDay] = useState("");
    const [guaranteeDay, setGuaranteeDay] = useState("");
    const [approveFlg, setApproveFlg] = useState<approval>(null);
    const [approveDate, setApproveDate] = useState<Date | null>(null);
    const [ticketNum, setTicketNum] = useState("");

    //* section reason
    const [repairDecision, setRepairDecision] = useState<Record<number, repairOption>>({});
    const [repairReason, setRepairReason] = useState<Record<number, string>>({});

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
            // console.log("check obj : ",r)
            const [fn = "", ln = ""] = String(r.customer_name || "").split(" ", 2);
            if (!alive) return;

            setVendorName(r.vendor_name ?? "");
            setReceiverName(r.send_to_vendor_by ?? "");
            setSendDate(r.send_to_vendor_date ?? "");
            setStatus(r.status);

            const q: quotationList[] = Array.isArray(r?.quotation)
            ? (r.quotation as quotationList[])
            : [];
            if (q.length > 0) {
                setQuotationNo(q[0]?.quotation_no ?? "");
                setReviewPriceDate(String(q[0]?.review_price_date ?? ""));
                setAvgRepairDay(q[0]?.num_of_repair_day ?? "");
                setGuaranteeDay(q[0]?.num_of_guarantee_day ?? "");
                setRows(
                    q.map((row, idx) => ({
                        id: idx + 1,
                        quotationId: row.id,
                        desc: String(row.repair_order ?? ""),
                        parts: Number(row.part_cost ?? 0),
                        labor: Number(row.labor_cost ?? 0),
                        warrantyParts: (row.part_warranty_flg ?? "") === "Y",
                        warrantyLabor: (row.labor_warranty_flg ?? "") === "Y",
                    }))
                );
               
                setRepairDecision(() => {
                    const obj: Record<number, repairOption> = {};
                    q.forEach((row) => {
                        obj[row.id] = (row.user_repair_flg === "Y" || row.user_repair_flg === "N")
                        ? row.user_repair_flg
                        : "Y"; 
                    });
                    return obj;
                });
                
                setRepairReason(() => {
                    const obj: Record<number, string> = {};
                    q.forEach((row) => {
                        const key = row.id; // ✅ quotationId
                        obj[key] = String(row.user_repair_reason ?? "");
                    });
                    return obj;
                });
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
        if (!approveFlg)  nextErrors.approveFlg    = "กรุณาเลือกผลการอนุมัติจากลูกค้า";
        if (!approveDate)  nextErrors.approveDate    = "กรุณาเลือกวันที่บันทึกผลการอนุมัติจากลูกค้า";
        if (!ticketNum.trim()) nextErrors.ticketNum = "กรุณากรอก Ticket No.";
        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        for (const r of rows) {
            const d = repairDecision[r.quotationId];
            if (d === "N" && !repairReason[r.quotationId]?.trim()) {
                alert(`กรุณาระบุเหตุผล รายการที่ ${r.id}`);
                return;
            }
        }
        
        // console.log("check repairDecision :: ",repairDecision)
        const quotationUpdates = rows.map(r => ({
            quotationId: r.quotationId,
            repairDecision: repairDecision[r.quotationId] ?? "",
            repairReason: repairReason[r.quotationId] ?? "",
        }));

        try {
            const statusNum = typeof status === "number" ? status : Number(status || 0);
            const mode = statusNum === 232 ? "DC" : "VEN";

            const approveDateStr = toYMD(approveDate);
            const payload = {
                requestId: id,
                quotationUpdates,
                approveFlg,     
                approveDate: approveDateStr,
                ticketNum: ticketNum,       
                updatedUser, 
                mode,                
            };

            const res = await fetch("/api/quotation/update-user-approve", {
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
                    <table className="ml-[5em]">
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
                            <tr>
                               

                                <td className="pr-4 text-right text-base text-slate-900 align-top whitespace-nowrap">
                                    ระยะเวลาการซ่อมประมาณ :
                                </td>
                                <td className="pb-2 text-slate-900 text-base">
                                    {avgRepairDay} วัน
                                </td>
                            </tr>
                            <tr>
                                <td className="pr-4 text-right text-base text-slate-900 align-top whitespace-nowrap">
                                    ระยะเวลารับประกันงานซ่อม :
                                </td>
                                <td className="pb-2 text-slate-900 text-base">
                                    {guaranteeDay} วัน
                                </td>
                            </tr>

                            {rows.map(r => (
                            <tr key={r.id} className="align-top">
                                <td className="pr-4 text-right text-slate-500 whitespace-nowrap">{r.id})</td>
                                <td className="py-1">
                                <div className="mb-1">
                                    <span className="text-slate-600 inline-block w-24">รายการซ่อม :</span>
                                    <span className="text-slate-900">{r.desc || "-"}</span>
                                </div>

                                <div className="mb-1 flex flex-nowrap items-center gap-2">
                                    <span className="text-slate-600 inline-block w-18">ค่าอะไหล่ :</span>
                                    <span className="tabular-nums">{money(r.parts || 0)}</span>
                                    {r.warrantyParts && (
                                        <span className="ml-2 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-700 align-middle whitespace-nowrap">
                                            ในประกัน
                                        </span>
                                    )}

                                    <span className="mx-2 text-slate-500">+</span>

                                    <span className="text-slate-600 inline-block w-16">ค่าแรง :</span>
                                    <span className="tabular-nums">{money(r.labor || 0)}</span>
                                    {r.warrantyLabor && (
                                        <span className="ml-2 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs text-sky-700 align-middle whitespace-nowrap">
                                            ในประกัน
                                        </span>
                                    )}

                                    <select
                                        className="ml-4 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                                        value={repairDecision[r.quotationId] ?? ""}
                                        onChange={e =>
                                            setRepairDecision(prev => ({
                                            ...prev,
                                            [r.quotationId]: e.target.value as repairOption,
                                            }))
                                        }
                                        >
                                        <option value="Y">ซ่อม</option>
                                        <option value="N">ไม่ซ่อม</option>
                                    </select>
                                </div>

                                {repairDecision[r.quotationId] === "N" && (
                                    <div className="mt-2 ml-14">
                                        <label className="block text-xs text-slate-600 mb-1">
                                            เหตุผล :
                                        </label>
                                        <textarea
                                            className="w-full max-w-md rounded-md border border-slate-300 px-2 py-1 text-sm"
                                            rows={2}
                                            value={repairReason[r.quotationId] ?? ""}
                                            onChange={e =>
                                            setRepairReason(prev => ({
                                                ...prev,
                                                [r.quotationId]: e.target.value,
                                            }))
                                            }
                                            placeholder="..."
                                        />
                                    </div>
                                )}


                                <div>
                                    <span className="text-slate-600 inline-block w-28">รวม :</span>
                                    <span className="font-semibold tabular-nums text-slate-900">
                                    {money(lineTotal(r))}
                                    </span>
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
                                            .filter(r => repairDecision[r.quotationId] === "Y")
                                            .reduce((s, r) => s + effectiveParts(r), 0)
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                                    <div className="text-xs text-slate-500">ค่าแรงทั้งหมด</div>
                                    <div className="text-sm font-semibold tabular-nums text-slate-900">
                                        {money(
                                        rows
                                            .filter(r => repairDecision[r.quotationId] === "Y")
                                            .reduce((s, r) => s + effectiveLabor(r), 0)
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[160px]">
                                    <div className="text-xs text-slate-500">รวมสุทธิ</div>
                                    <div className="text-lg font-semibold tabular-nums text-slate-900">
                                        {money(
                                        rows
                                            .filter(r => repairDecision[r.quotationId] === "Y")
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
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการอนุมัติ</legend>
                    <div className="ml-3 sm:ml-6 space-y-4">
                        <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
                            <span className="form-label whitespace-nowrap">ผลการอนุมัติจากลูกค้า<Req /></span>
                            <div className="flex flex-wrap items-center gap-4 ml-4">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="approveFlg"
                                        value="Y"
                                        checked={approveFlg === "Y"}
                                        onChange={() => setApproveFlg("Y")}
                                    />
                                    <span>อนุมัติให้ซ่อม</span>
                                </label>

                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="approveFlg"
                                        value="N"
                                        checked={approveFlg === "N"}
                                        onChange={() => setApproveFlg("N")}
                                    />
                                    <span>ไม่อนุมัติให้ซ่อม</span>
                                </label>
                            </div>
                            {errors.approveFlg && <p className="text-red-600 text-sm">{errors.approveFlg}</p>}
                        </div>
                        <div className="mt-1">
                            <label
                                htmlFor="approveDate"
                                className="form-label block mb-1"
                            >
                                วันที่บันทึกผลการอนุมัติจากลูกค้า<Req />
                            </label>
                            <DatePicker
                                id="approveDate"
                                selected={approveDate}
                                onChange={(date) => setApproveDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.approveDate)}
                            />
                            {errors.approveDate && (
                                <p className="text-red-600 text-sm mt-1">
                                {errors.approveDate}
                                </p>
                            )}
                        </div>
                        <div className="mt-1">
                            <label
                                htmlFor="ticketNum"
                                className="form-label block mb-1"
                            >
                                Ticket No.<Req />
                            </label>
                            <input
                                id="ticketNum"
                                className={`${inputClass(!!errors.ticketNum)} w-50`}
                                value={ticketNum}
                                onChange={e => setTicketNum(e.target.value)}
                            />
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
