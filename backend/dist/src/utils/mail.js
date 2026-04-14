import nodemailer from "nodemailer";
import { config } from "../config/env.js";
// ─── Initialize Transporter ────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465, // true for port 465, false for others
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});
// ─── Test Connection ──────────────────────────────────────────
export async function testEmailConnection() {
    try {
        await transporter.verify();
        console.log("✅ Email service connected successfully");
    }
    catch (error) {
        console.error("❌ Email service connection failed:", error);
        throw new Error("Email service configuration failed");
    }
}
// ─── Send Welcome Email ───────────────────────────────────────
export async function sendWelcomeEmail(email, name, referralCode) {
    const mailOptions = {
        from: config.smtp.from,
        to: email,
        subject: "Selamat Datang di Event Platform! 🎉",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Selamat Datang! 👋</h1>
        </div>

        <div style="padding: 30px 20px; background: #f9f9f9;">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Terima kasih telah mendaftar di <strong>Event Platform</strong>!</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 10px 0;"><strong>Kode Referral Anda:</strong></p>
            <p style="font-size: 18px; color: #667eea; font-weight: bold; font-family: monospace; letter-spacing: 2px;">
              ${referralCode}
            </p>
            <p style="margin: 10px 0; color: #666; font-size: 14px;">
              Bagikan kode ini ke teman dan dapatkan bonus poin!
            </p>
          </div>

          <p>Sekarang Anda siap untuk:</p>
          <ul style="color: #666;">
            <li>✅ Membeli tiket untuk event favorit Anda</li>
            <li>✅ Membuat event sendiri (jika organizer)</li>
            <li>✅ Kumpulkan poin dan tukar hadiah</li>
            <li>✅ Ajak teman dan dapatkan komisi</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/login" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login Sekarang
            </a>
          </div>

          <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
            Jika Anda tidak membuat akun ini, abaikan email ini.
          </p>
        </div>
      </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${email}`);
    }
    catch (error) {
        console.error("❌ Failed to send welcome email:", error);
        throw new Error("Gagal mengirim email sambutan");
    }
}
// ─── Send Ticket Email ────────────────────────────────────────
export async function sendTicketEmail(email, userName, eventName, ticketCode, qrCodeDataUrl, quantity, totalAmount) {
    const mailOptions = {
        from: config.smtp.from,
        to: email,
        subject: `🎫 Tiket Anda untuk ${eventName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎫 Tiket Anda Siap!</h1>
        </div>

        <div style="padding: 30px 20px; background: #f9f9f9;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Terima kasih telah membeli tiket untuk <strong>${eventName}</strong>!</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #667eea;">
            <h2 style="margin-top: 0; color: #667eea;">Detail Tiket</h2>
            <p style="margin: 8px 0;"><strong>Kode Tiket:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold;">${ticketCode}</span></p>
            <p style="margin: 8px 0;"><strong>Jumlah Tiket:</strong> ${quantity}</p>
            <p style="margin: 8px 0;"><strong>Total Harga:</strong> Rp ${totalAmount.toLocaleString("id-ID")}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #666; margin-bottom: 10px;"><strong>Tunjukkan QR Code ini saat masuk event:</strong></p>
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #667eea; border-radius: 5px;" />
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Penting:</strong> Simpan tiket ini dengan baik. Anda memerlukan QR Code ini untuk masuk ke event.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/tickets" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Lihat Tiket Saya
            </a>
          </div>

          <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
            Pertanyaan? Hubungi support kami di support@eventplatform.com
          </p>
        </div>
      </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Ticket email sent to ${email}`);
    }
    catch (error) {
        console.error("❌ Failed to send ticket email:", error);
        throw new Error("Gagal mengirim email tiket");
    }
}
// ─── Send Payment Confirmation ────────────────────────────────
export async function sendPaymentConfirmation(email, userName, amount, transactionId, eventName) {
    const mailOptions = {
        from: config.smtp.from,
        to: email,
        subject: `✅ Pembayaran Berhasil - ${eventName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">✅ Pembayaran Berhasil!</h1>
        </div>

        <div style="padding: 30px 20px; background: #f9f9f9;">
          <p>Halo <strong>${userName}</strong>,</p>
          <p>Pembayaran Anda telah berhasil diproses!</p>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #38ef7d;">
            <h3 style="margin-top: 0; color: #11998e;">Rincian Pembayaran</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;"><strong>Event:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${eventName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;"><strong>Jumlah:</strong></td>
                <td style="padding: 10px 0; text-align: right;">Rp ${amount.toLocaleString("id-ID")}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;"><strong>ID Transaksi:</strong></td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 12px;">${transactionId}</td>
              </tr>
            </table>
          </div>

          <p style="color: #666;">Tiket akan dikirimkan ke email Anda dalam beberapa saat. Silakan periksa email Anda atau daftar masuk ke akun Anda.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.frontendUrl}/transactions" style="display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Lihat Riwayat Transaksi
            </a>
          </div>

          <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
            Terima kasih telah berbelanja bersama kami!
          </p>
        </div>
      </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Payment confirmation sent to ${email}`);
    }
    catch (error) {
        console.error("❌ Failed to send payment confirmation:", error);
        throw new Error("Gagal mengirim email konfirmasi pembayaran");
    }
}
