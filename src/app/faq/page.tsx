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
      a: "ให้ผู้ใช้เอาเครื่องหมายถูกออกจากช่อง 'สินค้าในระบบ' บนหน้าแจ้งปัญหาใหม่ ซึ่งจะเปิดให้ผู้ใช้กรอก ประเภทสินค้า, ยี่ห้อ, รุ่น และบาร์โค้ด ได้อย่างอิสระโดยไม่ต้องระบุ SKU ดั้งเดิมของระบบ โดยระบบหลังบ้านจะจัดทำรหัส SKU จำลองเป็นรหัส '999999999999' เพื่อทำการบันทึกและรันข้อมูลผ่านระบบอย่างเป็นเอกภาพอัตโนมัติ",
      category: "การสร้างใบแจ้งซ่อม"
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-violet-500" />
              กระบวนการไหลของงานแจ้งซ่อมหลัก (Primary Workflow)
            </h3>
            
            {/* Visual Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                <h4 className="text-xs font-bold text-slate-800">CS: เปิดใบแจ้งซ่อม</h4>
                <p className="text-[10px] text-slate-500">ลงทะเบียนข้อมูลลูกค้า, รายละเอียดสินค้า (SKU) และระบุอาการเสียหายที่พบ</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                <h4 className="text-xs font-bold text-slate-800">GR: รับ/จัดส่งเครื่อง</h4>
                <p className="text-[10px] text-slate-500">รับสินค้าซ่อมจากพนักงาน CS ตรวจตรวจเช็คข้อมูล แล้วลงส่งต่อไปยัง DC หรือ Vendor</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">3</div>
                <h4 className="text-xs font-bold text-slate-800">DC: ตรวจสอบ/แยกงาน</h4>
                <p className="text-[10px] text-slate-500">รับจากสาขาหลัก ทำการคัดกรอง เช็คประกัน ตรวจงาน และสร้างเอกสารส่งมอบงานให้ Vendor</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">4</div>
                <h4 className="text-xs font-bold text-slate-800">Vendor: เสนอราคา</h4>
                <p className="text-[10px] text-slate-500">ช่างของ Vendor ตรวจเช็คเครื่อง ประเมินค่าบริการ อัปโหลดใบเสนอราคาเข้าระบบ</p>
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 bg-white rounded-full p-0.5 shadow border border-slate-100">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">5</div>
                <h4 className="text-xs font-bold text-slate-800">CS: อนุมัติการซ่อม</h4>
                <p className="text-[10px] text-slate-500">ประสานงานกับลูกค้า หากลูกค้าตอบรับ CS ทำการกดยืนยันใบเสนอราคาเพื่อให้ Vendor ลงมือซ่อม</p>
              </div>
            </div>
          </div>

          {/* Role details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800">คำแนะนำสำหรับ CS (Customer Service)</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 list-disc list-inside">
                <li>เมื่อสร้างใบแจ้งปัญหาใหม่ ให้พยายามเลือกสินค้าจากรหัส SKU ระบบเพื่อดึงข้อมูลต้นทุนและราคาที่ถูกต้อง</li>
                <li>หากเป็นสินค้านอกระบบสต็อกหลัก ให้เอาเครื่องหมายถูกออกเพื่อกรอกข้อมูลแบรนด์/รุ่นของสินค้าเอง</li>
                <li>ระบุอาการเสียชำรุดที่พบเบื้องต้นอย่างละเอียด และเลือกประเภทอาการเสียจากระบบให้ตรงกับลักษณะงาน</li>
                <li>ติดตามสถานะงานอย่างต่อเนื่อง เมื่อสถานะเปลี่ยนเป็น <span className="text-violet-600 font-bold">รอเสนอราคา</span> และ <span className="text-violet-600 font-bold">รออนุมัติราคา</span> ให้ติดต่อเสนองานซ่อมแก่ลูกค้าโดยเร็ว</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800">สิทธิ์และความมั่นคงปลอดภัย</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 list-disc list-inside">
                <li>บัญชีระดับพนักงานจะถูกกรองการเข้าถึงข้อมูลตามสาขาที่ท่านระบุในข้อมูลผู้ใช้ตั้งแต่การลงทะเบียน</li>
                <li>หากท่านมีสิทธิ์ข้ามสาขา หรือเป็นสาขา DC/แอนมินกลาง สามารถใช้ตัวเลือกกรองสาขาด้านบนของตารางติดตามเพื่อเรียกดูข้อมูลได้</li>
                <li>ห้ามใช้งานรหัสผู้ใช้งานหรือแชร์บัญชีล็อกอินร่วมกันในแต่ละสาขา เพื่อการตรวจสอบประวัติย้อนหลังที่ถูกต้องในระบบ</li>
              </ul>
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
