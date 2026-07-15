/**
 * Vendor notification service
 * Handles sending emails to vendors when repair requests are sent to them
 * TODO: This will be called from edit page when status changes to 30 (ส่ง Vendor)
 */

export async function notifyVendor({
  sku,
  requestNo,
  requestId,
}: {
  sku: number;
  requestNo: string;
  requestId: number;
}) {
  // TODO: Call this when user submits form with status = 30 (Vendor path)
  try {
    const response = await fetch("/api/notify/vendor-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, requestNo, requestId }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.warn("⚠️ Vendor notification failed:", data.message);
      return { ok: false, message: data.message };
    }

    // console.log("✅ Vendor notified:", data.message);
    return { ok: true, message: data.message };
  } catch (error) {
    console.error("❌ Vendor notify error:", error);
    return { ok: false, message: (error as Error).message };
  }
}
