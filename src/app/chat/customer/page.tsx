"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Search, 
  Send, 
  Paperclip, 
  MessageCircle, 
  Globe, 
  Clock, 
  MessageSquare,
  RefreshCw,
  HelpCircle
} from "lucide-react";

type Room = {
  id: number;
  request_id: number;
  request_no: string;
  customer_name: string;
  phone: string;
  service_tier: string;
  status_id: number;
  status_name: string;
  channel: "LINE" | "WEB";
  last_message: {
    message: string;
    created_at: string;
    sender_name: string;
    sender_type: "AGENT" | "CUSTOMER";
  } | null;
};

type Message = {
  id: number;
  chat_id: number;
  sender_type: "AGENT" | "CUSTOMER";
  sender_name: string;
  message: string;
  created_at: string;
};

export default function CustomerChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Role simulation state (for testing agent replies vs customer LINE inputs)
  const [chatRole, setChatRole] = useState<"agent" | "customer">("agent");

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch rooms list
  const fetchRooms = async (searchVal = "") => {
    try {
      setLoadingRooms(true);
      const url = `/api/chat/customer/rooms${searchVal ? `?search=${encodeURIComponent(searchVal)}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setRooms(data.rooms || []);
        setCurrentUser(data.user);
        
        // Auto-select first room if none is active
        if (data.rooms && data.rooms.length > 0 && !activeRoom) {
          setActiveRoom(data.rooms[0]);
        }
      }
    } catch (err) {
      console.error("Fetch rooms error:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Poll for messages
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/chat/customer/messages?chatId=${activeRoom.id}`);
        const data = await res.json();
        if (data.ok) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeRoom]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchRooms(val);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom || !inputText.trim()) return;

    const body = {
      chatId: activeRoom.id,
      message: inputText.trim(),
      senderType: chatRole === "customer" ? "CUSTOMER" : "AGENT",
      senderName: chatRole === "customer" ? activeRoom.customer_name : (currentUser?.user_full_name || currentUser?.user_name || "Agent")
    };

    setInputText("");

    try {
      const res = await fetch("/api/chat/customer/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(prev => [...prev, data.message]);
        // Update last message locally in room list
        setRooms(prev => prev.map(r => r.id === activeRoom.id ? {
          ...r,
          last_message: {
            message: data.message.message,
            created_at: data.message.created_at,
            sender_name: data.message.sender_name,
            sender_type: data.message.sender_type
          }
        } : r));
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // Helper for Priority styling
  const getPriorityBadge = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "VIP":
        return <span className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Critical</span>;
      case "EXPRESS":
        return <span className="bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">High</span>;
      default:
        return <span className="bg-blue-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Medium</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-full select-none h-[calc(100vh-120px)] flex flex-col justify-between">
      
      {/* Page Title */}
      <div className="shrink-0">
        <h1 className="text-xl font-black text-slate-800">ระบบแชตและข้อความเข้า (Customer Chat & Inbox)</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">ตอบโต้พูดคุยกับลูกค้าของแต่ละใบรับเครื่องซ่อม ผ่านช่องทางแชต LINE หรือ Web</p>
      </div>

      {/* Main Content Window - Light Theme styled like IT Helpdesk */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-grow overflow-hidden flex flex-row">
        
        {/* Left Side: Inbox List */}
        <div className="w-1/3 border-r border-slate-200 bg-[#f8fafc] flex flex-col min-w-[280px]">
          
          {/* Header block with search */}
          <div className="p-4 border-b border-slate-200 shrink-0 space-y-3 bg-white">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              ห้องแชตและข้อความเข้า
            </h3>
            
            {/* Search Input Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาตามเลขใบซ่อม หรือชื่อลูกค้า..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-slate-50 border border-slate-250 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none placeholder-slate-450 focus:border-violet-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Rooms scrolling list */}
          <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
                <span className="text-[10px] font-bold">กำลังค้นหาประวัติแชต...</span>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs font-semibold">
                ไม่พบประวัติแชตตามเงื่อนไข
              </div>
            ) : (
              rooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-2 relative ${
                      isActive 
                        ? "bg-violet-50/70 border-violet-250 border-violet-300 shadow-sm" 
                        : "bg-white border-slate-150 hover:bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    {/* Top Row: Request No + Priority */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-slate-900">{room.request_no}</span>
                      {getPriorityBadge(room.service_tier)}
                    </div>

                    {/* Middle Row: Subject / Customer Source */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">
                        {room.channel === "LINE" ? `แชตจาก LINE: ${room.customer_name}` : `ติดต่อผ่านเว็บ - ${room.customer_name}`}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        {room.channel === "LINE" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                            <MessageCircle className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                            LINE User
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                            <Globe className="w-3 h-3" />
                            Web User
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 shrink-0 truncate max-w-[100px]">
                          {room.status_name}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Last message snapshot */}
                    {room.last_message ? (
                      <p className="text-[10px] font-semibold text-slate-500 truncate w-full border-t border-slate-100 pt-1.5 mt-1">
                        <span className="font-extrabold text-slate-600">{room.last_message.sender_name}:</span> {room.last_message.message}
                      </p>
                    ) : (
                      <p className="text-[9px] font-semibold text-slate-400 italic w-full border-t border-slate-100 pt-1.5 mt-1">
                        ยังไม่มีบทสนทนา
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Box */}
        <div className="flex-grow bg-[#f8fafc] flex flex-col justify-between">
          
          {activeRoom ? (
            <>
              {/* Chat Header details */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  {activeRoom.channel === "LINE" ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <MessageCircle className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Globe className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900">
                      {activeRoom.customer_name} ({activeRoom.request_no})
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>เบอร์ติดต่อ: {activeRoom.phone || "-"}</span>
                      <span>•</span>
                      <span>สถานะซ่อม: {activeRoom.status_name}</span>
                    </span>
                  </div>
                </div>

                {/* Simulation Control Switcher */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
                  <span className="text-[10px] font-extrabold text-slate-500">สลับฝั่งพิมพ์เพื่อทดสอบ:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setChatRole("agent")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition ${
                        chatRole === "agent"
                          ? "bg-violet-600 text-white shadow"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      พนักงาน CS (Agent)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatRole("customer")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition ${
                        chatRole === "customer"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      ลูกค้า (ผ่าน LINE)
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat message bubbles scroll container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2 bg-white rounded-xl border border-slate-100 m-4 shadow-inner">
                    <MessageCircle className="w-12 h-12 text-slate-300" />
                    <span className="text-sm font-extrabold text-slate-500">ยินดีต้อนรับสู่ระบบแชต VService</span>
                    <span className="text-xs font-semibold text-slate-400">กรุณาส่งข้อความชิ้นแรกเพื่อเริ่มคุยกับลูกค้า</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = (chatRole === "agent" && msg.sender_type === "AGENT") ||
                                   (chatRole === "customer" && msg.sender_type === "CUSTOMER");
                    const dateStr = new Date(msg.created_at).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        {/* Sender Label */}
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500">
                          <span>{msg.sender_name}</span>
                          <span className={`px-1 rounded text-[8px] border font-black uppercase ${
                            msg.sender_type === "AGENT"
                              ? "bg-violet-50 text-violet-650 border-violet-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}>
                            {msg.sender_type === "AGENT" ? "AGENT" : "CUSTOMER"}
                          </span>
                        </div>

                        {/* Message bubble */}
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed whitespace-pre-wrap ${
                            isSelf
                              ? "bg-violet-600 text-white rounded-tr-none"
                              : msg.sender_type === "CUSTOMER" && activeRoom.channel === "LINE"
                                ? "bg-emerald-100 text-slate-800 rounded-tl-none border border-emerald-200"
                                : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                          }`}
                        >
                          {msg.message}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[8px] font-bold text-slate-400 mt-1 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{dateStr} น.</span>
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Chat Input form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-200 bg-white flex items-center gap-3 shrink-0 shadow-inner"
              >
                {/* File Attachment */}
                <button
                  type="button"
                  title="Attach file"
                  onClick={() => alert("ระบบแนบไฟล์ยังไม่เปิดใช้งานในการจำลอง")}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Main input text */}
                <input
                  type="text"
                  placeholder={
                    chatRole === "customer" 
                      ? `ส่งข้อความจากลูกค้า LINE (${activeRoom.customer_name})...`
                      : "พิมพ์ข้อความตอบกลับลูกค้าในนามพนักงาน CS..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-grow bg-slate-50 border border-slate-250 border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-850 outline-none placeholder-slate-450 focus:border-violet-500 focus:bg-white transition"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-500/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <MessageSquare className="w-16 h-16 text-slate-300" />
              <span className="text-sm font-extrabold text-slate-500">ยินดีต้อนรับสู่ระบบแชต VService</span>
              <span className="text-xs font-semibold text-slate-400">กรุณาเลือกรายการใบรับซ่อมด้านซ้าย เพื่อพูดคุยติดต่อกับลูกค้า</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
