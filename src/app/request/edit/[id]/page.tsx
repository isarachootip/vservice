"use client";

import { use, useEffect, useState, FormEvent, useRef } from "react";
// import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { DatePicker } from "react-datepicker";
import { CirclePlus, CircleMinus } from "lucide-react";

type Warranty = "in" | "out" | null;
type approval = "Y" | "N" | null;

type Row = {
    id: number;
    quotationId?: number | null;
    desc: string;          
    parts: number;         
    labor: number;        
    warrantyParts: boolean; 
    warrantyLabor: boolean; 
};

type quotationList = {
    id: number | null;
    review_price_date?: string | Date | null;
    repair_order?: string | null;
    part_cost?: number | string | null;
    part_warranty_flg?: "Y" | "N" | null;
    labor_cost?: number | string | null;
    labor_warranty_flg?: "Y" | "N" | null;
    user_approve_date?: string | Date | null;
    user_approve_flg?: "Y" | "N" | null;
    quotation_no?: string | null;
    num_of_repair_day?: string | null;
    num_of_guarantee_day?: string | null;
    ticket_no?: string | null;
};

type ExistAttachment = {
    [step_no: string]: {
        id: number;
        file_name: string;
        file_path: string;
    }[];
};

type Attachment ={
    id: number;
    file_name: string;
    file_path: string;
    step_no: string;
}

type Errors = Partial<{
    //* main
    firstName: string;
    lastName: string;
    phone: string;
    productType: string;
    brand: string;
    qty: string;
    warranty: string;
    warrantyNo: string;
    issue: string;
    sku: string;
    barcode: string;
    receiveFromUserDt: string;
    attachment?: string;
    //* vendor
    vendorName: string;
    receiverName : string;
    sendDate: string;
    receiverTel: string;
    //* CS send to GR
    senderName: string;
    //* quotation
    quotationNo: string;
    reviewPriceDate: string;
    avgRepairDay: string;
    guaranteeDay: string;
    //* user approve
    approveFlg: string;
    approveDate: string;
    ticketNum: string;
    //* vendor report
    notifierName: string;
    notifieDate: string;
    //* product vendor return
    vendorSentName: string;
    vendorReceiveName : string;
    vendorReturnDate: string;
    vendorSenderTel: string;
    //*
    sentName: string;
    customerName : string;
    sentProductReturnDate: string;
    //* HO to DC
    sentToDCName: string;
    dcReceiverTel: string;
    dcReceiveDate: string;
    dcArriveDate: string;
    //* GR to CS
    grSentName: string;
    csReceiverName : string;
    grReturnDate: string;
    grSentTel: string;
    location: string;
    //*
    dcSentName: string;
    dcReceiverName: string;
    vendorSendName: string;
    vendorReturnDcDate: string;
    vendorSentTel: string;
    hoReceiverName : string;
    dcReturnDate: string;
    dcSentTel: string;
    //* GR open log DC
    openLogBy : string;
    openLogDate: string;
    approvelogID: string;
    //* etc
    attachments?: string;
}>;

