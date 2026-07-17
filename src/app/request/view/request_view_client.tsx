"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ShieldX } from "lucide-react";

type Warranty = "in" | "out" | null;

export default function RequestViewPage() {
    const sp = useSearchParams();
    const id = sp.get("id") 

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

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        let alive = true;
        (async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/request/find?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
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
        <section className="max-w-4xl mx-auto">
        <br />
        <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
            รายละเอียดใบแจ้งซ่อม
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8 shadow-sm">
            <form className="space-y-8">

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">ข้อมูลลูกค้า</legend>
                <table className="ml-[14em]">
                    <tbody>
                        <tr>
                            <td className="pr-4 text-right">ชื่อ :</td>
                            <td>{firstName}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">นามสกุล :</td>
                            <td>{lastName}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">ที่อยู่ :</td>
                            <td>{address}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">โทรศัพท์ :</td>
                            <td>{phone}</td>
                        </tr>
                    </tbody>
                </table>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className="text-lg font-semibold text-slate-900">รายละเอียดสินค้า</legend>
                <table className="ml-[10em]">
                    <tbody>
                        <tr>
                            <td className="pr-4 text-right">ประเภทสินค้า :</td>
                            <td>{productType}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">ยี่ห้อ :</td>
                            <td>{brand}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">รุ่น :</td>
                            <td>{model}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">เลขเครื่อง (Serial) :</td>
                            <td>{serial}</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">จำนวน :</td>
                            <td>{qty}  ชิ้น</td>
                        </tr>
                        <tr>
                            <td className="pr-4 text-right">สถานะรับประกัน :</td>
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
                                    <td className="pr-4 text-right">เลขที่ใบประกัน :</td>
                                    <td>{warrantyNo}</td>
                                </tr>
                            </>
                        ) : (
                            <>
                            </>
                        )}
                        
                    </tbody>
                </table>
            </fieldset>

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
