import "server-only";
import nodemailer from "nodemailer";

// Envío de correo con el primer proveedor configurado:
// - Resend: RESEND_API_KEY (+ CONTACT_FROM_EMAIL con un dominio verificado en Resend)
// - SMTP (p. ej. el buzón de Hostinger): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Devuelve false si no hay proveedor o el envío falla.

export type Correo = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export const hayProveedorEmail = () =>
  Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));

export async function enviarEmail({ to, subject, text, html, replyTo }: Correo): Promise<boolean> {
  const { RESEND_API_KEY, CONTACT_FROM_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL || "DevMart Web <onboarding@resend.dev>",
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });
    return res.ok;
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = Number(SMTP_PORT) || 465;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: CONTACT_FROM_EMAIL || `DevMart Web <${SMTP_USER}>`,
      to,
      replyTo,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    return true;
  }

  return false;
}

