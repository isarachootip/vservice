const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

async function main() {
  const storeGpsPath = "C:\\Users\\isara\\Downloads\\StoreGPS.xlsx";
  const storeChgPath = "C:\\Users\\isara\\Downloads\\store_CHG.xlsx";

  console.log("=== Reading store_CHG.xlsx (259 rows) ===");
  const wbChg = XLSX.readFile(storeChgPath);
  const rowsChg = XLSX.utils.sheet_to_json(wbChg.Sheets[wbChg.SheetNames[0]]);

  console.log("=== Reading StoreGPS.xlsx (95 rows) ===");
  const wbGps = XLSX.readFile(storeGpsPath);
  const rowsGps = XLSX.utils.sheet_to_json(wbGps.Sheets[wbGps.SheetNames[0]]);

  // Map to hold location & store objects keyed by store_code
  const locationsMap = new Map();
  const storesMap = new Map();

  // 1. Process store_CHG.xlsx
  for (const r of rowsChg) {
    const storeCode = String(r.store_code || "").trim();
    const nameTH = String(r.store_name_th || "").trim();
    const nameEN = String(r.store_name_en || "").trim();
    const formalName = String(r.formal_name_th || nameTH).trim();
    const formalAddr = String(r.formal_address_th || "").trim();
    const bu = String(r.in_bu || "TW").trim();
    const nick3 = String(r.store_nick3 || "TW1").trim();
    const storeCodeOracle = String(r.store_code_oracle || storeCode).trim();

    if (!storeCode || !nameTH) continue;

    locationsMap.set(storeCode, {
      id: storeCode,
      name: nameTH,
      short_name: nameEN || nick3,
      code: storeCode,
      status: "active",
      bu: bu,
    });

    const storeIdInt = parseInt(storeCode, 10) || Math.floor(Math.random() * 90000) + 10000;
    storesMap.set(storeCode, {
      store_id: storeIdInt,
      store_code: storeCode,
      store_code_oracle: storeCodeOracle.substring(0, 10),
      store_name_th: nameTH.substring(0, 30),
      store_name_en: nameEN.substring(0, 40),
      store_nick3: nick3.substring(0, 3),
      store_nick2: nick3.substring(0, 2),
      store_nick_opn: "OPN",
      store_nick_acc: "ACC",
      store_nick_mms: "MMS",
      formal_name_th: formalName.substring(0, 150),
      formal_address_th: formalAddr.substring(0, 200),
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
      in_bu: bu.substring(0, 5),
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
    });
  }

  // 2. Process StoreGPS.xlsx (enriching name and short_name)
  for (const r of rowsGps) {
    const storeNo = String(r.STORE || r.STCODE || "").trim();
    const stCode = String(r.STCODE || "").trim();
    const nameTH = String(r.SnameTH || r.SName || "").trim();
    const nameEN = String(r.SName || "").trim();
    const formalName = String(r.STTNAME || nameTH).trim();
    const address = String(r.THADDRESS || "").trim();
    const bu = String(r.STOREGROUP || "TW").trim();

    if (!storeNo || !nameTH) continue;

    const locationName = nameTH.startsWith("สาขา") || nameTH.startsWith("ไทวัสดุ") ? nameTH : `ไทวัสดุ ${nameTH}`;

    locationsMap.set(storeNo, {
      id: storeNo,
      name: locationName,
      short_name: nameEN,
      code: stCode,
      status: "active",
      bu: bu,
    });

    const storeIdInt = parseInt(storeNo, 10) || Math.floor(Math.random() * 90000) + 10000;
    const nick3 = nameEN.substring(0, 3).toUpperCase();

    const existingStore = storesMap.get(storeNo);
    if (existingStore) {
      existingStore.store_name_th = nameTH.substring(0, 30);
      existingStore.store_name_en = nameEN.substring(0, 40);
      existingStore.formal_name_th = formalName.substring(0, 150);
      existingStore.formal_address_th = address.substring(0, 200);
      existingStore.in_bu = bu.substring(0, 5);
    } else {
      storesMap.set(storeNo, {
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
        in_bu: bu.substring(0, 5),
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
      });
    }
  }

  const locationsList = Array.from(locationsMap.values());
  const storesList = Array.from(storesMap.values());

  console.log(`Prepared ${locationsList.length} unique locations and ${storesList.length} unique stores.`);

  // Clear existing location and store records first for clean import
  await prisma.users.updateMany({ where: { location_id: { not: null } }, data: { location_id: null } });
  await prisma.repair_request.updateMany({ where: { location_id: { not: null } }, data: { location_id: null } });
  await prisma.chat_room.deleteMany({ where: { location_id: { not: null } } });
  await prisma.location.deleteMany({});
  await prisma.store.deleteMany({});

  console.log("Performing bulk insert into location table...");
  await prisma.location.createMany({
    data: locationsList,
    skipDuplicates: true,
  });

  console.log("Performing bulk insert into store table...");
  await prisma.store.createMany({
    data: storesList,
    skipDuplicates: true,
  });

  const finalLocCount = await prisma.location.count();
  const finalStoreCount = await prisma.store.count();

  console.log("\n================ IMPORTS COMPLETED ================");
  console.log("Total Locations in DB:", finalLocCount);
  console.log("Total Stores in DB:", finalStoreCount);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error during import:", err);
  process.exit(1);
});
