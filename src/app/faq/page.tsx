"use client";

import { useState } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  Search,
  MessageCircle,
  FileText
} from "lucide-react";

type FAQItem = {
  q: string;
  a: string;
  category: string;
};

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<"manual" | "faq">("manual");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      q: "กรณีสินค้าไม่อยู่ในระบบสต็อก หรือไม่มีรหัส SKU ในระบบ จะเปิดใบแจ้งซ่อมได้อย่างไร?",
      a: "ให้ผู้ใช้เอาเครื่องหมายถูกออกจากช่อง 'สินค้าในระบบ' บนหน้าแจ้งซ่อมใหม่ ซึ่งจะเปิดให้ผู้ใช้กรอก ประเภทสินค้า, ยี่ห้อ, รุ่น และบาร์โค้ด ได้อย่างอิสระโดยไม่ต้องระบุ SKU ดั้งเดิมของระบบ โดยระบบหลังบ้านจะจัดทำรหัส SKU จำลองเป็นรหัส '999999999999' เพื่อทำการบันทึกและรันข้อมูลผ่านระบบอย่างเป็นเอกภาพอัตโนมัติ",
      category: "การสร้างใบแจ้งซ่อม"
    },
    {
      q: "การตั้งค่าหรือกำหนดรหัส Business Unit (BU / Workspace) สำหรับการออกเลขเอกสารประจำสาขา ต้องทำอย่างไร?",
      a: "ผู้ดูแลระบบ (ADMIN) สามารถทำได้โดยไปที่หน้า 'จัดการระบบ' -> แท็บ 'Location Info (ข้อมูลสาขา)' จากนั้นกดปุ่ม 'แก้ไข' สาขาที่ต้องการ และเลือกกำหนดคำนำหน้ารูปแบบธุรกิจในส่วนของ 'Business Unit / Workspace (BU Prefix)' เช่น TW (ไทวัสดุ), A1 (Auto1), BB (Baan & Beyond), GW (Go Wow) ซึ่งระบบจะใช้ในการออกเลขที่ใบแจ้งซ่อมสำหรับพนักงานและสาขานั้นโดยอัตโนมัติ",
      category: "การจัดการระบบและสาขา"
    },
    {
      q: "พนักงานสาขาทั่วไป (CS / GR / DC) สามารถติดตามใบงานซ่อมข้ามสาขาอื่นๆ ได้หรือไม่?",
      a: "ไม่ได้ครับ ระบบได้ตั้งค่าการจัดแบ่งข้อมูลแยกตามสาขา (Location Isolation) โดยพนักงานทั่วไปจะมองเห็นและติดตามสถานะใบแจ้งซ่อมได้เฉพาะใบงานที่ถูกสร้างขึ้นในสาขาที่พนักงานสังกัดอยู่เท่านั้น (Dropdown ตัวกรองข้ามสาขาจะถูกซ่อนไว้) เฉพาะผู้ใช้ระดับผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถดูใบงานทั้งหมดในระบบและกรองรายสาขาได้",
      category: "สิทธิ์และการมองเห็นข้อมูล"
    },
    {
      q: "ทำไมพนักงานล็อกอินเข้าใช้งานระบบ UAT แล้วขึ้นข้อความแจ้งว่า 'ไม่พบข้อมูลผู้ใช้'?",
      a: "เนื่องจากระบบจะนำบัญชีผู้ใช้งานไปแมปกับรหัสร้านค้า (Store Code) ในตารางร้านค้า หากผู้ใช้ดังกล่าวระบุรหัสร้านค้าที่ไม่มีอยู่จริงในระบบ จะทำให้ล็อกอินไม่ผ่าน แนะนำให้แอดมินผู้ดูแลระบบตรวจสอบรหัสร้านค้าที่ผูกไว้กับผู้ใช้นั้นผ่านทางหน้า 'จัดการระบบ -> User & Access Info'",
      category: "ปัญหาการใช้งานทั่วไป"
    },
    {
      q: "ขั้นตอนการอนุมัติใบเสนอราคาซ่อม (CS / Customer Approval) ต้องทำอย่างไร?",
      a: "เมื่อใบซ่อมถูกประเมินและเสนอราคาค่าซ่อมเข้ามาโดย Vendor ระบบจะเปลี่ยนสถานะใบงานเป็น 'รออนุมัติราคา' พนักงาน CS สามารถเข้าหน้ารายละเอียดใบงานเพื่อตรวจสอบ และมีสิทธิ์กดปุ่ม 'อนุมัติการซ่อม' (Approve) หรือ 'ปฏิเสธการซ่อม' (Reject) ได้ตามที่ได้รับการยืนยันจากลูกค้า เพื่อให้ช่างเริ่มดำเนินงานหรือส่งเครื่องกลับคืนสาขาต่อไป",
      category: "การเสนอราคาและการอนุมัติ"
    },
    {
      q: "ระบบการบันทึกประวัติการเดินใบงาน (Transaction Logs) ตรวจสอบได้ที่ไหน?",
      a: "ในหน้ารายละเอียดติดตามใบงานซ่อมของแต่ละใบงาน จะมีประวัติแถบไทม์ไลน์สถานะและการล็อกบันทึกเหตุการณ์ (Transaction Log) แสดงไว้ที่ส่วนท้ายของหน้าจอ โดยจะระบุชัดเจนว่าสถานะถูกปรับเปลี่ยนเมื่อใด และเปลี่ยนโดยพนักงานชื่ออะไร เพื่อความโปร่งใสสูงสุดในการทำงาน",
      category: "การตรวจสอบประวัติ"
    },
    {
      q: "รูปภาพตัวอย่างในการบันทึกใบแจ้งซ่อมมีไว้เพื่ออะไร และตั้งค่าอย่างไร?",
      a: "รูปภาพตัวอย่าง (Example Images) มีไว้เพื่อเป็นแนวทางให้พนักงานสาขาถ่ายรูปสินค้าและ Serial Number ได้ถูกต้องชัดเจนตามมาตรฐานที่ระบุไว้ แอดมินสามารถทำการอัปโหลด/แก้ไขรูปภาพตัวอย่างและใส่คำอธิบายประกอบการถ่ายภาพของแต่ละช่องได้ผ่านเมนู 'ตั้งค่า' -> 'ตั้งค่ารูปภาพตัวอย่าง' (/maintain?tab=example_images) โดยการบันทึกภาพตัวอย่างใหม่จะแทนที่ภาพเก่าในระบบทันทีเพื่อความปลอดภัยและประหยัดพื้นที่เก็บข้อมูล",
      category: "รูปภาพตัวอย่าง & การตั้งค่า"
    },
    {
      q: "ผู้ใช้งานทั่วไปจะเปิดดูรูปภาพตัวอย่างในระหว่างสร้างงานซ่อมได้อย่างไร?",
      a: "ในหน้าจอสร้างใบแจ้งซ่อมใหม่ (/request/add) หัวข้อ 'รูปถ่ายเครื่องและป้าย Serial เพื่อบันทึกงานซ่อม' หากแอดมินมีการตั้งค่ารูปภาพตัวอย่างไว้ จะมีปุ่มสีเทาเขียนว่า '💡 ดูตัวอย่าง' ปรากฏอยู่ข้างๆ ชื่อหัวข้อรูปถ่ายแต่ละช่อง เมื่อผู้ใช้คลิกปุ่มนี้ หน้าต่างป๊อปอัปจะปรากฏขึ้นเพื่อแสดงรูปถ่ายอ้างอิงที่ถูกต้อง พร้อมคำแนะนำข้อความที่แอดมินกรอกไว้",
      category: "การสร้างใบแจ้งซ่อม"
    },
    {
      q: "การตั้งค่า Webhook ในระบบ LINE Official Account เพื่อเชื่อมต่อแชตต้องระบุลิงก์ใด?",
      a: "ให้เข้าสู่ระบบ LINE Developers Console ของบัญชี LINE OA นั้น ๆ จากนั้นไปที่หัวข้อ 'Messaging API' -> 'Webhook settings' แล้วนำลิงก์ https://vservice.online/api/line/webhook ไปกรอกในช่อง Webhook URL จากนั้นให้เลือกโหมดตอบกลับ (วิธีตอบข้อความ) ใน LINE OA Manager เป็น 'แชทแบบแมนนวล' (Manual Chat) เท่านั้นเพื่อปิดการตอบกลับอัตโนมัติของ LINE และให้บอท VService ทำหน้าที่แทนโดยไม่มีข้อความซ้ำซ้อน",
      category: "ระบบแชตและ LINE Integration"
    },
    {
      q: "ระบบแชตของลูกค้า (Customer Chat & Inbox) มีการดึงข้อมูลข้อความและรายชื่อห้องแชตแบบเรียลไทม์ (Auto-Refresh) หรือไม่?",
      a: "ใช่ครับ ระบบมีการทำ Auto-Refresh ในตัว โดยข้อความสนทนาในห้องแชตที่พนักงานเปิดอยู่ (ฝั่งขวา) จะมีระบบสแกนดึงข้อมูลอัตโนมัติ (Polling) ทุก ๆ 3 วินาที ทำให้ข้อความส่งตรงถึงกันได้ทันทีโดยไม่ต้องกดรีเฟรชหน้าเว็บแต่อย่างใด",
      category: "ระบบแชตและ LINE Integration"
    },
    {
      q: "การลงลายเซ็นดิจิทัล (Digital Signature) ในขั้นตอนการรับคืนสินค้า ทำงานอย่างไร และใช้บนมือถือได้หรือไม่?",
      a: "พนักงานและลูกค้าสามารถเซ็นชื่อได้โดยตรงผ่านกระดานลายเซ็นบนหน้าเว็บขณะทำรายการรับสินค้าผ่านมือถือหรือแท็บเล็ต (ใช้นิ้วลากเซ็นได้ทันทีพร้อมระบบล็อกหน้าจอไม่ให้เลื่อนขณะลากเส้น) ลายเซ็นจะถูกจัดเก็บเป็นรูปภาพ .jpg ในประวัติและนำไปพิมพ์แสดงผลประกอบหลักฐานในใบส่งคืนสินค้าและรายละเอียดใบแจ้งซ่อมฝั่งผู้ใช้งานอัตโนมัติ",
      category: "ระบบลายเซ็นดิจิทัล (Digital Signature)"
    },
    {
      q: "หลังจากพนักงานสาขาเปิดใบแจ้งซ่อมสำเร็จแล้ว (สถานะ 100) สถานะต่อไปคืออะไร และมีขั้นตอนอย่างไร?",
      a: "สถานะต่อไปคือ 110 (GR รับสินค้าซ่อมจาก CS) โดยมีขั้นตอนสำคัญคือ: 1) พนักงาน CS ต้องดำเนินการบันทึกส่งมอบสินค้าผ่านหน้าจอ 'CS ส่งต่อสินค้าให้ GR' (/request/product-cs-to-gr/[id]) ซึ่งระบบจะปรับสถานะใบงานเป็น 110 และ 2) แผนก GR จะต้องทำการตรวจสอบสภาพสินค้า คีย์ยืนยันรหัส Serial Number และอัปโหลดบันทึกรูปภาพตัวสินค้าเพื่อเป็นหลักฐานในการทำรายการรับของและบันทึกการปรับสถานะเพื่อเลือกเส้นทางการส่งซ่อมในขั้นตอนถัดไป",
      category: "ขั้นตอนการทำงาน"
    },
    {
      q: "ระบบ VService มีหน้าจอครบถ้วนทุกขั้นตอน (Step) แล้วหรือยัง และเข้าถึงได้อย่างไร?",
      a: "ปัจจุบันระบบได้พัฒนาหน้าจอปฏิบัติงาน (page.tsx) รองรับครบถ้วนทุกขั้นตอนการเดินสถานะ (ทั้ง DC Path และ Vendor Path) รวมกว่า 15 หน้าจอ โดยเมื่อมีงานเข้ามาและพนักงานกดดำเนินการจากหน้าติดตามสถานะ ระบบจะนำพนักงานไปยังหน้าจอถัดไปที่สอดคล้องกับสถานะปัจจุบันโดยอัตโนมัติ เช่น /request/gr-log-to-dc/[id] สำหรับสถานะ 200 หรือ /quotation/add/[id] สำหรับสถานะ 240/310",
      category: "ขั้นตอนการทำงาน"
    },
    {
      q: "ทำไมหน้าติดตามงานซ่อมทั้งหมด (/status) ของแต่ละผู้ใช้แสดงผลตัวเลือกสถานะใน Dropdown แตกต่างกัน?",
      a: "เพื่อป้องกันความสับสนและให้หน้าจอการทำงานสอดคล้องกับหน้าที่รับผิดชอบ ระบบจะทำการควบคุมสิทธิ์การกรองสถานะใน Dropdown โดยดึงตัวเลือกสถานะขึ้นมาแสดงผลตามบทบาท (Role) ของผู้ใช้งานที่ล็อกอินในขณะนั้นโดยอัตโนมัติ เช่น พนักงาน Vendor จะเห็นเฉพาะตัวเลือกสถานะรหัส 300+ ขึ้นไปที่ตนเองต้องเข้าจัดการเท่านั้น ขณะที่ผู้ใช้ระดับ ADMIN จะสามารถมองเห็นและเลือกกรองตัวเลือกสถานะได้ครบถ้วนทั้งหมด",
      category: "สิทธิ์และการมองเห็นข้อมูล"
    }
  ];

  const filteredFaqs = faqItems.filter(item => 
    item.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    item.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <HelpCircle className="w-80 h-80 -mr-10 -mb-10" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="bg-white/20 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
            Support Center
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">คู่มือการใช้งาน & ศูนย์ช่วยเหลือ (FAQ)</h1>
          <p className="text-violet-100 text-sm max-w-xl font-medium leading-relaxed">
            แหล่งรวบรวมขั้นตอนการไหลของงานของระบบรับแจ้งซ่อมสินค้า (Workflow) และตอบคำถามที่พบบ่อยในการปฏิบัติงานสำหรับพนักงานทุกสาขา
          </p>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 pb-4 px-6 font-bold text-sm transition-all border-b-2 ${
            activeTab === "manual"
              ? "text-violet-600 border-violet-600"
              : "text-slate-500 hover:text-slate-800 border-transparent"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          ขั้นตอนการทำงาน (Workflow Manual)
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`flex items-center gap-2 pb-4 px-6 font-bold text-sm transition-all border-b-2 ${
            activeTab === "faq"
              ? "text-violet-600 border-violet-600"
              : "text-slate-500 hover:text-slate-800 border-transparent"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          คำถามที่พบบ่อย (FAQs)
        </button>
      </div>

      {/* Tab content 1: Manual */}
      {activeTab === "manual" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Workflow overview diagram */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-500" />
              กระบวนการไหลของงานแจ้งซ่อมหลัก (6 ขั้นตอนการส่งมอบและซ่อม)
            </h3>
            
            {/* Visual Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 relative">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">1</div>
                <h4 className="text-[11px] font-bold text-slate-800">CS: เปิดใบแจ้งซ่อม</h4>
                <p className="text-[9px] text-slate-500 leading-tight">ลงทะเบียนข้อมูลลูกค้า & สินค้า แนบรูปภาพตัวอย่างตามมาตรฐาน (ขนาด &le; 800KB)</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 relative">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">2</div>
                <h4 className="text-[11px] font-bold text-slate-800">GR: รับ/จัดส่งเครื่อง</h4>
                <p className="text-[9px] text-slate-500 leading-tight">ตรวจสอบสินค้าซ่อม แนบหลักฐานเอกสารและภาพถ่ายส่งมอบ (ขนาด &le; 800KB)</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 relative">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">3</div>
                <h4 className="text-[11px] font-bold text-slate-800">DC: ส่งมอบให้ช่าง</h4>
                <p className="text-[9px] text-slate-500 leading-tight">DC บันทึกการส่งมอบสินค้าให้ช่างภายนอก (Vendor) พร้อมแนบรูปถ่ายอ้างอิง</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 relative">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">4</div>
                <h4 className="text-[11px] font-bold text-slate-800">Vendor: เสนอราคา</h4>
                <p className="text-[9px] text-slate-500 leading-tight">ช่างของ Vendor ตรวจเช็คเครื่อง ประเมินค่าซ่อม อัปโหลดเอกสารเสนอราคาเข้าระบบ</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 relative">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">5</div>
                <h4 className="text-[11px] font-bold text-slate-800">CS: ลูกค้าอนุมัติซ่อม</h4>
                <p className="text-[9px] text-slate-500 leading-tight">CS ประสานงานยืนยันราคากับลูกค้า หากอนุมัติจะกดยืนยันใบเสนอราคาให้ช่างดำเนินการ</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">6</div>
                <h4 className="text-[11px] font-bold text-slate-800">Return: ส่งมอบคืนเครื่อง</h4>
                <p className="text-[9px] text-slate-500 leading-tight">ช่างซ่อมเสร็จส่งเครื่องคืน DC, คลังส่งคืน CS เพื่อติดต่อมอบเครื่องคืนมือลูกค้า</p>
              </div>
            </div>
          </div>

          {/* Detailed workflow cards */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-500" />
              รายละเอียดคุณสมบัติและขั้นตอนของระบบ (System Handover Features)
            </h3>

            <div className="space-y-4">
              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">1. การจัดการฐานข้อมูลลูกค้าอัตโนมัติ (Automated Customer Management)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ระบบจะตรวจสอบฐานข้อมูลลูกค้าอ้างอิงจาก <strong>"เบอร์โทรศัพท์"</strong> โดยอัตโนมัติขณะที่บันทึกข้อมูลใบแจ้งซ่อมใหม่ หากไม่พบข้อมูลลูกค้า ระบบจะทำการสร้างโปรไฟล์ลูกค้าให้ทันที รวมถึงรองรับการผูกข้อมูลที่อยู่ได้หลายรูปแบบ เช่น ที่อยู่สำหรับออกใบกำกับภาษี หรือที่อยู่สำหรับการจัดส่งสินค้าข้ามสาขา
                </p>
              </div>

              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">2. ระบบแสดงรูปภาพตัวอย่างในการปฏิบัติงาน (Visual Guidelines Workflow)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  มีรูปภาพไกด์ไลน์ตัวอย่างการถ่ายภาพแสดงบนหน้าปฏิบัติงานจริง เพื่อคอยนำทางพนักงานถ่ายภาพประกอบได้อย่างเป็นมาตรฐาน โดยรูปภาพจะแสดงขนาดพอเหมาะ (300x300 พิกเซล) และสามารถกดเพื่อดูภาพขยายขนาดเต็มพร้อมคำอธิบายของแต่ละช่องได้ทันที:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 mt-2 pl-2 space-y-1">
                  <li><strong>หน้าแจ้งซ่อมใหม่ (CS: Create Repair)</strong>: แสดงรูปไกด์ไลน์ 4 ช่องประกอบการอัปโหลดรูปเครื่อง ป้าย Serial และสภาพชำรุด</li>
                  <li><strong>หน้าส่งมอบให้ GR (CS to GR)</strong>: แสดงตัวอย่างรูปถ่ายประกอบ เช่น ภาพตัวเครื่องประกอบ, ภาพถ่ายใบนำส่ง GR, ภาพป้าย Serial</li>
                  <li><strong>หน้าส่งมอบให้ช่างซ่อม (DC to Vendor)</strong>: แสดงตัวอย่างรูปถ่ายประกอบการลงบันทึกส่งมอบช่างซ่อม</li>
                </ul>
              </div>

              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">3. ข้อจำกัดและตรวจสอบความปลอดภัยของไฟล์แนบ (Upload Constraints Validation)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  เพื่อประสิทธิภาพในการประมวลผลและการจัดเก็บข้อมูลบนคลาวด์ ระบบมีการตรวจสอบและบล็อกการอัปโหลดไฟล์ที่มีขนาดเกิน <strong>800 KB</strong> หรือมีขนาดสเกลภาพสูงเกินความเหมาะสมในทุก ๆ จุดที่มีการอัปโหลดในระบบ รวมถึงหน้าการสร้างใบแจ้งซ่อม, หน้าส่งมอบให้ GR และหน้าส่งมอบให้ช่างซ่อม เพื่อควบคุมขนาดไฟล์และรักษาคุณภาพของใบเสนอราคาและเอกสารในระบบ
                </p>
              </div>

              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">4. สิทธิ์การตรวจสอบและการควบคุมข้ามสาขา (Access & Location Isolation)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  เพื่อความปลอดภัยและเป็นส่วนตัวของข้อมูลสาขา พนักงานระดับทั่วไป (CS / GR / DC) จะสามารถเข้าถึงและประมวลผลเอกสารเฉพาะของสาขาตัวเองเท่านั้น โดยระบบจะทำการปิดกั้นไม่ให้เลือกดูข้ามสาขา เฉพาะผู้ใช้สิทธิ์ระดับ Admin เท่านั้นที่จะมีเมนูตั้งค่ารูปภาพตัวอย่างและสามารถตรวจสอบใบแจ้งซ่อมข้ามสาขาทั้งหมดได้
                </p>
              </div>

              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">5. ระบบลงชื่อลายเซ็นดิจิทัลบนหน้าเว็บ (Digital Signature Handover)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  รองรับการลงลายมือชื่อดิจิทัลผ่านหน้าจอสัมผัส (Touchscreen) บนมือถือและแท็บเล็ตได้โดยตรง หรือลากเขียนด้วยเมาส์บนคอมพิวเตอร์ ในขั้นตอนส่งคืนสินค้าให้คลังสาขา (DC) และขั้นตอนส่งมอบเครื่องคืนแก่ลูกค้าปลายทาง โดยลายเซ็นจะถูกเซฟเก็บเป็นไฟล์ภาพ .jpg อัปโหลดเชื่อมโยงกับใบงาน และนำไปใช้พิมพ์แสดงในรายงานใบส่งคืนเครื่องให้อัตโนมัติ
                </p>
              </div>

              <div className="border-l-4 border-violet-500 pl-4 py-1.5">
                <h4 className="text-sm font-bold text-slate-800">6. กระบวนการไหลของสถานะงานซ่อมแบบ 3 หลัก (3-Digit Workflow Statuses & Screens)</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ระบบ VService รองรับการทำงานด้วยรหัสสถานะ 3 หลักตามข้อกำหนด SRS v2.1 โดยในการทำรายการรับของแผนก GR (จากสถานะ 100 ไป 110) ตัวระบบกำหนดให้ต้องบันทึกข้อมูลการตรวจรับเพื่อปรับสถานะ และอัปโหลดบันทึกรูปถ่ายของสินค้าประกอบเป็นหลักฐานทุกครั้ง เพื่อความถูกต้องในการเดินงาน ส่วนขั้นตอนถัดไปในสถานะอื่นๆ เช่น DC รับสินค้า (สถานะ 220), เสนอราคาและแจ้งผลอนุมัติ (240/250/260) และการส่งมอบสินค้าคืนในแต่ละจุดก็มีหน้าจอปฏิบัติการพร้อมใช้งานอย่างครบถ้วน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab content 2: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-6 animate-fadeIn">
          {/* FAQ Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="ค้นหาคำตอบตามคำค้น..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* FAQ Accordion list */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-white p-8 text-center text-slate-500 rounded-2xl border border-slate-100">
                ไม่พบหัวข้อคำถามที่คุณค้นหา
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:border-slate-200 transition"
                  >
                    <button
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 hover:text-violet-600 transition"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-violet-600 text-xs px-2 py-0.5 rounded bg-violet-50 font-bold">
                          {faq.category}
                        </span>
                        {faq.q}
                      </span>
                      <span className="text-slate-400 font-normal shrink-0 text-xs">
                        {isOpen ? "▲ ซ่อน" : "▼ แสดงคำตอบ"}
                      </span>
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-slate-600 text-xs leading-relaxed border-t border-slate-50 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Contact Support placeholder */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-full">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-800">มีข้อสงสัยหรือข้อขัดข้องอื่นๆ ในระบบ UAT?</h4>
                <p className="text-[11px] text-slate-500">ติดต่อแผนกพัฒนาโปรแกรมหรือผู้จัดการระบบเพื่อแก้ไขปัญหาได้ทันที</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shrink-0 shadow">
              แจ้งข้อมูลขัดข้อง (Support)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
