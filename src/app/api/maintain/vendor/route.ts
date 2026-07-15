import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
    try {
        const vendors = await prisma.vendor_info.findMany({
            select: {
                id: true,
                vendor_no: true,
                vendor_name: true,
                vendor_email: true,
            },
            orderBy: { vendor_no: "asc" },
        });

        return NextResponse.json({
            ok: true,
            vendors,
        });
    } catch (err) {
        console.error("Fetch vendor error:", err);
        return NextResponse.json(
            { ok: false, message: "โหลดข้อมูล Vendor ไม่สำเร็จ" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { vendors, updatedUser } = body;

        if (!Array.isArray(vendors) || vendors.length === 0) {
            return NextResponse.json(
                { ok: false, message: "ข้อมูล Vendor ไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        for (const vendor of vendors) {
            if (!vendor.vendor_no || !vendor.vendor_name || !vendor.vendor_email) {
                return NextResponse.json(
                    { ok: false, message: "ข้อมูล Vendor ไม่ครบ" },
                    { status: 400 }
                );
            }
        }

        let insertCount = 0;
        for (const vendor of vendors) {
            const vendorNo = parseInt(vendor.vendor_no, 10);
            const existing = await prisma.vendor_info.findFirst({
                where: { vendor_no: vendorNo },
            });

            if (existing) {
                await prisma.vendor_info.updateMany({
                    where: { vendor_no: vendorNo },
                    data: {
                        vendor_name: vendor.vendor_name,
                        vendor_email: vendor.vendor_email,
                        updated_user: updatedUser,
                        updated_date: new Date(),
                    },
                });
            } else {
                await prisma.vendor_info.create({
                    data: {
                        vendor_no: vendorNo,
                        vendor_name: vendor.vendor_name,
                        vendor_email: vendor.vendor_email,
                        created_user: updatedUser,
                        updated_user: updatedUser,
                    },
                });
                insertCount++;
            }
        }

        return NextResponse.json({
            ok: true,
            message: `import สำเร็จ ${vendors.length} รายการ (เพิ่มใหม่ ${insertCount}, อัปเดต ${vendors.length - insertCount})`,
            count: vendors.length,
        });
    } catch (err) {
        console.error("Import vendor error:", err);
        return NextResponse.json(
            { ok: false, message: "import ไม่สำเร็จ" },
            { status: 500 }
        );
    }
}
