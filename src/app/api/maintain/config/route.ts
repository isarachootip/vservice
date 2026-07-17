import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "diagnostic") {
      const data = await prisma.diagnostic_fee_config.findMany({
        orderBy: { product_type: "asc" },
      });
      return NextResponse.json({ ok: true, data });
    }

    if (type === "margin") {
      const data = await prisma.margin_config.findMany({
        orderBy: { product_type: "asc" },
      });
      return NextResponse.json({ ok: true, data });
    }

    if (type === "tier") {
      const data = await prisma.service_tier_config.findMany({
        orderBy: { tier: "asc" },
      });
      return NextResponse.json({ ok: true, data });
    }

    if (type === "system") {
      const data = await prisma.system_config.findMany({
        orderBy: { config_key: "asc" },
      });
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, message: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("GET config error:", error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { type, action, data } = await req.json();

    if (!type || !action || !data) {
      return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 });
    }

    if (type === "system") {
      if (action === "upsert") {
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item.config_key) continue;
          await prisma.system_config.upsert({
            where: { config_key: item.config_key },
            update: { config_value: String(item.config_value || ""), updated_at: new Date() },
            create: { config_key: item.config_key, config_value: String(item.config_value || "") }
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    if (type === "diagnostic") {
      if (action === "create") {
        const res = await prisma.diagnostic_fee_config.create({
          data: {
            product_type: data.product_type,
            fee_amount: Number(data.fee_amount),
            waive_in_warranty: Boolean(data.waive_in_warranty),
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "update") {
        const res = await prisma.diagnostic_fee_config.update({
          where: { id: Number(data.id) },
          data: {
            product_type: data.product_type,
            fee_amount: Number(data.fee_amount),
            waive_in_warranty: Boolean(data.waive_in_warranty),
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "delete") {
        await prisma.diagnostic_fee_config.delete({
          where: { id: Number(data.id) },
        });
        return NextResponse.json({ ok: true });
      }
    }

    if (type === "margin") {
      if (action === "create") {
        const res = await prisma.margin_config.create({
          data: {
            product_type: data.product_type,
            margin_percent: Number(data.margin_percent),
            margin_floor: Number(data.margin_floor),
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "update") {
        const res = await prisma.margin_config.update({
          where: { id: Number(data.id) },
          data: {
            product_type: data.product_type,
            margin_percent: Number(data.margin_percent),
            margin_floor: Number(data.margin_floor),
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "delete") {
        await prisma.margin_config.delete({
          where: { id: Number(data.id) },
        });
        return NextResponse.json({ ok: true });
      }
    }

    if (type === "tier") {
      if (action === "create") {
        const res = await prisma.service_tier_config.create({
          data: {
            tier: data.tier,
            sla_multiplier: Number(data.sla_multiplier),
            surcharge_type: data.surcharge_type,
            surcharge_value: Number(data.surcharge_value),
            active_flg: data.active_flg || "Y",
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "update") {
        const res = await prisma.service_tier_config.update({
          where: { id: Number(data.id) },
          data: {
            tier: data.tier,
            sla_multiplier: Number(data.sla_multiplier),
            surcharge_type: data.surcharge_type,
            surcharge_value: Number(data.surcharge_value),
            active_flg: data.active_flg || "Y",
          },
        });
        return NextResponse.json({ ok: true, data: res });
      }
      if (action === "delete") {
        await prisma.service_tier_config.delete({
          where: { id: Number(data.id) },
        });
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: false, message: "Invalid type or action" }, { status: 400 });
  } catch (error) {
    console.error("POST config error:", error);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
