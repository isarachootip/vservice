export type Language = "th" | "en";

export const translations = {
  th: {
    // General / Common
    appName: "ระบบแจ้งซ่อมสินค้า VService",
    systemTitle: "ระบบจัดการงานซ่อม (VService)",
    language: "ภาษา",
    thai: "ไทย",
    english: "English",
    search: "ค้นหา",
    filter: "ตัวกรอง",
    all: "ทั้งหมด",
    save: "บันทึก",
    cancel: "ยกเลิก",
    confirm: "ยืนยัน",
    delete: "ลบ",
    edit: "แก้ไข",
    add: "เพิ่ม",
    create: "สร้าง",
    back: "ย้อนกลับ",
    status: "สถานะ",
    action: "จัดการ",
    view: "ดูรายละเอียด",
    loading: "กำลังโหลด...",
    noData: "ไม่พบข้อมูล",
    active: "เปิดใช้งาน",
    inactive: "ปิดใช้งาน",
    success: "สำเร็จ",
    error: "เกิดข้อผิดพลาด",
    warning: "คำเตือน",
    logout: "ออกจากระบบ",
    user: "ผู้ใช้งาน",
    store: "สาขา",
    date: "วันที่",
    remark: "หมายเหตุ",

    // Navigation / Menu
    menu_dashboard: "หน้าหลัก (Dashboard)",
    menu_create_repair: "รับเครื่อง / สร้างงาน",
    menu_track_status: "ติดตามงานซ่อมทั้งหมด",
    menu_quotations: "ระบบเสนอราคาและอนุมัติ",
    menu_customer_chat: "แชตกับลูกค้า",
    menu_staff_chat: "ห้องสนทนาทีมงาน",
    menu_settings: "ตั้งค่าระบบหลังบ้าน",
    menu_faq: "คำถามที่พบบ่อย (FAQ)",

    // Form / Create Repair
    customer_info: "ข้อมูลลูกค้า",
    first_name: "ชื่อ",
    last_name: "นามสกุล",
    phone: "เบอร์โทรศัพท์",
    same_address: "ที่อยู่จัดส่งเดียวกับที่อยู่ใบเสร็จ",
    shipping_address: "ที่อยู่จัดส่ง / รับเครื่องคืน",
    billing_address: "ที่อยู่ตามใบเสร็จ",
    house_no: "บ้านเลขที่ / อาคาร",
    soi: "ซอย",
    road: "ถนน",
    subdistrict: "ตําบล / แขวง",
    district: "อำเภอ / เขต",
    province: "จังหวัด",
    zipcode: "รหัสไปรษณีย์",

    product_info: "ข้อมูลสินค้าแจ้งซ่อม",
    product_category: "หมวดหมู่สินค้า",
    select_category: "-- เลือกหมวดหมู่สินค้า --",
    brand: "ยี่ห้อ (Brand)",
    model: "รุ่น (Model)",
    serial_no: "หมายเลขเครื่อง (Serial No.)",
    qty: "จำนวน",
    barcode: "บาร์โค้ด (Barcode)",
    sku: "รหัสสินค้า (SKU)",
    in_system: "สินค้าในระบบ",
    not_in_system: "สินค้านอกระบบ",

    warranty_info: "ข้อมูลการรับประกัน",
    in_warranty: "อยู่ในประกัน",
    out_warranty: "นอกประกัน",
    warranty_no: "เลขที่ใบรับประกัน / ใบเสร็จ",
    issue_desc: "อาการเสีย / สาเหตุที่ส่งซ่อม",
    service_tier: "ประเภทบริการ",
    tier_normal: "ปกติ (Normal)",
    tier_express: "เร่งด่วน (Express)",
    tier_vip: "VIP",
    diagnostic_fee: "ค่าเปิดเครื่อง / ค่าตรวจเช็คเบื้องต้น",
    baht: "บาท",

    attachments: "รูปภาพประกอบ (4 ช่อง)",
    example_photo: "💡 ดูตัวอย่าง",
    upload_photo: "คลิกเพื่ออัปโหลด",

    submit_repair: "เปิดใบแจ้งซ่อม",

    // Track Status
    track_title: "รายการใบแจ้งซ่อมทั้งหมด",
    search_placeholder: "ค้นหาด้วย เลขที่ใบงาน, ชื่อลูกค้า, เบอร์โทร, SKU...",

    // Maintenance / Category admin
    maintain_category_title: "จัดการหมวดหมู่สินค้า (Product Category)",
    cat_name_th: "ชื่อหมวดหมู่ (ไทย)",
    cat_name_en: "ชื่อหมวดหมู่ (English)",
    cat_status: "สถานะการใช้งาน",
    add_category: "เพิ่มหมวดหมู่ใหม่",
    edit_category: "แก้ไขหมวดหมู่",

    // Status translations
    status_pending: "รอดำเนินการ",
    status_quoted: "รออนุมัติราคา",
    status_approved: "อนุมัติราคาแล้ว",
    status_rejected: "ปฏิเสธราคา",
    status_in_repair: "กำลังดำเนินการซ่อม",
    status_completed: "ซ่อมเสร็จสิ้น",
    status_returned: "รับเครื่องคืนแล้ว",
    status_cancelled: "ยกเลิกใบงาน",
  },
  en: {
    // General / Common
    appName: "VService Repair System",
    systemTitle: "Repair Management System (VService)",
    language: "Language",
    thai: "ไทย",
    english: "English",
    search: "Search",
    filter: "Filter",
    all: "All",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    back: "Back",
    status: "Status",
    action: "Action",
    view: "View Details",
    loading: "Loading...",
    noData: "No data found",
    active: "Active",
    inactive: "Inactive",
    success: "Success",
    error: "An error occurred",
    warning: "Warning",
    logout: "Log Out",
    user: "User",
    store: "Store / Branch",
    date: "Date",
    remark: "Remark",

    // Navigation / Menu
    menu_dashboard: "Dashboard",
    menu_create_repair: "Create Repair Request",
    menu_track_status: "Track Repair Status",
    menu_quotations: "Quotations & Approval",
    menu_customer_chat: "Customer LINE Chat",
    menu_staff_chat: "Staff Chat",
    menu_settings: "Admin Settings",
    menu_faq: "FAQ",

    // Form / Create Repair
    customer_info: "Customer Information",
    first_name: "First Name",
    last_name: "Last Name",
    phone: "Phone Number",
    same_address: "Shipping address same as billing address",
    shipping_address: "Shipping / Return Address",
    billing_address: "Billing Address",
    house_no: "House No. / Building",
    soi: "Soi / Alley",
    road: "Road",
    subdistrict: "Subdistrict",
    district: "District",
    province: "Province",
    zipcode: "Zipcode",

    product_info: "Product Repair Information",
    product_category: "Product Category",
    select_category: "-- Select Product Category --",
    brand: "Brand",
    model: "Model",
    serial_no: "Serial Number (S/N)",
    qty: "Quantity",
    barcode: "Barcode",
    sku: "SKU Code",
    in_system: "In-System Product",
    not_in_system: "Out-of-System Product",

    warranty_info: "Warranty Information",
    in_warranty: "In Warranty",
    out_warranty: "Out of Warranty",
    warranty_no: "Warranty / Receipt No.",
    issue_desc: "Issue / Symptom Description",
    service_tier: "Service Tier",
    tier_normal: "Normal",
    tier_express: "Express",
    tier_vip: "VIP",
    diagnostic_fee: "Diagnostic Fee",
    baht: "THB",

    attachments: "Photo Attachments (4 slots)",
    example_photo: "💡 Sample",
    upload_photo: "Click to upload",

    submit_repair: "Submit Repair Ticket",

    // Track Status
    track_title: "All Repair Tickets",
    search_placeholder: "Search by Ticket No, Customer Name, Phone, SKU...",

    // Maintenance / Category admin
    maintain_category_title: "Product Category Management",
    cat_name_th: "Category Name (Thai)",
    cat_name_en: "Category Name (English)",
    cat_status: "Active Status",
    add_category: "Add New Category",
    edit_category: "Edit Category",

    // Status translations
    status_pending: "Pending",
    status_quoted: "Awaiting Price Approval",
    status_approved: "Price Approved",
    status_rejected: "Price Rejected",
    status_in_repair: "In Repair Process",
    status_completed: "Repair Completed",
    status_returned: "Returned to Customer",
    status_cancelled: "Ticket Cancelled",
  },
};

export function getTranslation(key: keyof typeof translations.th, lang: Language = "th"): string {
  const dict = translations[lang] || translations.th;
  return dict[key] || translations.th[key] || String(key);
}

export function getLocalizedName(
  item: { name?: string | null; name_th?: string | null; name_en?: string | null },
  lang: Language = "th"
): string {
  if (!item) return "";
  if (lang === "en") {
    return item.name_en || item.name || item.name_th || "";
  }
  return item.name_th || item.name || item.name_en || "";
}
