import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/authen";
import { UserService, UserRowWithPermissionsList } from "@/lib/service/users.service";

export const runtime = "nodejs";

// Rollback Map ตาม SRS v2.1 หัวข้อ 3.6
const prevStatusMap: Record<number, number> = {
    // DC Path
    200: 110,
    210: 200,
    220: 210, //* กรณี DC ลืมขนสินค้าไปจากสาขา ต้องย้อนไปตั้งแต่ตอน DC รับของ
    230: 220,
    240: 230,
    250: 240,
    260: 250,
    270: 260,
    275: 270,
    280: 275,
    290: 275, //* หมายเหตุ SRS: 290→275 ข้ามขา 280/285 (คงพฤติกรรมเดิม 236→235)
    299: 290,

    // Vendor Path
    310: 300,
    320: 310,
    330: 320,
    340: 330,
    345: 340,
    390: 345, //* 350/360 ไม่อยู่ใน rollback map ตามระบบเดิม
    399: 390,
};

function getClientIp(req: Request): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }
    return "unknown";
}

export async function POST(req: Request) {
    let user = "";
    let profile: UserRowWithPermissionsList | null = null;

    try {
        const { searchParams } = new URL(req.url);
        const idParam = (searchParams.get("id") || "").trim();
        const body = await req.json();
        const reason = String(body.reason ?? "");
        const updatedUser = String(body.updatedUser ?? "");

        const store = await cookies();
        const token = store.get(COOKIE_NAME)?.value;

        if (token) {
            const payload = await verifyToken(token);
            user = String(payload.sub || "system");
            //data user
            profile = await UserService.getUserProfile(user);
        }
        if (!profile) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }, { status: 401 });
        }

        if (!idParam) {
            return NextResponse.json(
                { ok: false, message: "invalid ID" },
                { status: 400 }
            );
        }

        if (!reason.trim()) {
            return NextResponse.json(
                { ok: false, message: "กรุณาระบุเหตุผล" },
                { status: 400 }
            );
        }

        const n = Number(idParam);
        
        const current = await prisma.repair_request.findUnique({
            where: { id : n } ,
            select: { status: true, request_no: true },
        });
        if (!current) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูล" }, { status: 404 });
        }

        if (current.status == null) {
            return NextResponse.json(
                { ok: false, message: "สถานะปัจจุบันไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        const prevStatus = prevStatusMap[current.status];
        if (!prevStatus) {
            return NextResponse.json({
                ok: false,
                message: "ไม่สามารถ Reject ได้",
            }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            const updateData: {
                status: number;
                updated_user: string;
                rollback_reason: string;
                rollback_by: string;
                rollback_date?: Date | null;
                reject_flg: string;
                reject_from_status: string;

                dc_receiver_name?: null;
                dc_receive_date?: null;
                dc_receiver_tel?: null;
                arrive_to_dc_date?: null;
            } = {
                status: prevStatus,
                updated_user: user,

                rollback_reason: reason,
                rollback_by: updatedUser,
                rollback_date: new Date(),
                reject_flg: "Y",
                reject_from_status: String(current.status),
            };
            //*กรณี rollback หลัง DC รับของไปแล้ว
            if (current.status === 210 || current.status === 220 || current.status === 230) {
                updateData.dc_receiver_name = null;
                updateData.dc_receive_date = null;
                updateData.dc_receiver_tel = null;
                updateData.arrive_to_dc_date = null;
            }

            //* update request
            await tx.repair_request.update({
                where: { id: n },
                data: updateData,
            });
            //* ลบ attachment step 220 (DC รับสินค้า) เมื่อตีกลับ
            await tx.repair_attachment.deleteMany({
                where: { request_id : n , step_no : '220'},
            });

            const ip = getClientIp(req);
            let transLogText = "";
            if (current.status === 200) {
                transLogText =
                `GR Reject ช่วง GR เปิด log DC : ${current.request_no}` +
                ` | เหตุผล : ${reason}`;
            } else if (current.status === 210) {
                transLogText =
                `GR Reject ช่วง รอ DC มารับสินค้า : ${current.request_no}` +
                ` | เหตุผล : ${reason}`;
            } else if (current.status === 220) {
                transLogText =
                `GR Reject ช่วง DC รับสินค้าจากสาขาแล้ว : ${current.request_no}` +
                ` | เหตุผล : ${reason}`;
            } else if (current.status === 230) {
                transLogText =
                `DC Reject ช่วง DC รอ Vendor มารับสินค้า : ${current.request_no}` +
                ` | เหตุผล : ${reason}`;
            } else {
                transLogText =
                `Rollback status ${current.status} -> ${prevStatus}` +
                ` | Request : ${current.request_no}` +
                ` | เหตุผล : ${reason}`;
            }

            await tx.transaction_log.create({
                data: {
                    act_user_name: user,
                    act_ip_address: ip,
                    act_trans_log: transLogText,
                    step_no: String(current.status),
                    request_id: n,
                },
            });
        });      

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { ok: false, message: "rollback failed" },
            { status: 500 }
        );
    }
}
