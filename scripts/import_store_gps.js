const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const path = "C:\\Users\\isara\\Downloads\\StoreGPS.xlsx";

const prisma = new PrismaClient();

async function main() {
  const wb = XLSX.readFile(path);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Total rows in StoreGPS.xlsx (${sheetName}):`, rows.length);

  let successCount = 0;
  for (const r of rows) {
    const storeNo = String(r.STORE || r.STCODE || "").trim();
    const stCode = String(r.STCODE || "").trim();
    const nameTH = String(r.SnameTH || r.SName || "").trim();
    const nameEN = String(r.SName || "").trim();
    const formalName = String(r.STTNAME || nameTH).trim();
    const address = String(r.THADDRESS || "").trim();
    const bu = String(r.STOREGROUP || "").trim();

    if (!storeNo || !nameTH) {
      console.warn("Skipping row with missing ID/Name:", r);
      continue;
    }

    // Prepare location data
    // Format location name gracefully e.g. "ไทวัสดุ ภูเก็ต เฟสติวัล" or "TW ภูเก็ต เฟสติวัล"
    const locationName = nameTH.startsWith("สาขา") ? nameTH : `ไทวัสดุ ${nameTH}`;

    await prisma.location.upsert({
      where: { id: storeNo },
      update: {
        name: locationName,
        short_name: nameEN,
        code: stCode,
        status: "active",
        bu: bu || "TW",
        updated_at: new Date(),
      },
      create: {
        id: storeNo,
        name: locationName,
        short_name: nameEN,
        code: stCode,
        status: "active",
        bu: bu || "TW",
      },
    });

    // Also populate store table if needed
    const storeIdInt = parseInt(storeNo, 10) || Math.floor(Math.random() * 90000) + 10000;
    const nick3 = nameEN.substring(0, 3).toUpperCase();
    
    await prisma.store.upsert({
      where: { store_code: storeNo },
      update: {
        store_name_th: nameTH.substring(0, 30),
        store_name_en: nameEN.substring(0, 40),
        formal_name_th: formalName.substring(0, 150),
        formal_address_th: address.substring(0, 200),
      },
      create: {
        store_id: storeIdInt,
        store_code: storeNo,
        store_code_oracle: storeNo,
        store_name_th: nameTH.substring(0, 30),
        store_name_en: nameEN.substring(0, 40),
        store_nick3: nick3.length === 3 ? nick3 : "TW1",
        store_nick2: nick3.substring(0, 2),
        store_nick_opn: "OPN",
        store_nick_acc: "ACC",
        store_nick_mms: "MMS",
        formal_name_th: formalName.substring(0, 150),
        formal_address_th: address.substring(0, 200),
        store_email: "store@thaiwatsadu.com",
        mgr_user: "mgr",
        mgr_email: "mgr@thaiwatsadu.com",
        gr_email: "gr@thaiwatsadu.com",
        esc_store_email: "esc@thaiwatsadu.com",
        admin_email: "admin@thaiwatsadu.com",
        cs_email: "cs@thaiwatsadu.com",
        div_sale_12_email: "div@thaiwatsadu.com",
        ds_email: "ds@thaiwatsadu.com",
        finance_email: "finance@thaiwatsadu.com",
        store_location: "BKK",
        store_region: "CEN",
        license_zone: "Z1",
        store_size_sqm: 1000.0,
        in_host_store: "HOST",
        in_bu: bu || "TW",
        active: 1,
        active_doc: 1,
        district_code: "D1",
        district_lp_code: "DLP1",
        district_esc_code: "DESC1",
        esc_user: "esc",
        lpinv_zone: "LP1",
        cct_zone: "CCT1",
        claim_zone: "CLM1",
        eq_area: "EQ1",
        fc_area_online: "ONLINE",
        fc_area_offline: "OFFLINE",
        lp_claim_by: "LP",
        lpc_invest_by: "LPC",
        is_store_active: 1,
        is_for_refund: 1,
        current_guard_company: "GUARD",
      },
    });

    successCount++;
  }

  console.log(`Successfully imported ${successCount} location & store records!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error importing StoreGPS:", err);
  process.exit(1);
});
