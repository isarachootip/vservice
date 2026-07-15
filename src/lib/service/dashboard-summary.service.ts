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
};

export class DashboardService {
    static async getSummary(period: PeriodFilter): Promise<DashboardSummary> {
        const grouped = await DashboardRepository.getStatusCounts(period);
        // console.log("grouped : ",grouped)
        const countMap = new Map<number, number>();
        for (const row of grouped) {
            countMap.set(row.status ?? 0, row._count.status);
        }

        const sumStatuses = (statuses: number[]) =>
            statuses.reduce((sum, s) => sum + (countMap.get(s) ?? 0), 0);

        const [approvedRepairDone, rejectedRepairCancelled] = await Promise.all([
            DashboardRepository.countByStatusAndApproveFlg([36, 236], "Y", period),
            DashboardRepository.countByStatusAndApproveFlg([36, 236], "N", period),
        ]);
        // console.log("groupeddRepairDone : ",approvedRepairDone)
        // console.log("groupedRepairCancelled : ",rejectedRepairCancelled)
        return {
            totalRequest: grouped.reduce((sum, row) => sum + row._count.status, 0),

            pendingRepair: sumStatuses([10, 11, 20, 201, 21, 22, 23, 232, 233, 30, 31, 32, 33]),

            inProgress: sumStatuses([235, 35]),

            completed: sumStatuses([2360, 2361, 236, 360, 36, 361]),

            returned: sumStatuses([237, 37]),

            cancelled: sumStatuses([0, 234, 34]),

            pendingByRole: {
                cs: sumStatuses([10, 23, 232, 233, 31, 32, 33]),
                gr: sumStatuses([11, 20, 201, 30]),
                dc: sumStatuses([21, 22]),
            },

            completedBreakdown: {
                approve: approvedRepairDone,
                notApprove: rejectedRepairCancelled,
            },

            cancelledBreakdown: {
                userCancelled: sumStatuses([234, 34]),
                twCancelled: sumStatuses([0]),
            },
        };
    }
}