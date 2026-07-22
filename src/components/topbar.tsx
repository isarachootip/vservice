"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from 'next/image';
import { useLanguage } from "@/context/LanguageContext";

type BasicUser = { user_name: string; store_code?: number | null };
type FullUser = BasicUser & {
  user_full_name?: string | null;
  user_email?: string | null;
  role?: string;
  permissions?: string[];
};

type Props = { title?: string };

export default function Topbar({ title = "Request Repair System" }: Props) {
    const router = useRouter();
    const [user, setUser] = useState<FullUser | null>(null);
    const { language, setLanguage, t } = useLanguage();

    // ดึงจาก localStorage
    useEffect(() => {
        const raw = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
        if (raw) {
            try { setUser(JSON.parse(raw)); } catch {}
        }
    }, []);

    // ดึงโปรไฟล์เต็มจาก API
    useEffect(() => {
        let cancelled = false;
        (async () => {
        try {
            const res = await fetch("/api/auth/current-user", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            if (!cancelled && data?.authenticated && data.user) {
            setUser((prev) => {
                const merged = { ...(prev || {}), ...data.user };
                // update localStorage
                localStorage.setItem("userInfo", JSON.stringify(merged));
                return merged;
            });
            }
        } catch {}
        })();
        return () => { cancelled = true; };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            localStorage.removeItem("userInfo");
            router.push("/login");
        }
    };

    const displayName = user?.user_full_name || user?.user_name || "—";
    const rightInfo = user?.store_code ? `${user.store_code}` : "";

    const displayTitle = title === "Request Repair System" ? t("systemTitle") : title;

    return (
        <header className="topbar no-print">
            <div className="topbar-inner">
                <div className="flex items-center gap-2 !ml-6">
                    <Link href="/menu" className="flex items-center gap-2 hover:opacity-80">
                        <Image
                            src="/images/icon_twd.png"
                            width={30}
                            height={30}
                            className="w-6 h-6 sm:w-8 sm:h-8"
                            alt="Logo"
                            />
                        <h2 className="topbar-title ml-2">{displayTitle}</h2>
                    </Link>
                </div>

                <div className="topbar-right !mr-6 flex items-center gap-4">
                    {/* Language Switcher */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-700 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setLanguage("th")}
                            className={`px-2 py-1 rounded transition-colors ${
                                language === "th"
                                    ? "bg-red-600 text-white font-bold shadow-sm"
                                    : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            TH
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage("en")}
                            className={`px-2 py-1 rounded transition-colors ${
                                language === "en"
                                    ? "bg-red-600 text-white font-bold shadow-sm"
                                    : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
                            }`}
                        >
                            EN
                        </button>
                    </div>

                    <span className="topbar-user">
                        {displayName} {rightInfo ? `(${rightInfo})` : ""}
                    </span>
                    <button type="button" className="btn-logout" onClick={handleLogout}>
                        {t("logout")}
                    </button>
                </div>
            </div>
        </header>
    );
}


