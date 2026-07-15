import nodemailer from "nodemailer";
//* ต้อง npm install nodemailer
type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  } | false;
  tls?: {
    rejectUnauthorized: boolean;
  };
};

// TODO: Replace with your actual email config (use environment variables)
const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  } : false,
  tls: {
    rejectUnauthorized: false,
  },
};

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export class EmailService {
  // @ts-expect-error - emailConfig allows auth to be false for open relay
  private static transporter = nodemailer.createTransport(emailConfig);

  static async sendEmail({ to, subject, html }: SendEmailParams) {
    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || (typeof emailConfig.auth !== 'boolean' ? emailConfig.auth.user : ''),
        to,
        subject,
        html,
      });
      console.log("📧 Email sent:", result.messageId);
      return { ok: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Email send failed:", error);
      return { ok: false, error };
    }
  }

  static getVendorNotificationEmail(vendorName: string, requestNo: string, requestId: number, storeName: string | null): string {
    const printUrl = `${process.env.APP_URL}/print/${requestId}`;
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #2c3e50;">แจ้งผู้จัดจำหน่าย ${vendorName}</h2>

            <p>มีสินค้าที่ลูกค้านำมาซ่อม</p>

            <p>ทางเราได้ส่งเอกสารสินค้าซ่อมให้คุณเพื่อทำการตรวจสอบและประเมินราคา โปรดตรวจสอบรายละเอียดดังต่อไปนี้:</p>

            <div style="background: white; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0;">
              <p><strong>เลขที่ใบแจ้งซ่อม:</strong> ${requestNo}</p>
              ${storeName ? `<p><strong>สาขา:</strong> ${storeName}</p>` : ''}
            </div>

            <p>กรุณากดลิงค์ด้านล่างเพื่อดูรายละเอียดเพิ่มเติม:</p>

            <div style="margin: 20px 0;">
              <p>
                <a href="${printUrl}" target="_blank" style="background: #f39c12; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
                  ดูเอกสาร / Print
                </a>
              </p>
            </div>

            <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
              ข้อความนี้ถูกส่งโดยระบบอัตโนมัติ โปรดอย่าตอบกลับอีเมลนี้
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
