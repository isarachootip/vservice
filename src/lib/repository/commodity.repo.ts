import { prisma } from "@/lib/database";

export type commodityRow = {
  sku: string;
  sku_name: string;
  bar_code: string;
  class_name: string;
  brand: string;
  sku_cost?: number;
  sku_price?: number;
};

export class CommodityRepository {

    static async findBySku(rawSku: string) {
        const sku = rawSku.trim();
        if (!sku) return null;

        const rows = await prisma.$queryRaw<commodityRow[]>
        `SELECT 
            c.sku::text        AS sku,
            c.sbc::text        AS bar_code,
            trim(c.class_name) AS class_name,
            trim(c.brand)      AS brand,
            trim(c.sku_name)   AS sku_name,
            c.sku_cost::float  AS sku_cost,
            c.sku_price::float AS sku_price
        FROM public.commodity c
        WHERE c.sku::text = ${sku}
            AND c.sku_status_name = 'Active'`;
        return rows[0] ?? null;
    }

    static async getClasses() {
        return prisma.$queryRaw<{ class_name: string }[]>`
            SELECT DISTINCT
                TRIM(c.class_name) AS class_name
            FROM public.commodity c
            WHERE
                TRIM(c.class_name) <> ''
                AND c.class_name IS NOT NULL
                AND TRIM(c.sku_status_name) = 'Active'
            ORDER BY TRIM(c.class_name)
        `;
        // return prisma.commodity.findMany({
        //     where: { sku_status_name: "Active" },
        //     distinct: ["class_name"],
        //     select: { class_name: true },
        //     orderBy: { class_name: "asc" },
        // });
    }

    static async getBrand(className: string) {
        const cls = (className ?? "").trim();
        if (!cls) return [];

        return prisma.$queryRaw<{ brand: string }[]>`
            SELECT DISTINCT
                TRIM(c.brand) AS brand
            FROM public.commodity c
            WHERE
                TRIM(c.class_name) = TRIM(${cls})
                AND TRIM(c.brand) <> ''
                AND c.brand IS NOT NULL
                AND TRIM(c.sku_status_name) = 'Active'
            ORDER BY TRIM(c.brand)
        `;
        // const cls = (className ?? "").trim();
        // if (!cls) return [];
        // return prisma.commodity.findMany({
        //     where: { class_name: { equals: cls, mode: "insensitive" }, sku_status_name: "Active" },
        //     distinct: ["brand"],
        //     select: { brand: true },
        //     orderBy: { brand: "asc" },
        // });
    }
}