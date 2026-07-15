const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 1. Clean existing records
  await prisma.user_roles_has_permission.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.user_roles.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.repair_item.deleteMany({});
  await prisma.repair_request.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.status_info.deleteMany({});

  console.log("Cleaned database tables.");

  // 2. Create user roles
  await prisma.user_roles.createMany({
    data: [
      { roles_id: 1, roles_name: "CS", created_user: "system", updated_user: "system" },
      { roles_id: 2, roles_name: "GR", created_user: "system", updated_user: "system" },
      { roles_id: 3, roles_name: "DC", created_user: "system", updated_user: "system" },
      { roles_id: 4, roles_name: "ADMIN", created_user: "system", updated_user: "system" },
    ],
  });
  console.log("Seeded user roles.");

  // 3. Create permissions
  await prisma.permission.createMany({
    data: [
      { permission_id: 1, permission_name: "view_request", permission_desc: "ดูรายละเอียดใบแจ้งซ่อม", created_user: "system", updated_user: "system" },
      { permission_id: 2, permission_name: "edit_request", permission_desc: "แก้ไขใบแจ้งซ่อม", created_user: "system", updated_user: "system" },
      { permission_id: 3, permission_name: "create_request", permission_desc: "เปิดใบแจ้งซ่อมใหม่", created_user: "system", updated_user: "system" },
    ],
  });
  console.log("Seeded permissions.");

  // 4. Map permissions to roles
  await prisma.user_roles_has_permission.createMany({
    data: [
      // CS Permissions
      { user_roles_roles_id: 1, permission_id: 1, status: 1, created_user: "system", updated_user: "system" },
      { user_roles_roles_id: 1, permission_id: 2, status: 1, created_user: "system", updated_user: "system" },
      { user_roles_roles_id: 1, permission_id: 3, status: 1, created_user: "system", updated_user: "system" },
      // GR Permissions
      { user_roles_roles_id: 2, permission_id: 1, status: 1, created_user: "system", updated_user: "system" },
      { user_roles_roles_id: 2, permission_id: 2, status: 1, created_user: "system", updated_user: "system" },
      // DC Permissions
      { user_roles_roles_id: 3, permission_id: 1, status: 1, created_user: "system", updated_user: "system" },
      // ADMIN Permissions
      { user_roles_roles_id: 4, permission_id: 1, status: 1, created_user: "system", updated_user: "system" },
      { user_roles_roles_id: 4, permission_id: 2, status: 1, created_user: "system", updated_user: "system" },
      { user_roles_roles_id: 4, permission_id: 3, status: 1, created_user: "system", updated_user: "system" },
    ],
  });
  console.log("Mapped permissions to roles.");

  // 5. Seed stores
  await prisma.store.create({
    data: {
      store_id: 1,
      store_code: "S001",
      store_code_oracle: "S001",
      store_name_th: "สาขาพระราม 9",
      store_name_en: "Rama 9 Branch",
      store_nick3: "RM9",
      store_nick2: "R9",
      store_nick_opn: "RM9",
      store_nick_acc: "RM9",
      store_nick_mms: "RM9",
      formal_name_th: "สาขาพระราม 9 (สำนักงานใหญ่)",
      formal_address_th: "123 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10400",
      store_email: "rama9@company.com",
      mgr_user: "manager_rama9",
      mgr_email: "mgr_rama9@company.com",
      gr_email: "gr_rama9@company.com",
      esc_store_email: "esc_rama9@company.com",
      admin_email: "admin_rama9@company.com",
      cs_email: "cs_rama9@company.com",
      div_sale_12_email: "div_sale@company.com",
      ds_email: "ds@company.com",
      finance_email: "finance@company.com",
      store_location: "BKK",
      store_region: "BKK",
      license_zone: "Z1",
      store_size_sqm: 500.0,
      in_host_store: "N",
      in_bu: "BU1",
      active: 1,
      active_doc: 1,
      district_code: "D1",
      district_lp_code: "LP1",
      district_esc_code: "ESC1",
      esc_user: "esc_user1",
      lpinv_zone: "Z1",
      cct_zone: "Z1",
      claim_zone: "Z1",
      eq_area: "A1",
      fc_area_online: "ONLINE",
      fc_area_offline: "OFFLINE",
      lp_claim_by: "LP1",
      lpc_invest_by: "INV1",
      is_store_active: 1,
      is_for_refund: 1,
      current_guard_company: "GUARD1",
    },
  });
  console.log("Seeded store.");

  // 6. Seed users (password is bcrypt hash of '1234')
  const hashedPassword = await bcrypt.hash("1234", 10);
  await prisma.users.createMany({
    data: [
      {
        user_name: "test_cs",
        user_full_name: "Customer Service User",
        user_email: "test_cs@company.com",
        user_password: hashedPassword,
        roles_id: 1,
        is_active: 1,
        store_code: "S001",
        created_user: "system",
        updated_user: "system"
      },
      {
        user_name: "test_gr",
        user_full_name: "Goods Receive User",
        user_email: "test_gr@company.com",
        user_password: hashedPassword,
        roles_id: 2,
        is_active: 1,
        store_code: "S001",
        created_user: "system",
        updated_user: "system"
      },
      {
        user_name: "test_dc",
        user_full_name: "Distribution Center User",
        user_email: "test_dc@company.com",
        user_password: hashedPassword,
        roles_id: 3,
        is_active: 1,
        store_code: "S001",
        created_user: "system",
        updated_user: "system"
      },
    ],
  });
  console.log("Seeded user accounts.");

  // 7. Seed status info definitions
  const statuses = [
    { status_id: 0, status_name: "ใบแจ้งซ่อมถูกยกเลิก", path_type: "DC", sla_hours: 0 },
    { status_id: 10, status_name: "เปิดใบแจ้งซ่อม", path_type: "DC", sla_hours: 24 },
    { status_id: 11, status_name: "GR รับสินค้าซ่อมจาก CS", path_type: "DC", sla_hours: 24 },
    { status_id: 20, status_name: "ส่ง DC / รอ GR เปิด Log DC", path_type: "DC", sla_hours: 48 },
    { status_id: 201, status_name: "GR เปิด Log DC / รอ DC มารับสินค้า", path_type: "DC", sla_hours: 48 },
    { status_id: 21, status_name: "DC รับสินค้าจากสาขาแล้ว", path_type: "DC", sla_hours: 48 },
    { status_id: 22, status_name: "DC ส่งสินค้าให้ Vendor แล้ว", path_type: "DC", sla_hours: 72 },
    { status_id: 23, status_name: "Vendor เสนอราคากลับมา / รออนุมัติราคา", path_type: "DC", sla_hours: 72 },
    { status_id: 232, status_name: "รอผลการพิจารณาอนุมัติราคาจากลูกค้า", path_type: "DC", sla_hours: 96 },
    { status_id: 233, status_name: "ลูกค้าแจ้งผลอนุมัติงานซ่อมแล้ว", path_type: "DC", sla_hours: 48 },
    { status_id: 234, status_name: "ส่ง DC บันทึกอนุมัติสั่งซ่อม", path_type: "DC", sla_hours: 48 },
    { status_id: 235, status_name: "DC อนุมัติสั่งซ่อม / รอสินค้าซ่อมเสร็จ", path_type: "DC", sla_hours: 120 },
    { status_id: 2360, status_name: "DC ส่งสินค้าซ่อมเสร็จคืนให้ GR แล้ว", path_type: "DC", sla_hours: 48 },
    { status_id: 2361, status_name: "GR ส่งสินค้าซ่อมเสร็จคืนให้ CS แล้ว", path_type: "DC", sla_hours: 48 },
    { status_id: 236, status_name: "CS คืนสินค้าซ่อมเสร็จให้ลูกค้าแล้ว", path_type: "DC", sla_hours: 24 },
    { status_id: 30, status_name: "ส่งตรงไป Vendor / รอ GR รับกลับ", path_type: "VENDOR", sla_hours: 48 },
    { status_id: 31, status_name: "Vendor เสนอราคากลับมา / รออนุมัติ", path_type: "VENDOR", sla_hours: 72 },
    { status_id: 32, status_name: "รอผลพิจารณาอนุมัติราคาจากลูกค้า", path_type: "VENDOR", sla_hours: 96 },
    { status_id: 33, status_name: "ลูกค้าแจ้งผลอนุมัติงานซ่อมเสร็จ", path_type: "VENDOR", sla_hours: 48 },
    { status_id: 34, status_name: "GR รับสินค้าซ่อมเสร็จจาก Vendor", path_type: "VENDOR", sla_hours: 48 },
    { status_id: 35, status_name: "GR ส่งสินค้าซ่อมคืนให้ CS", path_type: "VENDOR", sla_hours: 48 },
    { status_id: 36, status_name: "CS คืนสินค้าให้ลูกค้าแล้ว", path_type: "VENDOR", sla_hours: 24 },
    { status_id: 37, status_name: "เสร็จสมบูรณ์", path_type: "DC", sla_hours: 0 },
  ];

  await prisma.status_info.createMany({
    data: statuses.map(s => ({
      status_id: s.status_id,
      status_name: s.status_name,
      path_type: s.path_type,
      sla_hours: s.sla_hours,
      created_user: "system",
      updated_user: "system"
    })),
  });
  console.log("Seeded status definitions.");

  // 8. Seed sample Repair Requests & Items
  const req1 = await prisma.repair_request.create({
    data: {
      id: 1,
      request_no: "REQ-2026-0001",
      customer_name: "สมชาย ใจดี",
      address: "123/45 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10400",
      phone: "0812345678",
      store_code: "S001",
      status: 10,
      receive_from_user_date: new Date(),
      created_user: "test_cs",
      updated_user: "test_cs",
    }
  });

  await prisma.repair_item.create({
    data: {
      id: 1,
      request_id: req1.id,
      product_type: "เครื่องซักผ้า",
      brand: "LG",
      model: "TurboWash-2026",
      serial_no: "SN-LG-998877",
      qty: 1,
      in_warranty: "Y",
      warranty_no: "WARR-LG-Rama9-001",
      issue: "หน้าจอไฟไม่ติด เครื่องไม่ทำงาน",
      created_user: "test_cs",
      updated_user: "test_cs",
    }
  });

  const req2 = await prisma.repair_request.create({
    data: {
      id: 2,
      request_no: "REQ-2026-0002",
      customer_name: "สมหญิง รักดี",
      address: "99/1 ถนนวิภาวดีรังสิต แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพฯ 10210",
      phone: "0898765432",
      store_code: "S001",
      status: 11,
      receive_from_user_date: new Date(),
      created_user: "test_cs",
      updated_user: "test_cs",
    }
  });

  await prisma.repair_item.create({
    data: {
      id: 2,
      request_id: req2.id,
      product_type: "โทรทัศน์ QLED 55 นิ้ว",
      brand: "Samsung",
      model: "QA55Q60AAKXXT",
      serial_no: "SN-SS-223344",
      qty: 1,
      in_warranty: "N",
      issue: "ภาพลายเป็นเส้นสีเขียวแนวตั้งกลางหน้าจอ",
      created_user: "test_cs",
      updated_user: "test_cs",
    }
  });

  console.log("Seeded sample repair requests and items.");
  console.log("Database seed completed successfully!");
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Database seed failed:", err);
  process.exit(1);
});