export default function RequestEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [requestId, setRequestId] = useState<number | "">("");
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    const [itemId,      setItemId]      = useState<number | "">("");
    const [productType, setProductType] = useState("");
    const [brand,       setBrand]       = useState("");
    const [model,       setModel]       = useState("");
    const [serial,      setSerial]      = useState("");
    const [issue,       setIssue]       = useState("");
    const [symptoms,    setSymptoms]    = useState<any[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);
    const [qty,         setQty]         = useState<number | "">("");
    const [skuFlg,      setSkuFlg]      = useState(true);
    const [sku,         setSku]         = useState<number | "">("");
    const [skuLoading, setSkuLoading] = useState(false);
    const [skuError, setSkuError] = useState<string | null>(null);
    const [barcode,     setBarcode]     = useState("");

    //* ไฟล์แนบ
    const [existingAttachments, setExistingAttachments] = useState<ExistAttachment>({});
    const [attachmentsByStep, setAttachmentsByStep] = useState<{
        [step: string]: File[];
    }>({});
    const [serialAttachments, setSerialAttachments] = useState<File[]>([]);
    const [otherAttachments, setOtherAttachments] = useState<File[]>([]);
    const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);

    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    const [status,      setStatus]    = useState<number | "">("");
    const [currentStep, setCurrentStep] = useState<string>("10");

    //* section Vendor มารับสินค้าไปตีราคา
    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);
    const [receiverTel, setReceiverTel] = useState("");

    //* section CS Send to GR
    const [senderName, setSenderName] = useState("");
    const [grReceiverName, setGrReceiverName] = useState("");
    const [grSendDate, setGrSendDate] = useState<Date | null>(null);
    const [grReceiverTel, setGrReceiverTel] = useState("");
    const [csToGrAttachments, setCsToGrAttachments] = useState<File[]>([]);

    //* section Quotation
    const [quotationNo, setQuotationNo] = useState("");
    const [reviewPriceDate, setReviewPriceDate] = useState<Date | null>(null);
    const [avgRepairDay, setAvgRepairDay] = useState("");
    const [guaranteeDay, setGuaranteeDay] = useState("");

    const [rows, setRows] = useState<Row[]>([
            {
            id: 1,
            quotationId: null,
            desc: "",
            parts: 0,
            labor: 0,
            warrantyParts: false,
            warrantyLabor: false,
            },
    ]);

    const parseNum = (v: string) =>
        v.trim() === "" ? 0 : Number(v.replace(/,/g, "")) || 0;

    const money = (n: number) =>
        n.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const effectiveParts = (r: Row) =>
        r.warrantyParts ? 0 : (r.parts || 0);

    const effectiveLabor = (r: Row) =>
        r.warrantyLabor ? 0 : (r.labor || 0);

    const lineTotal = (r: Row) =>
        effectiveParts(r) + effectiveLabor(r);

    const totalParts = rows.reduce((s, r) => s + effectiveParts(r), 0);
    const totalLabor = rows.reduce((s, r) => s + effectiveLabor(r), 0);
    const grandTotal = totalParts + totalLabor;

    const warrantyPartsTotal = rows.reduce((s, r) => s + (r.warrantyParts ? (r.parts || 0) : 0),0);
    const warrantyLaborTotal = rows.reduce((s, r) => s + (r.warrantyLabor ? (r.labor || 0) : 0),0);

    //* section User Approve
    const [approveFlg, setApproveFlg] = useState<approval>(null);
    const [approveDate, setApproveDate] = useState<Date | null>(null);
    const [ticketNum, setTicketNum] = useState("");

    //* section Vendoer Report
    const [notifierName, setNotifierName] = useState("");
    const [notifieDate, setNotifieDate] = useState<Date | null>(null);

    //* section Product Vendor Return
    const [vendorReceiveName, setVendorReceiveName] = useState("");
    const [vendorSentName, setVendorSentName] = useState("");
    const [vendorReturnDate, setVendorReturnDate] = useState<Date | null>(null);
    const [vendorSenderTel, setVendorSenderTel] = useState("");

    //* section Product Customer Return
    const [customerName, setCustomerName] = useState("");
    const [sentName, setSentName] = useState("");
    const [sentProductReturnDate, setSentProductReturnDate] = useState<Date | null>(null);

    //* สำหรับ DC
    const [sentToDCName, setSentToDCName] = useState("");
    const [dcReceiverTel, setDcReceiverTel] = useState("");
    const [dcReceiveDate, setDcReceiveDate] = useState<Date | null>(null);
    const [dcArriveDate, setDcArriveDate] = useState<Date | null>(null);

    //* Vendor back to DC
    const [vendorToDcReceiveBy, setVendorToDcReceiveBy] = useState("");

    //* DC back to GR(HO)
    const [hoReceiverName, setHoReceiverName] = useState("");
    const [dcSentName, setDcSentName] = useState("");
    const [dcReturnDate, setDcReturnDate] = useState<Date | null>(null);
    const [dcSentTel, setDcSentTel] = useState("");

    //* gr-open-dc-log
    const [openLogBy, setOpenLogBy] = useState("");
    const [approvelogID, setApprovelogID] = useState("");
    const [openLogDate, setOpenLogDate] = useState<Date | null>(null);

    //* GR back to CS
    const [grSentName, setGrSentName] = useState("");
    const [csReceiverName, setCsReceiverName] = useState("");
    const [grReturnDate, setGrReturnDate] = useState<Date | null>(null);
    const [grSentTel, setGrSentTel] = useState("");
    const [location, setLocation] = useState("");

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const csToGrFileInputRef = useRef<HTMLInputElement | null>(null);
    const timelineContainerRef = useRef<HTMLDivElement | null>(null);

    const [errors,  setErrors]  = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [pathSelectedBy, setPathSelectedBy] = useState<string>("");

    //? class list (commodity)
    const [classList, setClassList] = useState<string[]>([]);
    const [classLoading, setClassLoading] = useState(false);
    const [classError, setClassError] = useState<string | null>(null);

    //? brand list (commodity)
    const [brandList, setBrandList] = useState<string[]>([]);
    const [brandLoading, setBrandLoading] = useState(false);
    const [brandError, setBrandError] = useState<string | null>(null);

    const inputClass = (err?: boolean) =>
        `input-base ${err ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`;
    const baseInput =
        "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white";
    const Req = () => <span className="text-red-600 ml-0.5">*</span>;

    //* status flag
    const statusNum =
            typeof status === "number"
                ? status
                : Number(status || 0);

    const parseDate = (v: unknown): Date | null => {
        if (!v) return null;
        if (v instanceof Date) return v;

        const s = String(v);
        const [datePart] = s.split(" ");

        const d = new Date(datePart);
        return isNaN(d.getTime()) ? null : d;
    };

    //*for productType
    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            setClassLoading(true);
            setClassError(null);
            try {
                const res = await fetch("/api/commodity/class", {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const json = await res.json();

                setClassList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                    setClassError("โหลดรายการประเภทสินค้าไม่สำเร็จ");
            } finally {
                setClassLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    //*for brand
    useEffect(() => {
        if (!productType?.trim()) {
            setBrandList([]);
            return;
        }

        const controller = new AbortController();

        const t = setTimeout(async () => {
            setBrandLoading(true);
            setBrandError(null);

            try {
                const res = await fetch(
                    `/api/commodity/brand?class=${encodeURIComponent(productType)}`,
                    { signal: controller.signal, cache: "no-store" }
                );
                const json = await res.json();
                setBrandList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                    setBrandError("โหลดรายการยี่ห้อไม่สำเร็จ");
                    setBrandList([]);
            } finally {
                setBrandLoading(false);
            }
        }, 200); 

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [productType]);

    useEffect(() => {
        if (!skuFlg) {
            setSkuError(null);
            return;
        }

        if (!sku || Number(sku) <= 0) {
            setBrand("");
            setProductType("")
            setSkuError(null);
            return;
        }

        const t = setTimeout(async () => {
            const controller = new AbortController();
            setSkuLoading(true);
            setSkuError(null);

            try {
            const res = await fetch(`/api/commodity/lookup?sku=${encodeURIComponent(sku)}`, {
                signal: controller.signal,
                cache: "no-store",
            });

            const json = await res.json();
            const found = json?.data;

            if (!found) {
                setBrand("");
                setProductType("")
                setSkuError("ไม่พบ SKU ในระบบ");
                return;
            }

            setProductType(found.class_name ?? "");
            setBrand(found.brand ?? "");
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                alert("lookup sku error");
            } finally {
                setSkuLoading(false);
            }
        }, 300);

        return () => clearTimeout(t);
    }, [sku, skuFlg]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);

                const symsRes = await fetch("/api/maintain/symptoms", { cache: "no-store" });
                const symsData = await symsRes.json();
                let symsList: any[] = [];
                if (symsData.ok) {
                    symsList = symsData.symptoms || [];
                    if (alive) setSymptoms(symsList);
                }

                const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");
                
                const r = data.request;
                const [fn = "", ln = ""] = String(r.customer_name || "").split(" ", 2);
                if (!alive) return;

                setRequestId(r.id);
                setFirstName(fn);
                setLastName(ln);
                setAddress(r.address ?? "");
                setPhone(r.phone ?? "");
                setReceiveFromUserDt(parseDate(r.receive_from_user_date));

                const it = r.item || {};
                setItemId(it.id);
                setProductType(it.product_type ?? "");
                setBrand(it.brand ?? "");
                setModel(it.model ?? "");
                setSerial(it.serial_no ?? "");

                const dbIssue = it.issue ?? "";
                let matchedSym = "";
                let remainingIssue = dbIssue;
                if (symsList.length > 0) {
                    const found = symsList.find(s => dbIssue.startsWith(s.name));
                    if (found) {
                        matchedSym = found.name;
                        const regex = new RegExp(`^${found.name}\\s*\\((.*)\\)$`);
                        const match = dbIssue.match(regex);
                        if (match) {
                            remainingIssue = match[1];
                        } else {
                            remainingIssue = dbIssue.substring(found.name.length).trim();
                        }
                    } else if (dbIssue) {
                        matchedSym = "other";
                        remainingIssue = dbIssue;
                    }
                } else if (dbIssue) {
                    matchedSym = "other";
                    remainingIssue = dbIssue;
                }

                setIssue(remainingIssue);
                setSelectedSymptom(matchedSym);
                setQty(typeof it.qty === "number" ? it.qty : "");
            setSku(typeof it.sku_code === "number" ? it.sku_code : "");
            setBarcode(it.bar_code ?? "");
            setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
            setWarrantyNo(it.warranty_no ?? "");
            setStatus(r.status);
            setCurrentStep(String(r.status || "10"));

            //* gr-open-dc-log
            setOpenLogBy(r.gr_open_dc_log_by);
            setOpenLogDate(r.gr_open_dc_log_date);
            setApprovelogID(r.approvelog_id);

            const attachments: Attachment[] =
                Array.isArray(r?.repair_attachment) ? r.repair_attachment : [];
            const groupedAttachments = attachments.reduce(
                (acc: ExistAttachment, file:Attachment) => {
                    const step = file.step_no;
                    if (!acc[step]) acc[step] = [];

                    acc[step].push({
                        id: file.id,
                        file_name: file.file_name,
                        file_path: file.file_path,
                    });

                    return acc;
                },
                {} as {
                    [step_no: string]: {
                        id: number;
                        file_name: string;
                        file_path: string;
                    }[];
                }
            );
            setExistingAttachments(groupedAttachments);

            setVendorName(r.vendor_name ?? "");
            setReceiverName(r.send_to_vendor_by ?? "");
            setSendDate(
                r.send_to_vendor_date
                    ? new Date(String(r.send_to_vendor_date))
                    : null
            );
            setReceiverTel(r.send_to_vendor_tel ?? "")

            //* CS send to GR
            setSenderName(r.cs_send_to_gr_by ?? "");
            setGrReceiverName(r.cs_to_gr_receive_by ?? "");
            setGrSendDate(
                r.cs_send_to_gr_date
                    ? new Date(String(r.cs_send_to_gr_date))
                    : null
            );
            setGrReceiverTel(r.cs_to_gr_tel ?? "");

            //* vendor report
            setNotifieDate(
                r.vendor_notified_date
                    ? new Date(String(r.vendor_notified_date))
                    : null
            );
            setNotifierName(r.vendor_notified_by ?? "");

            //* product vendor return
            setVendorReceiveName(r.vendor_return_receive_by ?? "");
            setVendorReturnDate(
                r.vendor_return_date
                    ? new Date(String(r.vendor_return_date))
                    : null
            );
            setVendorSentName(r.vendor_return_sent_by ?? "");
            setVendorSenderTel(r.vendor_return_sender_tel ?? "");

            //* product customer return
            setSentName(r.customer_receive_sent_by ?? "");
            setSentProductReturnDate(
                r.customer_receive_date
                    ? new Date(String(r.customer_receive_date))
                    : null
            );
            setCustomerName(r.customer_receive_by ?? "");

            //* dc
            setSentToDCName(r.dc_receiver_name ?? "");
            setApprovelogID(r.approvelog_id ?? "-");
            setDcReceiverTel(r.dc_receiver_tel ?? "");
            setDcReceiveDate(
                r.dc_receive_date
                    ? new Date(String(r.dc_receive_date))
                    : null
            );
            setDcArriveDate(
                r.arrive_to_dc_date
                    ? new Date(String(r.arrive_to_dc_date))
                    : null
            );

            setHoReceiverName(r.dc_return_receive_by);
            setDcSentName(r.dc_return_send_by);
            setDcReturnDate(r.dc_return_date);
            setDcSentTel(r.dc_return_tel);
            //* GR back to CS
            setGrSentName(r.gr_send_return_to_cs_by);
            setCsReceiverName(r.gr_send_return_to_cs_receive_by);
            setGrReturnDate(r.gr_send_return_to_cs_date);
            setGrSentTel(r.gr_send_return_to_cs_tel);
            setLocation(r.location);

            //* หา user ทำตอน select path
            try {
                const transRes = await fetch(
                    `/api/request/find?id=${encodeURIComponent(id!)}&getTransactionLog=true`,
                    { cache: "no-store" }
                );
                const transData = await transRes.json();
                const transLogs = Array.isArray(transData?.transactionLogs) ? transData.transactionLogs : [];
                const pathSelectionLog = transLogs.find(
                    (log: {step_no: string | null; act_user_name: string | null}) => log.step_no === "20" || log.step_no === "30"
                );
                if (pathSelectionLog?.act_user_name) {
                    setPathSelectedBy(pathSelectionLog.act_user_name);
                }
            } catch (e) {
                console.error("failed to fetch transaction log:", e);
            }

            const q: quotationList[] = Array.isArray(r?.quotation)
            ? (r.quotation as quotationList[])
            : [];
            if (q.length > 0) {
                setQuotationNo(q[0]?.quotation_no ?? "");
                const rawReviewDate = q[0]?.review_price_date;
                setReviewPriceDate(
                    rawReviewDate
                        ? rawReviewDate instanceof Date
                        ? rawReviewDate
                    : new Date(String(rawReviewDate))
                    : null
                );
                setAvgRepairDay(q[0]?.num_of_repair_day ?? "");
                setGuaranteeDay(q[0]?.num_of_guarantee_day ?? "");
                const rawApproveDate = q[0]?.user_approve_date;
                setApproveDate(
                    rawApproveDate
                        ? rawApproveDate instanceof Date
                        ? rawApproveDate
                    : new Date(String(rawApproveDate))
                    : null
                );
                setApproveFlg(q[0]?.user_approve_flg === "Y" || q[0]?.user_approve_flg === "N"
                    ? q[0].user_approve_flg
                    : null
                );
                setTicketNum(q[0]?.ticket_no ?? "");
                setRows(
                    q.map((row, idx) => ({
                        id: idx + 1,
                        quotationId: row.id ?? null,
                        desc: String(row.repair_order ?? ""),
                        parts: Number(row.part_cost ?? 0),
                        labor: Number(row.labor_cost ?? 0),
                        warrantyParts: (row.part_warranty_flg ?? "") === "Y",
                        warrantyLabor: (row.labor_warranty_flg ?? "") === "Y",
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

    //* timeline 
    const timelineCalculation = () => {
        const buildTimelineSteps = (statusNum: number): { key: string; label: string }[] => {
            const vendorRoute =
                [10, 11, 30, 31, 32, 33, 34, 35, 360, 361, 36, 37];
            const dcRoute =
                [10, 11, 20, 201, 21, 22, 23, 232, 233, 234, 235, 2360, 2361, 236, 237];

            const vendorLabels = {
                10: "เปิดแจ้งซ่อม",
                11: "GR รับสินค้าค้าจาก CS",
                30: "ส่ง Vendor",
                31: "รอ Vendor เสนอราคา",
                32: "ขออนุมัติจากลูกค้า",
                33: "บันทึกผลอนุมัติ",
                34: "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)",
                35: "แจ้งผลให้ Vendor (อนุมัติซ่อม)",
                360: "DC รอส่งสาขา",
                361: "GR รับสินค้าซ่อมคืน",
                36: "CS รับสินค้าจาก GR / รอลูกค้ารับสินค้าคืน",
                37: "ลูกค้ารับสินค้าคืนแล้ว"
            };

            const dcLabels = {
                10: "เปิดแจ้งซ่อม",
                11: "GR รับสินค้าค้าจาก CS",
                20: "ส่ง DC",
                201: "GR เปิด Log / รอ DC มารับสินค้า",
                21: "DC รับสินค้าจากสาขาแล้ว",
                22: "DC รอ Vendor มารับสินค้า",
                23: "DC รอ Vendor เสนอราคา",
                232: "ขออนุมัติจากลูกค้า",
                233: "บันทึกผลอนุมัติ",
                234: "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)",
                235: "แจ้งผลให้ Vendor (อนุมัติซ่อม)",
                2360: "DC รับสินค้าคืนจาก Vendor",
                2361: "GR รับสินค้าคืนจาก DC",
                236: "CS รับสินค้าจาก GR / รอลูกค้ารับสินค้าคืน",
                237: "ลูกค้ารับสินค้าคืนแล้ว"
            };

            if (statusNum <= 11) {
                return [
                    { key: "10", label: vendorLabels[10] },
                    { key: "11", label: vendorLabels[11] },
                    { key: "20/30", label: "ส่ง DC / Vendor" }
                ];
            }

            const isVendor = vendorRoute.includes(statusNum);
            let route = isVendor ? vendorRoute : dcRoute;
            const labels = isVendor ? vendorLabels : dcLabels;

            if (approveFlg === "Y") {
                if (isVendor) {
                    route = route.filter(s => s !== 34);
                } else {
                    route = route.filter(s => s !== 234);
                }
            }

            if (isVendor && !vendorToDcReceiveBy) {
                route = route.filter(s => s !== 360);
            }

            const currentIdx = route.indexOf(statusNum);
            if (currentIdx === -1) {
                return [{ key: String(statusNum), label: labels[statusNum as keyof typeof labels] || `Step ${statusNum}` }];
            }

            const isEarlyStage = [10, 11, 20, 30].includes(statusNum);
            const visibleSteps = isEarlyStage ? route.slice(0, currentIdx + 2) : route.slice(0, currentIdx + 1);
            return visibleSteps.map(step => ({
                key: String(step),
                label: labels[step as keyof typeof labels] || `Step ${step}`
            }));
        };
        return buildTimelineSteps(Number(status) || 10);
    };

    const timelineSteps = timelineCalculation();
    const currentStepIndex = timelineSteps.findIndex(s => s.key === currentStep);

    //* Scroll timeline to center current step
    useEffect(() => {
        if (timelineContainerRef.current) {
            setTimeout(() => {
                const container = timelineContainerRef.current;
                if (container) {
                    const buttons = container.querySelectorAll('button');
                    const targetStepIndex = timelineSteps.findIndex(s => s.key === String(status));
                    const currentButton = buttons[targetStepIndex];
                    if (currentButton) {
                        const containerWidth = container.clientWidth;
                        const buttonLeft = currentButton.offsetLeft;
                        const buttonWidth = currentButton.offsetWidth;
                        const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
                        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    }
                }
            }, 0);
        }
    }, [status, timelineSteps]);

    const validate = (): Errors => {
        const next: Errors = {};

        if (currentStep === "10") {
            if (!firstName.trim())   next.firstName   = "กรุณากรอกชื่อ";
            if (!lastName.trim())    next.lastName    = "กรุณากรอกนามสกุล";
            if (!phone.trim())       next.phone       = "กรุณากรอกโทรศัพท์";
            if (!qty || Number(qty) <= 0) next.qty    = "กรุณาระบุจำนวน (มากกว่า 0)";
            if (!warranty)           next.warranty    = "กรุณาเลือกสถานะรับประกัน";
            if (warranty === "in" && !warrantyNo.trim()) next.warrantyNo = "กรุณากรอกเลขที่ใบประกัน";
            
            if (skuFlg) {
                if (!sku || Number(sku) <= 0) next.sku = "กรุณากรอก SKU";
            } else {
                if (!productType.trim()) next.productType = "กรุณากรอกประเภทสินค้า";
                if (!brand.trim())       next.brand       = "กรุณากรอกยี่ห้อ";
            }
            
            if (!selectedSymptom) {
                next.issue = "กรุณาเลือกอาการเสีย";
            } else if (selectedSymptom === "other" && !issue.trim()) {
                next.issue = "กรุณากรอกรายละเอียดอาการเสีย";
            }
        } else if (currentStep === "11") {
            if (!senderName.trim())        next.senderName   = "กรุณากรอกชื่อผู้ส่ง";
            if (!grReceiverName.trim())    next.receiverName = "กรุณากรอกชื่อผู้รับ";
            if (!grSendDate)               next.sendDate     = "กรุณาเลือกวันที่ส่ง";
            if (!grReceiverTel.trim())     next.receiverTel  = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (currentStep === "201") {
            if (!openLogBy.trim())       next.openLogBy    = "กรุณากรอกชื่อผู้เปิด Log";
            if (!openLogDate)            next.openLogDate  = "กรุณาเลือกวันที่เปิด Log";
            if (!approvelogID.trim())    next.approvelogID = "กรุณากรอกเลขที่ Log";
        } else if (currentStep === "21") {
            if (!sentToDCName.trim())    next.sentToDCName = "กรุณากรอกชื่อผู้มารับสินค้า";
            if (!dcReceiverTel.trim())   next.dcReceiverTel = "กรุณากรอกเบอร์ติดต่อ";
            if (!dcReceiveDate)          next.dcReceiveDate = "กรุณาเลือกวันที่รับสินค้าจากสาขา";
            if (!dcStep1Files.length)    next.attachment = "กรุณาแนบไฟล์";
        } else if (currentStep === "22") {
            if (!dcArriveDate)           next.dcArriveDate = "กรุณาเลือกวันที่ DC รับสินค้าเข้าที่ DC";
        } else if (currentStep === "23") {
            if (!vendorName.trim())      next.vendorName = "กรุณากรอกชื่อผู้ขาย (Vendor)";
            if (!receiverName.trim())    next.receiverName = "กรุณากรอกชื่อผู้มารับสินค้า";
            if (!sendDate)               next.sendDate = "กรุณาเลือกวันที่ส่งสินค้า";
            if (!receiverTel.trim())     next.receiverTel = "กรุณากรอกเบอร์ติดต่อ";
        } else if (currentStep === "232") {
            if (!quotationNo.trim())     next.quotationNo    = "กรุณากรอกเลขที่ใบเสนอราคา";
            if (!reviewPriceDate)        next.reviewPriceDate = "กรุณาเลือกวันที่เสนอราคา";
            if (!avgRepairDay.trim())    next.avgRepairDay   = "กรุณาระบุระยะเวลาซ่อม";
            if (!guaranteeDay.trim())    next.guaranteeDay   = "กรุณาระบุระยะเวลารับประกัน";
            if (!rows.length)            next.attachment     = "กรุณาเพิ่มรายการซ่อมอย่างน้อย 1 รายการ";
        } else if (currentStep === "233") {
            if (!approveFlg)             next.approveFlg     = "กรุณาเลือกผลการอนุมัติ";
            if (!approveDate)            next.approveDate    = "กรุณาเลือกวันที่อนุมัติ";
            if (!ticketNum.trim())       next.ticketNum      = "กรุณากรอก Ticket No.";
        } else if (currentStep === "234" || currentStep === "235") {
            if (!notifierName.trim())    next.notifierName   = "กรุณากรอกชื่อผู้รับทราบ";
            if (!notifieDate)            next.notifieDate    = "กรุณาเลือกวันที่แจ้ง";
        } else if (currentStep === "2360") {
            if (!vendorSentName.trim())      next.vendorSentName      = "กรุณากรอกชื่อผู้ส่งมอบ";
            if (!vendorReceiveName.trim())   next.vendorReceiveName   = "กรุณากรอกชื่อผู้รับ";
            if (!vendorReturnDate)           next.vendorReturnDate    = "กรุณาเลือกวันที่รับสินค้าคืน";
            if (!vendorSenderTel.trim())     next.vendorSenderTel     = "กรุณากรอกเบอร์โทรศัพท์";
         } else if (currentStep === "2361") {
            if (!dcSentName.trim())          next.dcSentName          = "กรุณากรอกชื่อผู้ส่งมอบ";
            if (!hoReceiverName.trim())      next.hoReceiverName      = "กรุณากรอกชื่อผู้รับ";
            if (!dcReturnDate)               next.dcReturnDate        = "กรุณาเลือกวันที่รับสินค้าคืน";
            if (!dcSentTel.trim())           next.dcSentTel           = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (currentStep === "236") {
            if (!grSentName.trim())          next.grSentName          = "กรุณากรอกชื่อผู้ส่งมอบ";
            if (!csReceiverName.trim())      next.csReceiverName      = "กรุณากรอกชื่อผู้รับ";
            if (!grReturnDate)               next.grReturnDate        = "กรุณาเลือกวันที่รับสินค้าคืน";
            if (!grSentTel.trim())           next.grSentTel           = "กรุณากรอกเบอร์โทรศัพท์";
            if (!location.trim())            next.location            = "กรุณากรอก Location";
        } else if (currentStep === "237") {
            if (!sentName.trim())            next.sentName            = "กรุณากรอกชื่อผู้ส่งมอบสินค้าคืน";
            if (!customerName.trim())        next.customerName        = "กรุณากรอกชื่อผู้รับสินค้าคืน";
            if (!sentProductReturnDate)      next.sentProductReturnDate = "กรุณาเลือกวันที่รับสินค้าคืน";
        } else if (currentStep === "31") {
            if (!vendorName.trim())     next.vendorName    = "กรุณากรอกชื่อผู้ขาย";
            if (!receiverName.trim())   next.receiverName  = "กรุณากรอกชื่อผู้รับสินค้า";
            if (!sendDate)              next.sendDate      = "กรุณาเลือกวันที่ส่ง";
            if (!receiverTel.trim())    next.receiverTel   = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (currentStep === "32") {
            if (!quotationNo.trim())     next.quotationNo    = "กรุณากรอกเลขที่ใบเสนอราคา";
            if (!reviewPriceDate)        next.reviewPriceDate = "กรุณาเลือกวันที่เสนอราคา";
            if (!avgRepairDay.trim())    next.avgRepairDay   = "กรุณาระบุระยะเวลาซ่อม";
            if (!guaranteeDay.trim())    next.guaranteeDay   = "กรุณาระบุระยะเวลารับประกัน";
            if (!rows.length)            next.attachment     = "กรุณาเพิ่มรายการซ่อมอย่างน้อย 1 รายการ";
        } else if (currentStep === "33") {
            if (!approveFlg)             next.approveFlg     = "กรุณาเลือกผลการอนุมัติ";
            if (!approveDate)            next.approveDate    = "กรุณาเลือกวันที่อนุมัติ";
            if (!ticketNum.trim())       next.ticketNum      = "กรุณากรอก Ticket No.";
        } else if (currentStep === "34" || currentStep === "35") {
            if (!notifierName.trim())    next.notifierName   = "กรุณากรอกชื่อผู้รับทราบ";
            if (!notifieDate)            next.notifieDate    = "กรุณาเลือกวันที่แจ้ง";
        } else if (currentStep === "361") {
            if (!vendorSentName.trim())      next.vendorSentName      = "กรุณากรอกชื่อผู้ส่งมอบ";
            if (!vendorReceiveName.trim())   next.vendorReceiveName   = "กรุณากรอกชื่อผู้รับ";
            if (!vendorReturnDate)           next.vendorReturnDate    = "กรุณาเลือกวันที่รับสินค้าคืน";
            if (!vendorSenderTel.trim())     next.vendorSenderTel     = "กรุณากรอกเบอร์โทรศัพท์";
        } else if (currentStep === "36") {
            if (!grSentName.trim())          next.grSentName          = "กรุณากรอกชื่อผู้ส่งมอบ";
            if (!csReceiverName.trim())      next.csReceiverName      = "กรุณากรอกชื่อผู้รับ";
            if (!grReturnDate)               next.grReturnDate        = "กรุณาเลือกวันที่รับสินค้าคืน";
            if (!grSentTel.trim())           next.grSentTel           = "กรุณากรอกเบอร์โทรศัพท์";
            if (!location.trim())            next.location            = "กรุณากรอก Location";
        } else if (currentStep === "37") {
            if (!sentName.trim())            next.sentName            = "กรุณากรอกชื่อผู้ส่งมอบสินค้าคืน";
            if (!customerName.trim())        next.customerName        = "กรุณากรอกชื่อผู้รับสินค้าคืน";
            if (!sentProductReturnDate)      next.sentProductReturnDate = "กรุณาเลือกวันที่รับสินค้าคืน";
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
    
    const addRow = () =>
        setRows(prev => [
        ...prev,
        {
            id: prev.length + 1,
            quotationId: null,
            desc: "",
            parts: 0,
            labor: 0,
            warrantyParts: false,
            warrantyLabor: false,
        },
    ]);

    const deleteRow = (rowId: number) =>
        setRows(prev => {
            if (prev.length === 1) return prev; 
            return prev
                .filter(r => r.id !== rowId)
                .map((r, idx) => ({ ...r, id: idx + 1 }));
    });

    const updateRow = (rowId: number, patch: Partial<Row>) =>
        setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, ...patch } : r)),
    );

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const nextErrors = validate();
        setErrors(nextErrors);
        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        const receiveFromUserDateStr = toYMD(receiveFromUserDt);

        const bodyData: Record<string, unknown> = {
            requestId,
            status: Number(currentStep),
            updatedUser: localStorage.getItem("userInfo") ? JSON.parse(localStorage.getItem("userInfo")!).user_name : "system"
        };

        if (currentStep === "10") {
            bodyData.customer = { firstName, lastName, address, phone, receiveFromUserDt: receiveFromUserDateStr };
            bodyData.product = {
                productType,
                brand,
                model,
                serial,
                qty: qty || 0,
                sku: skuFlg ? Number(sku) : 999999999999,
                skuFlg: skuFlg ? "Y" : "N",
                barcode,
                issue: selectedSymptom === "other" ? issue : (selectedSymptom + (issue.trim() ? ` (${issue.trim()})` : ""))
            };
            bodyData.warranty = { status: warranty, warrantyNo: warranty === "in" ? warrantyNo: undefined };
        } else if (currentStep === "11") {
            bodyData.senderName = senderName;
            bodyData.receiverName = grReceiverName;
            bodyData.sendDate = toYMD(grSendDate);
            bodyData.receiverTel = grReceiverTel;
        } else if (currentStep === "201") {
            bodyData.grOpenLogBy = openLogBy;
            bodyData.grOpenLogDate = toYMD(openLogDate);
            bodyData.approvelogID = approvelogID;
        } else if (currentStep === "21") {
            bodyData.sentToDCName = sentToDCName;
            bodyData.dcReceiverTel = dcReceiverTel;
            bodyData.dcReceiveDate = toYMD(dcReceiveDate);
        } else if (currentStep === "22") {
            bodyData.dcArriveDate = toYMD(dcArriveDate);
        } else if (currentStep === "23") {
            bodyData.vendorName = vendorName;
            bodyData.receiverName = receiverName;
            bodyData.sendDate = toYMD(sendDate);
            bodyData.receiverTel = receiverTel;
        } else if (currentStep === "232") {
            bodyData.quotationItems = rows.map(r => ({
                quotationId: r.quotationId,
                quotation_no: quotationNo,
                review_price_date: toYMD(reviewPriceDate),
                num_of_repair_day: avgRepairDay,
                num_of_guarantee_day: guaranteeDay,
                repair_order: r.desc,
                part_cost: r.parts,
                part_warranty_flg: r.warrantyParts ? "Y" : "N",
                labor_cost: r.labor,
                labor_warranty_flg: r.warrantyLabor ? "Y" : "N",
                total_part_cost: r.parts,
                total_labor_cost: r.labor,
                total_cost: r.parts + r.labor,
            }));
        } else if (currentStep === "233") {
            bodyData.userApproveFlg = approveFlg;
            bodyData.userApproveDate = toYMD(approveDate);
            bodyData.ticketNo = ticketNum;
        } else if (currentStep === "234" || currentStep === "235") {
            bodyData.notifierName = notifierName;
            bodyData.notifieDate = toYMD(notifieDate);
        } else if (currentStep === "2360") {
            bodyData.vendorSentName = vendorSentName;
            bodyData.vendorReceiveName = vendorReceiveName;
            bodyData.vendorReturnDate = toYMD(vendorReturnDate);
            bodyData.vendorSenderTel = vendorSenderTel;
        } else if (currentStep === "2361") {
            bodyData.dcSentName = dcSentName;
            bodyData.hoReceiverName = hoReceiverName;
            bodyData.dcReturnDate = toYMD(dcReturnDate);
            bodyData.dcSentTel = dcSentTel;
        } else if (currentStep === "236") {
            bodyData.grSentName = grSentName;
            bodyData.csReceiverName = csReceiverName;
            bodyData.grReturnDate = toYMD(grReturnDate);
            bodyData.grSentTel = grSentTel;
            bodyData.location = location;
        } else if (currentStep === "237") {
            bodyData.sentName = sentName;
            bodyData.customerName = customerName;
            bodyData.sentProductReturnDate = toYMD(sentProductReturnDate);
        } else if (currentStep === "31") {
            bodyData.vendorName = vendorName;
            bodyData.receiverName = receiverName;
            bodyData.sendDate = toYMD(sendDate);
            bodyData.receiverTel = receiverTel;
        } else if (currentStep === "32") {
            bodyData.quotationItems = rows.map(r => ({
                quotationId: r.quotationId,
                quotation_no: quotationNo,
                review_price_date: toYMD(reviewPriceDate),
                num_of_repair_day: avgRepairDay,
                num_of_guarantee_day: guaranteeDay,
                repair_order: r.desc,
                part_cost: r.parts,
                part_warranty_flg: r.warrantyParts ? "Y" : "N",
                labor_cost: r.labor,
                labor_warranty_flg: r.warrantyLabor ? "Y" : "N",
                total_part_cost: r.parts,
                total_labor_cost: r.labor,
                total_cost: r.parts + r.labor,
            }));
        } else if (currentStep === "33") {
            bodyData.userApproveFlg = approveFlg;
            bodyData.userApproveDate = toYMD(approveDate);
            bodyData.ticketNo = ticketNum;
        } else if (currentStep === "34" || currentStep === "35") {
            bodyData.notifierName = notifierName;
            bodyData.notifieDate = toYMD(notifieDate);
        } else if (currentStep === "361") {
            bodyData.vendorSentName = vendorSentName;
            bodyData.vendorReceiveName = vendorReceiveName;
            bodyData.vendorReturnDate = toYMD(vendorReturnDate);
            bodyData.vendorSenderTel = vendorSenderTel;
        } else if (currentStep === "236") {
            bodyData.grSentName = grSentName;
            bodyData.csReceiverName = csReceiverName;
            bodyData.grReturnDate = toYMD(grReturnDate);
            bodyData.grSentTel = grSentTel;
            bodyData.location = location;
        } else if (currentStep === "36") {
            bodyData.grSentName = grSentName;
            bodyData.csReceiverName = csReceiverName;
            bodyData.grReturnDate = toYMD(grReturnDate);
            bodyData.grSentTel = grSentTel;
            bodyData.location = location;
        } else if (currentStep === "37") {
            bodyData.sentName = sentName;
            bodyData.customerName = customerName;
            bodyData.sentProductReturnDate = toYMD(sentProductReturnDate);
        }

        const formData = new FormData();
        formData.append("data", JSON.stringify(bodyData));

        //* for new file attach
        if (Object.keys(attachmentsByStep).length > 0) {
            Object.entries(attachmentsByStep).forEach(([step, files]) => {
                files.forEach((file: File) => {
                formData.append("attachments", file);
                formData.append("steps", step);
                });
            });
        }
        //* for edit file
        formData.append("deletedAttachmentIds", JSON.stringify(deletedAttachmentIds ?? []));

        try {
            setSaving(true);
            const res = await fetch("/api/request/update", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");
            alert("บันทึกสำเร็จ");
            router.push('/status')
        } catch (err) {
            alert((err as Error).message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setSaving(false);
        }
    };
   
    if (loading) {
        return <section className="max-w-4xl mx-auto p-6">กำลังโหลดข้อมูล...</section>;
    }

    const startStepFiles = existingAttachments["10"] ?? [];
    const startStepSerialFiles = startStepFiles.filter((f) =>
        f.file_name.toUpperCase().includes("SERIAL")
    );
    const startStepOtherFiles = startStepFiles.filter(
        (f) => !f.file_name.toUpperCase().includes("SERIAL")
    );
    const lastedStepFiles = existingAttachments["37"] ?? existingAttachments["237"] ?? [];
    const stepKey = existingAttachments["37"] ? "37" : "237";
    //* CS send to GR files
    const csToGrExistingFiles = existingAttachments["11"] ?? [];
    //* existingFile by step (Vendor)
    const vendorStep1Files = existingAttachments["31"] ?? [];
    const vendorStep2Files = existingAttachments["361"] ?? [];
    // const vendorStep3Files = existingAttachments["37"] ?? [];
    //* existingFile by step (DC)
    const dcStep1Files = existingAttachments["21"] ?? [];
    const dcStep2Files = existingAttachments["23"] ?? [];
    const dcStep3Files = existingAttachments["2360"] ?? [];
    const dcStep4Files = existingAttachments["2361"] ?? [];
    const dcStep5Files = existingAttachments["236"] ?? [];
    // const dcStep5Files = existingAttachments["237"] ?? [];

    //* Section to steps mapping
    const sectionSteps: Record<string, string[]> = {
        "customer-details": ["10"],
        "product-details": ["10"],
        "cs-send-to-gr": ["11"],
        "path-review": ["20", "30"],
        "gr-open-dc-log": ["201"],
        "dc-receive-from-store": ["21"],
        "dc-receive-at-dc": ["22"],
        "vendor-pickup-receiver": ["23", "31"],
        "quotation": ["32", "232"],
        "user-approve": ["33", "233"],
        "vendor-notify": ["34", "35", "234", "235"],
        "vendor-return": ["360", "361"],
        "vendor-return-dc": ["2360"],
        "dc-return-gr": ["2361"],
        "gr-return-cs": ["36", "236"],
        "customer-return": ["37", "237"],
        "summary": ["10", "11", "20", "21", "22", "23", "234", "235", "236", "237", "2360", "2361"]
    };

    const shouldShowSection = (sectionKey: string): boolean => {
        const steps = sectionSteps[sectionKey] || [];
        return steps.includes(currentStep);
    };

    //* Check if a section is editable (only current or past steps)
    const isSectionEditable = (sectionKey: string): boolean => {
        const steps = sectionSteps[sectionKey] || [];
        return steps.includes(currentStep);
    };

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            แก้ไขใบแจ้งซ่อม
        </h1>

        {/* Timeline */}
        <div className="mt-6 overflow-x-auto" ref={timelineContainerRef}>
          <div className="flex items-center gap-2 pb-4 min-w-max px-4">
            {timelineSteps.map((step, idx) => {
              const isCurrentStep = step.key === currentStep;
              const isPastStep = idx < currentStepIndex;
              const isFutureStep = idx > currentStepIndex;

              return (
                <div key={step.key} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isCurrentStep || setCurrentStep(step.key)}
                    disabled={isPastStep || isFutureStep}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                      isCurrentStep
                        ? "bg-blue-600 text-white"
                        : isPastStep
                        ? "bg-slate-200 text-slate-900 cursor-not-allowed opacity-50"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {step.label}
                  </button>
                  {idx < timelineSteps.length - 1 && (
                    <div className={`w-3 h-0.5 mx-1 ${isFutureStep ? "bg-slate-200" : "bg-slate-400"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-8">
            {(currentStep === "20" || currentStep === "30") && (
            <div className="space-y-4">
                <fieldset className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">ข้อมูลลูกค้า</legend>
                    <div className="flex justify-center">
                        <table className="min-w-[560px]">
                            <tbody>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">ชื่อ - นามสกุล :</td>
                                    <td>{firstName}  {lastName}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">ที่อยู่ :</td>
                                    <td>{address}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">โทรศัพท์ :</td>
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
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">ประเภทสินค้า :</td>
                                    <td>{productType}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">ยี่ห้อ :</td>
                                    <td>{brand}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">รุ่น :</td>
                                    <td style={{maxWidth: "150px", wordBreak: "break-all", whiteSpace: "normal", overflow: "hidden"}}>{model}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">เลขเครื่อง (Serial) :</td>
                                    <td>{serial}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">จำนวน :</td>
                                    <td>{qty}  ชิ้น</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">SKU :</td>
                                    <td>{sku !== null && sku !== undefined && sku !== "" ? String(sku).padStart(7, "0") : "-"}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">Barcode :</td>
                                    <td>{barcode}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">อาการที่พบ :</td>
                                    <td>{issue}</td>
                                </tr>
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">สถานะรับประกัน :</td>
                                    <td>{warranty === "in" ? "ภายในประกัน" : "หมดประกัน"}</td>
                                </tr>
                                {warranty === "in" && (
                                    <tr>
                                        <td className="w-56 pr-4 text-right align-top whitespace-nowrap">เลขที่ใบประกัน :</td>
                                        <td>{warrantyNo}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="w-56 pr-4 text-right align-top whitespace-nowrap">วันที่รับสินค้าจากลูกค้า :</td>
                                    <td>{receiveFromUserDt ? toYMD(receiveFromUserDt) : "-"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </fieldset>
            </div>
            )}
            {shouldShowSection("path-review") && (
            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">การจัดส่งสินค้าซ่อม</legend>
                <div className="flex justify-center">
                    <table className="min-w-[560px]">
                        <tbody>
                            <tr>
                                <td className="w-56 pr-4 text-right align-top whitespace-nowrap">เส้นทาง :</td>
                                <td className="font-semibold">
                                    {currentStep === "20" ? "ส่งให้ DC" : currentStep === "30" ? "ส่งให้ Vendor" : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td className="w-56 pr-4 text-right align-top whitespace-nowrap">ผู้ดำเนินการ :</td>
                                <td className="font-semibold">{pathSelectedBy || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </fieldset>
            )}
            {shouldShowSection("customer-details") && (
            <fieldset disabled={!isSectionEditable("customer-details")} className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดลูกค้า</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">ชื่อ<Req/></label>
                        <input className={inputClass(!!errors.firstName)} value={firstName} onChange={e=>setFirstName(e.target.value)} />
                        {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                        <label className="form-label">นามสกุล<Req/></label>
                        <input className={inputClass(!!errors.lastName)} value={lastName} onChange={e=>setLastName(e.target.value)} />
                        {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                </div>

                <div>
                    <label className="form-label">ที่อยู่</label>
                    <textarea className="input-base min-h-24" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>

                <div>
                    <label className="form-label">โทรศัพท์<Req/></label>
                    <input className={inputClass(!!errors.phone)} value={phone} onChange={e=>setPhone(e.target.value)} />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
            </fieldset>
            )}

            {shouldShowSection("product-details") && (
            <fieldset disabled={!isSectionEditable("product-details")} className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={skuFlg}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSkuFlg(checked);

                                if (!checked) {
                                    setSku("");
                                    setErrors(prev => ({ ...prev, sku: undefined }));
                                }
                            }}
                        />
                        <span className="form-label mb-0">สินค้าอยู่ในระบบ</span>
                    </label>
                    <div />

                    <div>
                        <label htmlFor="sku" className="form-label">
                            SKU<Req />
                        </label>
                        <input
                            id="sku"
                            type="number"
                            className={`${inputClass(!!errors.sku)} w-50`}
                            value={sku}
                            onChange={(e) =>
                                setSku(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            disabled={!skuFlg} 
                        />
                            {errors.sku && (
                                <p className="text-red-600 text-sm mt-1">{errors.sku}</p>
                            )}
                            {skuLoading && <p className="text-xs text-slate-500 mt-1">กำลังค้นหา...</p>}
                            {skuError && <p className="text-xs text-red-600 mt-1">{skuError}</p>}
                    </div>
                    <div>
                        <label htmlFor="barcode" className="form-label">Barcode<Req /></label>
                        <input
                            id="barcode"
                            className={`${inputClass(!!errors.barcode)} w-60`}
                            value={barcode}
                            onChange={e => setBarcode(e.target.value)}
                            disabled={skuFlg}
                        />
                        {errors.barcode && <p className="text-red-600 text-sm mt-1">{errors.barcode}</p>}
                    </div>

                    <div>
                        <label className="form-label">ประเภทสินค้า<Req /></label>
                        {skuFlg ? (
                            <select
                                className="input-base"
                                value={productType}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setProductType(v);
                                    setBrand("");
                                    setBrandList([]);
                                }}
                                disabled={true}
                            >
                                <option value="">-- เลือกประเภทสินค้า --</option>
                                {classList.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className={inputClass(!!errors.productType)}
                                value={productType}
                                onChange={(e) => setProductType(e.target.value)}
                                placeholder="ระบุประเภทสินค้า"
                            />
                        )}
                        {errors.productType && <p className="text-red-600 text-sm mt-1">{errors.productType}</p>}
                    </div>
                    <div>
                        <label className="form-label">ยี่ห้อ<Req /></label>
                        {skuFlg ? (
                            <select
                                className="input-base"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                disabled={true}
                            >
                                <option value="">-- เลือกยี่ห้อ --</option>
                                {brandList.map((s) => (
                                    <option key={`${productType}-${s}`} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className={inputClass(!!errors.brand)}
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="ระบุยี่ห้อ"
                            />
                        )}
                        {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand}</p>}
                    </div>

                    <div className="sm:col-span-2" >
                        <label className="form-label">รุ่น</label>
                        <input 
                            className="input-base" 
                            value={model} 
                            onChange={e=>setModel(e.target.value)} 
                            disabled={skuFlg}
                            placeholder="ระบุรุ่นสินค้า"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="form-label">เลขเครื่อง (Serial Number)</label>
                        <input className="input-base w-100" value={serial} onChange={e=>setSerial(e.target.value)} />
                    </div>

                    <div>
                        <label className="form-label">
                            ไฟล์รูป (Serial Number)<Req />
                        </label>
                        {startStepSerialFiles.length > 0 ? (
                            <div className="mt-2 space-y-2">
                            {startStepSerialFiles.map((a) => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                <a
                                    href={a.file_path}
                                    target="_blank"
                                    className="underline text-slate-700 hover:text-slate-900"
                                    rel="noreferrer"
                                >
                                    {a.file_name}
                                </a>

                                <button
                                    type="button"
                                    className="text-red-600 hover:underline"
                                    onClick={() => {
                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                    setExistingAttachments((prev: ExistAttachment) => ({
                                        ...prev,
                                        ["10"]: (prev["10"] ?? []).filter((x) => x.id !== a.id),
                                    }));
                                    }}
                                >
                                    ลบ
                                </button>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์รูป</div>
                        )}
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                            onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                setSerialAttachments(files);
                            }}
                        />
                        {serialAttachments.length > 0 && (
                            <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                                {serialAttachments.map((f) => (
                                    <li key={`${f.name}-${f.size}`}>{f.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div />

                    <div>
                        <label className="form-label">จำนวน<Req/></label>
                        <input
                            id="qty" type="number" min={1}
                            className={inputClass(!!errors.qty)}
                            value={qty}
                            onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                        {errors.qty && <p className="text-red-600 text-sm mt-1">{errors.qty}</p>}
                    </div>
                    <div className="flex flex-col">
                        <label className="form-label">
                            วันที่รับสินค้าจากลูกค้า<Req />
                        </label>

                        <DatePicker
                            id="receiveFromUserDt"
                            selected={receiveFromUserDt}
                            onChange={(date) => setReceiveFromUserDt(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="วว/ดด/ปป"
                            className={`${inputClass(!!errors.receiveFromUserDt)} w-60`}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <label htmlFor="issueSymptom" className="form-label">อาการเสียที่พบ (จากระบบ)</label>
                        <select
                            id="issueSymptom"
                            className="input-base bg-white border border-slate-300 rounded-lg w-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            value={selectedSymptom}
                            onChange={e => setSelectedSymptom(e.target.value)}
                        >
                            <option value="">-- เลือกอาการเสีย --</option>
                            {symptoms.map(s => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                            <option value="other">อื่นๆ (ระบุเอง)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="issue" className="form-label">
                            {selectedSymptom === "other" ? "รายละเอียดอาการเสีย *" : "รายละเอียดอาการเสียเพิ่มเติม (ถ้ามี)"}
                        </label>
                        <textarea
                            id="issue"
                            className="input-base min-h-24 w-full"
                            value={issue}
                            onChange={e => setIssue(e.target.value)}
                            placeholder="ระบุรายละเอียดอาการชำรุดเสียหายเพิ่มเติม"
                        />
                        {errors.issue && <p className="text-red-600 text-sm mt-1">{errors.issue}</p>}
                    </div>

                    <span className="form-label">ปัญหาที่เกิด<Req/></span>
                    <div className="flex flex-wrap items-center gap-6">
                        <label className="inline-flex items-center gap-2">
                        <input type="radio" name="warranty" value="in" checked={warranty === "in"} onChange={() => setWarranty("in")} />
                        <span>อยู่ในประกัน</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                        <input type="radio" name="warranty" value="out" checked={warranty === "out"} onChange={() => setWarranty("out")} />
                        <span>ไม่อยู่ในประกัน</span>
                        </label>
                    </div>
                    {errors.warranty && <p className="text-red-600 text-sm">{errors.warranty}</p>}

                    {warranty === "in" && (
                        <div className="pt-2">
                            <label className="form-label">เลขที่ใบประกัน<Req/></label>
                            <input className={inputClass(!!errors.warrantyNo)} value={warrantyNo} onChange={e=>setWarrantyNo(e.target.value)} />
                            {errors.warrantyNo && <p className="text-red-600 text-sm mt-1">{errors.warrantyNo}</p>}
                        </div>
                    )}
                </div>
                <label className="form-label">
                    ไฟล์แนบ<Req />
                </label>
                {startStepOtherFiles.length > 0 ? (
                    <div className="mt-2 space-y-2">
                        {startStepOtherFiles.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                <a
                                    href={a.file_path}
                                    target="_blank"
                                    className="underline text-slate-700 hover:text-slate-900"
                                    rel="noreferrer"
                                >
                                    {a.file_name}
                                </a>


                                <button
                                    type="button"
                                    className="text-red-600 hover:underline"
                                    onClick={() => {
                                        setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                        setExistingAttachments((prev: ExistAttachment) => ({
                                        ...prev,
                                        ["10"]: (prev["10"] ?? []).filter((x) => x.id !== a.id),
                                        }));
                                    }}
                                >
                                    ลบ
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                )}
                <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                    onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setOtherAttachments(files);
                    }}
                />
                {otherAttachments.length > 0 && (
                    <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                        {otherAttachments.map((f) => (
                            <li key={`${f.name}-${f.size}`}>{f.name}</li>
                        ))}
                    </ul>
                )}
                {errors.attachment && (
                    <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                )}
            </fieldset>
            )}

            {shouldShowSection("cs-send-to-gr") && (
                <fieldset disabled={!isSectionEditable("cs-send-to-gr")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดการส่งสินค้าให้ GR</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="senderName" className="form-label">ผู้ส่งมอบ<Req /></label>
                            <input
                                id="senderName"
                                className={inputClass(!!errors.senderName)}
                                value={senderName}
                                onChange={e => setSenderName(e.target.value)}
                            />
                            {errors.senderName && <p className="text-red-600 text-sm mt-1">{errors.senderName}</p>}
                        </div>
                        <div>
                            <label htmlFor="grReceiverName" className="form-label">ผู้รับสินค้า<Req /></label>
                            <input
                                id="grReceiverName"
                                className={inputClass(!!errors.receiverName)}
                                value={grReceiverName}
                                onChange={e => setGrReceiverName(e.target.value)}
                            />
                            {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
                        </div>
                        <div>
                            <label htmlFor="grSendDate" className="form-label block mb-1">วันที่ส่งสินค้า<Req /></label>
                            <DatePicker
                                id="grSendDate"
                                selected={grSendDate}
                                onChange={(date) => setGrSendDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.sendDate)}
                            />
                            {errors.sendDate && <p className="text-red-600 text-sm mt-1">{errors.sendDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="grReceiverTel" className="form-label">เบอร์ติดต่อผู้รับ<Req /></label>
                            <input
                                id="grReceiverTel"
                                className={`${inputClass(!!errors.receiverTel)} w-50`}
                                value={grReceiverTel}
                                onChange={e => setGrReceiverTel(e.target.value)}
                            />
                            {errors.receiverTel && <p className="text-red-600 text-sm mt-1">{errors.receiverTel}</p>}
                        </div>
                        <div>
                            <label className="form-label">
                                ไฟล์แนบ<Req/>
                            </label>
                            {csToGrExistingFiles.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    <div className="text-sm font-semibold text-slate-600">ไฟล์ที่มีอยู่:</div>
                                    {csToGrExistingFiles.map(a => (
                                        <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                            <a
                                                href={a.file_path}
                                                target="_blank"
                                                className="underline text-slate-700 hover:text-slate-900"
                                                rel="noreferrer"
                                            >
                                                {a.file_name}
                                            </a>
                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                                    setExistingAttachments(
                                                        (prev: ExistAttachment) => ({
                                                            ...prev,
                                                            "11": (prev["11"] ?? []).filter((item) => item.id !== a.id),
                                                        })
                                                    );
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <input
                                ref={csToGrFileInputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className={`${inputClass(!!errors.attachments)} w-60 mt-2`}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    setCsToGrAttachments(files);
                                }}
                            />
                            {errors.attachments && (
                                <p className="text-red-600 text-sm mt-1">{errors.attachments}</p>
                            )}
                            {csToGrAttachments.length > 0 && (
                                <ul className="mt-2 text-sm text-slate-700 space-y-1">
                                    <div className="text-sm font-semibold text-slate-600">ไฟล์ใหม่:</div>
                                    {csToGrAttachments.map((f, idx) => (
                                        <li
                                            key={`${f.name}-${f.size}`}
                                            className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded"
                                        >
                                            <span className="truncate">{f.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCsToGrAttachments((prev) => {
                                                        const next = prev.filter((_, i) => i !== idx);
                                                        if (next.length === 0 && csToGrFileInputRef.current) {
                                                            csToGrFileInputRef.current.value = "";
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
            )}

            {shouldShowSection("dc-receive-from-store") && (
                <fieldset disabled={!isSectionEditable("dc-receive-from-store")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC รับสินค้าจากสาขา</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sentToDCName" className="form-label">ผู้มารับสินค้า<Req /></label>
                            <input
                                id="sentToDCName"
                                className={inputClass(!!errors.sentToDCName)}
                                value={sentToDCName}
                                onChange={e => setSentToDCName(e.target.value)}
                            />
                            {errors.sentToDCName && <p className="text-red-600 text-sm mt-1">{errors.sentToDCName}</p>}
                        </div>
                        <div>
                            <label htmlFor="dcReceiverTel" className="form-label">เบอร์ติดต่อ<Req /></label>
                            <input
                                id="dcReceiverTel"
                                className={`${inputClass(!!errors.dcReceiverTel)} w-50`}
                                value={dcReceiverTel}
                                onChange={e => setDcReceiverTel(e.target.value)}
                            />
                            {errors.dcReceiverTel && <p className="text-red-600 text-sm mt-1">{errors.dcReceiverTel}</p>}
                        </div>
                        <div>
                            <label htmlFor="dcReceiveDate" className="form-label block mb-1">วันที่รับสินค้าจากสาขา<Req /></label>
                                <DatePicker
                                    id="dcReceiveDate"
                                    selected={dcReceiveDate}
                                    onChange={(date) => setDcReceiveDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="วว/ดด/ปป"
                                    className={inputClass(!!errors.dcReceiveDate)}
                                />
                                {errors.dcReceiveDate && <p className="text-red-600 text-sm mt-1">{errors.dcReceiveDate}</p>}
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {dcStep1Files.length > 0 ? (
                            <div className="mt-2 space-y-2">
                            {dcStep1Files.map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                <a
                                    href={a.file_path}
                                    target="_blank"
                                    className="underline text-slate-700 hover:text-slate-900"
                                    rel="noreferrer"
                                >
                                    {a.file_name}
                                </a>

                                <button
                                    type="button"
                                    className="text-red-600 hover:underline"
                                    onClick={() => {
                                        setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                        setExistingAttachments(
                                            (prev: ExistAttachment) => ({
                                            ...prev,
                                            ["21"]: (prev["21"] ?? []).filter(
                                                (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                            ),
                                            })
                                        );
                                    }}
                                >
                                    ลบ
                                </button>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                        )}

                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf"
                            className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                            onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                setAttachmentsByStep((prev) => ({
                                    ...prev,
                                    "21": files,
                                }));
                            }}
                        />

                        {(attachmentsByStep["21"] ?? []).length > 0 && (
                            <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                                {attachmentsByStep["21"].map((f) => (
                                    <li key={`${f.name}-${f.size}`}>{f.name}</li>
                                ))}
                            </ul>
                        )}
                        {errors.attachment && (
                            <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                        )}
                </fieldset>
            )}

            {shouldShowSection("dc-receive-at-dc") && (
               <fieldset disabled={!isSectionEditable("dc-receive-at-dc")} className="space-y-4">
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
            )}

            {shouldShowSection("gr-open-dc-log") && (
                <fieldset disabled={!isSectionEditable("gr-open-dc-log")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียด GR เปิด Log ให้ DC</legend>
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
                            <label htmlFor="approvelogID" className="form-label">
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
            )}
            
            {shouldShowSection("vendor-pickup-receiver") && (
                <fieldset disabled={!isSectionEditable("vendor-pickup-receiver")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดผู้มารับสินค้า</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="vendorName" className="form-label">ผู้ขาย (Vender)<Req /></label>
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
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {currentStep === "31" && (
                        <>
                            {vendorStep1Files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {vendorStep1Files.map(a => (
                                        <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                            <a
                                                href={a.file_path}
                                                target="_blank"
                                                className="underline text-slate-700 hover:text-slate-900"
                                                rel="noreferrer"
                                            >
                                                {a.file_name}
                                            </a>

                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                                    setExistingAttachments(
                                                        (prev: ExistAttachment) => ({
                                                        ...prev,
                                                        ["31"]: (prev["31"] ?? []).filter(
                                                            (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                        ),
                                                        })
                                                    );
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                            )}
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    setAttachmentsByStep((prev) => ({
                                        ...prev,
                                        "31": files,
                                    }));
                                }}
                            />

                            {(attachmentsByStep["31"] ?? []).length > 0 && (
                                <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                                    {attachmentsByStep["31"].map((f) => (
                                        <li key={`${f.name}-${f.size}`}>{f.name}</li>
                                    ))}
                                </ul>
                            )}
                            {errors.attachment && (
                                <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                            )}
                        </>
                    )}

                    {currentStep === "23" && (
                        <>
                            {dcStep2Files.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {dcStep2Files.map(a => (
                                        <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                            <a
                                                href={a.file_path}
                                                target="_blank"
                                                className="underline text-slate-700 hover:text-slate-900"
                                                rel="noreferrer"
                                            >
                                                {a.file_name}
                                            </a>

                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                                    setExistingAttachments(
                                                        (prev: ExistAttachment) => ({
                                                        ...prev,
                                                        ["23"]: (prev["23"] ?? []).filter(
                                                            (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                        ),
                                                        })
                                                    );
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                            )}
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    setAttachmentsByStep((prev) => ({
                                        ...prev,
                                        "23": files,
                                    }));
                                }}
                            />

                            {(attachmentsByStep["23"] ?? []).length > 0 && (
                                <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                                    {attachmentsByStep["23"].map((f) => (
                                        <li key={`${f.name}-${f.size}`}>{f.name}</li>
                                    ))}
                                </ul>
                            )}
                            {errors.attachment && (
                                <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                            )}
                        </>
                    )}
                </fieldset>
            )}

            {shouldShowSection("quotation") && (
                <fieldset disabled={!isSectionEditable("quotation")} className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            รายละเอียดใบเสนอราคา
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 ml-8">
                                    ผู้ขาย (Vendor) :
                                </span>
                                <span className="text-sm text-slate-900">
                                    {vendorName || "-"}
                                </span>
                            </div>
                            <div>
                        
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                    เลขที่ใบเสนอราคา <Req />
                                </label>
                                <input
                                    id="quotationNo"
                                    className={`${inputClass(!!errors.quotationNo)} w-45`}
                                    value={quotationNo}
                                    onChange={e => setQuotationNo(e.target.value)}
                                />
                                {errors.quotationNo && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.quotationNo}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                    วันที่เสนอราคา <Req />
                                </label>
                                <DatePicker
                                    id="reviewPriceDate"
                                    selected={reviewPriceDate}
                                    onChange={(date) => setReviewPriceDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="วว/ดด/ปป"
                                    className={inputClass(!!errors.reviewPriceDate)}
                                />
                                {errors.reviewPriceDate && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.reviewPriceDate}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                    ระยะเวลาการซ่อมประมาณ (วัน) <Req />
                                </label>
                                <input
                                    id="avgRepairDay"
                                    className={`${inputClass(!!errors.avgRepairDay)} w-45`}
                                    value={avgRepairDay}
                                    onChange={e => setAvgRepairDay(e.target.value)}
                                    placeholder="จำนวนวัน"
                                />
                                {errors.avgRepairDay && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.avgRepairDay}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-2">
                                    ระยะเวลารับประกันงานซ่อม (วัน) <Req />
                                </label>
                                <input
                                    id="guaranteeDay"
                                    className={`${inputClass(!!errors.guaranteeDay)} w-49`}
                                    value={guaranteeDay}
                                    onChange={e => setGuaranteeDay(e.target.value)}
                                    placeholder="จำนวนวัน"
                                />
                                {errors.guaranteeDay && (
                                    <p className="text-red-600 text-xs mt-1">
                                        {errors.guaranteeDay}
                                    </p>
                                )}
                            </div>    
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-separate border-spacing-y-3 border-spacing-x-3">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-700">
                                <th className="w-10 text-right pr-1">#</th>
                                <th className="text-left">รายการซ่อม</th>
                                <th className="w-28 text-right">ค่าอะไหล่</th>
                                <th className="w-24 text-center">ในประกัน</th>
                                <th className="w-4"></th>
                                <th className="w-28 text-right">ค่าแรง</th>
                                <th className="w-24 text-center">ในประกัน</th>
                                <th className="w-28 text-right">รวม</th>
                                <th className="w-10"></th>
                                <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                <tr key={r.id} className="align-middle">
                                    <td className="text-right pr-1 text-slate-500 whitespace-nowrap">
                                    {r.id})
                                    </td>

                                    {/* รายการซ่อม */}
                                    <td>
                                    <input
                                        value={r.desc}
                                        onChange={e =>
                                        updateRow(r.id, { desc: e.target.value })
                                        }
                                        // placeholder="รายละเอียดงานซ่อม"
                                        className={`${baseInput} min-w-[12rem]`}
                                    />
                                    </td>

                                    {/* ค่าอะไหล่ */}
                                    <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`${baseInput} text-right`}
                                        value={r.parts || ""}
                                        onChange={e =>
                                        updateRow(r.id, { parts: parseNum(e.target.value) })
                                        }
                                        placeholder="0.00"
                                    />
                                    </td>

                                    {/* อยู่ในประกัน (อะไหล่) */}
                                    <td>
                                    <div className="flex justify-center">
                                        <input
                                        type="checkbox"
                                        checked={r.warrantyParts}
                                        onChange={e =>
                                            updateRow(r.id, {
                                            warrantyParts: e.target.checked,
                                            })
                                        }
                                        className="h-5 w-5 accent-sky-600"
                                        />
                                    </div>
                                    </td>

                                    {/* + */}
                                    <td className="text-center text-slate-500 align-middle">
                                    +
                                    </td>

                                    {/* ค่าแรง */}
                                    <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`${baseInput} text-right`}
                                        value={r.labor || ""}
                                        onChange={e =>
                                        updateRow(r.id, { labor: parseNum(e.target.value) })
                                        }
                                        placeholder="0.00"
                                    />
                                    </td>

                                    {/* อยู่ในประกัน (ค่าแรง) */}
                                    <td>
                                    <div className="flex justify-center">
                                        <input
                                        type="checkbox"
                                        checked={r.warrantyLabor}
                                        onChange={e =>
                                            updateRow(r.id, {
                                            warrantyLabor: e.target.checked,
                                            })
                                        }
                                        className="h-5 w-5 accent-sky-600"
                                        />
                                    </div>
                                    </td>

                                    {/* รวมต่อแถว */}
                                    <td className="text-right font-semibold text-slate-800 tabular-nums pr-2">
                                    {money(lineTotal(r))}
                                    </td>

                                    {/* ปุ่มเพิ่ม (เฉพาะแถวสุดท้าย) */}
                                    <td className="text-center">
                                    {r.id === rows.length && (
                                        <button
                                        type="button"
                                        onClick={addRow}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-sky-500 text-sky-600 bg-white shadow-sm hover:bg-sky-50 hover:shadow-md transition"
                                        title="เพิ่มรายการ"
                                        >
                                        <CirclePlus className="h-4 w-4" />
                                        </button>
                                    )}
                                    </td>

                                    {/* ปุ่มลบ */}
                                    <td className="text-center">
                                    {rows.length > 1 && (
                                        <button
                                        type="button"
                                        onClick={() => deleteRow(r.id)}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-rose-400 text-rose-500 bg-white shadow-sm hover:bg-rose-50 hover:shadow-md transition"
                                        title="ลบรายการ"
                                        >
                                        <CircleMinus className="h-4 w-4" />
                                        </button>
                                    )}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3 pt-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[170px]">
                            <div className="text-xs text-slate-500">ค่าอะไหล่ที่อยู่ในประกัน</div>
                            <div className="text-sm font-semibold tabular-nums text-emerald-700">
                                {money(warrantyPartsTotal)}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[170px]">
                            <div className="text-xs text-slate-500">ค่าแรงที่อยู่ในประกัน</div>
                            <div className="text-sm font-semibold tabular-nums text-emerald-700">
                                {money(warrantyLaborTotal)}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                            <div className="text-xs text-slate-500">ค่าอะไหล่ทั้งหมด</div>
                            <div className="text-sm font-semibold tabular-nums text-slate-900">
                                {money(totalParts)}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[150px]">
                            <div className="text-xs text-slate-500">ค่าแรงทั้งหมด</div>
                            <div className="text-sm font-semibold tabular-nums text-slate-900">
                                {money(totalLabor)}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right min-w-[160px]">
                            <div className="text-xs text-slate-500">รวมสุทธิ</div>
                            <div className="text-lg font-semibold tabular-nums text-slate-900">
                                {money(grandTotal)}
                            </div>
                        </div>
                    </div>
                </fieldset>
            )}
            {shouldShowSection("user-approve") && (
                <fieldset disabled={!isSectionEditable("user-approve")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดการอนุมัติจากลูกค้า</legend>
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
            )}

            {shouldShowSection("vendor-notify") && (
                <fieldset disabled={!isSectionEditable("vendor-notify")} className="space-y-4">
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
            )}  

            {shouldShowSection("vendor-return") && (
                <fieldset disabled={!isSectionEditable("vendor-return")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                        รายละเอียดบันทึกการส่งคืนสินค้าซ่อมจาก Vendor
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
                        </div>
                        <div>
                            <label htmlFor="vendorReceiveName" className="form-label">ผู้รับ<Req /></label>
                            <input
                                id="vendorReceiveName"
                                className={inputClass(!!errors.vendorReceiveName)}
                                value={vendorReceiveName}
                                onChange={e => setVendorReceiveName(e.target.value)}
                            />
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
                        </div>
                        <div>
                            <label htmlFor="vendorSenderTel" className="form-label">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                            <input
                                id="vendorSenderTel"
                                className={`${inputClass(!!errors.vendorSenderTel)} w-50`}
                                value={vendorSenderTel}
                                onChange={e => setVendorSenderTel(e.target.value)}
                            />
                            {errors.vendorSenderTel && <p className="text-red-600 text-sm mt-1">{errors.vendorSenderTel}</p>}
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {vendorStep2Files.length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {vendorStep2Files.map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                    <a
                                        href={a.file_path}
                                        target="_blank"
                                        className="underline text-slate-700 hover:text-slate-900"
                                        rel="noreferrer"
                                    >
                                        {a.file_name}
                                    </a>

                                    <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => {
                                            setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                            setExistingAttachments(
                                                (prev: ExistAttachment) => ({
                                                ...prev,
                                                ["361"]: (prev["361"] ?? []).filter(
                                                    (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                ),
                                                })
                                            );
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                    )}
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            setAttachmentsByStep((prev) => ({
                                ...prev,
                                "361": files,
                            }));
                        }}
                    />

                    {(attachmentsByStep["361"] ?? []).length > 0 && (
                        <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                            {attachmentsByStep["361"].map((f) => (
                                <li key={`${f.name}-${f.size}`}>{f.name}</li>
                            ))}
                        </ul>
                    )}
                    {errors.attachment && (
                        <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                    )}
                </fieldset>
            )}

            {shouldShowSection("vendor-return-dc") && (
                <fieldset disabled={!isSectionEditable("vendor-return-dc")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                        รายละเอียดบันทึกการส่งคืนสินค้าซ่อมจาก Vendor
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
                        </div>
                        <div>
                            <label htmlFor="vendorReceiveName" className="form-label">ผู้รับ<Req /></label>
                            <input
                                id="vendorReceiveName"
                                className={inputClass(!!errors.vendorReceiveName)}
                                value={vendorReceiveName}
                                onChange={e => setVendorReceiveName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="vendorReturnDate" className="form-label block mb-1">วันที่รับสินค้าคืน<Req /></label>
                                <DatePicker
                                    id="vendorReturnDate"
                                    selected={vendorReturnDate}
                                    onChange={(date) => setVendorReturnDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    className={inputClass(!!errors.vendorReturnDate)}
                                />
                        </div>
                        <div>
                            <label htmlFor="vendorSenderTel" className="form-label">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                            <input
                                id="vendorSenderTel"
                                className={`${inputClass(!!errors.vendorSenderTel)} w-50`}
                                value={vendorSenderTel}
                                onChange={e => setVendorSenderTel(e.target.value)}
                            />
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {dcStep3Files.length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {dcStep3Files.map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                    <a
                                        href={a.file_path}
                                        target="_blank"
                                        className="underline text-slate-700 hover:text-slate-900"
                                        rel="noreferrer"
                                    >
                                        {a.file_name}
                                    </a>

                                    <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => {
                                            setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                            setExistingAttachments(
                                                (prev: ExistAttachment) => ({
                                                ...prev,
                                                ["2360"]: (prev["2360"] ?? []).filter(
                                                    (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                ),
                                                })
                                            );
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                    )}
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            setAttachmentsByStep((prev) => ({
                                ...prev,
                                "2360": files,
                            }));
                        }}
                    />

                    {(attachmentsByStep["2360"] ?? []).length > 0 && (
                        <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                            {attachmentsByStep["2360"].map((f) => (
                                <li key={`${f.name}-${f.size}`}>{f.name}</li>
                            ))}
                        </ul>
                    )}
                    {errors.attachment && (
                        <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                    )}
                </fieldset>
            )}

            {shouldShowSection("gr-return-cs") && (
                <fieldset disabled={!isSectionEditable("gr-return-cs")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                        รายละเอียดบันทึกการส่งคืนสินค้าซ่อมจาก GR
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
                        </div>
                        <div>
                            <label htmlFor="csReceiverName" className="form-label">ผู้รับ<Req /></label>
                            <input
                                id="csReceiverName"
                                className={inputClass(!!errors.csReceiverName)}
                                value={csReceiverName}
                                onChange={e => setCsReceiverName(e.target.value)}
                            />
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
                        </div>
                        <div>
                            <label htmlFor="grSentTel" className="form-label block mb-1">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                                <input
                                    id="grSentTel"
                                    className={inputClass(!!errors.grSentTel)}
                                    value={grSentTel}
                                    onChange={e => setReceiverName(e.target.value)}
                                />
                        </div>
                        <div>
                            <label htmlFor="location" className="form-label block mb-1">Location<Req /></label>
                                <input
                                    id="location"
                                    className={inputClass(!!errors.location)}
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                />
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {statusNum === 36 ? (
                        <>
                            {((existingAttachments["36"] ?? [])).length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {(existingAttachments["36"] ?? []).map(a => (
                                        <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                            <a
                                                href={a.file_path}
                                                target="_blank"
                                                className="underline text-slate-700 hover:text-slate-900"
                                                rel="noreferrer"
                                            >
                                                {a.file_name}
                                            </a>

                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                                    setExistingAttachments(
                                                        (prev: ExistAttachment) => ({
                                                        ...prev,
                                                        ["36"]: (prev["36"] ?? []).filter(
                                                            (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                        ),
                                                        })
                                                    );
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                            )}
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    setAttachmentsByStep((prev) => ({
                                        ...prev,
                                        "36": files,
                                    }));
                                }}
                            />

                            {(attachmentsByStep["36"] ?? []).length > 0 && (
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {(attachmentsByStep["36"] ?? []).map((file, idx) => (
                                        <li key={idx}>{file.name}</li>
                                    ))}
                                </ul>
                            )}
                            {errors.attachment && (
                                <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                            )}
                        </>
                    ) : (
                        <>
                            {((existingAttachments["236"] ?? [])).length > 0 ? (
                                <div className="mt-2 space-y-2">
                                    {(existingAttachments["236"] ?? []).map(a => (
                                        <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                            <a
                                                href={a.file_path}
                                                target="_blank"
                                                className="underline text-slate-700 hover:text-slate-900"
                                                rel="noreferrer"
                                            >
                                                {a.file_name}
                                            </a>

                                            <button
                                                type="button"
                                                className="text-red-600 hover:underline"
                                                onClick={() => {
                                                    setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                                    setExistingAttachments(
                                                        (prev: ExistAttachment) => ({
                                                        ...prev,
                                                        ["236"]: (prev["236"] ?? []).filter(
                                                            (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                        ),
                                                        })
                                                    );
                                                }}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                            )}
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf"
                                className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    setAttachmentsByStep((prev) => ({
                                        ...prev,
                                        "236": files,
                                    }));
                                }}
                            />

                            {(attachmentsByStep["236"] ?? []).length > 0 && (
                                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                                    {(attachmentsByStep["236"] ?? []).map((file, idx) => (
                                        <li key={idx}>{file.name}</li>
                                    ))}
                                </ul>
                            )}
                            {errors.attachment && (
                                <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                            )}
                        </>
                    )}
                </fieldset>
            )}

            {shouldShowSection("dc-return-gr") && (
                <fieldset disabled={!isSectionEditable("dc-return-gr")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">
                        รายละเอียดบันทึกการส่งคืนสินค้าจาก DC
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dcSentName" className="form-label">ผู้ส่งมอบ<Req /></label>
                            <input
                                id="dcSentName"
                                className={inputClass(!!errors.dcSentName)}
                                value={dcSentName}
                                onChange={e => setDcSentName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="hoReceiverName" className="form-label">ผู้รับ<Req /></label>
                            <input
                                id="hoReceiverName"
                                className={inputClass(!!errors.hoReceiverName)}
                                value={hoReceiverName}
                                onChange={e => setHoReceiverName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="dcReturnDate" className="form-label block mb-1">วันที่รับสินค้าคืน<Req /></label>
                            <DatePicker
                                id="dcReturnDate"
                                selected={dcReturnDate}
                                onChange={(date) => setDcReturnDate(date)}
                                dateFormat="dd/MM/yyyy"
                                className={inputClass(!!errors.dcReturnDate)}
                            />
                        </div>
                        <div>
                            <label htmlFor="dcSentTel" className="form-label block mb-1">เบอร์ติดต่อผู้ส่งมอบ<Req /></label>
                            <input
                                id="dcSentTel"
                                className={inputClass(!!errors.dcSentTel)}
                                value={dcSentTel}
                                onChange={e => setDcSentTel(e.target.value)}
                            />
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {dcStep4Files.length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {dcStep4Files.map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                    <a
                                        href={a.file_path}
                                        target="_blank"
                                        className="underline text-slate-700 hover:text-slate-900"
                                        rel="noreferrer"
                                    >
                                        {a.file_name}
                                    </a>

                                    <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => {
                                            setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                            setExistingAttachments(
                                                (prev: ExistAttachment) => ({
                                                ...prev,
                                                ["2361"]: (prev["2361"] ?? []).filter(
                                                    (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                ),
                                                })
                                            );
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                    )}
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            setAttachmentsByStep((prev) => ({
                                ...prev,
                                "2361": files,
                            }));
                        }}
                    />

                    {(attachmentsByStep["2361"] ?? []).length > 0 && (
                        <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                            {attachmentsByStep["2361"].map((f) => (
                                <li key={`${f.name}-${f.size}`}>{f.name}</li>
                            ))}
                        </ul>
                    )}
                    {errors.attachment && (
                        <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                    )}
                </fieldset>
            )}

            {shouldShowSection("customer-return") && (
                <fieldset disabled={!isSectionEditable("customer-return")} className="space-y-4">
                    <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าให้ลูกค้า</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sentName" className="form-label">ผู้ส่งมอบสินค้าคืน<Req /></label>
                            <input
                                id="sentName"
                                className={inputClass(!!errors.sentName)}
                                value={sentName}
                                onChange={e => setSentName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="customerName" className="form-label">ผู้รับสินค้าคืน<Req /></label>
                            <input
                                id="customerName"
                                className={inputClass(!!errors.customerName)}
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                            />
                        </div>
                        <div className="col-span-2" >
                            <label htmlFor="sentProductReturnDate" className="form-label block mb-1">วันที่ลูกค้ารับสินค้าคืน<Req /></label>
                                <DatePicker
                                    id="sentProductReturnDate"
                                    selected={sentProductReturnDate}
                                    onChange={(date) => setSentProductReturnDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="วว/ดด/ปป"
                                    className={inputClass(!!errors.sentProductReturnDate)}
                                />
                        </div>
                    </div>
                    <label className="form-label">
                        ไฟล์แนบ<Req />
                    </label>
                    {lastedStepFiles.filter(a => !a.file_name.toUpperCase().includes("SIGNATURE")).length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {lastedStepFiles.filter(a => !a.file_name.toUpperCase().includes("SIGNATURE")).map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                    <a
                                        href={a.file_path}
                                        target="_blank"
                                        className="underline text-slate-700 hover:text-slate-900"
                                        rel="noreferrer"
                                    >
                                        {a.file_name}
                                    </a>

                                    <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => {
                                            setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                            setExistingAttachments(
                                                (prev: ExistAttachment) => ({
                                                ...prev,
                                                [stepKey]: (prev[stepKey] ?? []).filter(
                                                    (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                ),
                                                })
                                            );
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-slate-500">ยังไม่มีไฟล์แนบ</div>
                    )}
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        className={`${inputClass(!!errors.attachment)} w-60 mt-3`}
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            setAttachmentsByStep((prev) => ({
                                ...prev,
                                [stepKey]: files,
                            }));
                        }}
                    />

                    {(attachmentsByStep[stepKey] ?? []).length > 0 && (
                        <ul className="mt-2 text-sm text-slate-700 list-disc pl-6">
                            {attachmentsByStep[stepKey].map((f) => (
                                <li key={`${f.name}-${f.size}`}>{f.name}</li>
                            ))}
                        </ul>
                    )}
                    {errors.attachment && (
                        <p className="text-red-600 text-sm mt-1">{errors.attachment}</p>
                    )}
                    <label className="form-label mt-4">
                        ลายเซ็น<Req />
                    </label>
                    {lastedStepFiles.filter(a => a.file_name.toUpperCase().includes("SIGNATURE")).length > 0 ? (
                        <div className="mt-2 space-y-2">
                            {lastedStepFiles.filter(a => a.file_name.toUpperCase().includes("SIGNATURE")).map(a => (
                                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                                    <a
                                        href={a.file_path}
                                        target="_blank"
                                        className="underline text-slate-700 hover:text-slate-900"
                                        rel="noreferrer"
                                    >
                                        {a.file_name}
                                    </a>

                                    <button
                                        type="button"
                                        className="text-red-600 hover:underline"
                                        onClick={() => {
                                            setDeletedAttachmentIds((prev) => [...prev, a.id]);
                                            setExistingAttachments(
                                                (prev: ExistAttachment) => ({
                                                ...prev,
                                                [stepKey]: (prev[stepKey] ?? []).filter(
                                                    (x: { id: number; file_name: string; file_path: string }) => x.id !== a.id
                                                ),
                                                })
                                            );
                                        }}
                                    >
                                        ลบ
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-slate-500">ยังไม่มีลายเซนต์</div>
                    )}
                </fieldset>
            )}
            <div className="flex items-center justify-end gap-3">
                <button type="button" className="btn-back" onClick={() => history.back()}>
                    ย้อนกลับ
                </button>
                {currentStep !== "30" && currentStep !== "20" && (
                    <button type="submit" className="btn-submit" disabled={saving}>
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                )}
            </div>
            </form>
        </div>
        </section>
    );
}
