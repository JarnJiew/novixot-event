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
const qrPayloadNote = document.querySelector("#qrPayloadNote");
const qrPayloadValue = document.querySelector("#qrPayloadValue");
const copyQrUrlBtn = document.querySelector("#copyQrUrlBtn");

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

function buildPassQrPayload(tokenValue) {
  const config = window.NOVIXOT_PUBLIC_CONFIG || window.NOVIXOT_PUBLIC || {};
  const mode = config.QR_PAYLOAD_MODE || "public_url";
  if (mode === "token_only") {
    return tokenValue;
  }

  const base = config.PUBLIC_PASS_BASE_URL || `${window.location.origin}/pass`;
  const url = new URL(base, window.location.origin);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/pass";
  }
  url.searchParams.set("token", tokenValue);
  return url.toString();
}

function renderQr(data) {
  const qrPayload = buildPassQrPayload(data.qr_token || token);
  qrFallback.classList.add("hidden");
  qrFallback.textContent = "";
  if (qrPayloadNote) {
    qrPayloadNote.textContent = (window.NOVIXOT_PUBLIC_CONFIG || window.NOVIXOT_PUBLIC || {}).QR_PAYLOAD_MODE === "token_only"
      ? "QR contains station token"
      : "QR opens this pass";
  }
  if (qrPayloadValue) {
    qrPayloadValue.textContent = qrPayload;
  }
  try {
    window.NOVIXOT_QR.renderSvg(qrBox, qrPayload, { size: 280, quiet: 4, ecc: "M" });
  } catch (error) {
    qrBox.textContent = "";
    qrFallback.textContent = `QR rendering failed. Staff can use participant code/token. Payload: ${qrPayload}`;
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
copyQrUrlBtn.addEventListener("click", () => copy(qrPayloadValue.textContent, "QR URL"));

window.buildPassQrPayload = buildPassQrPayload;
loadPass();
