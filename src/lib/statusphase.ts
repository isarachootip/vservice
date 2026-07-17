export enum Phase {
    START = "เปิดใบแจ้งซ่อม",
    DC = "ส่ง DC",
    DC_STEP1 = "รับสินค้าซ่อมจากสาขาแล้ว",
    DC_STEP2 = "รอ Vendor มารับสินค้า",
    VENDOR = "ส่ง VENDOR",
    REVIEW_PRICE = "VENDOR ตีราคาค่าซ่อม",
    QUOTATION_START = "เปิดใบเสนอราคา",
    CUST_APPROVE = "ขออนุมัติราคาจากลูกค้า",
    REPORT_APPROVE = "แจ้งผลการอนุมัติ",
    APPROVE_PROCESS = "ส่งคืนสินค้า(ไม่ซ่อม)",
    REJECT_PROCESS = "ส่งคืนสินค้า(ซ่อม)",
    DC_RETURN = "DC ส่งสินค้าคืน",
    VENDOR_RETURN = "VENDOR ส่งสินค้าคืน",
    CUSTOMER_RETURN = "CUSTOMER ได้รับสินค้า",
}

// STATUS_PHASE_MAP ใช้รหัสมาตรฐานใหม่ 3 หลัก (SRS v2.1)
export const STATUS_PHASE_MAP: Record<number, Phase> = {

    100: Phase.START,
    110: Phase.START,
    200: Phase.DC,
    300: Phase.VENDOR,

    //! DC Path
    210: Phase.DC,
    220: Phase.DC_STEP1,
    230: Phase.DC_STEP2,
    240: Phase.REVIEW_PRICE,

    250: Phase.CUST_APPROVE,
    260: Phase.REPORT_APPROVE,
    270: Phase.REJECT_PROCESS,
    275: Phase.APPROVE_PROCESS,
    280: Phase.DC_RETURN,
    285: Phase.DC_RETURN,
    290: Phase.VENDOR_RETURN,
    299: Phase.CUSTOMER_RETURN,

    //! Vendor Path
    310: Phase.REVIEW_PRICE,
    320: Phase.CUST_APPROVE,
    330: Phase.REPORT_APPROVE,
    340: Phase.REJECT_PROCESS,
    345: Phase.APPROVE_PROCESS,
    350: Phase.VENDOR_RETURN,
    360: Phase.VENDOR_RETURN,
    390: Phase.VENDOR_RETURN,
    399: Phase.CUSTOMER_RETURN,

};

export function getPhaseFromStatus(status?: number | null): Phase | null {
    if (!status) return null;
    return STATUS_PHASE_MAP[status] ?? null;
}
