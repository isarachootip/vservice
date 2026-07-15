import { prisma } from "@/lib/database";

export type PeriodFilter = "all" | "day" | "week" | "month";

export class DashboardRepository {

    static buildDateFilter(period: PeriodFilter) {
        if (period === "all") {
            return {};
        }

        const now = new Date();
        let startDate: Date;

        if (period === "day") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === "week") {
            const day = now.getDay();
            const diff = day === 0 ? 6 : day - 1; // เริ่มนับวันจันทร์
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            created_date: {
                gte: startDate,
            },
        };
    }

    static async getStatusCounts(period: PeriodFilter) {
        const dateWhere = this.buildDateFilter(period);
        console.log("period : ", period)
        console.log("dateWhere : ",dateWhere)

        return prisma.repair_request.groupBy({
            by: ["status"],
            where: dateWhere,
            _count: {
                status: true,
            },
        });
    }

    static async countByStatusAndApproveFlg(
        statuses: number[],
        approveFlg: "Y" | "N",
        period: PeriodFilter
    ) {
    const dateWhere = this.buildDateFilter(period);

        return prisma.repair_request.count({
            where: {
                ...dateWhere,
                status: { in: statuses },
                quotation: {
                    some: {
                        user_approve_flg: approveFlg,
                    },
                },
            },
        });
    }
}