const form = document.querySelector("#registerForm");
const statusEl = document.querySelector("#status");
const successBox = document.querySelector("#successBox");
const openPassLink = document.querySelector("#openPassLink");
const openResultLink = document.querySelector("#openResultLink");

function optionalNumber(value) {
  return value === "" || value === null ? null : Number(value);
}

function payloadFromForm(formData) {
  const config = window.NOVIXOT_PUBLIC;
  return {
    event_code: config.EVENT_CODE,
    full_name: formData.get("full_name"),
    nickname: formData.get("nickname"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    age: optionalNumber(formData.get("age")),
    gender: formData.get("gender") || "not_specified",
    height_cm: optionalNumber(formData.get("height_cm")),
    weight_kg: optionalNumber(formData.get("weight_kg")),
    consent_data_collection: formData.get("consent_data_collection") === "on",
    consent_public_leaderboard: formData.get("consent_public_leaderboard") === "on",
    consent_marketing: formData.get("consent_marketing") === "on",
    consent_result_card: formData.get("consent_result_card") === "on",
    health_disclaimer_accepted: formData.get("health_disclaimer_accepted") === "on",
    metadata: { source: "public-web" }
  };
}

function validate(payload) {
  const errors = [];
  if (!payload.full_name?.trim() && !payload.nickname?.trim()) errors.push("Full name or nickname is required.");
  if (!payload.consent_data_collection) errors.push("Data collection consent is required.");
  if (!payload.health_disclaimer_accepted) errors.push("Health disclaimer acceptance is required.");
  if (payload.email && !payload.email.includes("@")) errors.push("Email must be valid when provided.");
  return errors;
}

function withToken(base, token) {
  const fallback = base || "pass.html";
  return `${fallback}${fallback.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

window.novixotShowConfigWarning("#configStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  successBox.classList.add("hidden");
  const payload = payloadFromForm(new FormData(form));
  const errors = validate(payload);
  if (errors.length) {
    statusEl.textContent = errors.join(" ");
    statusEl.className = "status error";
    return;
  }
  if (!window.NOVIxOTSupabase.configured()) {
    window.novixotShowConfigWarning("#status");
    return;
  }
  statusEl.textContent = "Registering...";
  statusEl.className = "status";
  try {
    const result = await window.NOVIxOTSupabase.registerParticipant(payload);
    const token = result.qr_token;
    openPassLink.href = withToken("/pass", token);
    openResultLink.href = withToken("/result", token);
    statusEl.textContent = `NOVI Pass ready: ${result.participant_code}`;
    statusEl.className = "status success";
    successBox.classList.remove("hidden");
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "status error";
  }
});
