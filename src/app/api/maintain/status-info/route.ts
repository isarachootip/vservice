import { NextResponse } from "next/server";
import { StatusInfoRepository } from "@/lib/repository/status-info.repo";

export const runtime = "nodejs";

type StatusInfoRaw = {
  status_id: number;
  status_name: string;
  path_type: string;
  sla_hours: number;
  updated_user: string;
};

export async function GET() {
  try {
    const data = await StatusInfoRepository.findAll();
    const items = (data as StatusInfoRaw[]).map((item) => ({
      id: item.status_id,
      path: item.path_type,
      status: item.status_name,
      sla: Math.ceil(item.sla_hours / 24),
    }));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Failed to fetch status info" },
      { status: 500 }
    );
  }
}