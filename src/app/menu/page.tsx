"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

type UserData = {
  user_name: string;
  user_full_name?: string | null;
  role?: string;
  permissions?: string[];
  store_code?: string | null;
};

export default function MenuPage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setUser({
        ...parsed,
        role: parsed.role,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      });
    } catch (e) {
      console.error("userInfo parse error:", e);
      setUser(null);
    }
  }, []);

  const permiss = useMemo(
    () => (user?.permissions ?? []).map((p) => String(p).trim()),
    [user]
  );
  const add_permiss = permiss.includes("add_request");

  return (
    <section className="container">
      <div className="menu-grid">


        {/* <Link href="/request/add?internal=Y" className="menu-tile">
          <div className="menu-icon">🖥️</div>
          <div className="menu-label">แจ้งซ่อมภายใน</div>
        </Link> */}

        <Link href="/status" className="menu-tile">
          <div className="menu-icon">📄</div>
          <div className="menu-label">ตรวจสอบสถานะใบแจ้งซ่อม</div>
        </Link>

        <Link href="/dashboard" className="menu-tile">
          <div className="menu-icon">📊</div>
          <div className="menu-label">Dashboard</div>
        </Link>

        {(user?.role === "ADMIN_GR" || user?.role === "ADMIN") && (
          <Link href="/maintain" className="menu-tile">
            <div className="menu-icon">⚙️</div>
            <div className="menu-label">Maintain</div>
          </Link>
        )}

      </div>
    </section>
  );
}
