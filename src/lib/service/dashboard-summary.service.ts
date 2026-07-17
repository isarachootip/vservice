import { DashboardRepository, PeriodFilter } from "@/lib/repository/dashboard-summary.repo";

export type DashboardSummary = {
    totalRequest: number;
    pendingRepair: number;
    inProgress: number;
    completed: number;
    returned: number;
    cancelled: number;
    pendingByRole: {
        cs: number;
        gr: number;
        dc: number;
    };
    completedBreakdown: {
        approve: number;
        notApprove: number;
    };
    cancelledBreakdown: {
        userCancelled: number;
        twCancelled: number;
    };
    statusCounts: Array<{ statusId: number; count: number }>;
};

// รหัสสถานะใหม่ 3 หลัก (SRS v2.1)
export class DashboardService {
    static async getSummary(period: PeriodFilter, locationId?: string): Promise<DashboardSummary> {
        const grouped = await DashboardRepository.getStatusCounts(period, locationId);
        const countMap = new Map<number, number>();
        for (const row of grouped) {
            countMap.set(row.status ?? 0, row._count.status);
        }

        const sumStatuses = (statuses: number[]) =>
            statuses.reduce((sum, s) => sum + (countMap.get(s) ?? 0), 0);

        // รอลูกค้ารับ = 290 (DC Path) หรือ 390 (Vendor Path)
        const [approvedRepairDone, rejectedRepairCancelled] = await Promise.all([
            DashboardRepository.countByStatusAndApproveFlg([290, 390], "Y", period, locationId),
            DashboardRepository.countByStatusAndApproveFlg([290, 390], "N", period, locationId),
        ]);

        return {
            totalRequest: grouped.reduce((sum, row) => sum + row._count.status, 0),

            // รอดำเนินการ: ตั้งแต่เปิดงานจนถึงก่อน Vendor ส่งคืน
            pendingRepair: sumStatuses([
                100, 110,                    // รับงาน
                200, 210, 220, 230, 240, 250, 260,  // DC Path ก่อนซ่อม
                300, 310, 320, 330           // Vendor Path ก่อนซ่อม
            ]),

            // กำลังซ่อม: รอ Vendor ส่งคืน
            inProgress: sumStatuses([275, 345]),

            // ซ่อมเสร็จ/รอส่งคืน: DC รับคืน → GR รับคืน → CS รับคืน
            completed: sumStatuses([280, 285, 290, 350, 360, 390]),

            // ปิดงาน: ลูกค้ารับแล้ว
            returned: sumStatuses([299, 399]),

            // ยกเลิก / ไม่อนุมัติ
            cancelled: sumStatuses([0, 270, 340]),

            pendingByRole: {
                // CS: เปิดงาน, ขออนุมัติ, แจ้งผล, รับสินค้าคืน
                cs: sumStatuses([100, 240, 250, 260, 290, 310, 320, 330, 390]),
                // GR: รับสินค้า, เปิด log DC, รับคืนจาก DC, รอ Vendor
                gr: sumStatuses([110, 200, 210, 280, 285, 300]),
                // DC: รับสินค้า, รอ Vendor, จัดการ Vendor
                dc: sumStatuses([220, 230, 270, 275]),
            },

            completedBreakdown: {
                approve: approvedRepairDone,
                notApprove: rejectedRepairCancelled,
            },

            cancelledBreakdown: {
                userCancelled: sumStatuses([270, 340]),  // ลูกค้าไม่อนุมัติซ่อม
                twCancelled: sumStatuses([0]),             // ยกเลิกโดยร้าน
            },
            statusCounts: grouped.map(row => ({
                statusId: row.status ?? 0,
                count: row._count.status
            }))
        };
    }
}