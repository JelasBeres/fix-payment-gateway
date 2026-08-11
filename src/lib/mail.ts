import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_APP_NAME || "DripClient"}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export function generateOrderSuccessEmailHtml(customerName: string, items: { productName: string, keys: string[] }[]) {
  const itemsHtml = items.map((item: any) => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${item.productName}</h3>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        ${item.keys.map((k: string) => `
          <div style="background: #f8f8f8; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #8b5cf6; border: 1px dashed #ddd; margin-bottom: 4px;">
            ${k}
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: #8b5cf6; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PEMBAYARAN BERHASIL</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; margin-top: 0;">Halo <strong>${customerName}</strong>,</p>
        <p style="color: #666; line-height: 1.5;">Terima kasih telah berbelanja di <strong>DripClient</strong>. Berikut adalah rincian kunci lisensi untuk pesanan Anda:</p>
        
        <div style="margin: 25px 0;">
          ${itemsHtml}
        </div>
        
        <p style="color: #666; line-height: 1.5;">Simpan email ini sebagai bukti pembelian resmi. Jika Anda memiliki kendala dalam aktivasi, silakan hubungi tim support kami melalui Telegram.</p>
        
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eee; paddingTop: 20px;">
          <p style="font-size: 12px; color: #aaa;">© 2026 DripClient - Secure & Instant Marketplace</p>
          <p style="font-size: 11px; color: #ccc;">Jangan membalas email ini, ini adalah pesan otomatis.</p>
        </div>
      </div>
    </div>
  `;
}
