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
    const [tab, setTab] = useState<"status" | "vendor" | "user" | "location">("status");

    //* Location Info state
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationSearchQ, setLocationSearchQ] = useState("");
    const [locationFileInputRef, setLocationFileInputRef] = useState<HTMLInputElement | null>(null);
    const [locationsList, setLocationsList] = useState<any[]>([]);

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

    //* User & Access Info state
    const [usersRows, setUsersRows] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userSearchQ, setUserSearchQ] = useState("");

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
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Status Info
                    </button>
                    <button
                        onClick={() => setTab("vendor")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "vendor"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Vendor Info
                    </button>
                    <button
                        onClick={() => setTab("user")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "user"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        User & Access Info
                    </button>
                    <button
                        onClick={() => setTab("location")}
                        className={`pb-3 px-2 font-medium transition ${
                            tab === "location"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Location Info
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
                                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
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
                            <h2 className="text-xl font-semibold text-slate-900">Vendor Info</h2>
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
                                className="flex-1 min-w-64 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900">No.</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900">Vendor Name</th>
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredVendorRows.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูล
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredVendorRows.map((row, idx) => (
                                                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-slate-900 text-center">{idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.vendor_name}</td>
                                                    <td className="px-6 py-4 text-slate-700">{row.vendor_email}</td>
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
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow transition text-sm disabled:opacity-50"
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
                                            <th className="text-center px-6 py-3 font-semibold text-slate-900 w-24">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {locationLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                                                    กำลังโหลดข้อมูล...
                                                </td>
                                            </tr>
                                        ) : locationsList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                                                    ไม่พบข้อมูลสาขา (กรุณานำเข้าไฟล์ Excel/JSON เพื่อเริ่มต้น)
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
                                                        <td className="px-6 py-4 text-slate-700 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                row.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                                                            }`}>
                                                                {row.status || "active"}
                                                            </span>
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
            </div>

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
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SLA (วัน)</label>
                                <input
                                    type="number"
                                    value={formData.sla}
                                    onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <select
                                    value={userFormData.locationId}
                                    onChange={(e) => setUserFormData({ ...userFormData, locationId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {locationsList.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} ({loc.id})
                                        </option>
                                    ))}
                                </select>
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
        </main>
    );
}
