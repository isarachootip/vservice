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

        if (!vendors) {
            // Single vendor POST
            const { vendor_no, vendor_name, vendor_email } = body;
            if (!vendor_no || !vendor_name || !vendor_email) {
                return NextResponse.json({ ok: false, message: "กรุณาระบุข้อมูลให้ครบถ้วน" }, { status: 400 });
            }
            const vendorNo = parseInt(vendor_no, 10);
            const existing = await prisma.vendor_info.findUnique({
                where: { vendor_no: vendorNo },
            });
            if (existing) {
                return NextResponse.json({ ok: false, message: "มีรหัสผู้รับเหมานี้อยู่ในระบบแล้ว" }, { status: 400 });
            }
            await prisma.vendor_info.create({
                data: {
                    vendor_no: vendorNo,
                    vendor_name: vendor_name.trim(),
                    vendor_email: vendor_email.trim(),
                    created_user: updatedUser || "admin",
                    updated_user: updatedUser || "admin",
                },
            });
            return NextResponse.json({ ok: true, message: "เพิ่มข้อมูลผู้รับเหมาสำเร็จ" });
        }

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

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, vendor_no, vendor_name, vendor_email, updatedUser } = body;

        if (!id || !vendor_no || !vendor_name || !vendor_email) {
            return NextResponse.json({ ok: false, message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const existing = await prisma.vendor_info.findUnique({
            where: { id: Number(id) },
        });

        if (!existing) {
            return NextResponse.json({ ok: false, message: "ไม่พบข้อมูลผู้รับเหมา" }, { status: 404 });
        }

        const vendorNo = parseInt(vendor_no, 10);
        const duplicate = await prisma.vendor_info.findFirst({
            where: {
                vendor_no: vendorNo,
                NOT: { id: Number(id) },
            },
        });

        if (duplicate) {
            return NextResponse.json({ ok: false, message: "มีรหัสผู้รับเหมานี้ในระบบแล้ว" }, { status: 400 });
        }

        await prisma.vendor_info.update({
            where: { id: Number(id) },
            data: {
                vendor_no: vendorNo,
                vendor_name: vendor_name.trim(),
                vendor_email: vendor_email.trim(),
                updated_user: updatedUser || "admin",
                updated_date: new Date(),
            },
        });

        return NextResponse.json({ ok: true, message: "อัปเดตข้อมูลผู้รับเหมาสำเร็จ" });
    } catch (error) {
        console.error("PUT /api/maintain/vendor error:", error);
        return NextResponse.json(
            { ok: false, message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้รับเหมา" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ ok: false, message: "ไม่พบ ID ที่ต้องการลบ" }, { status: 400 });
        }

        await prisma.vendor_info.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ ok: true, message: "ลบข้อมูลผู้รับเหมาสำเร็จ" });
    } catch (error) {
        console.error("DELETE /api/maintain/vendor error:", error);
        return NextResponse.json(
            { ok: false, message: "เกิดข้อผิดพลาดในการลบข้อมูลผู้รับเหมา" },
            { status: 500 }
        );
    }
}
