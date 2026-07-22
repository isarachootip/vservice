"use client";

import { use, useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedName } from "@/lib/i18n";

type Warranty = "in" | "out" | null;

type Errors = Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    productType: string;
    brand: string;
    qty: string;
    sku: string;
    barcode: string;
    warranty: string;
    warrantyNo: string;
    issue: string;
    receiveFromUserDt: string;
    serialAttachments?: string;
    picAttachments?: string;
}>;

export default function RequestAddPage({ searchParams }: { searchParams: Promise<{ internal: string }> }) {
    const { language, t } = useLanguage();
    const { internal } = use(searchParams);

    //? ข้อมูลลูกค้า
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [useSameAddress, setUseSameAddress] = useState(true);
    const [shippingFields, setShippingFields] = useState({
        number: "",
        soi: "",
        road: "",
        subdistrict: "",
        district: "",
        province: "",
        zipcode: ""
    });
    const [billingFields, setBillingFields] = useState({
        number: "",
        soi: "",
        road: "",
        subdistrict: "",
        district: "",
        province: "",
        zipcode: ""
    });

    const parseAddressDetail = (detail: string) => {
        const defaults = { number: "", soi: "", road: "", subdistrict: "", district: "", province: "", zipcode: "" };
        if (!detail) return defaults;
        const trimmed = detail.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                return { ...defaults, ...JSON.parse(trimmed) };
            } catch {}
        }
        return { ...defaults, number: detail };
    };

    const formatAddressDetail = (detail: string) => {
        if (!detail) return "";
        const trimmed = detail.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                const p = JSON.parse(trimmed);
                const parts = [];
                if (p.number) parts.push(p.number);
                if (p.soi) parts.push(`ซ.${p.soi}`);
                if (p.road) parts.push(`ถ.${p.road}`);
                if (p.subdistrict) parts.push(`ต./แขวง ${p.subdistrict}`);
                if (p.district) parts.push(`อ./เขต ${p.district}`);
                if (p.province) parts.push(`จ.${p.province}`);
                if (p.zipcode) parts.push(p.zipcode);
                return parts.join(" ");
            } catch {
                return detail;
            }
        }
        return detail;
    };

    const [lookupLoading, setLookupLoading] = useState(false);
    const [foundCustomerMsg, setFoundCustomerMsg] = useState("");

    useEffect(() => {
        const cleanedPhone = phone.trim();
        if (cleanedPhone.length === 10) {
            const lookup = async () => {
                setLookupLoading(true);
                setFoundCustomerMsg("");
                try {
                    const res = await fetch(`/api/customer/lookup?phone=${cleanedPhone}`);
                    const data = await res.json();
                    if (data.ok && data.customer) {
                        const cust = data.customer;
                        const names = cust.name.split(" ");
                        const first = names[0] || "";
                        const last = names.slice(1).join(" ") || "";
                        setFirstName(first);
                        setLastName(last);
                        
                        const shipping = cust.addresses.find((a: any) => a.address_type === "SHIPPING")?.address_detail || "";
                        const billing = cust.addresses.find((a: any) => a.address_type === "BILLING")?.address_detail || "";
                        
                        const parsedShipping = parseAddressDetail(shipping);
                        const parsedBilling = parseAddressDetail(billing);

                        setShippingFields(parsedShipping);
                        if (billing && billing !== shipping) {
                            setBillingFields(parsedBilling);
                            setUseSameAddress(false);
                        } else {
                            setBillingFields(parsedShipping);
                            setUseSameAddress(true);
                        }
                        setFoundCustomerMsg(`พบข้อมูลคุณ ${cust.name} ในระบบ (ดึงข้อมูลอัตโนมัติ)`);
                    } else {
                        setFoundCustomerMsg("ลูกค้าใหม่ (ยังไม่มีข้อมูลในฐานข้อมูล)");
                    }
                } catch (err) {
                    console.error("Lookup error:", err);
                } finally {
                    setLookupLoading(false);
                }
            };
            lookup();
        } else {
            setFoundCustomerMsg("");
        }
    }, [phone]);

    //? ข้อมูลสินค้า
    const [productType, setProductType] = useState("");
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [serial, setSerial] = useState("");
    const [issue, setIssue] = useState("");
    const [symptoms, setSymptoms] = useState<any[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState("");
    const [receiveFromUserDt, setReceiveFromUserDt] = useState<Date | null>(null);
    const [qty, setQty] = useState<number | "">("");
    const [sku, setSku] = useState<number | "">("");
    const [skuFlg, setSkuFlg] = useState(true);
    const [skuLoading, setSkuLoading] = useState(false);
    const [skuError, setSkuError] = useState<string | null>(null);
    const [barcode, setBarcode] = useState("");
    const [fileSlot1, setFileSlot1] = useState<File | null>(null);
    const [fileSlot2, setFileSlot2] = useState<File | null>(null);
    const [fileSlot3, setFileSlot3] = useState<File | null>(null);
    const [fileSlot4, setFileSlot4] = useState<File | null>(null);

    const [previewSlot1, setPreviewSlot1] = useState<string>("");
    const [previewSlot2, setPreviewSlot2] = useState<string>("");
    const [previewSlot3, setPreviewSlot3] = useState<string>("");
    const [previewSlot4, setPreviewSlot4] = useState<string>("");

    const slot1Ref = useRef<HTMLInputElement | null>(null);
    const slot2Ref = useRef<HTMLInputElement | null>(null);
    const slot3Ref = useRef<HTMLInputElement | null>(null);
    const slot4Ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!fileSlot1) {
            setPreviewSlot1("");
            return;
        }
        const url = URL.createObjectURL(fileSlot1);
        setPreviewSlot1(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot1]);

    useEffect(() => {
        if (!fileSlot2) {
            setPreviewSlot2("");
            return;
        }
        const url = URL.createObjectURL(fileSlot2);
        setPreviewSlot2(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot2]);

    useEffect(() => {
        if (!fileSlot3) {
            setPreviewSlot3("");
            return;
        }
        const url = URL.createObjectURL(fileSlot3);
        setPreviewSlot3(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot3]);

    useEffect(() => {
        if (!fileSlot4) {
            setPreviewSlot4("");
            return;
        }
        const url = URL.createObjectURL(fileSlot4);
        setPreviewSlot4(url);
        return () => URL.revokeObjectURL(url);
    }, [fileSlot4]);

    //? V2.0 Config states
    const [diagConfigs, setDiagConfigs] = useState<any[]>([]);
    const [serviceTiers, setServiceTiers] = useState<any[]>([]);
    
    const [serviceTier, setServiceTier] = useState("NORMAL");
    const [diagnosticFee, setDiagnosticFee] = useState(0);
    const [payMethod, setPayMethod] = useState("CASH");
    const [payRefNo, setPayRefNo] = useState("");

    //? รูปภาพตัวอย่างสำหรับช่วยเหลือผู้ใช้
    const [exampleImages, setExampleImages] = useState<any>(null);
    const [exampleModal, setExampleModal] = useState<{ isOpen: boolean; title: string; imageUrl: string; desc: string } | null>(null);

    useEffect(() => {
        fetch("/api/maintain/symptoms")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setSymptoms(data.symptoms || []);
                }
            })
            .catch(console.error);

        fetch("/api/maintain/config?type=diagnostic")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setDiagConfigs(data.data || []);
                }
            })
            .catch(console.error);

        fetch("/api/maintain/config?type=tier")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setServiceTiers(data.data || []);
                }
            })
            .catch(console.error);

        fetch("/api/maintain/example-images?flow=create_repair")
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setExampleImages(data.data);
                }
            })
            .catch(console.error);
    }, []);

    //? ข้อมูลประกัน
    const [warranty, setWarranty] = useState<Warranty>(null);
    const [warrantyNo, setWarrantyNo] = useState("");

    useEffect(() => {
        if (warranty === "in") {
            setDiagnosticFee(0);
            return;
        }

        let baseFee = 150;
        const matched = diagConfigs.find(c => 
            productType.toLowerCase().includes(c.product_type.split(" ")[0].toLowerCase()) ||
            c.product_type.toLowerCase().includes(productType.toLowerCase())
        );
        if (matched) {
            baseFee = parseFloat(matched.fee_amount);
        } else {
            const gen = diagConfigs.find(c => c.product_type.includes("General"));
            if (gen) baseFee = parseFloat(gen.fee_amount);
        }

        let totalFee = baseFee;
        const tierCfg = serviceTiers.find(t => t.tier === serviceTier);
        if (tierCfg) {
            const surchargeVal = parseFloat(tierCfg.surcharge_value);
            if (tierCfg.surcharge_type === "PERCENT") {
                totalFee = baseFee + (baseFee * (surchargeVal / 100));
            } else if (tierCfg.surcharge_type === "FLAT") {
                totalFee = baseFee + surchargeVal;
            }
        }
        setDiagnosticFee(totalFee);
    }, [productType, warranty, serviceTier, diagConfigs, serviceTiers]);

    const internalFlg = internal === "Y" ? "Y" : "N";
    const [errors, setErrors] = useState<Errors>({});
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [classList, setClassList] = useState<{ name: string; name_th: string | null; name_en?: string | null }[]>([]);
    const [classLoading, setClassLoading] = useState(false);
    const [classError, setClassError] = useState<string | null>(null);

    const [brandList, setBrandList] = useState<string[]>([]);
    const [brandLoading, setBrandLoading] = useState(false);
    const [brandError, setBrandError] = useState<string | null>(null);

    const [skuList, setSkuList] = useState<any[]>([]);
    const [skuListLoading, setSkuListLoading] = useState(false);
    const [skuListError, setSkuListError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            setBrandLoading(true);
            setBrandError(null);
            try {
                const res = await fetch("/api/commodity/brand", {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const json = await res.json();
                setBrandList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                setBrandError("โหลดรายการยี่ห้อไม่สำเร็จ");
            } finally {
                setBrandLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!brand?.trim()) {
            setClassList([]);
            return;
        }

        const controller = new AbortController();
        const t = setTimeout(async () => {
            setClassLoading(true);
            setClassError(null);
            try {
                const res = await fetch(`/api/commodity/class?brand=${encodeURIComponent(brand)}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const json = await res.json();
                setClassList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                setClassError("โหลดรายการประเภทสินค้าไม่สำเร็จ");
                setClassList([]);
            } finally {
                setClassLoading(false);
            }
        }, 150);

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [brand]);

    useEffect(() => {
        if (!brand?.trim() || !productType?.trim()) {
            setSkuList([]);
            return;
        }

        const controller = new AbortController();
        const t = setTimeout(async () => {
            setSkuListLoading(true);
            setSkuListError(null);
            try {
                const res = await fetch(`/api/commodity/list?brand=${encodeURIComponent(brand)}&class=${encodeURIComponent(productType)}`, {
                    signal: controller.signal,
                    cache: "no-store",
                });
                const json = await res.json();
                setSkuList(Array.isArray(json?.data) ? json.data : []);
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                setSkuListError("โหลดรายการสินค้าไม่สำเร็จ");
                setSkuList([]);
            } finally {
                setSkuListLoading(false);
            }
        }, 150);

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [brand, productType]);

    useEffect(() => {
        if (skuFlg && brand && productType && skuList.length === 1 && !sku) {
            const singleItem = skuList[0];
            setSku(Number(singleItem.sku));
            setBarcode(singleItem.bar_code ?? "");
            setModel(singleItem.sku_name ?? "");
        }
    }, [skuList, brand, productType, skuFlg, sku]);

    useEffect(() => {
        if (!skuFlg) {
            setSkuError(null);
            return;
        }

        if (!sku || Number(sku) <= 0) {
            setBarcode("");
            setProductType("");
            setBrand("");
            setModel("");
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
                    setBarcode("");
                    setProductType("");
                    setBrand("");
                    setModel("");
                    setSkuError("ไม่พบ SKU ในระบบ");
                    return;
                }

                setBarcode(found.bar_code ?? "");
                setProductType(found.class_name ?? "");
                setBrand(found.brand ?? "");
                setModel(found.sku_name ?? "");
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return;
                alert("lookup sku error");
            } finally {
                setSkuLoading(false);
            }
            return () => controller.abort();
        }, 300);

        return () => clearTimeout(t);
    }, [sku, skuFlg]);

    const toYMD = (v: unknown): string | null => {
        if (!v) return null;
        const d = v instanceof Date ? v : new Date(String(v));
        if (Number.isNaN(d.getTime())) return null;

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const nextErrors: Errors = {};
        if (submitting) return;

        if (!firstName.trim()) nextErrors.firstName = "กรุณากรอกชื่อ";
        if (!lastName.trim()) nextErrors.lastName = "กรุณากรอกนามสกุล";
        if (!phone.trim()) nextErrors.phone = "กรุณากรอกโทรศัพท์";
        if (!qty || Number(qty) <= 0) nextErrors.qty = "กรุณาระบุจำนวน";
        if (skuFlg) {
            if (!sku || Number(sku) <= 0) nextErrors.sku = "กรุณากรอก SKU";
        } else {
            if (!productType.trim()) nextErrors.productType = "กรุณากรอกประเภทสินค้า";
            if (!brand.trim()) nextErrors.brand = "กรุณากรอกยี่ห้อ";
        }
        if (!barcode.trim()) nextErrors.barcode = "กรุณากรอก Barcode";

        if (!receiveFromUserDt) nextErrors.receiveFromUserDt = "กรุณากรอกวันที่รับสินค้าจากลูกค้า";
        if (!warranty) nextErrors.warranty = "กรุณาเลือกสถานะการรับประกัน";
        if (warranty === "in" && !warrantyNo.trim()) {
            nextErrors.warrantyNo = "กรุณากรอกเลขที่รับประกัน";
        }

        if (!selectedSymptom) {
            nextErrors.issue = "กรุณาเลือกอาการเสีย";
        } else if (selectedSymptom === "other" && !issue.trim()) {
            nextErrors.issue = "กรุณากรอกรายละเอียดอาการเสีย";
        }
        
        if (!fileSlot4) nextErrors.serialAttachments = "กรุณาแนบรูปถ่าย Serial Number (ช่องที่ 4)";
        if (!fileSlot1) nextErrors.picAttachments = "กรุณาแนบรูปถ่ายตัวสินค้าด้านบน (ช่องที่ 1)";

        setErrors(nextErrors);

        const missing = Object.values(nextErrors);
        if (missing.length > 0) {
            alert("กรอกข้อมูลไม่ครบ :\n• " + missing.join("\n• "));
            return;
        }

        let skuToSend: number;
        let skuFlgToSend: string;
        if (!skuFlg) {
            skuToSend = 999999999999;
            skuFlgToSend = "N";
        } else {
            skuToSend = Number(sku);
            skuFlgToSend = "Y";
        }

        const receiveFromUserDtStr = toYMD(receiveFromUserDt);

        const formData = new FormData();
        formData.append("customer", JSON.stringify({
            firstName,
            lastName,
            address: formatAddressDetail(JSON.stringify(shippingFields)),
            billingAddress: useSameAddress ? JSON.stringify(shippingFields) : JSON.stringify(billingFields),
            shippingAddress: JSON.stringify(shippingFields),
            phone,
            receiveFromUserDtStr,
        }));
        formData.append("product", JSON.stringify({
            productType,
            brand,
            model,
            serial,
            qty: qty || 0,
            skuFlg: skuFlgToSend,
            sku: skuToSend,
            barcode,
            issue: selectedSymptom === "other" ? issue : (selectedSymptom + (issue.trim() ? ` (${issue.trim()})` : "")),
        }));
        formData.append("warranty", JSON.stringify({
            status: warranty,
            warrantyNo: warranty === "in" ? warrantyNo : null,
        }));
        formData.append("internalFlg", internalFlg);
        formData.append("serviceTier", serviceTier);
        formData.append("diagnosticFee", String(diagnosticFee));
        formData.append("payMethod", payMethod);
        formData.append("payRefNo", payRefNo);
        if (fileSlot4) {
            formData.append("serialAttachments", fileSlot4);
        }
        if (fileSlot1) formData.append("picAttachments", fileSlot1);
        if (fileSlot2) formData.append("picAttachments", fileSlot2);
        if (fileSlot3) formData.append("picAttachments", fileSlot3);

        try {
            setSubmitting(true);
            const res = await fetch("/api/request/add", {
                method: "POST",
                body: formData,   
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.message || "บันทึกไม่สำเร็จ");
                setSubmitting(false);
                return;
            }
            alert("บันทึกสำเร็จ เลขที่ใบแจ้ง : " + (data.requestNo ?? data.id));
            router.push(`/print/${data.id}`);
        } catch {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            setSubmitting(false);
        }
    };

    const inputClass = (hasError?: boolean) =>
        `block w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-800 transition shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            hasError
                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                : "border-slate-300 hover:border-slate-400 focus:ring-red-500/20 focus:border-[#c8102e]"
        }`;

    const Req = () => <span className="text-red-600 font-bold ml-1">*</span>;

    const renderUploadSlot = (
        slotId: 'slot1' | 'slot2' | 'slot3' | 'slot4',
        title: string,
        isRequired: boolean,
        file: File | null,
        previewUrl: string,
        setFile: (f: File | null) => void,
        ref: React.RefObject<HTMLInputElement | null>
    ) => {
        const slotConfig = exampleImages?.[slotId];
        const hasExample = slotConfig?.url;

        return (
            <div className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{title}</span>
                    {isRequired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                            * จำเป็น
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium text-slate-400">ถ้ามี</span>
                    )}
                </div>
                
                <input
                    type="file"
                    ref={ref as any}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                            if (selectedFile.size > 800 * 1024) {
                                alert("ขนาดไฟล์รูปภาพต้องไม่เกิน 800 KB ครับ");
                                return;
                            }
                            setFile(selectedFile);
                        }
                    }}
                />

                <div className="space-y-2">
                    {/* Preview Box or Upload Box */}
                    {previewUrl ? (
                        <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
                            {file && file.type === "application/pdf" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-bold text-xs p-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-500 mb-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <span className="truncate max-w-full text-xs">{file.name}</span>
                                </div>
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 gap-2">
                                <button
                                    type="button"
                                    onClick={() => ref.current?.click()}
                                    className="px-3 py-1.5 bg-white text-slate-800 rounded-lg hover:bg-slate-100 shadow text-xs font-bold transition cursor-pointer"
                                >
                                    เปลี่ยนรูป
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        if (ref.current) ref.current.value = "";
                                    }}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow text-xs font-bold transition cursor-pointer"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => ref.current?.click()}
                            className="aspect-4/3 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50/50 hover:bg-red-50/20 flex flex-col items-center justify-center cursor-pointer transition p-3 text-center group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500 group-hover:text-[#c8102e]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#c8102e]">คลิกเพื่ออัปโหลด</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (ไม่เกิน 800KB)</span>
                        </div>
                    )}

                    {/* Example Image Trigger Button */}
                    {hasExample && (
                        <button
                            type="button"
                            onClick={() => setExampleModal({
                                isOpen: true,
                                title: title,
                                imageUrl: slotConfig.url,
                                desc: slotConfig.desc || "ไม่มีคำอธิบายเพิ่มเติม"
                            })}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <span>ดูรูปตัวอย่าง</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto py-6 px-4 pb-28 select-none">
            {/* Header Title */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-[#c8102e] rounded-full inline-block"></span>
                        สร้างใบแจ้งซ่อมใหม่ (New Repair Ticket)
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        กรอกข้อมูลรายละเอียดลูกค้า สินค้า และการรับประกันเพื่อบันทึกการแจ้งซ่อมเข้าสู่ระบบ
                    </p>
                </div>
                {internalFlg === "Y" && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        เคสภายใน (Internal Ticket)
                    </span>
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* SECTION 1: CUSTOMER & ADDRESS DETAILS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                            👤 รายละเอียดลูกค้าและเบอร์ติดต่อ (Customer Details)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                        <div>
                            <label htmlFor="firstName" className="block text-xs font-bold text-slate-700 mb-1.5">
                                ชื่อจริง<Req />
                            </label>
                            <input
                                id="firstName"
                                className={inputClass(!!errors.firstName)}
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="ระบุชื่อจริง"
                            />
                            {errors.firstName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.firstName}</p>}
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-xs font-bold text-slate-700 mb-1.5">
                                นามสกุล<Req />
                            </label>
                            <input
                                id="lastName"
                                className={inputClass(!!errors.lastName)}
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="ระบุนามสกุล"
                            />
                            {errors.lastName && <p className="text-red-600 text-xs mt-1 font-medium">{errors.lastName}</p>}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                                <span>เบอร์โทรศัพท์<Req /></span>
                                {lookupLoading && <span className="loading loading-spinner loading-xs text-[#c8102e]"></span>}
                            </label>
                            <input
                                id="phone"
                                className={inputClass(!!errors.phone)}
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                inputMode="tel"
                                placeholder="0812345678"
                            />
                            {foundCustomerMsg && (
                                <p className={`text-xs mt-1 font-bold ${
                                    foundCustomerMsg.includes("พบข้อมูล") ? "text-emerald-600" : "text-blue-600"
                                }`}>
                                    {foundCustomerMsg}
                                </p>
                            )}
                            {errors.phone && <p className="text-red-600 text-xs mt-1 font-medium">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3 bg-sky-500 rounded"></span>
                            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">ที่อยู่จัดส่งสินค้า</span>
                        </div>
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">บ้านเลขที่ / อาคาร / ชั้น</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น 123/45 หมู่ 5"
                                        className={inputClass()}
                                        value={shippingFields.number}
                                        onChange={e => setShippingFields(prev => ({ ...prev, number: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">ซอย</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น ซอยสุขุมวิท 10"
                                        className={inputClass()}
                                        value={shippingFields.soi}
                                        onChange={e => setShippingFields(prev => ({ ...prev, soi: e.target.value }))}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">ถนน</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น ถนนสุขุมวิท"
                                        className={inputClass()}
                                        value={shippingFields.road}
                                        onChange={e => setShippingFields(prev => ({ ...prev, road: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">แขวง / ตำบล</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น คลองเตย"
                                        className={inputClass()}
                                        value={shippingFields.subdistrict}
                                        onChange={e => setShippingFields(prev => ({ ...prev, subdistrict: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">เขต / อำเภอ</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น คลองเตย"
                                        className={inputClass()}
                                        value={shippingFields.district}
                                        onChange={e => setShippingFields(prev => ({ ...prev, district: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">จังหวัด</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น กรุงเทพมหานคร"
                                        className={inputClass()}
                                        value={shippingFields.province}
                                        onChange={e => setShippingFields(prev => ({ ...prev, province: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสไปรษณีย์</label>
                                    <input
                                        type="text"
                                        placeholder="เช่น 10110"
                                        className={inputClass()}
                                        value={shippingFields.zipcode}
                                        onChange={e => setShippingFields(prev => ({ ...prev, zipcode: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Option */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useSameAddress}
                                onChange={e => setUseSameAddress(e.target.checked)}
                                className="w-4 h-4 rounded text-[#c8102e] focus:ring-[#c8102e] border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-700">ใช้ที่อยู่จัดส่งเป็นที่อยู่ออกใบกำกับภาษี</span>
                        </label>

                        {!useSameAddress && (
                            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider">ที่อยู่ออกใบกำกับภาษี</span>
                                    <button
                                        type="button"
                                        onClick={() => setBillingFields({ ...shippingFields })}
                                        className="text-xs font-bold text-[#c8102e] hover:underline flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v2.25C15.75 20.77 14.52 22 13 22H5C3.48 22 2.25 20.77 2.25 19.25V9C2.25 7.48 3.48 6.25 5 6.25h2.25" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.75V4.75C8.25 3.23 9.48 2 11 2h8c1.52 0 2.75 1.23 2.75 2.75v10c0 1.52-1.23 2.75-2.75 2.75h-8c-1.52 0-2.75-1.23-2.75-2.75Z" />
                                        </svg>
                                        คัดลอกจากที่อยู่จัดส่ง
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">บ้านเลขที่ / อาคาร / ชั้น</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น 123/45 หมู่ 5"
                                            className={inputClass()}
                                            value={billingFields.number}
                                            onChange={e => setBillingFields(prev => ({ ...prev, number: e.target.value }))}
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">ซอย</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น ซอยสุขุมวิท 10"
                                            className={inputClass()}
                                            value={billingFields.soi}
                                            onChange={e => setBillingFields(prev => ({ ...prev, soi: e.target.value }))}
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">ถนน</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น ถนนสุขุมวิท"
                                            className={inputClass()}
                                            value={billingFields.road}
                                            onChange={e => setBillingFields(prev => ({ ...prev, road: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">แขวง / ตำบล</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น คลองเตย"
                                            className={inputClass()}
                                            value={billingFields.subdistrict}
                                            onChange={e => setBillingFields(prev => ({ ...prev, subdistrict: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">เขต / อำเภอ</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น คลองเตย"
                                            className={inputClass()}
                                            value={billingFields.district}
                                            onChange={e => setBillingFields(prev => ({ ...prev, district: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">จังหวัด</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น กรุงเทพมหานคร"
                                            className={inputClass()}
                                            value={billingFields.province}
                                            onChange={e => setBillingFields(prev => ({ ...prev, province: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสไปรษณีย์</label>
                                        <input
                                            type="text"
                                            placeholder="เช่น 10110"
                                            className={inputClass()}
                                            value={billingFields.zipcode}
                                            onChange={e => setBillingFields(prev => ({ ...prev, zipcode: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 2: PRODUCT & WARRANTY DETAILS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                            📦 ข้อมูลสินค้าและการรับประกัน (Product & Warranty)
                        </h2>

                        {/* Mode Selector Badge: System Stock vs Non-System Stock */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setSkuFlg(true);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    skuFlg
                                        ? "bg-white text-[#c8102e] shadow-sm border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${skuFlg ? "bg-[#c8102e]" : "bg-slate-300"}`}></span>
                                สินค้าในระบบ (System Stock)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSkuFlg(false);
                                    setSku("");
                                    setErrors(prev => ({ ...prev, sku: undefined }));
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    !skuFlg
                                        ? "bg-white text-[#c8102e] shadow-sm border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${!skuFlg ? "bg-[#c8102e]" : "bg-slate-300"}`}></span>
                                สินค้านอกระบบ (Non-System)
                            </button>
                        </div>
                    </div>

                    {/* Product Basic Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ยี่ห้อ<Req /></label>
                            {skuFlg ? (
                                <select
                                    className={inputClass(!!errors.brand)}
                                    value={brand}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setBrand(v);
                                        setProductType("");
                                        setClassList([]);
                                        setSkuList([]);
                                        setSku("");
                                        setBarcode("");
                                        setModel("");
                                    }}
                                >
                                    <option value="">-- เลือกยี่ห้อ --</option>
                                    {brandList.map((s) => (
                                        <option key={s} value={s}>{s}</option>
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
                            {errors.brand && <p className="text-red-600 text-xs mt-1 font-medium">{errors.brand}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทสินค้า<Req /></label>
                            {skuFlg ? (
                                <select
                                    className={inputClass(!!errors.productType)}
                                    value={productType}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setProductType(v);
                                        setSkuList([]);
                                        setSku("");
                                        setBarcode("");
                                        setModel("");
                                    }}
                                    disabled={!brand}
                                >
                                    <option value="">{t("select_category")}</option>
                                    {classList.map((c) => {
                                        const displayName = getLocalizedName(c, language);
                                        const fullLabel = displayName && displayName !== c.name ? `${displayName} (${c.name})` : c.name;
                                        return (
                                            <option key={c.name} value={c.name}>{fullLabel}</option>
                                        );
                                    })}
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
                            {errors.productType && <p className="text-red-600 text-xs mt-1 font-medium">{errors.productType}</p>}
                        </div>

                        <div>
                            <label htmlFor="sku" className="block text-xs font-bold text-slate-700 mb-1.5">SKU<Req /></label>
                            {skuFlg && brand && productType ? (
                                <select
                                    id="sku"
                                    className={inputClass(!!errors.sku)}
                                    value={sku ? String(sku) : ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) {
                                            setSku("");
                                            setBarcode("");
                                            setModel("");
                                            return;
                                        }
                                        const found = skuList.find(item => String(item.sku) === val);
                                        if (found) {
                                            setSku(Number(found.sku));
                                            setBarcode(found.bar_code ?? "");
                                            setModel(found.sku_name ?? "");
                                        }
                                    }}
                                >
                                    {skuListLoading ? (
                                        <option value="">-- กำลังโหลดรายการ SKU... --</option>
                                    ) : skuList.length === 0 ? (
                                        <option value="">-- ไม่พบสินค้าในกลุ่มนี้ --</option>
                                    ) : (
                                        <>
                                            <option value="">-- เลือก SKU --</option>
                                            {skuList.map((item) => (
                                                <option key={item.sku} value={String(item.sku)}>
                                                    [{item.sku}] {item.sku_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            ) : (
                                <input
                                    id="sku"
                                    type="number"
                                    className={inputClass(!!errors.sku)}
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value === "" ? "" : Number(e.target.value))}
                                    disabled={!skuFlg}
                                    placeholder="ระบุรหัส SKU"
                                    autoComplete="off"
                                />
                            )}
                            {errors.sku && <p className="text-red-600 text-xs mt-1 font-medium">{errors.sku}</p>}
                            {skuLoading && <p className="text-xs text-slate-400 mt-1">กำลังค้นหา...</p>}
                            {skuError && <p className="text-xs text-red-600 mt-1 font-medium">{skuError}</p>}
                        </div>

                        <div>
                            <label htmlFor="barcode" className="block text-xs font-bold text-slate-700 mb-1.5">Barcode<Req /></label>
                            <input
                                id="barcode"
                                className={inputClass(!!errors.barcode)}
                                value={barcode}
                                onChange={e => setBarcode(e.target.value)}
                                disabled={skuFlg}
                                placeholder="ระบุบาร์โค้ด"
                            />
                            {errors.barcode && <p className="text-red-600 text-xs mt-1 font-medium">{errors.barcode}</p>}
                        </div>
                    </div>

                    {/* Specs, Serial, Qty & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="model" className="block text-xs font-bold text-slate-700 mb-1.5">รุ่นสินค้า / Model<Req /></label>
                            {skuFlg ? (
                                <select
                                    id="model"
                                    className={inputClass()}
                                    value={sku && barcode && model ? `${sku}|${barcode}|${model}` : ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) {
                                            setSku("");
                                            setBarcode("");
                                            setModel("");
                                            return;
                                        }
                                        const [selectedSku, selectedBarcode, selectedModel] = val.split("|");
                                        setSku(Number(selectedSku));
                                        setBarcode(selectedBarcode);
                                        setModel(selectedModel);
                                    }}
                                    disabled={!productType}
                                >
                                    <option value="">-- เลือกรุ่นสินค้า --</option>
                                    {(() => {
                                        const list = [...skuList];
                                        if (sku && model && !list.some(item => String(item.sku) === String(sku))) {
                                            list.unshift({ sku: String(sku), bar_code: barcode, sku_name: model });
                                        }
                                        return list.map((item) => (
                                            <option key={item.sku} value={`${item.sku}|${item.bar_code}|${item.sku_name}`}>
                                                [{item.sku}] {item.sku_name}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            ) : (
                                <input
                                    id="model"
                                    className={inputClass()}
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                    placeholder="ระบุรุ่นสินค้า"
                                />
                            )}
                        </div>

                        <div>
                            <label htmlFor="serial" className="block text-xs font-bold text-slate-700 mb-1.5">Serial Number (เลขเครื่อง)</label>
                            <input
                                id="serial"
                                className={inputClass()}
                                value={serial}
                                onChange={e => setSerial(e.target.value)}
                                placeholder="ระบุเลข Serial"
                            />
                        </div>

                        <div>
                            <label htmlFor="qty" className="block text-xs font-bold text-slate-700 mb-1.5">จำนวน<Req /></label>
                            <input
                                id="qty"
                                type="number"
                                min={1}
                                className={inputClass(!!errors.qty)}
                                value={qty}
                                onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="ระบุจำนวนชิ้น"
                            />
                            {errors.qty && <p className="text-red-600 text-xs mt-1 font-medium">{errors.qty}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">วันที่รับเครื่อง<Req /></label>
                            <DatePicker
                                id="receiveFromUserDt"
                                selected={receiveFromUserDt}
                                onChange={(date) => setReceiveFromUserDt(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="วว/ดด/ปป"
                                className={inputClass(!!errors.receiveFromUserDt)}
                                wrapperClassName="w-full"
                            />
                            {errors.receiveFromUserDt && <p className="text-red-600 text-xs mt-1 font-medium">{errors.receiveFromUserDt}</p>}
                        </div>
                    </div>

                    {/* Warranty & Symptom Section */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Warranty Choice */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700">การรับประกัน (Warranty Status)<Req /></label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWarranty("in")}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                        warranty === "in"
                                            ? "bg-red-50 border-[#c8102e] text-[#c8102e] font-extrabold ring-2 ring-red-500/20"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                                    }`}
                                >
                                    <span className="text-xs">🛡️ อยู่ในประกัน</span>
                                    <span className="text-[10px] opacity-70">In Warranty</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setWarranty("out")}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                                        warranty === "out"
                                            ? "bg-red-50 border-[#c8102e] text-[#c8102e] font-extrabold ring-2 ring-red-500/20"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                                    }`}
                                >
                                    <span className="text-xs">⚠️ ไม่อยู่ในประกัน</span>
                                    <span className="text-[10px] opacity-70">Out of Warranty</span>
                                </button>
                            </div>
                            {errors.warranty && <p className="text-red-600 text-xs mt-1 font-medium">{errors.warranty}</p>}

                            {warranty === "in" && (
                                <div className="mt-2 animate-fadeIn">
                                    <label htmlFor="warrantyNo" className="block text-xs font-bold text-slate-700 mb-1.5">
                                        เลขที่ใบประกัน (Warranty No.)<Req />
                                    </label>
                                    <input
                                        id="warrantyNo"
                                        className={inputClass(!!errors.warrantyNo)}
                                        value={warrantyNo}
                                        onChange={e => setWarrantyNo(e.target.value)}
                                        placeholder="ระบุเลขที่รับประกัน"
                                    />
                                    {errors.warrantyNo && <p className="text-red-600 text-xs mt-1 font-medium">{errors.warrantyNo}</p>}
                                </div>
                            )}
                        </div>

                        {/* Symptom Selection */}
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="issueSymptom" className="block text-xs font-bold text-slate-700 mb-1.5">
                                    อาการเสียที่พบ (จากระบบ)<Req />
                                </label>
                                <select
                                    id="issueSymptom"
                                    className={inputClass()}
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
                                <label htmlFor="issue" className="block text-xs font-bold text-slate-700 mb-1.5">
                                    {selectedSymptom === "other" ? "รายละเอียดอาการเสีย *" : "รายละเอียดอาการเสียเพิ่มเติม (ถ้ามี)"}
                                </label>
                                <textarea
                                    id="issue"
                                    className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 transition shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#c8102e] h-16 resize-none"
                                    value={issue}
                                    onChange={e => setIssue(e.target.value)}
                                    placeholder="ระบุรายละเอียดอาการชำรุดเสียหายเพิ่มเติม"
                                />
                                {errors.issue && <p className="text-red-600 text-xs mt-1 font-medium">{errors.issue}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: IMAGE ATTACHMENT SLOTS */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                                📸 รูปถ่ายเครื่องและป้าย Serial เพื่อบันทึกงานซ่อม (Required Photos & Serial)
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                แนบรูปภาพตัวสินค้าและป้าย Serial เพื่อประกอบการส่งซ่อมและยืนยันการรับประกัน
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {renderUploadSlot('slot1', '1. ภาพด้านบน (Top View)', true, fileSlot1, previewSlot1, setFileSlot1, slot1Ref)}
                        {renderUploadSlot('slot2', '2. ภาพด้านข้าง (Side View)', false, fileSlot2, previewSlot2, setFileSlot2, slot2Ref)}
                        {renderUploadSlot('slot3', '3. ภาพมุมอื่น (Other View)', false, fileSlot3, previewSlot3, setFileSlot3, slot3Ref)}
                        {renderUploadSlot('slot4', '4. ภาพ Serial Number', true, fileSlot4, previewSlot4, setFileSlot4, slot4Ref)}
                    </div>
                </div>

                {/* SECTION 4: SERVICE TIER & DIAGNOSTIC FEE */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                            ⚡ ระดับบริการ & ค่าเปิดเครื่องตรวจเช็ค (Service Tier & Diagnostic Fee)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Service Tier Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ระดับบริการ (Service Tier)</label>
                            <select
                                value={serviceTier}
                                onChange={e => setServiceTier(e.target.value)}
                                className={inputClass()}
                            >
                                <option value="NORMAL">NORMAL (SLA ปกติ)</option>
                                <option value="EXPRESS">EXPRESS (SLA ด่วนพิเศษ +50%)</option>
                                <option value="VIP">VIP (SLA ด่วนสุด ลัดคิว)</option>
                            </select>
                        </div>

                        {/* Calculated Diagnostic Fee Info */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">ค่าบริการเปิดเครื่อง / ตรวจเช็ค</label>
                            <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between shadow-xs">
                                <span className="text-xs font-semibold text-slate-600">ประเมินค่าตรวจเช็ค:</span>
                                {warranty === "in" ? (
                                    <span className="text-emerald-600 font-black text-sm">ฟรี (อยู่ในประกัน)</span>
                                ) : (
                                    <span className="text-[#c8102e] font-black text-base">
                                        {diagnosticFee.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Payment details if out of warranty */}
                        {warranty === "out" && diagnosticFee > 0 && (
                            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">ช่องทางการชำระเงินค่าเปิดเครื่อง</label>
                                    <select
                                        value={payMethod}
                                        onChange={e => setPayMethod(e.target.value)}
                                        className={inputClass()}
                                    >
                                        <option value="CASH">เงินสด (CASH)</option>
                                        <option value="TRANSFER">โอนเงินธนาคาร (TRANSFER)</option>
                                        <option value="QR_PROMPTPAY">QR PromptPay</option>
                                        <option value="CREDIT_CARD">บัตรเครดิต (CREDIT CARD)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเลขอ้างอิงสลิป / รูดบัตร (Ref No.)</label>
                                    <input
                                        type="text"
                                        value={payRefNo}
                                        onChange={e => setPayRefNo(e.target.value)}
                                        className={inputClass()}
                                        placeholder="ใส่เลขอ้างอิงชำระเงิน"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>ตรวจสอบความถูกต้องของข้อมูลก่อนกดบันทึก</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                onClick={() => history.back()}
                            >
                                ย้อนกลับ
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 rounded-xl text-xs font-bold bg-[#c8102e] hover:bg-[#b00d25] text-white shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs text-white"></span>
                                        <span>กำลังบันทึกข้อมูล...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        <span>บันทึกข้อมูลใบแจ้งซ่อม</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Example Image Modal */}
            {exampleModal && exampleModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative animate-scaleUp">
                        <button
                            type="button"
                            onClick={() => setExampleModal(null)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            title="ปิด"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-4 bg-[#c8102e] rounded"></span>
                                รูปตัวอย่างสำหรับ: {exampleModal.title}
                            </h3>
                        </div>

                        <div className="w-full aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                            <img
                                src={exampleModal.imageUrl}
                                alt={exampleModal.title}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5">
                            <h4 className="text-xs font-bold text-slate-600 mb-1">💡 คำแนะนำในการถ่ายภาพ:</h4>
                            <p className="text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                                {exampleModal.desc}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setExampleModal(null)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                            ตกลง เข้าใจแล้ว
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
