import { prisma } from "@/lib/database";

export class StatusInfoRepository {

  static async findAll() {
    return await prisma.status_info.findMany({
      select: { 
        status_id: true, 
        status_name: true,
        path_type: true,
        sla_hours: true,
        updated_user: true,
      },
    });
  }

  static async updateStatusInfo(
    statusId: number,
    data: {
      status_name: string;
      sla_hours: number;
    },
    updatedUser: string
  ) {
    return prisma.status_info.update({
      where: {
        status_id: statusId,
      },
      data: {
        status_name: data.status_name,
        sla_hours: data.sla_hours,
        updated_user: updatedUser,
      },
    });
  }
}
