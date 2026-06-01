import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ success: false, error: "Metodo nao permitido" });
  }

  try {
    const { data, error } = await resend.emails.list();

    if (error) {
      return response.status(502).json({
        success: false,
        error: error.message || "Erro ao buscar historico no Resend.",
      });
    }

    return response.status(200).json({
      success: true,
      emails: data?.data || [],
      hasMore: Boolean(data?.has_more),
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message || "Erro ao buscar historico no Resend.",
    });
  }
}
