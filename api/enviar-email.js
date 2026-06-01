import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeRecipients(value) {
  const recipients = Array.isArray(value) ? value : String(value || "").split(/[;,]/);
  return recipients.map((item) => String(item).trim()).filter(Boolean);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const { to, fromName, fromEmail, subject, html } = request.body;
    const recipients = normalizeRecipients(to);
    if (!recipients.length) {
      return response.status(400).json({ success: false, error: "Informe o e-mail destinatario." });
    }
    const invalidRecipients = recipients.filter((email) => !isEmail(email));
    if (invalidRecipients.length) {
      return response.status(400).json({ success: false, error: `E-mail invalido: ${invalidRecipients.join(", ")}` });
    }
    const cleanFromName = String(fromName || "DocGestor").replace(/[\r\n<>]/g, "").trim();
    const cleanFromEmail = String(fromEmail || "").replace(/[\r\n<>]/g, "").trim();
    const configuredFrom = cleanFromEmail ? `${cleanFromName || "DocGestor"} <${cleanFromEmail}>` : "";

    const result = await resend.emails.send({
      from: configuredFrom || process.env.RESEND_FROM_EMAIL || "DocGestor <onboarding@resend.dev>",
      to: recipients,
      subject: subject || "Teste de envio do DocGestor",
      html: html || "<p>Funcionou! O DocGestor ja consegue enviar e-mails.</p>",
    });

    return response.status(200).json({ success: true, result });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
