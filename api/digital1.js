module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdAQvry3-pKeDZMg6h54TpVQ6IK373NAuBOcJACt5W4jY2XSg/formResponse";

  const data = req.body || {};
  const parsed =
    typeof data === "string"
      ? (() => {
          try { return JSON.parse(data); } catch { return {}; }
        })()
      : data;

  const fechaHora = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

  const contactId = parsed.contact_id || parsed.contactId || "";
  const nombreCompleto =
    parsed.full_name || [parsed.first_name, parsed.last_name].filter(Boolean).join(" ") || "";
  const email = parsed.email || "";
  const telefono = (parsed.phone || "").toString().replace(/^\+/, "").replace(/\s/g, "");
  const origenFuente = parsed.contact_source || "";
  const pais = parsed.country || (parsed.location && parsed.location.country) || "";
  const timezone = parsed.timezone || "";

  const urlDelFormulario =
    (parsed.contact && parsed.contact.attributionSource && parsed.contact.attributionSource.url) ||
    (parsed.contact && parsed.contact.lastAttributionSource && parsed.contact.lastAttributionSource.url) ||
    "";

  const referrer =
    (parsed.contact && parsed.contact.attributionSource && parsed.contact.attributionSource.referrer) ||
    (parsed.contact && parsed.contact.lastAttributionSource && parsed.contact.lastAttributionSource.referrer) ||
    "";

  const formParams = new URLSearchParams();
  formParams.append("entry.99773689", fechaHora);
  formParams.append("entry.2098041704", contactId);
  formParams.append("entry.379244977", nombreCompleto);
  formParams.append("entry.662128694", email);
  formParams.append("entry.2026790237", telefono);
  formParams.append("entry.942838195", origenFuente);
  formParams.append("entry.782980798", pais);
  formParams.append("entry.798218329", timezone);
  formParams.append("entry.778186638", urlDelFormulario);
  formParams.append("entry.363421330", referrer);

  try {
    console.log("✅ Webhook recibido. Keys:", Object.keys(parsed || {}));
    console.log("🧾 Payload mapeado:", {
      fechaHora,
      contactId,
      nombreCompleto,
      email,
      telefono,
      origenFuente,
      pais,
      timezone,
      urlDelFormulario,
      referrer
    });
    console.log("➡️ Enviando a Form:", FORM_URL);
    console.log("🧾 formParams (primeros 400):", formParams.toString().slice(0, 400));

    const response = await fetch(FORM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0" // a veces ayuda con Forms
      },
      body: formParams.toString(),
      redirect: "manual" // para ver 302 sin seguirlo
    });

    const text = await response.text();

    console.log("📩 Forms status:", response.status);
    console.log("📩 Forms location header:", response.headers.get("location"));
    console.log("📩 Forms body (primeros 300):", text.slice(0, 300));

    const ok = response.status === 200 || response.status === 302;
    return res.status(200).json({ ok, formStatus: response.status });
  } catch (err) {
    console.error("❌ Error enviando a Google Forms:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
};
