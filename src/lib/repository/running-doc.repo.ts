import { prisma } from "@/lib/database";

export class RunningDocRepository {

  static async findByKey(prefix: string, yy: number, mm: number, dd: number) {
   return prisma.running_doc.findUnique({
      where: {
        prefix_yy_mm_dd: { prefix, yy, mm, dd }, 
      },
    });
  }
}
