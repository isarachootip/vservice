"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, BadgeCheck, BadgeX, ChevronsDown, CircleCheck, CircleX, File, Image} from "lucide-react";
import Link from "next/link";

type Warranty = "in" | "out" | null;
type approval = "Y" | "N" | null;

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
    num_of_repair_day?: string | null;
    num_of_guarantee_day?: string | null;
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

type CollapsibleFieldsetProps = {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
};

type UserInfo = {
  user_name: string;
  role?: string;
  permissions?: string[];
};

type Step = {
  key: string;
  label: string;
  active: boolean;
  done: boolean;
};

type VendorStatus 
    = 10 | 11 | 30 | 31 | 32 | 33 | 34 | 35 | 360 | 361 | 36 | 37;
type DcStatus 
    = 10 | 11 | 20 | 201 | 21 | 22 | 23 | 232 | 233 | 234 | 235 | 2360 | 2361 | 236 | 237;

const VENDOR_ROUTE: readonly VendorStatus[] 
    = [10, 11, 30, 31, 32, 33, 34, 35, 360, 361, 36, 37] as const;
const DC_ROUTE: readonly DcStatus[] 
    = [10, 11, 20, 201, 21, 22, 23, 232, 233, 234, 235, 2360, 2361, 236, 237] as const;

const VENDOR_LABELS: Record<VendorStatus, string> = {
    10: "เปิดใบแจ้งซ่อม",
    11: "GR รับสินค้าซ่อมจาก CS",
    30: "ส่ง Vendor / รอ Vendor มารับสินค้า",
    31: "Vendor รับสินค้าแล้ว / รอตีราคา",
    32: "ขออนุมัติราคาจากลูกค้า",
    33: "บันทึกผลการตัดสินใจของลูกค้า",
    34: "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)",
    35: "แจ้งผลให้ Vendor (อนุมัติซ่อม)",
    360: "DC รอส่งสินค้าเข้าสาขา",
    361: "GR รับสินค้าคืนจาก Vendor / DC แล้ว",
    36: "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน",
    37: "ลูกค้ารับสินค้าคืนแล้ว",
};

const DC_LABELS: Record<DcStatus, string> = {
    10: "เปิดใบแจ้งซ่อม",
    11: "GR รับสินค้าซ่อมจาก CS",
    20: "ส่ง DC / รอ GR เปิด Log DC",
    201: "GR เปิด Log DC / รอ DC มารับสินค้า",
    21: "DC รับสินค้าจากสาขาแล้ว",
    22: "DC รับสินค้าเข้า DC แล้ว / รอ Vendor มารับสินค้า",
    23: "Vendor รับสินค้าแล้ว / รอตีราคา",
    232: "ขออนุมัติราคาจากลูกค้า",
    233: "บันทึกผลการตัดสินใจของลูกค้า",
    234: "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)",
    235: "แจ้งผลให้ Vendor (อนุมัติซ่อม)",
    2360: "DC รับสินค้าคืนจาก Vendor แล้ว",
    2361: "GR รับสินค้าคืนจาก DC แล้ว",
    236: "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน",
    237: "ลูกค้ารับสินค้าคืนแล้ว",
};

