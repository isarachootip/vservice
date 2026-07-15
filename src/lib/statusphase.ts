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

export const STATUS_PHASE_MAP: Record<number, Phase> = {

    10: Phase.START,
    11: Phase.START,
    20: Phase.DC,
    30: Phase.VENDOR,

    //! DC
    201: Phase.DC,
    21: Phase.DC_STEP1,
    22: Phase.DC_STEP2,
    23: Phase.REVIEW_PRICE,

    232: Phase.CUST_APPROVE,
    233: Phase.REPORT_APPROVE,
    234: Phase.REJECT_PROCESS,
    235: Phase.APPROVE_PROCESS,
    2360: Phase.DC_RETURN,
    2361: Phase.DC_RETURN,
    236: Phase.VENDOR_RETURN,
    237: Phase.CUSTOMER_RETURN,

    //! Vendor
    31: Phase.REVIEW_PRICE,
    32: Phase.CUST_APPROVE,
    33: Phase.REPORT_APPROVE,
    34: Phase.REJECT_PROCESS,
    35: Phase.APPROVE_PROCESS,
    360: Phase.VENDOR_RETURN,
    361: Phase.VENDOR_RETURN,
    36: Phase.VENDOR_RETURN,
    37: Phase.CUSTOMER_RETURN,

};

export function getPhaseFromStatus(status?: number | null): Phase | null {
    if (!status) return null;
    return STATUS_PHASE_MAP[status] ?? null;
}
