const payloadInput = document.querySelector("#payloadInput");
const payloadOutput = document.querySelector("#payloadOutput");
const qrTestBox = document.querySelector("#qrTestBox");
const generateBtn = document.querySelector("#generateBtn");

function generateQr() {
  const payload = payloadInput.value.trim();
  payloadOutput.textContent = payload ? `Payload: ${payload}` : "Enter a payload.";
  qrTestBox.textContent = "";
  if (!payload) return;

  try {
    window.NOVIXOT_QR.renderSvg(qrTestBox, payload, { size: 280, quiet: 4, ecc: "M", label: "NOVI QR test" });
  } catch (error) {
    qrTestBox.textContent = `QR generation failed: ${error.message}`;
  }
}

generateBtn.addEventListener("click", generateQr);
payloadInput.addEventListener("input", generateQr);
generateQr();
