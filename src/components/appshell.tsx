"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Topbar from "../components/topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // หน้าไหนบ้างไม่มี topbar
  const hideTopbar = pathname === "/login" || pathname === "/";

  return (
    <>
      {!hideTopbar && <Topbar />}
      {children}
    </>
  );
}
