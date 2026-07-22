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

    // DC ตีกลับ: status=220, reject_flg=Y → GR task
    if (status === 220 && reject_flg === "Y" && reject_from_status && status === Number(reject_from_status)) {
        return `/request/product-rej-dc-to-gr/${id}`;
    }

    if (status === 110 && reject_flg === "Y" && reject_from_status && status === Number(reject_from_status)) {
        return `/request/change-status/${id}`;
    }
   
    switch (status) {
        // --- Common ---
        case 100:
        return `/request/product-cs-to-gr/${id}`;
        case 110:
        return `/request/change-status/${id}`;

        // --- DC Path ---
        case 200:
        return `/request/gr-log-to-dc/${id}`;
        case 210:
        return `/request/dc-detail/${id}`;
        case 220:
        return `/request/dc-detail-ext/${id}`;
        case 230:
        return `/request/dc-to-vendor/${id}`;
        case 240:
        return `/quotation/add/${id}`;
        case 250:
        return `/quotation/user-approve/${id}`;
        case 260:
        return `/quotation/vendor-report/${id}`;
        case 270:
        case 275:
        return `/request/product-vendor-to-dc-return/${id}`;
        case 280:
        return `/request/product-dc-return/${id}`;
        case 285:
        return `/request/product-gr-to-cs-return/${id}`;
        case 290:
        return `/request/product-customer-return/${id}`;

        // --- Vendor Path ---
        case 300:
        return `/request/vendor-detail/${id}`;
        case 310:
        return `/quotation/add/${id}`;
        case 320:
        return `/quotation/user-approve/${id}`;
        case 330:
        return `/quotation/vendor-report/${id}`;
        case 340:
        case 345:
        return `/request/product-vendor-return/${id}`;
        case 350:
        return `/request/product-dc-return/${id}`;
        case 360:
        return `/request/product-gr-to-cs-return/${id}`;
        case 390:
        return `/request/product-customer-return/${id}`;

        default:
        return `/request/view/${id}`;
    }
};

export const labelFor = (row: RepairRow) => {
    if (row.status === 100 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return "ดำเนินการ";
    }
    if (row.status === 110 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return "ดำเนินการ";
    }
    if (row.status === 0) return "ยกเลิกใบแจ้งซ่อม";
    return "ดำเนินการ";
};

// roleActionMap ตาม SRS v2.1 หัวข้อ 2
export const roleActionMap: Record<Role, number[]> = {
    CS:  [100, 240, 250, 260, 285, 290, 310, 320, 330, 360, 390],
    GR:  [110, 200, 210, 280, 300, 340, 345, 350],
    DC:  [220, 230, 270, 275],
    ADMIN_GR: [110, 200, 210, 280, 300, 340, 345, 350],
    ADMIN_DC: [100, 240, 250, 260, 285, 290, 310, 320, 330, 360, 390],
    ADMIN: [100, 110,
        200, 210, 220, 230, 240, 250, 260, 270, 275, 280, 285, 290, 299,
        300, 310, 320, 330, 340, 345, 350, 360, 390, 399],
};

export const canHandle = (role: Role, row: RepairRow) => {
    const list = roleActionMap[role] ?? [];

    //* ถ้า status=220 และ reject_flg="Y" → ให้ GR จัดการ (DC ตีกลับ)
    if (row.status === 220 && row.reject_flg === "Y" && row.status === Number(row.reject_from_status)) {
        return role === "GR" || role === "ADMIN" || role === "ADMIN_GR";
    }

    return list.includes(row.status);
};

export const statusText = (row: RepairRow, lang: "th" | "en" = "th") => {
    if (row.status === 220 
        && row.reject_flg === "Y"
        && (row.reject_from_status === "220" || row.reject_from_status === "230")){
        return lang === "en" ? "DC returned product to store" : "DC ตีกลับสินค้าคืนสาขา";
    }

    if (row.status === 110 
        && row.reject_flg === "Y"
        && (row.reject_from_status === "220" || row.reject_from_status === "230")){
        return lang === "en" ? "GR received returned product from DC" : "GR บันทึกรับสินค้าคืนจาก DC";
    }

    if (lang === "en") {
        switch (row.status) {
            case 0:   return "Ticket Cancelled";
            case 100: return "Create Ticket / Submit for Repair";
            case 110: return "GR Received Item from CS";
            case 200: return "GR Opened DC Log";
            case 210: return "Awaiting DC Pickup";
            case 220: return "DC Received Item from Branch";
            case 230: return "DC Awaiting Vendor Pickup";
            case 240: return "Awaiting Vendor Quotation";
            case 250: return "Awaiting Customer Price Approval";
            case 260: return "Notified Approval Result";
            case 270: return "Awaiting Vendor Return (Unrepaired)";
            case 275: return "Awaiting Vendor Return (Repaired)";
            case 280: return "DC Received Return from Vendor";
            case 285: return "GR Received Return from DC";
            case 290: return "CS Received Return / Awaiting Customer Pickup";
            case 299: return "Customer Picked Up Item";

            case 300: return "Awaiting Vendor Pickup";
            case 310: return "Awaiting Vendor Quotation";
            case 320: return "Awaiting Customer Price Approval";
            case 330: return "Notified Approval Result";
            case 340: return "Awaiting Vendor Return (Unrepaired)";
            case 345: return "Awaiting Vendor Return (Repaired)";
            case 350: return "Vendor Returned via DC";
            case 360: return "GR Received Return from Vendor/DC";
            case 390: return "CS Received Return / Awaiting Customer Pickup";
            case 399: return "Customer Picked Up Item";

            default: return "-";
        }
    }

    switch (row.status) {
        // --- Common ---
        case 0:   return "ใบแจ้งซ่อมถูกยกเลิก"; // status 0 = 000 (cancelled)
        case 100: return "เปิดใบแจ้งซ่อม / ส่งซ่อม";
        case 110: return "GR รับสินค้าซ่อมจาก CS";

        // --- DC Path ---
        case 200: return "GR เปิด log DC";
        case 210: return "รอ DC มารับสินค้า";
        case 220: return "DC รับสินค้าจากสาขาแล้ว";
        case 230: return "DC รอ Vendor มารับสินค้า";
        case 240: return "รอ Vendor ตีราคา";
        case 250: return "ขออนุมัติราคาจากลูกค้า";
        case 260: return "แจ้งผลการอนุมัติ";
        case 270: return "รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)";
        case 275: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
        case 280: return "DC รับสินค้าคืนจาก Vendor แล้ว";
        case 285: return "GR รับสินค้าคืนจาก DC แล้ว";
        case 290: return "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน";
        case 299: return "ลูกค้ารับสินค้าแล้ว";

        // --- Vendor Path ---
        case 300: return "รอ Vendor มารับสินค้า";
        case 310: return "รอ Vendor ตีราคา";
        case 320: return "ขออนุมัติราคาจากลูกค้า";
        case 330: return "แจ้งผลการอนุมัติ";
        case 340: return "รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)";
        case 345: return "รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ";
        case 350: return "Vendor คืนผ่าน DC แทนสาขา (DC รอส่งเข้าสาขา)";
        case 360: return "GR รับสินค้าคืนจาก Vendor / DC แล้ว";
        case 390: return "CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน";
        case 399: return "ลูกค้ารับสินค้าแล้ว";

        default: return "-";
    }
};
