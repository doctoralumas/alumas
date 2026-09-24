export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const provider = (process.env.EMAIL_PROVIDER || "console").toLowerCase();
  
  if (provider === "console") {
    console.log(`[Alumas Email Mock] To: ${to} | Subject: ${subject}`);
    console.log(`[Content]: ${html}`);
    return { success: true, provider: "console" };
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY eksik");
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Alumas Sağlık <noreply@alumas.tr>",
        to,
        subject,
        html
      })
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "E-posta gönderilemedi");
    return { success: true, provider: "resend", id: data.id };
  }

  throw new Error(`Desteklenmeyen EMAIL_PROVIDER: ${provider}`);
}