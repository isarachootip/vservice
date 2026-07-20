"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Hash, 
  Send, 
  Paperclip, 
  Search, 
  Users, 
  MessageSquare, 
  ChevronDown, 
  RefreshCw, 
  HelpCircle,
  Clock
} from "lucide-react";

type Room = {
  id: number;
  name: string;
  vendor_no: number;
  location_id: string;
  location_name: string;
  last_message: {
    message: string;
    created_at: string;
    sender_name: string;
  } | null;
};

type Message = {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
};

export default function TeamChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Filtering & Administration states
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  // Role simulation state (for testing branch vs vendor messaging)
  const [chatRole, setChatRole] = useState<"branch" | "vendor">("branch");

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch rooms list and basic info
  const fetchRooms = async (locId?: string) => {
    try {
      setLoadingRooms(true);
      const url = `/api/chat/rooms${locId ? `?locationId=${locId}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setRooms(data.rooms || []);
        setCurrentUser(data.user);
        setLocations(data.locations || []);
        if (!selectedLocationId && data.user?.location_id) {
          setSelectedLocationId(data.user.location_id);
        }
        
        // Auto-select first room if none is selected
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

  // Run on mount & poll rooms list silently
  useEffect(() => {
    fetchRooms(selectedLocationId);

    const interval = setInterval(() => {
      const fetchRoomsSilently = async () => {
        try {
          const url = `/api/chat/rooms${selectedLocationId ? `?locationId=${selectedLocationId}` : ""}`;
          const res = await fetch(url, { cache: "no-store" });
          const data = await res.json();
          if (data.ok) {
            setRooms(data.rooms || []);
            setCurrentUser(data.user);
            setLocations(data.locations || []);
          }
        } catch (err) {
          console.error("Silent fetch rooms error:", err);
        }
      };
      fetchRoomsSilently();
    }, 10000); // Poll rooms list every 10 seconds

    return () => clearInterval(interval);
  }, [selectedLocationId]);

  // Poll for messages in the active room
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/chat/messages?roomId=${activeRoom.id}`);
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

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeRoom || !inputText.trim()) return;

    const body = {
      roomId: activeRoom.id,
      message: inputText.trim(),
      senderName: chatRole === "vendor" ? activeRoom.name : (currentUser?.user_full_name || currentUser?.user_name),
      senderRole: chatRole === "vendor" ? "VENDOR" : (currentUser?.role || "STORE")
    };

    setInputText("");

    try {
      const res = await fetch("/api/chat/messages", {
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
            sender_name: data.message.sender_name
          }
        } : r));
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // Filtered rooms list based on search box query
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => 
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.location_name.toLowerCase().includes(roomSearch.toLowerCase())
    );
  }, [rooms, roomSearch]);

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "ADMIN_GR";

  return (
    <div className="space-y-4 max-w-full select-none h-[calc(100vh-120px)] flex flex-col justify-between">
      
      {/* Header section with page title & Admin branch selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-800">ห้องสนทนาทีมงาน (Team Chat)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">ประสานงานและพูดคุยระหว่างสาขาและผู้รับเหมา (Vendor)</p>
        </div>

        {/* Admin location filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">เลือกสาขาในการสลับแชท:</span>
            <select
              value={selectedLocationId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedLocationId(id);
                fetchRooms(id);
              }}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Chat Interface Window - Dark Themed Vibe */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl shadow-xl flex-grow overflow-hidden flex flex-row">
        
        {/* Left Side: Rooms List */}
        <div className="w-1/3 border-r border-slate-800 bg-[#0f172a] flex flex-col min-w-[240px]">
          
          {/* Header block with Your Projects label */}
          <div className="p-4 border-b border-slate-800 shrink-0">
            <span className="text-[10px] font-extrabold text-cyan-400 tracking-wider uppercase block mb-3">
              Your Channels / ผู้รับเหมา
            </span>
            
            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาช่องสนทนา..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none placeholder-slate-500 focus:border-cyan-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Rooms scrolling list */}
          <div className="flex-grow overflow-y-auto p-2 space-y-1 scrollbar-hide">
            {loadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
                <span className="text-[10px] font-bold">กำลังโหลดห้องสนทนา...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-xs font-semibold">
                ไม่พบช่องสนทนา
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-2 group ${
                      isActive 
                        ? "bg-[#1e293b] text-cyan-400 font-extrabold border-l-2 border-cyan-400 shadow-lg" 
                        : "text-slate-400 hover:bg-[#1e293b]/40 hover:text-slate-200"
                    }`}
                  >
                    <Hash className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate">{room.name}</span>
                      </div>
                      {room.last_message ? (
                        <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                          <span className="font-bold text-slate-400">{room.last_message.sender_name}:</span> {room.last_message.message}
                        </p>
                      ) : (
                        <p className="text-[9px] font-medium text-slate-600 truncate mt-0.5 italic">
                          ยังไม่มีการพูดคุย
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Box */}
        <div className="flex-grow bg-[#0b1329] flex flex-col justify-between">
          
          {activeRoom ? (
            <>
              {/* Top bar header of Chat */}
              <div className="p-4 border-b border-slate-800 bg-[#0f172a]/95 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-100">{activeRoom.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>2 Members (เจ้าหน้าที่สาขา {activeRoom.location_name} & ผู้รับเหมา)</span>
                    </span>
                  </div>
                </div>

                {/* Role Switch Simulation Box - Premium tester utility */}
                <div className="flex items-center gap-2 bg-[#1e293b]/70 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
                  <span className="text-[10px] font-extrabold text-slate-400">สวมบทบาทในการส่งข้อความ:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setChatRole("branch")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition ${
                        chatRole === "branch"
                          ? "bg-[#c8102e] text-white shadow"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      สาขา ({activeRoom.location_name})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatRole("vendor")}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition ${
                        chatRole === "vendor"
                          ? "bg-cyan-500 text-slate-950 shadow"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      ผู้รับเหมา ({activeRoom.name})
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Message List Area */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                    <MessageSquare className="w-10 h-10 text-slate-600 mb-1" />
                    <span className="text-sm font-extrabold text-slate-400">ยังไม่มีข้อความส่งคุยกัน</span>
                    <span className="text-[10px] font-bold text-slate-500">เริ่มการพิมพ์สนทนาชิ้นแรกได้เลย!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    // Check if message belongs to the role/side currently simulated
                    const isSelf = (chatRole === "branch" && msg.sender_role !== "VENDOR") || 
                                   (chatRole === "vendor" && msg.sender_role === "VENDOR");
                    const dateStr = new Date(msg.created_at).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        {/* Sender metadata info */}
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold">
                          <span className="text-slate-300">{msg.sender_name}</span>
                          <span className={`px-1 rounded text-[8px] border ${
                            msg.sender_role === "VENDOR" 
                              ? "bg-cyan-950 text-cyan-400 border-cyan-800" 
                              : "bg-red-950 text-[#ff4d4d] border-red-900"
                          }`}>
                            {msg.sender_role === "VENDOR" ? "VENDOR" : msg.sender_role}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed font-semibold shadow-md whitespace-pre-wrap ${
                            isSelf
                              ? "bg-[#1e293b] text-cyan-300 rounded-tr-none border border-slate-700"
                              : "bg-[#0f172a] text-slate-200 rounded-tl-none border border-slate-800"
                          }`}
                        >
                          {msg.message}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[8px] font-bold text-slate-500 mt-1 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-600" />
                          <span>{dateStr} น.</span>
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Bottom chat text inputs */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-800 bg-[#0f172a]/95 flex items-center gap-3 shrink-0"
              >
                {/* File attachment button */}
                <button
                  type="button"
                  title="Attach file"
                  onClick={() => alert("ระบบรองรับการอัปโหลดไฟล์ในเวอร์ชันจริง")}
                  className="p-2 rounded-xl bg-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Main text input field */}
                <input
                  type="text"
                  placeholder={`พิมพ์ข้อความสนทนาในฐานะ #${chatRole === "vendor" ? activeRoom.name : (currentUser?.user_full_name || "สาขา")}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-grow bg-[#1e293b] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none placeholder-slate-500 focus:border-cyan-500 transition"
                />

                {/* Send action button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <span className="text-sm font-extrabold text-slate-400">กรุณาเลือกช่องสนทนาด้านซ้าย</span>
              <span className="text-[10px] font-bold text-slate-500">เพื่อเริ่มสื่อสารระหว่างสาขาและผู้รับเหมา</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
