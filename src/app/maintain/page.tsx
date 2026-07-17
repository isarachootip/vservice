"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Download, Upload, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

type StatusInfo = {
    id: number;
    path: string;
    status: string;
    sla: number;
};

type FormData = {
    path: string;
    status: string;
    sla: string;
};

type VendorInfo = {
    id: number;
    vendor_no: string;
    vendor_name: string;
    vendor_email: string;
};

export default function MainTainPage() {
    const [tab, setTab] = useState<"status" | "vendor" | "user" | "location" | "product" | "symptom" | "announcement" | "category">("status");

    //* Product Info state
    const [productsList, setProductsList] = useState<any[]>([]);
    const [productLoading, setProductLoading] = useState(false);
    const [productError, setProductError] = useState<string | null>(null);
    const [productSearchQ, setProductSearchQ] = useState("");
    const [productPage, setProductPage] = useState(1);
    const [productTotalPages, setProductTotalPages] = useState(1);
    const [productFileInputRef, setProductFileInputRef] = useState<HTMLInputElement | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProductSku, setEditingProductSku] = useState<string | null>(null);
    const [productFormData, setProductFormData] = useState({ sku: "", sbc: "", sku_name: "", brand: "", class_name: "", sku_cost: "", sku_price: "", vendor_no: "", vendor_name: "", model: "" });
    const [productFormError, setProductFormError] = useState<string | null>(null);
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    //* Category Info state
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [categoryFormData, setCategoryFormData] = useState({ name: "" });
    const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
    const [isSavingCategory, setIsSavingCategory] = useState(false);

    //* Symptom Info state
    const [symptomsList, setSymptomsList] = useState<any[]>([]);
    const [symptomLoading, setSymptomLoading] = useState(false);
    const [symptomError, setSymptomError] = useState<string | null>(null);
    const [showSymptomModal, setShowSymptomModal] = useState(false);
    const [editingSymptomId, setEditingSymptomId] = useState<number | null>(null);
    const [symptomFormData, setSymptomFormData] = useState({ name: "", description: "" });
    const [symptomFormError, setSymptomFormError] = useState<string | null>(null);
    const [isSavingSymptom, setIsSavingSymptom] = useState(false);

    //* Location Info state
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationSearchQ, setLocationSearchQ] = useState("");
    const [locationFileInputRef, setLocationFileInputRef] = useState<HTMLInputElement | null>(null);
    const [locationsList, setLocationsList] = useState<any[]>([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
    const [locationFormData, setLocationFormData] = useState({ id: "", name: "", short_name: "", code: "", status: "active", bu: "" });
    const [locationFormError, setLocationFormError] = useState<string | null>(null);
    const [isSavingLocation, setIsSavingLocation] = useState(false);

    const fetchLocations = useCallback(async () => {
        let alive = true;
        try {
            setLocationLoading(true);
            setLocationError(null);
            const res = await fetch("/api/maintain/locations", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลสาขาไม่สำเร็จ");
            if (alive) {
                setLocationsList(data.locations || []);
            }
        } catch (e) {
            if (alive) {
                setLocationError((e as Error).message);
            }
        } finally {
            if (alive) {
                setLocationLoading(false);
            }
        }
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const fetchProducts = useCallback(async (query = productSearchQ, page = productPage) => {
        let alive = true;
        try {
            setProductLoading(true);
            setProductError(null);
            const res = await fetch(`/api/maintain/products?q=${encodeURIComponent(query)}&page=${page}&limit=20`, { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลสินค้าไม่สำเร็จ");
            if (alive) {
                setProductsList(data.products || []);
                setProductTotalPages(data.pagination?.totalPages || 1);
                setProductPage(data.pagination?.page || 1);
            }
        } catch (e) {
            if (alive) {
                setProductError((e as Error).message);
            }
        } finally {
            if (alive) {
                setProductLoading(false);
            }
        }
        return () => { alive = false; };
    }, [productSearchQ, productPage]);

    useEffect(() => {
        if (tab === "product") {
            fetchProducts();
        }
    }, [tab, fetchProducts]);

    const handleProductImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                setProductLoading(true);
                setProductError(null);

                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<any>(sheet);

                const products = rows.map((r: any) => ({
                    sku: r.sku || r.SKU || r["รหัสสินค้า"],
                    sku_name: r.sku_name || r.name || r.Name || r.SKU_Name || r["ชื่อสินค้า"],
                    brand: r.brand || r.Brand || r["ยี่ห้อ"],
                    class_name: r.class_name || r.category || r.Category || r.Class_Name || r["หมวดหมู่"],
                    sku_cost: Number(r.sku_cost || r.cost || r.Cost || r.Sku_Cost || r["ทุน"] || r["ต้นทุน"] || 0),
                    sku_price: Number(r.sku_price || r.price || r.Price || r.Sku_Price || r["ราคา"] || r["ราคาขาย"] || 0),
                    vendor_no: Number(r.vendor_no || r.Vendor_No || r["รหัสผู้รับเหมา"] || 0),
                    vendor_name: r.vendor_name || r.vendor || r.Vendor || r.Vendor_Name || r["ชื่อผู้รับเหมา"] || "",
                }));

                const res = await fetch("/api/maintain/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ products }),
                });
                const resData = await res.json();
                if (!res.ok) throw new Error(resData.message || "เกิดข้อผิดพลาดในการนำเข้าสินค้า");

                alert(resData.message || "นำเข้าข้อมูลสินค้าสำเร็จ");
                fetchProducts("", 1);
            } catch (err: any) {
                setProductError(err.message);
            } finally {
                setProductLoading(false);
                if (productFileInputRef) productFileInputRef.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const fetchSymptoms = useCallback(async () => {
        let alive = true;
        try {
            setSymptomLoading(true);
            setSymptomError(null);
            const res = await fetch("/api/maintain/symptoms", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลอาการเสียไม่สำเร็จ");
            if (alive) {
                setSymptomsList(data.symptoms || []);
            }
        } catch (e) {
            if (alive) {
                setSymptomError((e as Error).message);
            }
        } finally {
            if (alive) {
                setSymptomLoading(false);
            }
        }
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (tab === "symptom") {
            fetchSymptoms();
        }
    }, [tab, fetchSymptoms]);

    const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

    const [newAnnMsg, setNewAnnMsg] = useState("");
    const [newAnnSeverity, setNewAnnSeverity] = useState("warning");
    const [newAnnStartDate, setNewAnnStartDate] = useState("");
    const [newAnnEndDate, setNewAnnEndDate] = useState("");

    const formatAnnDate = (dStr: string | null) => {
        if (!dStr) return "ไม่มีกำหนด";
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return "-";
        const day = String(d.getDate()).padStart(2, "0");
        const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const month = thMonths[d.getMonth()];
        const year = String(d.getFullYear() + 543).slice(-2);
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${day} ${month} ${year} ${hours}:${minutes}`;
    };

    const getAnnStatus = (start: string | null, end: string | null) => {
        const now = new Date();
        const startTime = start ? new Date(start).getTime() : 0;
        const endTime = end ? new Date(end).getTime() : Infinity;
        const nowTime = now.getTime();
        if (nowTime > endTime) return { label: "หมดอายุ", class: "bg-slate-100 text-slate-500 border-slate-200" };
        if (nowTime < startTime) return { label: "ยังไม่เริ่ม", class: "bg-blue-50 text-blue-600 border-blue-100" };
        return { label: "กำลังประกาศ", class: "bg-green-50 text-green-700 border-green-100" };
    };

    const fetchAnnouncements = useCallback(async () => {
        let alive = true;
        try {
            setAnnouncementsLoading(true);
            setAnnouncementsError(null);
            const res = await fetch("/api/maintain/announcements", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลประกาศไม่สำเร็จ");
            if (alive) setAnnouncementsList(data.announcements || []);
        } catch (e) {
            if (alive) setAnnouncementsError((e as Error).message);
        } finally {
            if (alive) setAnnouncementsLoading(false);
        }
        return () => { alive = false; };
    }, []);

    const handleSaveAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnMsg.trim()) {
            alert("กรุณากรอกข้อความประกาศ");
            return;
        }

        try {
            setIsSavingAnnouncement(true);
            const userStr = localStorage.getItem("userInfo");
            const createdUser = userStr ? JSON.parse(userStr).user_name : "admin";

            const res = await fetch("/api/maintain/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: newAnnMsg,
                    severity: newAnnSeverity,
                    startDate: newAnnStartDate || null,
                    endDate: newAnnEndDate || null,
                    createdUser
                }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.message || "บันทึกประกาศไม่สำเร็จ");

            setNewAnnMsg("");
            setNewAnnSeverity("warning");
            setNewAnnStartDate("");
            setNewAnnEndDate("");
            
            await fetchAnnouncements();
            alert("บันทึกประกาศสำเร็จ");
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setIsSavingAnnouncement(false);
        }
    };

    const handleDeleteAnnouncement = async (id: number) => {
        if (!confirm("คุณต้องการลบประกาศนี้ใช่หรือไม่?")) return;

        try {
            const res = await fetch(`/api/maintain/announcements?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.message || "ลบประกาศไม่สำเร็จ");
            
            await fetchAnnouncements();
            alert("ลบประกาศสำเร็จ");
        } catch (e) {
            alert((e as Error).message);
        }
    };

    useEffect(() => {
        if (tab === "announcement") {
            fetchAnnouncements();
        }
    }, [tab, fetchAnnouncements]);

    const openAddSymptomModal = () => {
        setEditingSymptomId(null);
        setSymptomFormData({ name: "", description: "" });
        setSymptomFormError(null);
        setShowSymptomModal(true);
    };

    const openEditSymptomModal = (sym: any) => {
        setEditingSymptomId(sym.id);
        setSymptomFormData({ name: sym.name, description: sym.description || "" });
        setSymptomFormError(null);
        setShowSymptomModal(true);
    };

    const handleSaveSymptom = async () => {
        if (!symptomFormData.name.trim()) {
            setSymptomFormError("กรุณาระบุชื่ออาการเสีย");
            return;
        }

        try {
            setIsSavingSymptom(true);
            setSymptomFormError(null);

            const method = editingSymptomId ? "PUT" : "POST";
            const body = {
                id: editingSymptomId,
                name: symptomFormData.name,
                description: symptomFormData.description,
                updatedUser,
            };

            const res = await fetch("/api/maintain/symptoms", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

            setShowSymptomModal(false);
            fetchSymptoms();
        } catch (err: any) {
            setSymptomFormError(err.message);
        } finally {
            setIsSavingSymptom(false);
        }
    };

    const handleDeleteSymptom = async (id: number) => {
        if (!confirm("คุณต้องการลบข้อมูลอาการเสียนี้ใช่หรือไม่?")) return;

        try {
            setSymptomLoading(true);
            const res = await fetch(`/api/maintain/symptoms?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "ลบไม่สำเร็จ");

            fetchSymptoms();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSymptomLoading(false);
        }
    };

    //* Status Info state
    const [loading, setLoading] = useState(true);
    const [allRows, setAllRows] = useState<StatusInfo[]>([]);
    const [rows, setRows] = useState<StatusInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"asc" | "desc" | null>(null);
    const [pathFilter, setPathFilter] = useState<string>("ALL");

    //* Vendor Info state
    const [vendorLoading, setVendorLoading] = useState(false);
    const [vendorRows, setVendorRows] = useState<VendorInfo[]>([]);
    const [vendorError, setVendorError] = useState<string | null>(null);
    const [vendorSearchQ, setVendorSearchQ] = useState("");
    const [vendorFileInputRef, setVendorFileInputRef] = useState<HTMLInputElement | null>(null);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
    const [vendorFormData, setVendorFormData] = useState({ vendor_no: "", vendor_name: "", vendor_email: "" });
    const [vendorFormError, setVendorFormError] = useState<string | null>(null);
    const [isSavingVendor, setIsSavingVendor] = useState(false);

    //* User & Access Info state
    const [usersRows, setUsersRows] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userSearchQ, setUserSearchQ] = useState("");
    const [locSearch, setLocSearch] = useState("");
    const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);

    const [permissionRows, setPermissionRows] = useState<any[]>([]);
    const [permissionLoading, setPermissionLoading] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [permissionToggles, setPermissionToggles] = useState<Record<number, boolean>>({});
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);

    //* Modals state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({ path: "", status: "", sla: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [userFormData, setUserFormData] = useState({
        username: "",
        fullName: "",
        email: "",
        password: "",
        rolesId: "1",
        storeCode: "",
        locationId: "",
    });
    const [userFormError, setUserFormError] = useState<string | null>(null);
    const [isSavingUser, setIsSavingUser] = useState(false);

    const isEditMode = editingId !== null;
    const [updatedUser, setUpdatedUser] = useState("");

    const fetchCategories = useCallback(async () => {
        let alive = true;
        try {
            setCategoryLoading(true);
            setCategoryError(null);
            const res = await fetch("/api/maintain/categories", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลหมวดหมู่ไม่สำเร็จ");
            if (alive) {
                setCategoriesList(data.categories || []);
            }
        } catch (e) {
            if (alive) {
                setCategoryError((e as Error).message);
            }
        } finally {
            if (alive) {
                setCategoryLoading(false);
            }
        }
        return () => { alive = false; };
    }, []);



    const openAddCategoryModal = () => {
        setEditingCategoryId(null);
        setCategoryFormData({ name: "" });
        setCategoryFormError(null);
        setShowCategoryModal(true);
    };

    const openEditCategoryModal = (cat: any) => {
        setEditingCategoryId(cat.id);
        setCategoryFormData({ name: cat.name });
        setCategoryFormError(null);
        setShowCategoryModal(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryFormData.name.trim()) {
            setCategoryFormError("กรุณาระบุชื่อหมวดหมู่");
            return;
        }

        try {
            setIsSavingCategory(true);
            setCategoryFormError(null);

            const method = editingCategoryId ? "PUT" : "POST";
            const body = {
                id: editingCategoryId,
                name: categoryFormData.name,
                updatedUser,
            };

            const res = await fetch("/api/maintain/categories", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

            setShowCategoryModal(false);
            fetchCategories();
        } catch (err: any) {
            setCategoryFormError(err.message);
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?")) return;

        try {
            setCategoryLoading(true);
            const res = await fetch(`/api/maintain/categories?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "ลบไม่สำเร็จ");

            fetchCategories();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setCategoryLoading(false);
        }
    };

    const openAddLocationModal = () => {
        setEditingLocationId(null);
        setLocationFormData({ id: "", name: "", short_name: "", code: "", status: "active", bu: "" });
        setLocationFormError(null);
        setShowLocationModal(true);
    };

    const openEditLocationModal = (loc: any) => {
        setEditingLocationId(loc.id);
        setLocationFormData({ id: loc.id, name: loc.name, short_name: loc.short_name || "", code: loc.code || "", status: loc.status || "active", bu: loc.bu || "" });
        setLocationFormError(null);
        setShowLocationModal(true);
    };

    const handleSaveLocation = async () => {
        if (!locationFormData.id.trim() || !locationFormData.name.trim()) {
            setLocationFormError("กรุณาระบุรหัสสาขาและชื่อสาขา");
            return;
        }

        try {
            setIsSavingLocation(true);
            setLocationFormError(null);

            const method = editingLocationId ? "PUT" : "POST";
            const body = {
                id: locationFormData.id,
                name: locationFormData.name,
                short_name: locationFormData.short_name,
                code: locationFormData.code,
                status: locationFormData.status,
                bu: locationFormData.bu,
            };

            const res = await fetch("/api/maintain/locations", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

            setShowLocationModal(false);
            fetchLocations();
        } catch (err: any) {
            setLocationFormError(err.message);
        } finally {
            setIsSavingLocation(false);
        }
    };

    const handleDeleteLocation = async (id: string) => {
        if (!confirm("คุณต้องการลบสาขานี้ใช่หรือไม่?")) return;

        try {
            setLocationLoading(true);
            const res = await fetch(`/api/maintain/locations?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "ลบไม่สำเร็จ");

            fetchLocations();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLocationLoading(false);
        }
    };

    const openAddVendorModal = () => {
        setEditingVendorId(null);
        setVendorFormData({ vendor_no: "", vendor_name: "", vendor_email: "" });
        setVendorFormError(null);
        setShowVendorModal(true);
    };

    const openEditVendorModal = (v: any) => {
        setEditingVendorId(v.id);
        setVendorFormData({ vendor_no: String(v.vendor_no), vendor_name: v.vendor_name || "", vendor_email: v.vendor_email || "" });
        setVendorFormError(null);
        setShowVendorModal(true);
    };

    const handleSaveVendor = async () => {
        if (!vendorFormData.vendor_no.trim() || !vendorFormData.vendor_name.trim() || !vendorFormData.vendor_email.trim()) {
            setVendorFormError("กรุณาระบุข้อมูลให้ครบถ้วน");
            return;
        }

        try {
            setIsSavingVendor(true);
            setVendorFormError(null);

            const method = editingVendorId ? "PUT" : "POST";
            const body = {
                id: editingVendorId,
                vendor_no: vendorFormData.vendor_no,
                vendor_name: vendorFormData.vendor_name,
                vendor_email: vendorFormData.vendor_email,
                updatedUser,
            };

            const res = await fetch("/api/maintain/vendor", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

            setShowVendorModal(false);
            fetchVendorData();
        } catch (err: any) {
            setVendorFormError(err.message);
        } finally {
            setIsSavingVendor(false);
        }
    };

    const handleDeleteVendor = async (id: number) => {
        if (!confirm("คุณต้องการลบผู้รับเหมารายนี้ใช่หรือไม่?")) return;

        try {
            setVendorLoading(true);
            const res = await fetch(`/api/maintain/vendor?id=${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "ลบไม่สำเร็จ");

            fetchVendorData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setVendorLoading(false);
        }
    };

    const openAddProductModal = () => {
        setEditingProductSku(null);
        setProductFormData({ sku: "", sbc: "", sku_name: "", brand: "", class_name: "", sku_cost: "", sku_price: "", vendor_no: "", vendor_name: "", model: "" });
        setProductFormError(null);
        setShowProductModal(true);
    };

    const openEditProductModal = (p: any) => {
        setEditingProductSku(p.sku);
        setProductFormData({
            sku: String(p.sku),
            sbc: p.sbc || "",
            sku_name: p.sku_name || "",
            brand: p.brand || "",
            class_name: p.class_name || "",
            sku_cost: String(p.sku_cost || 0),
            sku_price: String(p.sku_price || 0),
            vendor_no: String(p.vendor_no || 0),
            vendor_name: p.vendor_name || "",
            model: p.model || "",
        });
        setProductFormError(null);
        setShowProductModal(true);
    };

    const handleSaveProduct = async () => {
        if (!productFormData.sku.trim() || !productFormData.sku_name.trim() || !productFormData.brand.trim()) {
            setProductFormError("กรุณาระบุข้อมูลจำเป็นให้ครบถ้วน (SKU, ชื่อสินค้า, ยี่ห้อ)");
            return;
        }

        try {
            setIsSavingProduct(true);
            setProductFormError(null);

            const method = editingProductSku ? "PUT" : "POST";
            const body = {
                sku: productFormData.sku,
                sbc: productFormData.sbc || null,
                sku_name: productFormData.sku_name,
                brand: productFormData.brand,
                class_name: productFormData.class_name,
                sku_cost: productFormData.sku_cost,
                sku_price: productFormData.sku_price,
                vendor_no: productFormData.vendor_no,
                vendor_name: productFormData.vendor_name,
                model: productFormData.model,
            };

            const res = await fetch("/api/maintain/products", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

            setShowProductModal(false);
            fetchProducts();
        } catch (err: any) {
            setProductFormError(err.message);
        } finally {
            setIsSavingProduct(false);
        }
    };

    const handleDeleteProduct = async (sku: string) => {
        if (!confirm("คุณต้องการลบสินค้ารายการนี้ใช่หรือไม่?")) return;

        try {
            setProductLoading(true);
            const res = await fetch(`/api/maintain/products?sku=${sku}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "ลบไม่สำเร็จ");

            fetchProducts();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProductLoading(false);
        }
    };

    const filterRows = (dataToFilter: StatusInfo[], path: string) => {
        setPathFilter(path);
        if (path === "ALL") {
            setRows(dataToFilter);
        } else {
            setRows(dataToFilter.filter((r) => r.path === path));
        }
    };

    const applyFilter = (items: StatusInfo[], path: string) => {
        if (path === "ALL") return items;
        return items.filter((r) => r.path === path);
    };

    const fetchData = useCallback(async () => {
        let alive = true;
        try {
            setLoading(true);

            const res = await fetch("/api/maintain/status-info", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลไม่สำเร็จ");
            const items = data.items || [];

            //* get current user
            const raw = localStorage.getItem("userInfo");
            if (raw) {
                const u = JSON.parse(raw);
                if (alive) setUpdatedUser(u.user_name);
            }

            const sortedItems = items.sort((a: StatusInfo, b: StatusInfo) => a.id - b.id);
            setAllRows(sortedItems);
            setRows(applyFilter(sortedItems, pathFilter));
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
        return () => { alive = false; };
    }, [pathFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    //* Fetch vendor data
    const fetchVendorData = useCallback(async () => {
        let alive = true;
        try {
            setVendorLoading(true);
            setVendorError(null);

            const res = await fetch("/api/maintain/vendor", { cache: "no-store" });
            const data = await res.json();

            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูล Vendor ไม่สำเร็จ");

            if (alive) {
                setVendorRows(data.vendors || []);
            }
        } catch (e) {
            if (alive) {
                setVendorError((e as Error).message);
            }
        } finally {
            if (alive) {
                setVendorLoading(false);
            }
        }
        return () => { alive = false; };
    }, []);

    //* Load vendor data on tab change
    useEffect(() => {
        if (tab === "vendor") {
            fetchVendorData();
        }
    }, [tab, fetchVendorData]);

    //* Load categories and vendor data for category/product tabs
    useEffect(() => {
        if (tab === "category" || tab === "product") {
            fetchCategories();
        }
        if (tab === "product") {
            fetchVendorData();
        }
    }, [tab, fetchCategories, fetchVendorData]);

    //* Fetch users data
    const fetchUsersData = useCallback(async () => {
        let alive = true;
        try {
            setUsersLoading(true);
            setUsersError(null);
            const res = await fetch("/api/maintain/users", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลผู้ใช้งานไม่สำเร็จ");
            if (alive) setUsersRows(data.users || []);
        } catch (e) {
            if (alive) setUsersError((e as Error).message);
        } finally {
            if (alive) setUsersLoading(false);
        }
        return () => { alive = false; };
    }, []);

    //* Fetch permissions data
    const fetchPermissionsData = useCallback(async () => {
        let alive = true;
        try {
            setPermissionLoading(true);
            setPermissionError(null);
            const res = await fetch("/api/maintain/permissions", { cache: "no-store" });
            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "โหลดข้อมูลสิทธิ์การใช้งานไม่สำเร็จ");
            if (alive) {
                setPermissionRows(data.permissions || []);
                const toggles: Record<number, boolean> = {};
                (data.permissions || []).forEach((p: any) => {
                    toggles[p.roles_id] = p.can_add_request;
                });
                setPermissionToggles(toggles);
            }
        } catch (e) {
            if (alive) setPermissionError((e as Error).message);
        } finally {
            if (alive) setPermissionLoading(false);
        }
        return () => { alive = false; };
    }, []);

    //* Load user and permissions data on tab change
    useEffect(() => {
        if (tab === "user") {
            fetchUsersData();
            fetchPermissionsData();
        }
    }, [tab, fetchUsersData, fetchPermissionsData]);

    //* Import vendor data from Excel
    const handleVendorImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{
                vendor_no?: string;
                vendor_name?: string;
                vendor_email?: string;
            }>;

            if (jsonData.length === 0) {
                alert("ไฟล์ Excel ว่าง");
                return;
            }

            //* Validate data
            const vendorData = jsonData.map((row, idx) => {
                const vendorNo = String(row.vendor_no || "").trim();
                const vendorName = String(row.vendor_name || "").trim();
                const vendorEmail = String(row.vendor_email || "").trim();

                if (!vendorNo || !vendorName || !vendorEmail) {
                    throw new Error(`แถว ${idx + 2}: ข้อมูลไม่ครบ (vendor_no, vendor_name, vendor_email ต้องไม่ว่าง)`);
                }

                return { vendor_no: vendorNo, vendor_name: vendorName, vendor_email: vendorEmail };
            });

            //* Send to API
            setVendorLoading(true);
            const res = await fetch("/api/maintain/vendor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendors: vendorData, updatedUser }),
            });

            const result = await res.json();
            if (!result.ok) throw new Error(result?.message || "import ไม่สำเร็จ");

            alert(`import สำเร็จ ${result.count || vendorData.length} รายการ`);
            await fetchVendorData();
        } catch (err) {
            alert(`Error: ${(err as Error).message}`);
        } finally {
            setVendorLoading(false);
            if (e.target) e.target.value = "";
        }
    };

    //* Import location data from Excel or JSON
    const handleLocationImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const isJson = file.name.endsWith(".json");
            let locationData: any[] = [];

            if (isJson) {
                const text = await file.text();
                const parsed = JSON.parse(text);
                const list = Array.isArray(parsed) ? parsed : (parsed.locations || []);
                locationData = list.map((loc: any, idx: number) => {
                    const id = String(loc.id || loc.code || "").trim();
                    const name = String(loc.name || "").trim();
                    const shortName = String(loc.shortName || loc.short_name || "").trim();
                    const code = String(loc.code || "").trim();
                    const status = String(loc.status || "active").trim();

                    if (!id || !name) {
                        throw new Error(`รายการที่ ${idx + 1}: ข้อมูลไม่ครบ (ต้องมี id หรือ code และ name)`);
                    }
                    return { id, name, shortName, code, status };
                });
            } else {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<{
                    id?: any;
                    code?: any;
                    name?: any;
                    shortName?: any;
                    short_name?: any;
                    status?: any;
                }>;

                if (jsonData.length === 0) {
                    alert("ไฟล์ Excel ว่าง");
                    return;
                }

                locationData = jsonData.map((row, idx) => {
                    const id = String(row.id || row.code || "").trim();
                    const name = String(row.name || "").trim();
                    const shortName = String(row.shortName || row.short_name || "").trim();
                    const code = String(row.code || "").trim();
                    const status = String(row.status || "active").trim();

                    if (!id || !name) {
                        throw new Error(`แถวที่ ${idx + 2}: ข้อมูลไม่ครบ (ต้องมีคอลัมน์ id หรือ code และ name)`);
                    }
                    return { id, name, shortName, code, status };
                });
            }

            setLocationLoading(true);
            const res = await fetch("/api/maintain/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locations: locationData }),
            });

            const result = await res.json();
            if (!result.ok) throw new Error(result?.message || "นำเข้าไม่สำเร็จ");

            alert(result.message || "นำเข้าข้อมูลสาขาสำเร็จ");
            await fetchLocations();
        } catch (err) {
            alert(`Error: ${(err as Error).message}`);
        } finally {
            setLocationLoading(false);
            if (e.target) e.target.value = "";
        }
    };

    //* Export vendor data to Excel
    const handleVendorExport = () => {
        if (vendorRows.length === 0) {
            alert("ไม่มีข้อมูลให้ export");
            return;
        }

        const exportData = vendorRows.map(row => ({
            vendor_no: row.vendor_no,
            vendor_name: row.vendor_name,
            vendor_email: row.vendor_email,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vendors");
        XLSX.writeFile(wb, `vendor_info_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    //* Filter vendor rows by search
    const filteredVendorRows = vendorRows.filter(row =>
        String(row.vendor_no).includes(vendorSearchQ) ||
        row.vendor_name?.toLowerCase().includes(vendorSearchQ.toLowerCase())
    );

    const handleSortSLA = () => {
        let newSort: "asc" | "desc" | null = null;
        if (sortBy === null) {
            newSort = "asc";
        } else if (sortBy === "asc") {
            newSort = "desc";
        } else {
            newSort = null;
        }
        setSortBy(newSort);

        const sorted = [...rows];
        if (newSort) {
            sorted.sort((a, b) => {
                return newSort === "asc" ? a.sla - b.sla : b.sla - a.sla;
            });
        }
        setRows(sorted);
    };

    const openEditModal = (row: StatusInfo) => {
        setEditingId(row.id);
        setFormData({
            path: row.path,
            status: row.status,
            sla: String(row.sla),
        });
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ path: "", status: "", sla: "" });
        setFormError(null);
    };

    const handleSave = async () => {
        setFormError(null);

        if (editingId === null || Number.isNaN(editingId)) {
            setFormError("ไม่พบรายการที่ต้องการแก้ไข");
            return;
        }

        if (!formData.sla.trim()) {
            setFormError("กรุณากรอก SLA");
            return;
        }

        if (!formData.status.trim()) {
            setFormError("กรุณากรอก Status Name");
            return;
        }

        const statusName = formData.status;
        const slaDay = Number(formData.sla);

        if (Number.isNaN(slaDay) || slaDay < 0) {
            setFormError("กรุณากรอก SLA เป็นตัวเลข 0 ขึ้นไป");
            return;
        }

        try {
            setIsSaving(true);

            //* Convert days to hours for database storage
            const slaHours = slaDay * 24;

            const res = await fetch(`/api/maintain/status-info/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    statusName,
                    sla: slaHours,
                    updatedUser,
                }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "บันทึกไม่สำเร็จ");

            await fetchData();
            closeModal();
            alert("บันทึกข้อมูลสำเร็จ");
        } catch (e) {
            setFormError((e as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const downloadVendorTemplate = () => {
        const templateData = [
            { vendor_no: "", vendor_name: "", vendor_email: "" }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vendors");
        XLSX.writeFile(wb, "template_vendor_info.xlsx");
    };

    //* User actions
    const openAddUserModal = () => {
        setEditingUserId(null);
        setUserFormData({
            username: "",
            fullName: "",
            email: "",
            password: "",
            rolesId: "1",
            storeCode: "",
            locationId: "",
        });
        setUserFormError(null);
        setShowUserModal(true);
    };

    const openEditUserModal = (usr: any) => {
        setEditingUserId(usr.user_id);
        setUserFormData({
            username: usr.user_name,
            fullName: usr.user_full_name || "",
            email: usr.user_email || "",
            password: "",
            rolesId: String(usr.roles_id),
            storeCode: usr.store_code || "",
            locationId: usr.location_id || "",
        });
        setUserFormError(null);
        setShowUserModal(true);
    };

    const handleSaveUser = async () => {
        setUserFormError(null);

        const { username, fullName, email, password, rolesId, storeCode, locationId } = userFormData;

        if (!username.trim() || !email.trim() || (!editingUserId && !password.trim())) {
            setUserFormError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
            return;
        }

        try {
            setIsSavingUser(true);
            const isEdit = editingUserId !== null;
            const url = isEdit ? `/api/maintain/users/${editingUserId}` : "/api/maintain/users";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    fullName,
                    email,
                    password: password.trim() ? password : undefined,
                    rolesId: Number(rolesId),
                    storeCode,
                    locationId,
                    updatedUser,
                }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "บันทึกข้อมูลไม่สำเร็จ");

            await fetchUsersData();
            setShowUserModal(false);
            alert("บันทึกข้อมูลผู้ใช้งานสำเร็จ");
        } catch (e) {
            setUserFormError((e as Error).message);
        } finally {
            setIsSavingUser(false);
        }
    };

    //* Permission actions
    const handlePermissionToggle = (roleId: number, checked: boolean) => {
        setPermissionToggles((prev) => ({
            ...prev,
            [roleId]: checked,
        }));
    };

    const handleSavePermissions = async () => {
        try {
            setIsSavingPermissions(true);
            setPermissionError(null);

            const toggles = Object.entries(permissionToggles).map(([roleId, enabled]) => ({
                rolesId: Number(roleId),
                enabled,
            }));

            const res = await fetch("/api/maintain/permissions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toggles, updatedUser }),
            });

            const data = await res.json();
            if (!data.ok) throw new Error(data?.message || "บันทึกสิทธิ์การเข้าใช้งานไม่สำเร็จ");

            alert("บันทึกสิทธิ์การสร้างใบงานสำเร็จ");
            await fetchPermissionsData();
        } catch (e) {
            setPermissionError((e as Error).message);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
                <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-10 overflow-x-hidden scrollbar-hide">
            <div className="w-full max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">ข้อมูลการซ่อม</h1>
                </div>

                <div className="flex gap-4 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setTab("status")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "status"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Status Info
                    </button>
                    <button
                        onClick={() => setTab("vendor")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "vendor"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Vendor Info
                    </button>
                    <button
                        onClick={() => setTab("user")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "user"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        User & Access Info
                    </button>
                    <button
                        onClick={() => setTab("location")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "location"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Location Info
                    </button>
                    <button
                        onClick={() => setTab("product")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "product"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Product Info (สินค้า & ทุน)
                    </button>
                    <button
                        onClick={() => setTab("category")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "category"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Category Info (หมวดหมู่สินค้า)
                    </button>
                    <button
                        onClick={() => setTab("symptom")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "symptom"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Symptom Info (อาการเสีย)
                    </button>
                    <button
                        onClick={() => setTab("announcement")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "announcement"
                                ? "text-[#c8102e] border-b-2 border-[#c8102e]"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        ตั้งค่าประกาศ (Announcements)
                    </button>
                </div>

                {tab === "status" && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">Status Info</h2>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {error}
                            </div>
                        )}

                        <div className="mb-6 flex gap-2 flex-wrap">
                            <button
                                onClick={() => filterRows(allRows, "ALL")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                    pathFilter === "ALL"
                                        ? "bg-slate-700 text-white hover:bg-slate-800"
                                        : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                                }`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => filterRows(allRows, "DC")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                    pathFilter === "DC"
                                        ? "bg-slate-700 text-white hover:bg-slate-800"
                                        : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                                }`}
                            >
                                DC
                            </button>
                            <button
                                onClick={() => filterRows(allRows, "VENDOR")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                    pathFilter === "VENDOR"
                                        ? "bg-slate-700 text-white hover:bg-slate-800"
                                        : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                                }`}
                            >
                                VENDOR
                            </button>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">Path</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">Status</th>
                                            <th
                                                className="text-left px-6 py-3 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                                                onClick={handleSortSLA}
                                                title="เรียงลำดับ SLA"
                                            >
                                                SLA {sortBy === "asc" && "↑"} {sortBy === "desc" && "↓"}
                                            </th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูล
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row) => (
                                                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-sm">{row.path}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.status}</td>
                                                    <td className="px-6 py-4 text-slate-700 font-medium">{row.sla} วัน</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(row)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-[#c8102e] hover:bg-[#b00d25] text-white rounded-lg transition font-medium text-sm"
                                                                title="แก้ไข"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                                แก้ไข
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {rows.length > 0 && (
                            <div className="mt-4 text-sm text-slate-600">
                                รวมทั้งหมด {rows.length} แถว
                            </div>
                        )}
                    </>
                )}

                {tab === "vendor" && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">Vendor Info (ผู้รับเหมา)</h2>
                            <button
                                onClick={openAddVendorModal}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                            >
                                เพิ่มผู้รับเหมา
                            </button>
                        </div>

                        {vendorError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {vendorError}
                            </div>
                        )}

                        <div className="mb-6 flex gap-2 flex-wrap">
                            <input
                                type="text"
                                placeholder="ค้นหาจาก Vendor No หรือ Vendor Name..."
                                value={vendorSearchQ}
                                onChange={(e) => setVendorSearchQ(e.target.value)}
                                className="flex-1 min-w-64 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                            />
                            <button
                                onClick={downloadVendorTemplate}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition"
                                title="Download Template"
                            >
                                <FileDown className="w-4 h-4" />
                                Template
                            </button>
                            <button
                                onClick={() => document.getElementById("vendorImportInput")?.click()}
                                disabled={vendorLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8102e] hover:bg-[#b00d25] text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Import"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>
                            <input
                                id="vendorImportInput"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleVendorImport}
                                className="hidden"
                                ref={(input) => setVendorFileInputRef(input)}
                            />
                            <button
                                onClick={handleVendorExport}
                                disabled={vendorLoading || vendorRows.length === 0}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">No.</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900 w-32">Vendor No</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">Vendor Name</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">Email</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-32">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVendorRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูล
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredVendorRows.map((row, idx) => (
                                                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-mono font-semibold">{row.vendor_no}</td>
                                                    <td className="px-6 py-4 text-slate-700 font-semibold">{row.vendor_name}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.vendor_email}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditVendorModal(row)}
                                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteVendor(row.id)}
                                                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                ลบ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {vendorRows.length > 0 && (
                            <div className="mt-4 text-sm text-slate-600">
                                แสดง {filteredVendorRows.length} จากทั้งหมด {vendorRows.length} แถว
                            </div>
                        )}
                    </>
                )}

                {tab === "user" && (
                    <div className="space-y-10">
                        {/* User Accounts Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-slate-900">จัดการบัญชีผู้ใช้งาน (User Accounts)</h2>
                                <button
                                    onClick={openAddUserModal}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                                >
                                    เพิ่มผู้ใช้งาน
                                </button>
                            </div>

                            {usersError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                    {usersError}
                                </div>
                            )}

                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="ค้นหาจากชื่อผู้ใช้ หรือชื่อ-นามสกุล..."
                                    value={userSearchQ}
                                    onChange={(e) => setUserSearchQ(e.target.value)}
                                    className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">ลำดับ</th>
                                                <th className="text-left px-6 py-3 font-semibold text-slate-900">Username</th>
                                                <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่อ-นามสกุล</th>
                                                <th className="text-left px-6 py-3 font-semibold text-slate-900">อีเมล</th>
                                                <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">Store</th>
                                                <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">Location</th>
                                                <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">บทบาท</th>
                                                <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">การจัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersLoading ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-6 text-center text-slate-500">
                                                        กำลังโหลดข้อมูล...
                                                    </td>
                                                </tr>
                                            ) : usersRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-6 text-center text-slate-500">
                                                        ไม่พบข้อมูลผู้ใช้งาน
                                                    </td>
                                                </tr>
                                            ) : (
                                                usersRows
                                                    .filter(u => 
                                                        u.user_name.toLowerCase().includes(userSearchQ.toLowerCase()) || 
                                                        (u.user_full_name && u.user_full_name.toLowerCase().includes(userSearchQ.toLowerCase()))
                                                    )
                                                    .map((row, idx) => (
                                                        <tr key={row.user_id} className="border-t border-slate-100 hover:bg-slate-50">
                                                            <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                            <td className="px-6 py-4 text-slate-900 font-semibold">{row.user_name}</td>
                                                            <td className="px-6 py-4 text-slate-700">{row.user_full_name || "-"}</td>
                                                            <td className="px-6 py-4 text-slate-700">{row.user_email}</td>
                                                            <td className="px-6 py-4 text-slate-700 text-center">
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded font-mono text-xs">
                                                                    {row.store_nick}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-700 text-center">
                                                                <span className="px-2 py-1 bg-violet-100 text-violet-800 rounded font-semibold text-xs">
                                                                    {row.location_name || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-700 text-center">
                                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                    row.role_name === "ADMIN" ? "bg-red-100 text-red-800" :
                                                                    row.role_name === "CS" ? "bg-blue-100 text-blue-800" :
                                                                    row.role_name === "GR" ? "bg-green-100 text-green-800" :
                                                                    "bg-slate-100 text-slate-800"
                                                                }`}>
                                                                    {row.role_name}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        onClick={() => openEditUserModal(row)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition font-medium text-xs shadow-sm"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                        แก้ไข
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Creation Access Control Section */}
                        <div className="pt-8 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-slate-900">สิทธิ์การเปิดใบงาน (Access Control - add_request)</h2>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isSavingPermissions || permissionLoading}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition text-sm"
                                >
                                    {isSavingPermissions ? "กำลังบันทึก..." : "บันทึกสิทธิ์การเข้าใช้งาน"}
                                </button>
                            </div>
                            <p className="text-slate-500 text-xs mb-6">
                                ตั้งค่าว่าบทบาท (Role) ใดบ้างที่ได้รับสิทธิ์ในการ "เปิดใบแจ้งซ่อมใหม่ (add_request)" ในระบบ
                            </p>

                            {permissionError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                    {permissionError}
                                </div>
                            )}

                            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden max-w-xl">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-sm">
                                        <tr>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">บทบาท (Role)</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-48">สิทธิ์การสร้างใบงาน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissionLoading ? (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : permissionRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลบทบาท
                                                </td>
                                            </tr>
                                        ) : (
                                            permissionRows.map((r) => (
                                                <tr key={r.roles_id} className="border-t border-slate-100 hover:bg-slate-50 text-sm">
                                                    <td className="px-6 py-4 text-slate-900 font-semibold">{r.roles_name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!permissionToggles[r.roles_id]}
                                                            onChange={(e) => handlePermissionToggle(r.roles_id, e.target.checked)}
                                                            className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "location" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">จัดการข้อมูลสาขา (Location Management)</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={openAddLocationModal}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                                >
                                    เพิ่มสาขา
                                </button>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.json"
                                    onChange={handleLocationImport}
                                    ref={(el) => setLocationFileInputRef(el)}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => locationFileInputRef?.click()}
                                    disabled={locationLoading}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg shadow transition text-sm disabled:opacity-50"
                                >
                                    {locationLoading ? "กำลังนำเข้า..." : "นำเข้าข้อมูลสาขา (Excel / JSON)"}
                                </button>
                            </div>
                        </div>

                        {locationError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {locationError}
                            </div>
                        )}

                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="ค้นหาจากรหัส หรือชื่อสาขา..."
                                value={locationSearchQ}
                                onChange={(e) => setLocationSearchQ(e.target.value)}
                                className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">ลำดับ</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ID / Code</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่อสาขา</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่อย่อ (Short Name)</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-36">BU / Workspace</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">สถานะ</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-32">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {locationLoading ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : locationsList.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลสาขา
                                                </td>
                                            </tr>
                                        ) : (
                                            locationsList
                                                .filter(loc => 
                                                    loc.id.toLowerCase().includes(locationSearchQ.toLowerCase()) || 
                                                    loc.name.toLowerCase().includes(locationSearchQ.toLowerCase())
                                                )
                                                .map((row, idx) => (
                                                    <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                        <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                        <td className="px-6 py-4 text-slate-900 font-mono font-semibold">{row.id}</td>
                                                        <td className="px-6 py-4 text-slate-900 font-semibold">{row.name}</td>
                                                        <td className="px-6 py-4 text-slate-700">{row.short_name || "-"}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            {row.bu ? (
                                                                <span className="px-2.5 py-1 rounded bg-violet-100 text-violet-800 text-xs font-bold font-mono">
                                                                    {row.bu}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs italic">Auto</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-700 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                row.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                                                            }`}>
                                                                {row.status || "active"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => openEditLocationModal(row)}
                                                                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                                                                >
                                                                    แก้ไข
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLocation(row.id)}
                                                                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold"
                                                                >
                                                                    ลบ
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "product" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">จัดการข้อมูลสินค้าและต้นทุน (Product & Cost Management)</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={openAddProductModal}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                                >
                                    เพิ่มสินค้า
                                </button>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.json"
                                    onChange={handleProductImport}
                                    ref={(el) => setProductFileInputRef(el)}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => productFileInputRef?.click()}
                                    disabled={productLoading}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg shadow transition text-sm disabled:opacity-50"
                                >
                                    {productLoading ? "กำลังนำเข้า..." : "นำเข้าข้อมูลสินค้า (Excel)"}
                                </button>
                            </div>
                        </div>

                        {productError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                {productError}
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="ค้นหาตาม SKU, ชื่อสินค้า, หมวดหมู่, ยี่ห้อ..."
                                value={productSearchQ}
                                onChange={(e) => setProductSearchQ(e.target.value)}
                                className="flex-1 max-w-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                            />
                            <button
                                onClick={() => fetchProducts(productSearchQ, 1)}
                                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition"
                            >
                                ค้นหา
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">ลำดับ</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900 w-32">SKU</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900 w-32">Barcode</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่อสินค้า</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900 w-40">หมวดหมู่</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900 w-32">ยี่ห้อ</th>
                                            <th className="text-right px-6 py-3 font-semibold text-slate-900 w-28">ทุน (Cost)</th>
                                            <th className="text-right px-6 py-3 font-semibold text-slate-900 w-28">ราคา (Price)</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-32">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productLoading ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : productsList.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลสินค้า
                                                </td>
                                            </tr>
                                        ) : (
                                            productsList.map((row, idx) => (
                                                <tr key={row.sku} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-center">{(productPage - 1) * 20 + idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-mono font-semibold">{row.sku}</td>
                                                    <td className="px-6 py-4 text-slate-700 font-mono">{row.sbc || "-"}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-semibold">{row.sku_name}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.class_name || "-"}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.brand || "-"}</td>
                                                    <td className="px-6 py-4 text-slate-900 text-right font-mono font-semibold">
                                                        {row.sku_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-900 text-right font-mono font-semibold">
                                                        {row.sku_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditProductModal(row)}
                                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(row.sku)}
                                                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                ลบ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {productTotalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button
                                    onClick={() => fetchProducts(productSearchQ, productPage - 1)}
                                    disabled={productPage === 1}
                                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                <span className="px-3 py-1.5 text-xs text-slate-600">
                                    หน้า {productPage} จาก {productTotalPages}
                                </span>
                                <button
                                    onClick={() => fetchProducts(productSearchQ, productPage + 1)}
                                    disabled={productPage === productTotalPages}
                                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                    ถัดไป
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {tab === "symptom" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">จัดการประเภทอาการเสีย (Symptom/Issue Type Management)</h2>
                            <button
                                onClick={openAddSymptomModal}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                            >
                                เพิ่มประเภทอาการเสีย
                            </button>
                        </div>

                        {symptomError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {symptomError}
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">ลำดับ</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่ออาการเสีย</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">รายละเอียด/คำอธิบาย</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-32">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {symptomLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : symptomsList.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลอาการเสีย
                                                </td>
                                            </tr>
                                        ) : (
                                            symptomsList.map((row, idx) => (
                                                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-semibold">{row.name}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.description || "-"}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditSymptomModal(row)}
                                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSymptom(row.id)}
                                                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                ลบ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "category" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900">จัดการหมวดหมู่สินค้า (Category Management)</h2>
                            <button
                                onClick={openAddCategoryModal}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm"
                            >
                                เพิ่มหมวดหมู่
                            </button>
                        </div>

                        {categoryError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {categoryError}
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-16">ลำดับ</th>
                                            <th className="text-left px-6 py-3 font-semibold text-slate-900">ชื่อหมวดหมู่</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-32">การจัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryLoading ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : categoriesList.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลหมวดหมู่
                                                </td>
                                            </tr>
                                        ) : (
                                            categoriesList.map((row, idx) => (
                                                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-900 font-semibold">{row.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditCategoryModal(row)}
                                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCategory(row.id)}
                                                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold"
                                                            >
                                                                ลบ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "announcement" && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Title Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                                ⚙️ System Settings
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                ตั้งค่าระบบ การเชื่อมต่อ และประกาศแจ้งเตือน (สำหรับ Admin)
                            </p>
                        </div>

                        {/* List Section */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    📢 ประกาศแจ้งเตือนระบบ (System Announcements)
                                </h3>
                                <span className="text-xs font-semibold text-slate-400">
                                    {announcementsList.length} ประกาศ
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                                ประกาศจะแสดงเป็น Banner วิ่งด้านบนทุกหน้า รองรับการตั้งเวลาเริ่มต้นและหมดอายุอัตโนมัติ
                            </p>

                            {announcementsLoading && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    กำลังโหลดข้อมูลประกาศ...
                                </div>
                            )}

                            {announcementsError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                                    {announcementsError}
                                </div>
                            )}

                            {!announcementsLoading && announcementsList.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                                    ไม่มีประกาศในระบบขณะนี้
                                </div>
                            )}

                            <div className="space-y-4">
                                {announcementsList.map((ann) => {
                                    const status = getAnnStatus(ann.start_date, ann.end_date);
                                    let severityColor = "bg-amber-500";
                                    let severityLabel = "warning";
                                    let headerBg = "bg-[#8c4f2b]";

                                    if (ann.severity === "danger") {
                                        severityColor = "bg-red-500";
                                        severityLabel = "danger";
                                        headerBg = "bg-red-800";
                                    } else if (ann.severity === "info") {
                                        severityColor = "bg-blue-500";
                                        severityLabel = "info";
                                        headerBg = "bg-indigo-800";
                                    }

                                    return (
                                        <div key={ann.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            {/* Colored Header bar */}
                                            <div className={`${headerBg} px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5`}>
                                                <span>⚠️</span>
                                                <span>{ann.severity === "danger" ? "ระบบขัดข้องรุนแรง" : ann.severity === "info" ? "แจ้งเพื่อทราบ" : "ทดสอบระบบ/คำเตือน"}</span>
                                            </div>

                                            {/* Content Area */}
                                            <div className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-3 flex-grow">
                                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                                        {ann.message}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Status Badge */}
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${status.class}`}>
                                                            {status.label}
                                                        </span>
                                                        {/* Severity Badge */}
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${severityColor}`}>
                                                            {severityLabel}
                                                        </span>
                                                        {/* Dates */}
                                                        <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 ml-2">
                                                            <span className="text-green-600">▶</span> {formatAnnDate(ann.start_date)}
                                                            <span className="text-red-500">◼</span> {formatAnnDate(ann.end_date)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition self-start md:self-center"
                                                >
                                                    🗑️ ลบ
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Creation Form */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                                ➕ เพิ่มประกาศใหม่
                            </h3>

                            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                        ข้อความประกาศ <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={newAnnMsg}
                                        onChange={(e) => setNewAnnMsg(e.target.value)}
                                        placeholder="เช่น ขณะนี้ระบบ SAP ล่ม หรือการปรับปรุงระบบ UAT..."
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-xs font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                            ระดับความรุนแรง (Severity)
                                        </label>
                                        <select
                                            value={newAnnSeverity}
                                            onChange={(e) => setNewAnnSeverity(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-xs font-medium"
                                        >
                                            <option value="info">Info (แจ้งเพื่อทราบ - น้ำเงิน)</option>
                                            <option value="warning">Warning (คำเตือน/ทดสอบ - น้ำตาล)</option>
                                            <option value="danger">Danger (แจ้งเตือนรุนแรง - แดง)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                            วันที่เริ่มประกาศ (Start Date)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newAnnStartDate}
                                            onChange={(e) => setNewAnnStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-xs font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                            วันที่สิ้นสุดประกาศ (End Date)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newAnnEndDate}
                                            onChange={(e) => setNewAnnEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-xs font-medium"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingAnnouncement}
                                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50"
                                >
                                    {isSavingAnnouncement ? "กำลังบันทึก..." : "บันทึก / เพิ่มประกาศ"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {showSymptomModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingSymptomId ? "แก้ไขประเภทอาการเสีย" : "เพิ่มประเภทอาการเสีย"}
                        </h2>

                        {symptomFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {symptomFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่ออาการเสีย <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={symptomFormData.name}
                                    onChange={(e) => setSymptomFormData({ ...symptomFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    placeholder="เช่น หน้าจอแตก, เปิดไม่ติด, ฯลฯ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">คำอธิบายเพิ่มเติม</label>
                                <textarea
                                    value={symptomFormData.description}
                                    onChange={(e) => setSymptomFormData({ ...symptomFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 h-24 resize-none"
                                    placeholder="รายละเอียดเพิ่มเติมของอาการเสีย"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowSymptomModal(false)}
                                disabled={isSavingSymptom}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveSymptom}
                                disabled={isSavingSymptom}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingSymptom ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            แก้ไขข้อมูล
                        </h2>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {formError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-slate-700">Path</label>
                                </div>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        value={formData.path}
                                        disabled
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed text-slate-600"
                                    />
                                ) : (
                                    <select
                                        value={formData.path}
                                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                                    >
                                        <option value="">-- เลือก Path --</option>
                                        <option value="DC">DC</option>
                                        <option value="VENDOR">VENDOR</option>
                                        <option value="ALL">ALL</option>
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Name</label>
                                <input
                                    type="text"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SLA (วัน)</label>
                                <input
                                    type="number"
                                    value={formData.sla}
                                    onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8102e]"
                                    placeholder="เช่น 7"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={closeModal}
                                disabled={isSaving}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-submit"
                            >
                                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingUserId ? "แก้ไขข้อมูลผู้ใช้งาน / ตั้งค่ารหัสผ่านใหม่" : "เพิ่มผู้ใช้งานใหม่"}
                        </h2>

                        {userFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm font-medium">
                                {userFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={userFormData.username}
                                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                                    disabled={editingUserId !== null}
                                    placeholder="เช่น somchai_cs"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                                <input
                                    type="text"
                                    value={userFormData.fullName}
                                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                                    placeholder="เช่น สมชาย ใจดี"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                    placeholder="เช่น somchai@company.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    รหัสผ่าน {editingUserId ? "(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={userFormData.password}
                                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                    placeholder={editingUserId ? "ระบุรหัสผ่านใหม่เพื่อรีเซ็ต" : "ระบุรหัสผ่านเริ่มต้น"}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">บทบาท (Role) <span className="text-red-500">*</span></label>
                                    <select
                                        value={userFormData.rolesId}
                                        onChange={(e) => setUserFormData({ ...userFormData, rolesId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="1">CS</option>
                                        <option value="2">GR</option>
                                        <option value="3">DC</option>
                                        <option value="4">ADMIN</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสสาขา (Store Code)</label>
                                    <input
                                        type="text"
                                        value={userFormData.storeCode}
                                        onChange={(e) => setUserFormData({ ...userFormData, storeCode: e.target.value })}
                                        placeholder="เช่น S001"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">พื้นที่ดูแล / สาขาหลัก (User Location)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ค้นหาหรือเลือกสาขา..."
                                        value={isLocDropdownOpen ? locSearch : (locationsList.find(l => l.id === userFormData.locationId)?.name || "")}
                                        onFocus={() => {
                                            setIsLocDropdownOpen(true);
                                            setLocSearch("");
                                        }}
                                        onChange={(e) => setLocSearch(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                    />
                                    
                                    {/* Clear button if selected */}
                                    {userFormData.locationId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUserFormData({ ...userFormData, locationId: "" });
                                                setLocSearch("");
                                            }}
                                            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-semibold"
                                        >
                                            ✕
                                        </button>
                                    )}

                                    {/* Dropdown toggle indicator */}
                                    <button
                                        type="button"
                                        onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        ▼
                                    </button>

                                    {/* Dropdown container */}
                                    {isLocDropdownOpen && (
                                        <>
                                            {/* Backdrop to close dropdown on click outside */}
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setIsLocDropdownOpen(false)}
                                            />
                                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                                                <div 
                                                    onClick={() => {
                                                        setUserFormData({ ...userFormData, locationId: "" });
                                                        setIsLocDropdownOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-500 font-semibold border-b border-slate-100"
                                                >
                                                    -- ไม่ระบุ --
                                                </div>
                                                {locationsList
                                                    .filter(loc => 
                                                        !locSearch.trim() || 
                                                        loc.name.toLowerCase().includes(locSearch.toLowerCase()) || 
                                                        loc.id.toLowerCase().includes(locSearch.toLowerCase())
                                                    )
                                                    .map(loc => (
                                                        <div
                                                            key={loc.id}
                                                            onClick={() => {
                                                                setUserFormData({ ...userFormData, locationId: loc.id });
                                                                setIsLocDropdownOpen(false);
                                                            }}
                                                            className={`px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm font-semibold flex justify-between items-center ${
                                                                userFormData.locationId === loc.id ? "bg-violet-50 text-violet-700" : "text-slate-800"
                                                            }`}
                                                        >
                                                            <span>{loc.name}</span>
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{loc.id}</span>
                                                        </div>
                                                    ))
                                                }
                                                {locationsList.filter(loc => 
                                                    !locSearch.trim() || 
                                                    loc.name.toLowerCase().includes(locSearch.toLowerCase()) || 
                                                    loc.id.toLowerCase().includes(locSearch.toLowerCase())
                                                ).length === 0 && (
                                                    <div className="px-3 py-4 text-center text-slate-400 text-xs font-semibold">
                                                        ไม่พบข้อมูลสาขา
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowUserModal(false)}
                                disabled={isSavingUser}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveUser}
                                disabled={isSavingUser}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingUser ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingCategoryId ? "แก้ไขหมวดหมู่สินค้า" : "เพิ่มหมวดหมู่สินค้าใหม่"}
                        </h2>

                        {categoryFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {categoryFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อหมวดหมู่ <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({ name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น เครื่องซักผ้า, ทีวี, เครื่องใช้ไฟฟ้า..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                disabled={isSavingCategory}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveCategory}
                                disabled={isSavingCategory}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingCategory ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLocationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingLocationId ? "แก้ไขข้อมูลสาขา" : "เพิ่มสาขาใหม่"}
                        </h2>

                        {locationFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {locationFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสสาขา (ID/Code) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={locationFormData.id}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, id: e.target.value })}
                                    disabled={editingLocationId !== null}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 text-slate-900"
                                    placeholder="เช่น BN, RAMA9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อสาขา <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={locationFormData.name}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น บางนา, พระราม 9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อย่อ (Short Name)</label>
                                <input
                                    type="text"
                                    value={locationFormData.short_name}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, short_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น BN"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสย่อ (Code)</label>
                                <input
                                    type="text"
                                    value={locationFormData.code}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น 1001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Business Unit / Workspace (BU Prefix)</label>
                                <select
                                    value={locationFormData.bu}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, bu: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-semibold"
                                >
                                    <option value="">-- อัตโนมัติ (Auto-detect) --</option>
                                    <option value="TW">TW (ไทวัสดุ / Thaiwatsadu)</option>
                                    <option value="A1">A1 (Auto1 / Auto 1)</option>
                                    <option value="BB">BB (Baan & Beyond / BNB)</option>
                                    <option value="GW">GW (Go Wow)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">สถานะ</label>
                                <select
                                    value={locationFormData.status}
                                    onChange={(e) => setLocationFormData({ ...locationFormData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLocationModal(false)}
                                disabled={isSavingLocation}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveLocation}
                                disabled={isSavingLocation}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingLocation ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showVendorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingVendorId ? "แก้ไขข้อมูลผู้รับเหมา" : "เพิ่มผู้รับเหมาใหม่"}
                        </h2>

                        {vendorFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {vendorFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผู้รับเหมา (Vendor No) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={vendorFormData.vendor_no}
                                    onChange={(e) => setVendorFormData({ ...vendorFormData, vendor_no: e.target.value })}
                                    disabled={editingVendorId !== null}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 text-slate-900"
                                    placeholder="เช่น 100201"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อผู้รับเหมา <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={vendorFormData.vendor_name}
                                    onChange={(e) => setVendorFormData({ ...vendorFormData, vendor_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น บจก. เทคโน แอดวานซ์"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมลผู้รับเหมา <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={vendorFormData.vendor_email}
                                    onChange={(e) => setVendorFormData({ ...vendorFormData, vendor_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น contact@vendor.com"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowVendorModal(false)}
                                disabled={isSavingVendor}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveVendor}
                                disabled={isSavingVendor}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingVendor ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingProductSku ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
                        </h2>

                        {productFormError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                                {productFormError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสสินค้า (SKU) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={productFormData.sku}
                                        onChange={(e) => setProductFormData({ ...productFormData, sku: e.target.value })}
                                        disabled={editingProductSku !== null}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 text-slate-900"
                                        placeholder="เช่น 12345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสบาร์โค้ด (SBC/Barcode)</label>
                                    <input
                                        type="text"
                                        value={productFormData.sbc}
                                        onChange={(e) => setProductFormData({ ...productFormData, sbc: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                        placeholder="เช่น 8851234567890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={productFormData.sku_name}
                                    onChange={(e) => setProductFormData({ ...productFormData, sku_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                    placeholder="เช่น หม้อหุงข้าวไฟฟ้า 1.8 ลิตร"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">ยี่ห้อ (Brand) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={productFormData.brand}
                                        onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                        placeholder="เช่น Sharp, Toshiba"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">รุ่น (Model)</label>
                                    <input
                                        type="text"
                                        value={productFormData.model}
                                        onChange={(e) => setProductFormData({ ...productFormData, model: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                        placeholder="เช่น KS-18E"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">หมวดหมู่สินค้า (Category)</label>
                                <select
                                    value={productFormData.class_name}
                                    onChange={(e) => setProductFormData({ ...productFormData, class_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-medium"
                                >
                                    <option value="">-- เลือกหมวดหมู่ --</option>
                                    {categoriesList.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                    <option value="General">General</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">ต้นทุน (Cost)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.sku_cost}
                                        onChange={(e) => setProductFormData({ ...productFormData, sku_cost: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">ราคาขาย (Price)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productFormData.sku_price}
                                        onChange={(e) => setProductFormData({ ...productFormData, sku_price: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผู้รับเหมา (Vendor No)</label>
                                    <select
                                        value={productFormData.vendor_no}
                                        onChange={(e) => {
                                            const vNo = e.target.value;
                                            const vName = vendorRows.find(v => String(v.vendor_no) === vNo)?.vendor_name || "";
                                            setProductFormData({ ...productFormData, vendor_no: vNo, vendor_name: vName });
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900 font-medium"
                                    >
                                        <option value="">-- เลือกผู้รับเหมา --</option>
                                        {vendorRows.map(v => (
                                            <option key={v.id} value={String(v.vendor_no)}>{v.vendor_no} - {v.vendor_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อผู้รับเหมา (Vendor Name)</label>
                                    <input
                                        type="text"
                                        value={productFormData.vendor_name}
                                        onChange={(e) => setProductFormData({ ...productFormData, vendor_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-100 text-slate-900"
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowProductModal(false)}
                                disabled={isSavingProduct}
                                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50 transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                disabled={isSavingProduct}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 transition shadow"
                            >
                                {isSavingProduct ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
