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

    // İleti Merkezi genellikle 10 haneli (5xxxxxxxxx) veya 12 haneli (905xxxxxxxxx) format bekler.
    // Başındaki + ve 0'ları temizleyip, 10 haneli hale getirelim.
    let cleanPhone = phone.replace(/\D/g, ""); // Tüm rakam olmayanları sil (+ dahil)
    if (cleanPhone.startsWith("90") && cleanPhone.length === 12) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.substring(1);
    
    // Eğer numara çok kısaysa hata fırlat ki API'ye gitmeden dursun
    if (cleanPhone.length < 10) throw new Error("Geçersiz telefon numarası formatı");

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
