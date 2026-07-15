import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class VendorRepository {
  /**
   * Fetch vendor email by vendor name
   * TODO: Once vendor_info table has a primary key, update this query
   */
  static async getVendorEmailByName(vendorName: string): Promise<string | null> {
    try {
      // TODO: This uses raw SQL because vendor_info doesn't have a PK
      const result = await prisma.$queryRaw<
        { vendor_email: string | null }[]
      >`
        SELECT vendor_email
        FROM vendor_info
        WHERE vendor_name = ${vendorName}
        LIMIT 1
      `;

      return result?.[0]?.vendor_email || null;
    } catch (error) {
      console.error("❌ Failed to fetch vendor email:", error);
      return null;
    }
  }

  static async getVendorByName(vendorName: string) {
    try {
      const result = await prisma.$queryRaw<
        {
          vendor_no: number;
          vendor_name: string;
          vendor_email: string | null;
        }[]
      >`
        SELECT vendor_no, vendor_name, vendor_email
        FROM vendor_info
        WHERE vendor_name = ${vendorName}
        LIMIT 1
      `;

      return result?.[0] || null;
    } catch (error) {
      console.error("❌ Failed to fetch vendor:", error);
      return null;
    }
  }

  static async getVendorNameBySku(sku: number): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<
        { vendor_name: string | null }[]
      >`
        SELECT DISTINCT vendor_name
        FROM commodity
        WHERE sku = ${sku}
        LIMIT 1
      `;

      return result?.[0]?.vendor_name || null;
    } catch (error) {
      console.error("❌ Failed to fetch vendor by SKU:", error);
      return null;
    }
  }

  static async getStoreNameByRequestId(requestId: number): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<
        { store_name_th: string | null }[]
      >`
        SELECT s.store_name_th
        FROM repair_request rr
        LEFT JOIN store s ON rr.store_code = s.store_code
        WHERE rr.id = ${requestId}
        LIMIT 1
      `;

      return result?.[0]?.store_name_th || null;
    } catch (error) {
      console.error("❌ Failed to fetch store name by request ID:", error);
      return null;
    }
  }
}
