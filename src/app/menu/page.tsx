"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  Wrench, 
  ClipboardList, 
  FileText, 
  MessageSquare, 
  Users, 
  User,
  Store, 
  BookOpen, 
  Settings, 
  ArrowRight,
  Clock,
  Coins,
  Percent,
  Image,
  Megaphone,
  Grid
} from "lucide-react";

type FeatureItem = {
  title: string;
  desc: string;
  href: string;
  icon: any;
  color: string;
  bgColor: string;
  isAdminOnly?: boolean;
};

export default function MenuPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const isAdmin = user?.role === "ADMIN" || user?.role === "ADMIN_GR";

  const coreFeatures: FeatureItem[] = [
    {
      title: "หน้าหลัก (Dashboard)",
      desc: "ดูสรุปภาพรวม สถิติงานซ่อม และสถานะใบแจ้งซ่อมปัจจุบันของสาขา",
      href: "/dashboard",
      icon: Home,
      color: "text-[#c8102e]",
      bgColor: "bg-red-50",
    },
    {
      title: "รับเครื่อง / สร้างงาน (Create Repair)",
      desc: "บันทึกใบแจ้งซ่อมใหม่ ลงทะเบียนข้อมูลลูกค้า สินค้า ประกันภัย และอัปโหลดภาพถ่ายตัวเครื่อง",
      href: "/request/add",
      icon: Wrench,
      color: "text-[#c8102e]",
      bgColor: "bg-red-50",
    },
    {
      title: "ติดตามงานซ่อมทั้งหมด (Track Status)",
      desc: "ดูรายการงานซ่อม ค้นหาข้อมูล กรองสถานะ และติดตามความคืบหน้าของใบงานซ่อม",
      href: "/status",
      icon: ClipboardList,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "ใบเสนอราคา (Quotations)",
      desc: "ตรวจสอบรายการใบเสนอราคาค่าบริการและอะไหล่จาก Vendor และอนุมัติ/ปฏิเสธราคา",
      href: "/quotation",
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "ห้องสนทนาทีมงาน (Internal Chat)",
      desc: "ช่องทางพูดคุย สื่อสาร และประสานงานกันเองระหว่างเจ้าหน้าที่สาขาและทีมงานภายใน",
      href: "/chat",
      icon: MessageSquare,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "แชตกับลูกค้า LINE OA (LINE Chat)",
      desc: "ระบบแชตสนทนาตอบโต้กับลูกค้าผู้แจ้งซ่อมโดยตรงผ่านบัญชี LINE Official ของระบบ",
      href: "/chat/customer",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "จัดการข้อมูลลูกค้า (Customer Management)",
      desc: "ค้นหาข้อมูลลูกค้า ดูประวัติการแจ้งซ่อม และจัดการที่อยู่จัดส่งสินค้า/ออกใบกำกับภาษี",
      href: "/customer",
      icon: User,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "คลังความรู้ & คู่มือระบบ (Knowledge & Manual)",
      desc: "รวบรวมขั้นตอนการทำงาน (Workflow) ทั้ง 6 ขั้นตอน และคุณสมบัติเด่นของระบบ พร้อมคำถามที่พบบ่อย (FAQs)",
      href: "/faq",
      icon: BookOpen,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
  ];

  const adminFeatures: FeatureItem[] = [
    {
      title: "ตั้งค่ารูปภาพตัวอย่าง (Example Photos)",
      desc: "กำหนดและอัปโหลดรูปภาพอ้างอิง รวมถึงคำแนะนำในการถ่ายภาพประกอบใบแจ้งซ่อมของพนักงานสาขา",
      href: "/maintain?tab=example_images",
      icon: Image,
      color: "text-slate-800",
      bgColor: "bg-slate-100",
      isAdminOnly: true,
    },
    {
      title: "ประกาศแจ้งเตือนระบบ (Announcements)",
      desc: "สร้าง แก้ไข และกำหนดระยะเวลาแสดงผล Banner ประกาศข่าวสารแจ้งพนักงานด้านบนของทุกหน้าจอ",
      href: "/maintain?tab=announcement",
      icon: Megaphone,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      isAdminOnly: true,
    },
    {
      title: "ระดับบริการซ่อม (Service Tier Config)",
      desc: "กำหนดอัตราเร่งด่วน SLA และค่าบริการเสริมตามประเภท Service Tier (เช่น VIP, EXPRESS, NORMAL)",
      href: "/maintain?tab=service_tier",
      icon: Clock,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      isAdminOnly: true,
    },
    {
      title: "ตารางค่าบริการตรวจเช็ค (Diagnostic Fee)",
      desc: "ตั้งค่าราคากลางสำหรับค่าเปิดเครื่องตรวจเช็คสินค้าแยกตามแต่ละประเภทสินค้าและประเภทประกัน",
      href: "/maintain?tab=diagnostic",
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      isAdminOnly: true,
    },
    {
      title: "ตั้งค่าอัตรามาร์จิน (Margin Config)",
      desc: "ตั้งค่าสัดส่วนมาร์จินกำไร และเพดานราคากลางสำหรับประเมินกำไรของการดำเนินงานซ่อม",
      href: "/maintain?tab=margin",
      icon: Percent,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      isAdminOnly: true,
    },
    {
      title: "จัดการระบบหลังบ้านหลัก (Admin Maintain)",
      desc: "เข้าสู่ศูนย์รวมจัดการตารางตั้งค่าระบบ เช่น ข้อมูลผู้รับเหมา (Vendor), พนักงานผู้ใช้งาน (Users), และสาขา (Locations)",
      href: "/maintain",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isAdminOnly: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 select-none">
      {/* Page Header banner */}
      <div className="bg-gradient-to-r from-[#c8102e] to-[#990a20] text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Grid className="w-80 h-80 -mr-10 -mb-10" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="bg-white/20 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
            VService Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">เมนูคุณสมบัติของระบบ (VService Features Menu)</h1>
          <p className="text-red-100 text-sm max-w-xl font-medium leading-relaxed">
            เลือกใช้งานระบบงานซ่อม เครื่องมือสื่อสาร หรือศูนย์การตั้งค่าระบบ โดยสิทธิ์การใช้งานจะถูกกรองตามบัญชีผู้ใช้งานของคุณ
          </p>
        </div>
      </div>

      {/* Core Functions */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>🛠️ ระบบงานซ่อมและผู้ใช้งาน (Core Features)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link 
                key={idx} 
                href={item.href}
                className="group flex flex-col bg-white border border-slate-200/80 hover:border-[#c8102e]/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden animate-fadeIn"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 ${item.bgColor} ${item.color} rounded-xl`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#c8102e] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#c8102e] transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin Functions */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>⚙️ การจัดการและตั้งค่าระบบ (Admin Config Features)</span>
          </h2>
          {!isAdmin && (
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded font-extrabold">
              สำหรับแอดมินเท่านั้น
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((item, idx) => {
            const Icon = item.icon;
            if (!isAdmin) {
              return (
                <div 
                  key={idx} 
                  className="flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-none opacity-50 select-none cursor-not-allowed animate-fadeIn"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-slate-200 text-slate-500 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">LOCKED</span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <h3 className="text-sm font-bold text-slate-400">{item.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              );
            }
            return (
              <Link 
                key={idx} 
                href={item.href}
                className="group flex flex-col bg-white border border-slate-200/80 hover:border-[#c8102e]/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden animate-fadeIn"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 ${item.bgColor} ${item.color} rounded-xl`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#c8102e] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#c8102e] transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
