export type Role = "CS" | "GR" | "DC" | "ADMIN" | "ADMIN_GR" | "ADMIN_DC";

export type RepairRow = {
    id: number | string;
    status: number;
    reject_flg?: string | null;
    reject_from_status?: string | null;
};

export const getActionStatus = (row: RepairRow) => {
    return row.status;
};

export const optionRoute = (row: RepairRow) => {
    const { id, status, reject_flg, reject_from_status } = row;

    if (status === 21 && reject_flg === "Y" && reject_from_status && status === Number(reject_from_status)) {
        return `/request/product-rej-dc-to-gr/${id}`;
    }

    if (status === 11 && reject_flg === "Y" && reject_from_status && status === Number(reject_from_status)) {
        return `/request/change-status/${id}`;
    }
   
    switch (status) {
        case 10:
        return `/request/product-cs-to-gr/${id}`;
        case 11:
        return `/request/change-status/${id}`;
        case 20:
        return `/request/gr-log-to-dc/${id}`;
        case 201:
        return `/request/dc-detail/${id}`;
        case 21:
        return `/request/dc-detail-ext/${id}`;
        case 22:
        return `/request/dc-to-vendor/${id}`;
        case 23:
        return `/quotation/add/${id}`;
        case 232:
        return `/quotation/user-approve/${id}`;
        case 233:
        return `/quotation/vendor-report/${id}`;
        case 234:
        case 235:
        return `/request/product-vendor-to-dc-return/${id}`;
        case 2360:
        return `/request/product-dc-return/${id}`;
        case 2361:
        return `/request/product-gr-to-cs-return/${id}`;
        case 236:
        return `/request/product-customer-return/${id}`;
        case 30:
        return `/request/vendor-detail/${id}`;
        case 31:
        return `/quotation/add/${id}`;
        case 32:
        return `/quotation/user-approve/${id}`;
        case 33:
        return `/quotation/vendor-report/${id}`;
        case 34:
        case 35:
        return `/request/product-vendor-return/${id}`;
        case 360:
        return `/request/product-dc-return/${id}`;
        case 361:
        return `/request/product-gr-to-cs-return/${id}`;
        case 36:
        return `/request/product-customer-return/${id}`;
        default:
        return `/request/view/${id}`;
    }
};

export const labelFor = (row: RepairRow) => {
    if (row.status === 10 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return "ดำเนินการ";
    }
    if (row.status === 11 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return "ดำเนินการ";
    }
    if (row.status === 0) return "ยกเลิกใบแจ้งซ่อม";
    return "ดำเนินการ";
};

export const roleActionMap: Record<Role, number[]> = {
    CS: [10, 23, 232, 233, 2361, 236, 31, 32, 33, 36, 361],
    GR: [11, 20, 201, 2360, 30, 34, 35, 360],
    DC: [21, 22, 234, 235],
    ADMIN_GR: [11, 20, 201, 2360, 30, 34, 35, 360],
    ADMIN_DC: [10, 23, 232, 233, 236, 31, 32, 33, 36],
    ADMIN: [10, 11, 
        20, 201, 21, 22, 23, 232, 233, 234, 235, 2360, 2361, 236, 237,
        30, 31, 32, 33, 34, 35, 360, 361, 36, 37],
};

export const canHandle = (role: Role, row: RepairRow) => {
    const list = roleActionMap[role] ?? [];

    //* If status is 21 and reject_flg is "Y", it's a GR task
    if (row.status === 21 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return role === "GR" || role === "ADMIN" || role === "ADMIN_GR";
    }

    // return list.includes(row.status);
    return list.includes(row.status);
};

export const statusText = (row: RepairRow) => {

    if (row.status === 21 
        && row.reject_flg === "Y"
        && (row.reject_from_status === "21" || row.reject_from_status === "22")){
        return "DC ตีกลับสินค้าคืนสาขา";
    }

    if (row.status === 11 
        && row.reject_flg === "Y"
        && (row.reject_from_status === "21" || row.reject_from_status === "22")){
        return "GR บันทึกรับสินค้าคืนจาก DC";
    }

    switch (row.status) {
        case 10: return "ส่งซ่อม";
        case 11: return "GR รับสินค้าซ่อมจาก CS";
        case 20: return "GR เปิด log DC";
        case 201: return "รอ DC มารับสินค้า";
        case 21: return "DC รับสินค้าจากสาขาแล้ว";
        case 22: return "DC รอ Vendor มารับสินค้า";
        case 23: return "DC รอ Vendor ตีราคา";
        case 232: return "ขออนุมัติราคาจากลูกค้า";
        case 233: return "แจ้งผลการอนุมัติ";
        case 234: return "รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)";
        case 235: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
        case 2360: return "DC รับสินค้าคืนจาก Vendor แล้ว";
        case 2361: return "GR รับสินค้าคืนจาก DC แล้ว";
        case 236: return "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน";
        case 237: return "ลูกค้ารับสินค้าแล้ว";
        case 30: return "รอ Vendor มารับสินค้า";
        case 31: return "รอ Vendor ตีราคา";
        case 32: return "ขออนุมัติราคาจากลูกค้า";
        case 33: return "แจ้งผลการอนุมัติ";
        case 34: return "รอ Vendor ส่งคืนสินค้า(ไม่อนุมัติซ่อม)";
        case 35: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
        case 360: return "DC รอส่งสินค้าเข้าสาขา";
        case 361: return "GR รับสินค้าคืนจาก Vendor / DC แล้ว";
        case 36: return "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน";
        case 37: return "ลูกค้ารับสินค้าแล้ว";
        case 0: return "ใบแจ้งซ่อมถูกยกเลิก";
        default: return "-";
    }
};
