import { NextRequest, NextResponse } from "next/server";
import { StatusInfoRepository } from "@/lib/repository/status-info.repo";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const statusId = Number(id);
        const body = await req.json();

        const statusName = body.statusName?.trim();
        const slaHours = Number(body.sla);
        const updatedUser = body.updatedUser?.trim();

        if (isNaN(statusId) || statusId <= 0) {
            return NextResponse.json(
                { ok: false, message: "status_Id ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        if (!statusName) {
            return NextResponse.json(
                { ok: false, message: "Status Name ต้องไม่เป็นค่าว่าง" },
                { status: 400 }
            );
        }

        if (isNaN(slaHours) || slaHours < 0) {
            return NextResponse.json(
                { ok: false, message: "SLA ต้องเป็นตัวเลข" },
                { status: 400 }
            );
        }

        const item = await StatusInfoRepository.updateStatusInfo
        (
            statusId,
            {
                status_name: statusName,
                sla_hours: slaHours,
            },
            updatedUser
        );

        return NextResponse.json({ ok: true, item });
    } catch (error) {
        console.error("=== UPDATE ERROR ===", error);
        return NextResponse.json(
            { ok: false, message: "อัปเดตข้อมูลไม่สำเร็จ", error: (error as Error).message },
            { status: 500 }
        );
    }
}