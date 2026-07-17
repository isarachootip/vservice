-- =============================================================================
-- Status Code Migration Script
-- SRS v2.1: รหัสสถานะใหม่ 3 หลัก
-- วันที่: 17/07/2026
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!
-- =============================================================================

BEGIN;

-- =============================================================================
-- Step 1: เพิ่ม column legacy_code ใน status_info (เพื่อ reference เดิม)
-- =============================================================================
ALTER TABLE status_info
  ADD COLUMN IF NOT EXISTS legacy_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- =============================================================================
-- Step 2: Update status ใน repair_request
-- ต้องเริ่มจากรหัสที่ใหญ่ที่สุดก่อน เพื่อหลีกเลี่ยง collision
-- =============================================================================

-- 4-digit codes first
UPDATE repair_request SET status = 285 WHERE status = 2361;
UPDATE repair_request SET status = 280 WHERE status = 2360;

-- DC Path (เรียงจากปลายมาต้น)
UPDATE repair_request SET status = 299 WHERE status = 237;
UPDATE repair_request SET status = 290 WHERE status = 236;
UPDATE repair_request SET status = 275 WHERE status = 235;
UPDATE repair_request SET status = 270 WHERE status = 234;
UPDATE repair_request SET status = 260 WHERE status = 233;
UPDATE repair_request SET status = 250 WHERE status = 232;
UPDATE repair_request SET status = 240 WHERE status = 23;
UPDATE repair_request SET status = 230 WHERE status = 22;
UPDATE repair_request SET status = 220 WHERE status = 21;
UPDATE repair_request SET status = 210 WHERE status = 201;
UPDATE repair_request SET status = 200 WHERE status = 20;

-- Vendor Path (เรียงจากปลายมาต้น)
UPDATE repair_request SET status = 399 WHERE status = 37;
UPDATE repair_request SET status = 390 WHERE status = 36;
UPDATE repair_request SET status = 360 WHERE status = 361;
UPDATE repair_request SET status = 350 WHERE status = 360;  -- ต้องทำก่อน 360→361 ถ้ายังมีอยู่
UPDATE repair_request SET status = 345 WHERE status = 35;
UPDATE repair_request SET status = 340 WHERE status = 34;
UPDATE repair_request SET status = 330 WHERE status = 33;
UPDATE repair_request SET status = 320 WHERE status = 32;
UPDATE repair_request SET status = 310 WHERE status = 31;
UPDATE repair_request SET status = 300 WHERE status = 30;

-- Common (เรียงจากปลายมาต้น)
UPDATE repair_request SET status = 110 WHERE status = 11;
UPDATE repair_request SET status = 100 WHERE status = 10;

-- Cancel status
UPDATE repair_request SET status = 0 WHERE status = 0;  -- ไม่เปลี่ยน (0 = cancelled)

-- =============================================================================
-- Step 3: Update reject_from_status ใน repair_request (เก็บเป็น VARCHAR)
-- =============================================================================
UPDATE repair_request SET reject_from_status = '285' WHERE reject_from_status = '2361';
UPDATE repair_request SET reject_from_status = '280' WHERE reject_from_status = '2360';
UPDATE repair_request SET reject_from_status = '299' WHERE reject_from_status = '237';
UPDATE repair_request SET reject_from_status = '290' WHERE reject_from_status = '236';
UPDATE repair_request SET reject_from_status = '275' WHERE reject_from_status = '235';
UPDATE repair_request SET reject_from_status = '270' WHERE reject_from_status = '234';
UPDATE repair_request SET reject_from_status = '260' WHERE reject_from_status = '233';
UPDATE repair_request SET reject_from_status = '250' WHERE reject_from_status = '232';
UPDATE repair_request SET reject_from_status = '240' WHERE reject_from_status = '23';
UPDATE repair_request SET reject_from_status = '230' WHERE reject_from_status = '22';
UPDATE repair_request SET reject_from_status = '220' WHERE reject_from_status = '21';
UPDATE repair_request SET reject_from_status = '210' WHERE reject_from_status = '201';
UPDATE repair_request SET reject_from_status = '200' WHERE reject_from_status = '20';
UPDATE repair_request SET reject_from_status = '399' WHERE reject_from_status = '37';
UPDATE repair_request SET reject_from_status = '390' WHERE reject_from_status = '36';
UPDATE repair_request SET reject_from_status = '360' WHERE reject_from_status = '361';
UPDATE repair_request SET reject_from_status = '345' WHERE reject_from_status = '35';
UPDATE repair_request SET reject_from_status = '340' WHERE reject_from_status = '34';
UPDATE repair_request SET reject_from_status = '330' WHERE reject_from_status = '33';
UPDATE repair_request SET reject_from_status = '320' WHERE reject_from_status = '32';
UPDATE repair_request SET reject_from_status = '310' WHERE reject_from_status = '31';
UPDATE repair_request SET reject_from_status = '300' WHERE reject_from_status = '30';
UPDATE repair_request SET reject_from_status = '110' WHERE reject_from_status = '11';
UPDATE repair_request SET reject_from_status = '100' WHERE reject_from_status = '10';

