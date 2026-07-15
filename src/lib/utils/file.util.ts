import path from "path";

export function buildAttachmentFileName(
  requestNo: string,
  serial: string | null,
  originalName: string
) {
  const ext = path.extname(originalName) || "";
  const timestamp = Date.now();

  const cleanSerial = serial?.trim();

  if (cleanSerial) {
    return `${requestNo}_${cleanSerial}_${timestamp}${ext}`;
  }
  
  return `${requestNo}_${timestamp}${ext}`;
}
