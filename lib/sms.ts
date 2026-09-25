export async function sendSms(phone: string, body: string) {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
  
  if (provider === "console") { 
    console.log(`[Alumas SMS] ${phone}: ${body}`); 
    return { provider: "console", id: "dev" }; 
  }
  
  if (provider === "iletimerkezi") {
    const apiKey = process.env.ILETI_MERKEZI_KEY;
    const apiHash = process.env.ILETI_MERKEZI_HASH;
    const sender = process.env.ILETI_MERKEZI_SENDER || "ALUMAS"; // Default title

    if (!apiKey || !apiHash) throw new Error("İleti Merkezi API Key veya Hash eksik");

    // Clean phone number (remove +)
    const cleanPhone = phone.replace("+", "");

    const payload = {
      request: {
        authentication: { key: apiKey, hash: apiHash },
        order: {
          sender: sender,
          sendDateTime: "",
          message: {
            text: body,
            recepients: { number: [cleanPhone] }
          }
        }
      }
    };

    const res = await fetch("https://api.iletimerkezi.com/v1/send-sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.response.status.code !== 200) {
      throw new Error(`İleti Merkezi Hatası: ${data.response.status.message}`);
    }
    return { provider: "iletimerkezi", id: data.response.order.id };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) throw new Error("Twilio ortam değişkenleri eksik");
    const form = new URLSearchParams({ To: phone, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    const data = await res.json(); 
    if (!res.ok) throw new Error(data?.message || "SMS gönderilemedi"); 
    return { provider: "twilio", id: data.sid };
  }
  
  throw new Error(`Desteklenmeyen SMS_PROVIDER: ${provider}`);
}
