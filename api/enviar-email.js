import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Metodo nao permitido" });
  }

  try {
    const { to, subject, html } = request.body;

    const result = await resend.emails.send({
      from: "DocGestor <onboarding@resend.dev>",
      to: [to || "jonatass.goncalvess@gmail.com"],
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
