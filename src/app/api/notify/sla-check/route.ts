import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { NotificationService } from "@/lib/service/notification.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const activeRequests = await prisma.repair_request.findMany({
      where: {
        status: {
          notIn: [0, 237, 37] // Exclude cancelled and completed tickets
        }
      },
      include: {
        repair_item: true
      }
    });

    const statusInfo = await prisma.status_info.findMany();
    const tierConfig = await prisma.service_tier_config.findMany();

    const statusSlaMap = new Map(statusInfo.map(s => [s.status_id, Number(s.sla_hours || 0)]));
    const tierMap = new Map(tierConfig.map(t => [t.tier.toUpperCase(), Number(t.sla_multiplier || 1)]));

    const now = new Date();
    let alertCount = 0;
    const details: any[] = [];

    for (const r of activeRequests) {
      const currentStatus = r.status ?? 10;
      const statusSlaHours = statusSlaMap.get(currentStatus) ?? 24; // fallback 24h
      const tier = (r.service_tier || "NORMAL").toUpperCase();
      const multiplier = tierMap.get(tier) ?? 1.0;
      const deadlineHours = statusSlaHours * multiplier;

      const baseDate = r.status_updated_date || r.updated_date || r.created_date || new Date();
      const elapsedMs = now.getTime() - new Date(baseDate).getTime();
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      // Warning threshold is 75% of the deadline
      const isAtRisk = elapsedHours >= 0.75 * deadlineHours;

      if (isAtRisk) {
        // Check if we already sent an SLA alert for this request ID
        const alreadyNotified = await prisma.transaction_log.findFirst({
          where: {
            request_id: r.id,
            step_no: "NOTIFY",
            act_trans_log: {
              contains: `SLA Alert`
            }
          }
        });

        if (!alreadyNotified) {
          const daysLeft = Math.max(0, Math.round((deadlineHours - elapsedHours) / 24));
          await NotificationService.sendNotification(r.id, "NEAR_SLA", daysLeft);
          alertCount++;
          details.push({
            requestId: r.id,
            requestNo: r.request_no,
            status: currentStatus,
            elapsedHours: elapsedHours.toFixed(1),
            deadlineHours: deadlineHours.toFixed(1),
            action: "ALERT_SENT"
          });
        } else {
          details.push({
            requestId: r.id,
            requestNo: r.request_no,
            status: currentStatus,
            elapsedHours: elapsedHours.toFixed(1),
            deadlineHours: deadlineHours.toFixed(1),
            action: "ALREADY_ALERTED"
          });
        }
      } else {
        details.push({
          requestId: r.id,
          requestNo: r.request_no,
          status: currentStatus,
          elapsedHours: elapsedHours.toFixed(1),
          deadlineHours: deadlineHours.toFixed(1),
          action: "ON_TRACK"
        });
      }
    }

    return NextResponse.json({
      ok: true,
      alertCount,
      totalChecked: activeRequests.length,
      details
    });
  } catch (err: any) {
    console.error("SLA check error:", err);
    return NextResponse.json({
      ok: false,
      message: "Internal server error",
      error: err.message
    }, { status: 500 });
  }
}
