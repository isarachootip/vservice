"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ShieldX } from "lucide-react";

type Warranty = "in" | "out" | null;

export default function RequestViewPage() {
    const sp = useSearchParams();
    const id = sp.get("id");

    const [firstName, setFirstName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [lastName,  setLastName]  = useState("");
    const [address,   setAddress]   = useState("");
    const [phone,     setPhone]     = useState("");

    const [productType, setProductType] = useState("");
    const [brand,       setBrand]       = useState("");
    const [model,       setModel]       = useState("");
    const [serial,      setSerial]      = useState("");
    const [qty,         setQty]         = useState<number | "">("");

    const [warranty,   setWarranty]   = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);
    const [currentStatus, setCurrentStatus] = useState<number>(100);

    const steps = [
      { label: "แจ้งซ่อม", desc: "CS เปิดใบแจ้งซ่อม" },
      { label: "ส่งซ่อม (Vendor)", desc: "กำลังส่งไปยังศูนย์ซ่อม" },
      { label: "ประเมินราคา", desc: "ประเมินค่าใช้จ่าย" },
      { label: "อนุมัติซ่อม", desc: "ช่างเริ่มงานซ่อม" },
      { label: "ส่งคืนสาขา", desc: "ส่งกลับมายังสาขา" },
      { label: "ส่งคืนลูกค้า", desc: "รับเครื่องเรียบร้อย" }
    ];

    function getActiveStepIndex(status: number): number {
      if (status === 100) return 0;
      if ([110, 200, 210, 220, 230, 300].includes(status)) return 1;
      if ([240, 250, 310, 320].includes(status)) return 2;
      if ([260, 270, 275, 330, 340, 345].includes(status)) return 3;
      if ([280, 285, 290, 350, 360, 390].includes(status)) return 4;
      if ([299, 399].includes(status)) return 5;
      return 0;
    }

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}&getTransactionLog=true`, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");

            const r = data.request;
            if (!r) throw new Error("ไม่พบข้อมูลใบแจ้งซ่อม");
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
            setWarranty(it.in_warranty === "Y" ? "in" : it.in_warranty === "N" ? "out" : null);
            setWarrantyNo(it.warranty_no ?? "");
            
            setCurrentStatus(r.status ?? 100);
            setLogs(data.transactionLogs || []);
        } catch (e) {
            setError((e as Error).message);
            alert((e as Error).message);
        } finally {
            if (alive) setLoading(false);
        }
        })();
        return () => { alive = false; };
    }, [id]);

    if (loading) {
        return <section className="max-w-4xl mx-auto p-6 text-center text-slate-500">กำลังโหลดข้อมูล...</section>;
    }

    if (!id) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-slate-200 text-center space-y-6">
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                        ติดตามสถานะใบแจ้งซ่อม
                    </h2>
                    <p className="text-slate-500 text-sm">
                        กรุณากรอกหมายเลขใบแจ้งซ่อมของคุณเพื่อค้นหาความคืบหน้าของสินค้า
                    </p>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const val = new FormData(e.currentTarget).get("ticketId") as string;
                        if (val.trim()) {
                            window.location.search = `?id=${encodeURIComponent(val.trim())}`;
                        }
                    }} className="space-y-4">
                        <input
                            type="text"
                            name="ticketId"
                            className="input-base focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            required
                            placeholder="ระบุหมายเลขใบแจ้งซ่อม (เช่น 1, 2)"
                        />
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-all duration-200"
                        >
                            ค้นหาข้อมูล
                        </button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 text-left space-y-2">
                        <p className="text-xs text-slate-500 font-medium">
                            💡 ตั๋วสำหรับทดสอบระบบในฐานข้อมูล:
                        </p>
                        <div className="flex gap-2">
                            <a href="/?id=1" className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition">ตั๋ว ID 1 (LG)</a>
                            <a href="/?id=2" className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition">ตั๋ว ID 2 (Samsung)</a>
                        </div>
                        <p className="text-xs text-slate-400 pt-2 text-center">
                            สำหรับเจ้าหน้าที่? <a href="/login" className="text-[#c8102e] hover:underline font-semibold">เข้าสู่ระบบที่นี่</a>
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-10 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-2">ไม่พบข้อมูล</h2>
                    <p className="mb-6">{error}</p>
                    <button onClick={() => history.back()} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">ย้อนกลับ</button>
                </div>
            </div>
        );
    }

    return (
        <section className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 tracking-tight">
                รายละเอียดใบแจ้งซ่อม
            </h1>

            {/* 1. Shopee-style Horizontal Progress Bar or Cancel Banner */}
            <div className="mt-8">
                {currentStatus === 0 ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex items-center gap-3 shadow-sm">
                        <span className="text-2xl">❌</span>
                        <div>
                            <h3 className="font-bold text-sm">ใบแจ้งซ่อมนี้ถูกยกเลิกแล้ว</h3>
                            <p className="text-xs text-red-600/90 mt-0.5">รายการซ่อมนี้ได้รับการยกเลิกในระบบแล้ว หากมีข้อสงสัยโปรดติดต่อสาขาไทวัสดุ</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                        <div className="relative flex justify-between items-center w-full min-w-[650px] px-4">
                            {/* Background Line */}
                            <div className="absolute top-[22px] left-[40px] right-[40px] h-[3px] bg-slate-100 -z-0" />
                            
                            {/* Progress Line */}
                            <div 
                                className="absolute top-[22px] left-[40px] h-[3px] bg-[#c8102e] transition-all duration-500 -z-0" 
                                style={{ width: `${(getActiveStepIndex(currentStatus) / (steps.length - 1)) * 87}%` }}
                            />

                            {steps.map((step, idx) => {
                                const activeIndex = getActiveStepIndex(currentStatus);
                                const isCompleted = idx < activeIndex;
                                const isActive = idx === activeIndex;
                                
                                return (
                                    <div key={idx} className="flex flex-col items-center z-10 flex-1">
                                        <div 
                                            className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                                isCompleted 
                                                    ? "bg-[#c8102e] border-[#c8102e] text-white shadow-md shadow-red-200" 
                                                    : isActive 
                                                        ? "bg-white border-[#c8102e] text-[#c8102e] shadow-md shadow-red-100 scale-110 font-bold" 
                                                        : "bg-white border-slate-200 text-slate-400"
                                            }`}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className={`text-[11px] font-bold mt-2 text-center max-w-[100px] leading-tight ${
                                            isActive ? "text-[#c8102e]" : isCompleted ? "text-slate-700" : "text-slate-400"
                                        }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Customer and Product Details Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">ข้อมูลลูกค้า</h2>
                    <div className="space-y-2.5 text-sm text-slate-600">
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-24 shrink-0">ชื่อ-นามสกุล:</span>
                            <span>{firstName} {lastName}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-24 shrink-0">โทรศัพท์:</span>
                            <span>{phone}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-24 shrink-0">ที่อยู่:</span>
                            <span className="leading-relaxed">{address}</span>
                        </div>
                    </div>
                </div>

                {/* Product Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">รายละเอียดสินค้า</h2>
                    <div className="space-y-2.5 text-sm text-slate-600">
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-36 shrink-0">ประเภทสินค้า:</span>
                            <span>{productType}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-36 shrink-0">ยี่ห้อ:</span>
                            <span>{brand}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-36 shrink-0">รุ่น:</span>
                            <span>{model}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-36 shrink-0">เลขเครื่อง (Serial):</span>
                            <span>{serial || "-"}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold text-slate-800 w-36 shrink-0">จำนวน:</span>
                            <span>{qty} ชิ้น</span>
                        </div>
                        <div className="flex items-center">
                            <span className="font-bold text-slate-800 w-36 shrink-0">สถานะรับประกัน:</span>
                            <span className="flex items-center gap-1">
                                {warranty === "in" ? (
                                    <>
                                        <ShieldCheck className="text-green-600 w-4 h-4" />
                                        <span className="text-green-600 font-bold">อยู่ในประกัน {warrantyNo && `(${warrantyNo})`}</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldX className="text-red-600 w-4 h-4" />
                                        <span className="text-red-600 font-bold">นอกประกัน</span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Detailed Transaction Log Timeline */}
            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800 border-b pb-2">ประวัติการดำเนินงาน</h2>
                
                {logs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">ไม่พบประวัติความคืบหน้าของสินค้า</p>
                ) : (
                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
                        {logs.map((log, idx) => {
                            const isLatest = idx === 0;
                            
                            return (
                                <div key={idx} className="relative">
                                    {/* Dot indicator */}
                                    <div className={`absolute -left-[32px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                                        isLatest ? "border-[#c8102e] scale-125" : "border-slate-300"
                                    }`}>
                                        {isLatest && <div className="w-1.5 h-1.5 bg-[#c8102e] rounded-full mx-auto mt-[1px]" />}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className={`text-sm ${isLatest ? "font-bold text-slate-900" : "text-slate-600 font-medium"}`}>
                                            {log.act_trans_log}
                                        </p>
                                        <div className="flex gap-2 items-center text-xs text-slate-400">
                                            <span>{new Date(log.act_date_time).toLocaleString("th-TH")}</span>
                                            {log.act_user_name && (
                                                <>
                                                    <span>•</span>
                                                    <span>ผู้บันทึก: {log.act_user_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Back Button */}
            <div className="mt-6 flex justify-end">
                <button
                    type="button"
                    className="btn-back bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg shadow-sm transition"
                    onClick={() => history.back()}
                >
                    ย้อนกลับ
                </button>
            </div>
        </section>
    );
}