const toYMD = (v: unknown): string => {
    if (!v) return "";
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

function isVendorStatus(v: number): v is VendorStatus {
  return (VENDOR_ROUTE as readonly number[]).includes(v);
}

export default function RequestViewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    //* section ข้อมูลลูกค้า
    const [firstName, setFirstName] = useState("");
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    //* section รายละเอียดสินค้า
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

    const [status,      setStatus]    = useState<number | "">("");
    const [rejectFlg,   setRejectFlg] = useState<string | null>(null);
    const [rejectFromStatus, setRejectFromStatus] = useState<string | null>(null);
    const [transactionLogs, setTransactionLogs] = useState<Array<{step_no: string | null; act_user_name: string | null; act_trans_log: string | null; act_date_time: Date | null}>>([]);
    const [attachments, setAttachments] = useState<{ file_path: string; file_name: string }[]>([]);
    const [signatureAttachments237, setSignatureAttachments237] = useState<{ id: number; file_path: string; file_name: string }[]>([]);
    const [signatureAttachments37, setSignatureAttachments37] = useState<{ id: number; file_path: string; file_name: string }[]>([]);
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);
    const [showRejectHistory, setShowRejectHistory] = useState(false);

    //* section Vendor ตีราคา
    const [vendorName, setVendorName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverTel, setReceiverTel] = useState("");
    const [sendDate, setSendDate] = useState<Date | null>(null);

    //* section Quotation
    const [rows, setRows] = useState<Row[]>([]);
    const [quotationNo, setQuotationNo] = useState("");
    const [reviewPriceDate, setReviewPriceDate] = useState<string>("");
    const [avgRepairDay, setAvgRepairDay] = useState("");
    const [guaranteeDay, setGuaranteeDay] = useState("");

    const money = (n: number) =>
        n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const effectiveParts = (r: Row) => (r.warrantyParts ? 0 : (r.parts || 0));
    const effectiveLabor = (r: Row) => (r.warrantyLabor ? 0 : (r.labor || 0));
    const lineTotal = (r: Row) => effectiveParts(r) + effectiveLabor(r);

    const totalParts = rows.reduce((s, r) => s + effectiveParts(r), 0);
    const totalLabor = rows.reduce((s, r) => s + effectiveLabor(r), 0);
    const grandTotal = totalParts + totalLabor;

    //* section cs to gr
    const [csSendName, setCsSendName] = useState("");
    const [grReceiveName, setGrReceiveName] = useState("");
    const [grReceiverTel, setGrReceiverTel] = useState("");
    const [csSendDate, setCsSendDate] = useState<Date | null>(null);

    //* section User Approve
    const [approveFlg, setApproveFlg] = useState<approval>(null);
    const [approveDate, setApproveDate] = useState<string>("");
    const [ticketNum, setTicketNum] = useState("");

    //* section Verdor Report
    const [vendorNotiBy, setVendorNotiBy] = useState("");
    const [vendorNotiDate, setVendorNotiDate] = useState<string>("");

    //* section Product Return (Vendor)
    const [vendorReturnReceive, setVendorReturnReceive] = useState("");
    const [vendorReturnSent, setVendorReturnSent] = useState("");
    const [vendorReturnSenderTel, setVendorReturnSenderTel] = useState("");
    const [vendorReturnDate, setVendorReturnDate] = useState<string>("");

    //* section Product Return (Customer)
    const [customerReturnReceive, setCustomerReturnReceive] = useState("");
    const [customerReturnSent, setCustomerReturnSent] = useState("");
    const [customerReturnDate, setCustomerReturnDate] = useState<string>("");

    //* section DC
    const [sentToDCName, setSentToDCName] = useState("");
    // const [approvelogID, setApprovelogID] = useState("");
    const [dcReceiverTel, setDcReceiverTel] = useState("");
    const [dcReceiveDate, setDcReceiveDate] = useState<string>("");
    const [dcArriveDate, setDcArriveDate] = useState<string>("");
    //* section Vendor to DC
    const [vendorSentName, setVendorSentName] = useState("");
    const [dcReceiveVenName, setDcReceiveVenName] = useState("");
    const [returnDcDate, setReturnDcDate] = useState<string>("");
    const [senderTel, setSenderTel] = useState("");
    //* section DC to GR
    const [dcSentName, setDcSentName] = useState("");
    const [receiveName, setReceiveName] = useState("");
    const [dcReturnDate, setDcReturnDate] = useState<string>("");
    const [dcSentTel, setDcSentTel] = useState("");
    //* section GR to CS
    const [grSentName, setGrSentName] = useState("");
    const [csReceiverName, setCsReceiverName] = useState("");
    const [grReturnDate, setGrReturnDate] = useState<Date | null>(null);
    const [grSentTel, setGrSentTel] = useState("");
    const [location, setLocation] = useState("");
    //* section GR open log DC
    const [openLogBy, setOpenLogBy] = useState("");
    const [approvelogID, setApprovelogID] = useState("");
    const [openLogDate, setOpenLogDate] = useState<Date | null>(null);
    //* section GR reject
    const [dcSentReturnName, setDcSentReturnName] = useState("");
    const [receiveReturnName, setReceiveReturnName] = useState("");
    const [dcSentReturnDate, setDcSentReturnDate] = useState<string>("");
    const [dcSentReturnTel, setDcSentReturnTel] = useState("");

    //* status flag
    const statusNum =
            typeof status === "number"
                ? status
                : Number(status || 0);

    const isUserConfirmDetailFlg = [33,34,35,360,36,37,233,234,235,2360,236,237].includes(statusNum);

    //* progress bar
    const statusNums = typeof status === "number" ? status : Number(status || 0);
    const hasDcFlow = Boolean(
        dcReceiveVenName &&
        dcReceiveVenName !== "-" &&
        dcReceiveVenName.trim() !== "");
    const steps = buildStepsFromStatus(statusNums);
    const [loading, setLoading] = useState(true);
    const [openStepKey, setOpenStepKey] = useState<string | null>("10");;

    //* CSS
    const labelCell = "w-56 pr-4 text-right align-top whitespace-nowrap";

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const raw = localStorage.getItem("userInfo");
                if (!raw) return;
                try {
                    const u = JSON.parse(raw);
                    setUserInfo({
                        user_name: u.user_name,
                        role: u.role,
                        permissions: Array.isArray(u.permissions) ? u.permissions : [],
                    });
                } catch {}

                const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}&getTransactionLog=true`, { cache: "no-store" });
                const data = await res.json();

                if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");

                const r = data.request;
                if (!r) throw new Error("ไม่พบข้อมูลใบแจ้งซ่อม");
                setTransactionLogs(data.transactionLogs ?? []);
                // console.log("check obj : ",r)
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
                setStatus(r.status);
                setRejectFlg(r.reject_flg ?? null);
                setRejectFromStatus(r.reject_from_status ?? null);
                setAttachments(r.repair_attachment ?? []);

                //* signature for step 237
                const sig237 = (r.repair_attachment ?? []).filter(
                    (a: { id: number; file_path: string; file_name: string; step_no: string }) =>
                        String(a.step_no) === "237" && a.file_name.toUpperCase().includes("SIGNATURE")
                );
                setSignatureAttachments237(sig237);

                //* signature for step 37
                const sig37 = (r.repair_attachment ?? []).filter(
                    (a: { id: number; file_path: string; file_name: string; step_no: string }) =>
                        String(a.step_no) === "37" && a.file_name.toUpperCase().includes("SIGNATURE")
                );
                setSignatureAttachments37(sig37);

                setReceiveFromUserDt(r.receive_from_user_date ?? "");

                setVendorName(r.vendor_name ?? "");
                setReceiverName(r.send_to_vendor_by ?? "");
                setReceiverTel(r.send_to_vendor_tel ?? "")
                setSendDate(r.send_to_vendor_date ?? "");

                setVendorNotiBy(r.vendor_notified_by ?? "");
                setVendorNotiDate(r.vendor_notified_date ?? "");

                //* cs to gr
                setCsSendName(r.cs_send_to_gr_by ?? "");
                setGrReceiveName(r.cs_to_gr_receive_by ?? "");
                setGrReceiverTel(r.cs_to_gr_tel ?? "");
                setCsSendDate(r.cs_send_to_gr_date ?? "");

                //* product return (vendor)
                setVendorReturnReceive(r.vendor_return_receive_by ?? "");
                setVendorReturnSent(r.vendor_return_sent_by ?? "");
                setVendorReturnSenderTel(r.vendor_return_sender_tel ?? "");
                setVendorReturnDate(r.vendor_return_date ?? "");

                //* product return (gr to cs)
                setGrSentName(r.gr_send_return_to_cs_by ?? "");
                setGrReturnDate(r.gr_send_return_to_cs_date ?? "");
                setGrSentTel(r.gr_send_return_to_cs_tel ?? "");
                setCsReceiverName(r.gr_send_return_to_cs_receive_by ?? "");
                setLocation(r.location ?? "");

                //* product return (customer)
                setCustomerReturnReceive(r.customer_receive_by ?? "");
                setCustomerReturnSent(r.customer_receive_sent_by ?? "");
                setCustomerReturnDate(r.customer_receive_date ?? "");

                //* DC
                setSentToDCName(r.dc_receiver_name ?? "-");
                setApprovelogID(r.approvelog_id ?? "-");
                setDcReceiverTel(r.dc_receiver_tel);
                setDcReceiveDate(r.dc_receive_date ?? "-");
                setDcArriveDate(r.arrive_to_dc_date ?? "-");

                //* Vendor return to DC
                setVendorSentName(r.vendor_return_sent_by ?? "-");
                setDcReceiveVenName(r.vendor_return_receive_by ?? "-");
                setReturnDcDate(r.vendor_return_date ?? "-");
                setSenderTel(r.vendor_return_sender_tel ?? "-");

                //* DC return
                setDcSentName(r.dc_return_send_by ?? "-");
                setReceiveName(r.dc_return_receive_by ?? "-");
                setDcReturnDate(r.dc_return_date ?? "-");
                setDcSentTel(r.dc_return_tel ?? "-");

                //* GR open log DC
                setOpenLogBy(r.gr_open_dc_log_by ?? "");
                setApprovelogID(r.approvelog_id ?? "");
                setOpenLogDate(r.gr_open_dc_log_date ?? "");

                //* GR reject (DC คืนสินค้าให้สาขา)
                setDcSentReturnName(r.dc_rej_return_send_by ?? "");
                setReceiveReturnName(r.dc_rej_return_receive_by ?? "");
                setDcSentReturnDate(r.dc_rej_return_date ?? "");
                setDcSentReturnTel(r.dc_rej_return_tel ?? "");

                const q: quotationList[] = Array.isArray(r?.quotation)
                ? (r.quotation as quotationList[])
                : [];
                if (q.length > 0) {
                    setQuotationNo(q[0]?.quotation_no ?? "");
                    setReviewPriceDate(toYMD(q[0]?.review_price_date));
                    setAvgRepairDay(q[0]?.num_of_repair_day ?? "");
                    setGuaranteeDay(q[0]?.num_of_guarantee_day ?? "");
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
                setError((e as Error).message);
                alert((e as Error).message);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]);

    useEffect(() => {
        const activeStep = steps.find(s => s.active);
        if (activeStep) {
            setOpenStepKey(activeStep.key);
        }
    }, [statusNums]);

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6 text-center text-slate-500">กำลังโหลดข้อมูล...</section>;
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-10 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-2">ไม่พบข้อมูล</h2>
                    <p className="mb-6">{error}</p>
                    <button onClick={() => router.push("/status")} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">ย้อนกลับไปหน้าตรวจสอบสถานะ</button>
                </div>
            </div>
        );
    }

    const showDate = (v: Date | string | null | undefined): string => {
        if (!v) return "-";
        const d = v instanceof Date ? v : new Date(v);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH");
    };

    function indexOfStatus<T extends number>(arr: readonly T[], v: number) {
        const idx = arr.indexOf(v as T);
        return idx >= 0 ? idx : 0;
    }

    function getDcRouteByStatus(
        statusNums: number,
        approveFlg: approval,
    ): readonly DcStatus[] {
        let route = [...DC_ROUTE];

        if (approveFlg === "N") {
            route = route.filter(s => s !== 235);
        } else if (approveFlg === "Y") {
            route = route.filter(s => s !== 234);
        } else {
            route = route.filter(s => s !== 234 && s !== 235);
        }

        return route;
    }

    function getVendorRouteByStatus(
        statusNums: number,
        approveFlg: approval,
        hasDcFlow: boolean
    ): readonly VendorStatus[] {
        let route = [...VENDOR_ROUTE];

        if (approveFlg === "N") {
            route = route.filter(s => s !== 35);
        } else if (approveFlg === "Y") {
            route = route.filter(s => s !== 34);
        } else {
            route = route.filter(s => s !== 34 && s !== 35);
        }

        if (!hasDcFlow) {
            route = route.filter(s => s !== 360);
        }
        return route;
    }

    function getVendorLabel(
        status: VendorStatus,
        hasDcFlow: boolean,
        statusNums: number,
    ) {
        if (status === 34 || status === 35) {
            if (statusNums < 34) {
                return "แจ้งผลให้ Vendor (ซ่อม / ไม่ซ่อม)";
            }
            return status === 34
                ? "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)"
                : "แจ้งผลให้ Vendor (อนุมัติซ่อม)";
        }

        if (status === 361) {
            return hasDcFlow
                ? "GR รับสินค้าคืนจาก DC แล้ว"
                : "GR รับสินค้าคืนจาก Vendor แล้ว";
        }
        return VENDOR_LABELS[status];
    }

    function getDcLabel(
        status: DcStatus,
        statusNums: number
    ): string {
        switch (status) {
            case 234:
            case 235:
                if (statusNums < 234) {
                    return "แจ้งผลให้ Vendor (ซ่อม / ไม่ซ่อม)";
                }

                return status === 234
                    ? "แจ้งผลให้ Vendor (ไม่อนุมัติซ่อม)"
                    : "แจ้งผลให้ Vendor (อนุมัติซ่อม)";

            default:
                return DC_LABELS[status];
        }
    }

    function buildStepsFromStatus(statusNums: number): Step[] {
        if (statusNums === 0) {
            return [
                {
                    key: "10",
                    label: "เปิดใบแจ้งซ่อม",
                    done: true,
                    active: false,
                },
                {
                    key: "0",
                    label: "ใบแจ้งซ่อมถูกยกเลิก",
                    done: false,
                    active: true,
                },
            ];
        }

        if ((statusNums === 10 || statusNums === 11) && !hasDcFlow) {
            const hasReject = rejectFlg === "Y" && (rejectFromStatus === "21" || rejectFromStatus === "22");

            const steps = [
                {
                    key: "10",
                    label: "เปิดใบแจ้งซ่อม",
                    done: hasReject || statusNums !== 10,
                    active: statusNums === 10 && !hasReject,
                },
                {
                    key: "11",
                    label: "GR รับสินค้าซ่อมจาก CS",
                    done: hasReject || statusNums > 11,
                    active: statusNums === 11 && !hasReject,
                },
            ];

            if (hasReject) {
                steps.splice(2, 0, {
                    key: "10_reject",
                    label: "GR บันทึกรับสินค้าคืนจาก DC",
                    done: false,
                    active: true,
                });
            }

            steps.push({
                key: "send_choice",
                label: "ส่ง DC / Vendor",
                done: false,
                active: false,
            });

            return steps;
        }
        if (isVendorStatus(statusNums)) {
            const route = getVendorRouteByStatus(statusNums,approveFlg,hasDcFlow);
            const currentIndex = indexOfStatus(route, statusNums);

            const steps = route.map((status, idx) => ({
                key: String(status),
                label: getVendorLabel(status, hasDcFlow, statusNums),
                done: idx < currentIndex,
                active: idx === currentIndex,
            }));

            if (rejectFlg === "Y" && (rejectFromStatus === "21" || rejectFromStatus === "22")) {
                if (statusNums === 10) {
                    steps.splice(2, 0, {
                        key: "10_reject",
                        label: "GR บันทึกรับสินค้าคืนจาก DC",
                        done: false,
                        active: true,
                    });
                }
            }

            return steps;
        }

        //* DC route
        const route = getDcRouteByStatus(statusNums,approveFlg);
        const currentIndex = indexOfStatus(route, statusNums);

        const steps = route.map((status, idx) => ({
            key: String(status),
            label: getDcLabel(status, statusNums),
            done: idx < currentIndex,
            active: idx === currentIndex,
        }));

        //* reject step
        if (rejectFlg === "Y") {
            if (rejectFromStatus === "20") {
                const idx20 = steps.findIndex(s => s.key === "20");
                if (idx20 >= 0) {
                    steps[idx20] = {
                        key: "20_reject",
                        label: "ส่ง DC / รอ GR เปิด Log DC",
                        done: steps[idx20].done,
                        active: steps[idx20].active,
                    };
                }
            } else if (rejectFromStatus === "201") {
                const idx201 = steps.findIndex(s => s.key === "201");
                if (idx201 >= 0) {
                    steps[idx201] = {
                        key: "201_reject",
                        label: "GR เปิด Log DC / รอ DC มารับสินค้า",
                        done: steps[idx201].done,
                        active: steps[idx201].active,
                    };
                }
            } else if (rejectFromStatus === "21") {
                const idx21 = steps.findIndex(s => s.key === "21");
                if (idx21 >= 0) {
                    steps[idx21] = {
                        key: "21_reject",
                        label: "DC รับสินค้าจากสาขาแล้ว",
                        done: steps[idx21].done,
                        active: steps[idx21].active,
                    };
                }
            } else if (rejectFromStatus === "22") {
                const idx22 = steps.findIndex(s => s.key === "22");
                if (idx22 >= 0) {
                    steps[idx22] = {
                        key: "22_reject",
                        label: "DC รับสินค้าเข้า DC แล้ว / รอ Vendor มารับสินค้า",
                        done: steps[idx22].done,
                        active: steps[idx22].active,
                    };
                }
            }
        }

        return steps;
    }

    function TimelineStep({
            step,
            isLast,
            children,
            openStepKey,
            setOpenStepKey,
        }: {
            step: Step;
            isLast: boolean;
            children?: React.ReactNode;
            openStepKey: string | null;
            setOpenStepKey: (key: string) => void;
        })
    {
        const open = openStepKey === step.key;
        const canOpen = step.done || step.active;
        const isCancelled = step.key === "0";
        const isReject = ["20_reject", "201_reject", "21_reject", "22_reject"].includes(step.key);
        const isExpandable = !isCancelled  && canOpen &&
            [
                "10",
                "10_reject",
                "11",
                "20_reject",
                "201",
                "201_reject",
                "21",
                "21_reject",
                "22",
                "22_reject",
                "23",
                "232",
                "233",
                "234",
                "235",
                "2360",
                "2361",
                "236",
                "237",
                "31",
                "32",
                "33",
                "34",
                "35",
                "361",
                "36",
                "37",
            ].includes(step.key);
        return (
            <div className={`relative pl-10 ${isLast ? "pb-0" : "pb-4"}`}>
                <div
                    className={`absolute left-0 top-1 h-5 w-5 rounded-full border-2 ${
                        isCancelled
                            ? "bg-red-500 border-red-500"
                            : step.done
                            ? "bg-green-500 border-green-500"
                            : step.active
                            ? "bg-blue-500 border-blue-500 animate-pulse"
                            : "bg-white border-slate-400"
                    }`}
                />

                {isExpandable ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const scrollPos = window.scrollY;
                            setOpenStepKey(open ? "" : step.key);
                            requestAnimationFrame(() => {
                                window.scrollTo(0, scrollPos);
                            });
                        }}
                        disabled={!canOpen}
                        className={`flex items-center gap-3 text-left font-semibold
                            ${!canOpen ? "opacity-50 cursor-not-allowed" : ""}
                        `}

                    >
                        <span>
                            {step.label}
                        </span>
                        <ChevronsDown
                            className={`w-4 h-4 transition-transform ${
                                open ? "" : "-rotate-90"
                            }`}
                        />
                    </button>
                ) : (
                    <div
                        className={`flex items-center gap-3 font-semibold ${
                            isCancelled ? "text-red-600" : "text-slate-800"
                        }`}
                    >
                        <span>{step.label}</span>
                    </div>
                )}
                {isExpandable && open && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        {children}
                    </div>
                )}
                {!isLast && (
                    <div className="absolute left-[9px] top-6 bottom-[-8px] w-[2px] bg-slate-300" />
                )}
            </div>
        );
    }

    function getPrintPath(status: number, id: string) {
        if ([37, 237].includes(status)) {
            //* ใบเสนอราคา / ส่งคืน
            // return `/print-quotation/${encodeURIComponent(id)}`;
        }
        //* default
        return `/print/${encodeURIComponent(id)}`;
    }

    function formatDateTH(d: Date) {
        return d.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        });
    }

    //*  สิ้นสุดวันประกันวันที่ Vendor
    function getEndOfGuaranteeDays(vendor_return_date: string | null,num_of_guarantee_day: string | null) {
        if (!vendor_return_date || !num_of_guarantee_day) return null;

        const days = Number(num_of_guarantee_day);
        if (!Number.isFinite(days)) return null;

        const base = new Date(vendor_return_date);
        if (Number.isNaN(base.getTime())) return null;

        const result = new Date(base);
        result.setDate(result.getDate() + days);

        return formatDateTH(result);
    }    

    //*  สิ้นสุดวันประกันวันที่ DC
    function getEndOfGuaranteeDaysDC(dc_return_date: string | null,num_of_guarantee_day: string | null) {
        if (!dc_return_date || !num_of_guarantee_day) return null;

        const days = Number(num_of_guarantee_day);
        if (!Number.isFinite(days)) return null;

        const base = new Date(dc_return_date);
        if (Number.isNaN(base.getTime())) return null;

        const result = new Date(base);
        result.setDate(result.getDate() + days);
       
        return formatDateTH(result);
    }

    //*  สิ้นสุดวันประกันวันที่ DC กรณี GR รับแทน
    function getEndOfGuaranteeDaysDcButGR(vendor_send_to_dc_date: string | null,num_of_guarantee_day: string | null) {
        if (!vendor_send_to_dc_date || !num_of_guarantee_day) return null;

        const days = Number(num_of_guarantee_day);
        if (!Number.isFinite(days)) return null;

        const base = new Date(vendor_send_to_dc_date);
        if (Number.isNaN(base.getTime())) return null;

        const result = new Date(base);
        result.setDate(result.getDate() + days);
       
        return formatDateTH(result);
    }

    const formatDate = (v: unknown) => {
        if (!v) return "-";
        const d = new Date(v as string);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH");
    };

    return (
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            รายละเอียดใบแจ้งซ่อม
        </h1>
        <br />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            
            <form className="relative space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="mb-6 flex gap-3 justify-end">
                <Link
                    href={getPrintPath(statusNums, String(id))}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg
                                bg-orange-200 px-4 py-2 text-sm font-semibold text-orange-900
                                hover:bg-orange-300 transition"
                >
                    <File className="w-4 h-4" />
                    ดูเอกสาร / Print
                </Link>
                <Link
                    href={`/api/attachments/download?requestId=${id}`}
                    className="inline-flex items-center gap-2 rounded-lg
                                bg-green-200 px-4 py-2 text-sm font-semibold text-green-900
                                hover:bg-green-300 transition"
                    >
                    <Image className="w-4 h-4" />
                    ดาวน์โหลดไฟล์แนบ
                </Link>
            </div>

            {transactionLogs.some(log => log.act_trans_log && log.act_trans_log.includes("Reject")) && (
                <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowRejectHistory(!showRejectHistory)}
                        className="flex items-center gap-2 text-lg font-bold text-red-600 hover:text-red-700 w-full"
                    >
                        📋 ประวัติการ Reject
                        <span className={`transition-transform ${showRejectHistory ? "" : "-rotate-90"}`}>
                            <ChevronsDown className="w-5 h-5" />
                        </span>
                    </button>
                    {showRejectHistory && (
                        <div className="space-y-2 mt-3">
                            {transactionLogs
                                .filter(log => log.act_trans_log && log.act_trans_log.includes("Reject"))
                                .map((log, idx) => (
                                    <div key={idx} className="bg-white border border-red-200 rounded p-3">
                                        <p className="text-sm font-semibold text-red-700">
                                            {log.act_trans_log?.replace(/\s*\|\s*เหตุผล\s*:.*$/, "")}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">
                                            เหตุผล: {log.act_trans_log?.match(/\| เหตุผล : (.+?)$/)?.[1] || "-"}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            โดย: {log.act_user_name} | {
                                                log.act_date_time
                                                    ? new Date(log.act_date_time).toLocaleDateString("th-TH", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit"
                                                    })
                                                    : "-"
                                            }
                                        </p>
                                        {log.step_no === "21" && dcSentReturnName && (
                                            <div className="mt-3 border-t border-gray-200 pt-3">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-700">ผู้ส่งสินค้าคืนจาก DC</p>
                                                        <p className="text-sm text-gray-600">{dcSentReturnName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-700">ผู้รับสินค้าคืน</p>
                                                        <p className="text-sm text-gray-600">{receiveReturnName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-700">วันที่รับสินค้าคืน</p>
                                                        <p className="text-sm text-gray-600">{formatDate(dcSentReturnDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-700">เบอร์ติดต่อผู้ส่งมอบ</p>
                                                        <p className="text-sm text-gray-600">{dcSentReturnTel}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {steps.map((step,index) => (
                <TimelineStep
                    key={step.key}
                    step={step}
                    isLast={index === steps.length - 1}
                    openStepKey={openStepKey}
                    setOpenStepKey={setOpenStepKey}
                >
                    {step.key === "0" && (
                        <div className="text-sm text-red-700">
                            ใบแจ้งซ่อมนี้ถูกยกเลิกแล้ว
                        </div>
                    )}

                    {step.key === "10_reject" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึก DC ตีคืนสินค้ากลับ</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>
                                                {dcSentReturnName || "-"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้รับ :</td>
                                            <td>
                                                {receiveReturnName || "-"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                            <td>
                                                {dcSentReturnTel || "-"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(dcSentReturnDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step.key === "10" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">ข้อมูลลูกค้า</legend>
                            <div className="flex justify-center">
                                <table className="data-table min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ชื่อ - นามสกุล :</td>
                                            <td>{firstName}  {lastName}</td>
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
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
                            <div className="flex justify-center overflow-x-auto md:overflow-x-visible">
                                <table className="data-table min-w-[560px]">
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
                                                {sku !== null && sku !== undefined && sku !== ""
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
                                                {formatDate(receiveFromUserDt)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step.key === "11" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดการส่งสินค้าให้ GR</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>{csSendName}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับสินค้า :</td>
                                            <td>{grReceiveName}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อผู้รับ :</td>
                                            <td>{grReceiverTel}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่ส่งสินค้า :</td>
                                            <td>{formatDate(csSendDate)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(step.key === "201" || step.key === "201_reject") && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียด GR เปิด Log ให้ DC</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้เปิด Log :</td>
                                            <td>{openLogBy}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เลขที่ Log :</td>
                                            <td>{approvelogID}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่เปิด Log :</td>
                                            <td>{formatDate(openLogDate)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {(step.key === "21" || step.key === "21_reject") && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC รับสินค้าจากสาขา</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                <tbody>
                                    <tr>
                                        <td className={labelCell}>ผู้มารับสินค้า :</td>
                                        <td>
                                            {sentToDCName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={labelCell}>เบอร์ติดต่อ :</td>
                                        <td>
                                            {dcReceiverTel}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className={labelCell}>วันที่รับสินค้าจากสาขา :</td>
                                        <td>
                                            {formatDate(dcReceiveDate)}
                                        </td>
                                    </tr>
                                </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "22" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียด DC รับสินค้าเข้าที่ DC</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>วันที่ DC รับสินค้าเข้าที่ DC :</td>
                                            <td>
                                                {formatDate(dcArriveDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "23" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดผู้มารับสินค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ขาย (Vendor) :</td>
                                            <td>
                                                {vendorName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้มารับสินค้า :</td>
                                            <td>
                                                {receiverName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อ :</td>
                                            <td>
                                                 {receiverTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่ส่งสินค้า :</td>
                                            <td>
                                                {formatDate(sendDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "232" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดใบเสนอราคา</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody className="text-sm">
                                        <tr>
                                            <td className="pr-4 text-right text-base text-slate-900 align-top">
                                                เลขที่ใบเสนอราคา :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {quotationNo}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
                                                วันที่เสนอราคา :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {formatDate(reviewPriceDate)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
                                                ระยะเวลาการซ่อมประมาณ :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {avgRepairDay} วัน
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
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
                                                    {isUserConfirmDetailFlg && (
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
                                                    )}
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
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "233" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการอนุมัติจากลูกค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
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
                                                {formatDate(approveDate)}
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
                            </div>                 
                        </div>
                    )}

                    {(step.key === "234" || step.key === "235") && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการการแจ้ง Vendor</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้รับทราบ :</td>
                                            <td>
                                                {vendorNotiBy}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่บันทึกการแจ้ง :</td>
                                            <td>
                                                {formatDate(vendorNotiDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "2360" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าจาก Vendor</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้ส่งมอบ :</td>
                                            <td>
                                                {vendorSentName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้รับ :</td>
                                            <td>
                                                {dcReceiveVenName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                            <td>
                                                {senderTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(returnDcDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )} 

                    {step.key === "2361" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าจาก DC</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>
                                                {dcSentName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้รับ :</td>
                                            <td>
                                                {receiveName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                            <td>
                                                {dcSentTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(dcReturnDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "236" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดการส่งสินค้าคืนให้ CS</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>
                                                {grSentName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับ :</td>
                                            <td>
                                                {csReceiverName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ผู้ส่งมอบ :</td>
                                            <td>
                                                {grSentTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>Location :</td>
                                            <td>
                                                {location}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(grReturnDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "237" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าแก่ลูกค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบสินค้าคืน :</td>
                                            <td>
                                                {customerReturnSent}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับสินค้าคืน :</td>
                                            <td>
                                                {customerReturnReceive}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่ลูกค้ารับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(customerReturnDate)}
                                            </td>
                                        </tr>
                                        {statusNum === 237 && dcSentName !== "-" ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDC(dcReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                            ) : String(status).startsWith("2") ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDcButGR(returnDcDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                        ) : null}
                                        {statusNum === 37 && dcSentName !== "-" ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDC(dcReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                            ) : String(status).startsWith("3") ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDays(vendorReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                        ) : null}
                                        <tr>
                                            <td className={labelCell}>ลายเซ็น :</td>
                                            <td>
                                                {signatureAttachments237.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {signatureAttachments237.map(sig => (
                                                            <div key={sig.id} className="flex flex-col items-start gap-3 border border-gray-300 rounded p-3">
                                                                <img
                                                                    src={sig.file_path}
                                                                    alt="Signature"
                                                                    className="max-w-xs border border-gray-200 rounded"
                                                                />
                                                                <a
                                                                    href={sig.file_path}
                                                                    download
                                                                    className="text-blue-600 underline text-sm hover:text-blue-800"
                                                                >
                                                                    ดาวน์โหลด
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">ไม่มีลายเซ็น</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step.key === "31" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียด Vendor มารับสินค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ขาย (Vendor) :</td>
                                            <td>{vendorName}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้มารับสินค้า :</td>
                                            <td>{receiverName}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อ :</td>
                                            <td>{receiverTel}</td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่ Vendor รับสินค้า :</td>
                                            <td>{formatDate(sendDate)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "32" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดใบเสนอราคา</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody className="text-sm">
                                        <tr>
                                            <td className="pr-4 text-right text-base text-slate-900 align-top">
                                                เลขที่ใบเสนอราคา :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {quotationNo}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
                                                วันที่เสนอราคา :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {formatDate(reviewPriceDate)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
                                                ระยะเวลาการซ่อมประมาณ :
                                            </td>
                                            <td className="pb-2 text-slate-900 text-base">
                                                {avgRepairDay} วัน
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>
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
                                                    {isUserConfirmDetailFlg && (
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
                                                    )}
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
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "33" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการอนุมัติจากลูกค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
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
                                                {formatDate(approveDate)}
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
                            </div>                 
                        </div>
                    )}

                    {(step.key === "34" || step.key === "35") && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการการแจ้ง Vendor</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ชื่อผู้รับทราบ :</td>
                                            <td>
                                                {vendorNotiBy}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่บันทึกการแจ้ง :</td>
                                            <td>
                                                {formatDate(vendorNotiDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "360" && (
                        <>
                        {/* รายละเอียดบันทึกการอนุมัติจากลูกค้า */}
                        </>
                    )}

                    {step.key === "361" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าจาก Vendor</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>
                                                {vendorReturnSent}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับ :</td>
                                            <td>
                                                {vendorReturnReceive}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ติดต่อผู้ส่งมอบ :</td>
                                            <td>
                                                {vendorReturnSenderTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(vendorReturnDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                 
                        </div>
                    )}

                    {step.key === "36" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดการส่งสินค้าคืนให้ CS</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบ :</td>
                                            <td>
                                                {grSentName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับ :</td>
                                            <td>
                                                {csReceiverName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>เบอร์ผู้ส่งมอบ :</td>
                                            <td>
                                                {grSentTel}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>Location :</td>
                                            <td>
                                                {location}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่รับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(grReturnDate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {step.key === "37" && (
                        <div className="space-y-6">
                            <legend className="text-lg font-semibold text-slate-900">รายละเอียดบันทึกการส่งคืนสินค้าแก่ลูกค้า</legend>
                            <div className="flex justify-center">
                                <table className="min-w-[560px]">
                                    <tbody>
                                        <tr>
                                            <td className={labelCell}>ผู้ส่งมอบสินค้าคืน :</td>
                                            <td>
                                                {customerReturnSent}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>ผู้รับสินค้าคืน :</td>
                                            <td>
                                                {customerReturnReceive}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={labelCell}>วันที่ลูกค้ารับสินค้าคืน :</td>
                                            <td>
                                                {formatDate(customerReturnDate)}
                                            </td>
                                        </tr>
                                        {statusNum === 237 && dcSentName !== "-" ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDC(dcReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                            ) : String(status).startsWith("2") ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDcButGR(returnDcDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                        ) : null}
                                        {statusNum === 37 && dcSentName !== "-" ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDaysDC(dcReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                            ) : String(status).startsWith("3") ? (
                                            <tr>
                                                <td className={labelCell}>สิ้นสุดวันประกันวันที่ :</td>
                                                <td>
                                                    {getEndOfGuaranteeDays(vendorReturnDate, guaranteeDay) ?? "-"}
                                                </td>
                                            </tr>
                                        ) : null}
                                        <tr>
                                            <td className={labelCell}>ลายเซ็น :</td>
                                            <td>
                                                {signatureAttachments37.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {signatureAttachments37.map(sig => (
                                                            <div key={sig.id} className="flex flex-col items-start gap-3 border border-gray-300 rounded p-3">
                                                                <img
                                                                    src={sig.file_path}
                                                                    alt="Signature"
                                                                    className="max-w-xs border border-gray-200 rounded"
                                                                />
                                                                <a
                                                                    href={sig.file_path}
                                                                    download
                                                                    className="text-blue-600 underline text-sm hover:text-blue-800"
                                                                >
                                                                    ดาวน์โหลด
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">ไม่มีลายเซ็น</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                </TimelineStep>
            ))}

            <div className="flex items-center justify-end gap-3">
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
        </section>
    );
}
