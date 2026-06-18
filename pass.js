const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
const statusEl = document.querySelector("#status");
const passContent = document.querySelector("#passContent");
const qrBox = document.querySelector("#qrBox");
const qrFallback = document.querySelector("#qrFallback");
const displayName = document.querySelector("#displayName");
const participantCode = document.querySelector("#participantCode");
const eventCode = document.querySelector("#eventCode");
const tokenValue = document.querySelector("#tokenValue");
const resultLink = document.querySelector("#resultLink");

function resultUrl(tokenValue) {
  return `/result?token=${encodeURIComponent(tokenValue)}`;
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = `${label} copied.`;
  } catch (error) {
    statusEl.textContent = `Copy failed. Select manually: ${text}`;
  }
}

function passPayload(tokenValue) {
  const base = window.NOVIXOT_PUBLIC.PUBLIC_PASS_BASE_URL || "/pass";
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(tokenValue)}`;
}

function renderQr(data) {
  const payload = passPayload(data.qr_token || token);
  qrFallback.classList.add("hidden");
  qrFallback.textContent = "";
  try {
    window.NOVIXOT_QR.renderSvg(qrBox, payload, { size: 292 });
  } catch (error) {
    qrBox.textContent = "";
    qrFallback.textContent = `QR rendering failed. Staff can use participant code/token. Payload: ${payload}`;
    qrFallback.classList.remove("hidden");
  }
}

async function loadPass() {
  window.novixotShowConfigWarning("#configStatus");
  if (!token) {
    statusEl.textContent = "Missing token. Open this page from your registration success link.";
    statusEl.className = "status error";
    return;
  }
  if (!window.NOVIxOTSupabase.configured()) {
    window.novixotShowConfigWarning("#status");
    return;
  }
  try {
    const data = await window.NOVIxOTSupabase.getPass(token);
    if (!data) throw new Error("Pass not found.");
    displayName.textContent = data.display_name || "-";
    participantCode.textContent = data.participant_code || "-";
    eventCode.textContent = data.event_code || "-";
    tokenValue.textContent = data.qr_token || token;
    resultLink.href = resultUrl(data.qr_token || token);
    renderQr(data);
    passContent.classList.remove("hidden");
    statusEl.textContent = "Ready";
    statusEl.className = "status success";
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "status error";
  }
}

document.querySelector("#copyTokenBtn").addEventListener("click", () => copy(tokenValue.textContent, "Token"));
document.querySelector("#copyCodeBtn").addEventListener("click", () => copy(participantCode.textContent, "Participant code"));

loadPass();