-- =============================================================================
-- Step 4: Upsert status_info ด้วยรหัสใหม่ทั้งหมด (SRS v2.1 ตารางสถานะ)
-- =============================================================================
-- ลบรหัสเก่าออกก่อน (ถ้ายังมีอยู่)
DELETE FROM status_info WHERE status_id IN (
  10, 11, 20, 201, 21, 22, 23, 232, 233, 234, 235, 2360, 2361, 236, 237,
  30, 31, 32, 33, 34, 35, 360, 361, 36, 37
);

-- Insert รหัสใหม่ทั้งหมด
INSERT INTO status_info (status_id, status_name, path_type, sla_hours, legacy_code, display_order)
VALUES
  -- Cancel
  (0,   'ใบแจ้งซ่อมถูกยกเลิก',                  'ALL',    0,   '0',    0),
  -- Common
  (100, 'เปิดใบแจ้งซ่อม / ส่งซ่อม (CS)',          'ALL',    1,   '10',   1),
  (110, 'GR รับสินค้าซ่อมจาก CS (เลือกเส้นทาง)',  'ALL',    1,   '11',   2),
  -- DC Path
  (200, 'GR เปิด log DC',                         'DC',     48,  '20',   10),
  (210, 'รอ DC มารับสินค้า',                       'DC',     120, '201',  11),
  (220, 'DC รับสินค้าจากสาขาแล้ว',                'DC',     120, '21',   12),
  (230, 'DC รอ Vendor มารับสินค้า',                'DC',     120, '22',   13),
  (240, 'รอ Vendor ตีราคา',                        'DC',     72,  '23',   14),
  (250, 'ขออนุมัติราคาจากลูกค้า',                  'DC',     24,  '232',  15),
  (260, 'แจ้งผลการอนุมัติ',                        'DC',     24,  '233',  16),
  (270, 'รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)','DC',     168, '234',  17),
  (275, 'รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ',         'DC',     168, '235',  18),
  (280, 'DC รับสินค้าคืนจาก Vendor แล้ว',          'DC',     168, '2360', 19),
  (285, 'GR รับสินค้าคืนจาก DC แล้ว',              'DC',     120, '2361', 20),
  (290, 'CS รับสินค้าคืนแล้ว / รอลูกค้ารับ',       'DC',     24,  '236',  21),
  (299, 'ลูกค้ารับสินค้าแล้ว (ปิดงาน)',             'DC',     168, '237',  22),
  -- Vendor Path
  (300, 'รอ Vendor มารับสินค้า',                   'VENDOR', 120, '30',   30),
  (310, 'รอ Vendor ตีราคา',                        'VENDOR', 72,  '31',   31),
  (320, 'ขออนุมัติราคาจากลูกค้า',                  'VENDOR', 24,  '32',   32),
  (330, 'แจ้งผลการอนุมัติ',                        'VENDOR', 24,  '33',   33),
  (340, 'รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)','VENDOR', 168, '34',   34),
  (345, 'รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ',         'VENDOR', 168, '35',   35),
  (350, 'Vendor คืนผ่าน DC แทนสาขา',               'VENDOR', 120, '360',  36),
  (360, 'GR รับสินค้าคืนจาก Vendor / DC แล้ว',    'VENDOR', 168, '361',  37),
  (390, 'CS รับสินค้าคืนแล้ว / รอลูกค้ารับ',       'VENDOR', 24,  '36',   38),
  (399, 'ลูกค้ารับสินค้าแล้ว (ปิดงาน)',             'VENDOR', 168, '37',   39)
ON CONFLICT (status_id) DO UPDATE SET
  status_name   = EXCLUDED.status_name,
  path_type     = EXCLUDED.path_type,
  sla_hours     = EXCLUDED.sla_hours,
  legacy_code   = EXCLUDED.legacy_code,
  display_order = EXCLUDED.display_order,
  updated_date  = NOW();

-- =============================================================================
-- Step 5: ตรวจสอบผลลัพธ์
-- =============================================================================
SELECT DISTINCT status
FROM repair_request
WHERE status NOT IN (
  0, 100, 110,
  200, 210, 220, 230, 240, 250, 260, 270, 275, 280, 285, 290, 299,
  300, 310, 320, 330, 340, 345, 350, 360, 390, 399
)
ORDER BY status;
-- ผลลัพธ์ที่ถูกต้อง: 0 rows

COMMIT;
