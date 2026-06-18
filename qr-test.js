const payloadInput = document.querySelector("#payloadInput");
const payloadOutput = document.querySelector("#payloadOutput");
const qrTestBox = document.querySelector("#qrTestBox");
const generateBtn = document.querySelector("#generateBtn");
const expectedScanValue = document.querySelector("#expectedScanValue");
const renderedPayloadValue = document.querySelector("#renderedPayloadValue");

const presets = {
  root: "https://novixot-event.vercel.app/",
  pass: "https://novixot-event.vercel.app/pass?token=QR-test-1234",
  token: "QR-test-1234"
};

function generateQr() {
  const payload = payloadInput.value.trim();
  payloadOutput.textContent = payload ? "Payload rendered above." : "Enter a payload.";
  expectedScanValue.textContent = payload || "-";
  renderedPayloadValue.textContent = "-";
  qrTestBox.textContent = "";
  if (!payload) return;

  try {
    window.NOVIXOT_QR.renderSvg(qrTestBox, payload, { size: 280, quiet: 4, ecc: "M", label: "NOVI QR test" });
    renderedPayloadValue.textContent = qrTestBox.dataset.qrPayload || payload;
  } catch (error) {
    qrTestBox.textContent = `QR generation failed: ${error.message}`;
  }
}

generateBtn.addEventListener("click", generateQr);
payloadInput.addEventListener("input", generateQr);
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    payloadInput.value = presets[button.dataset.preset];
    generateQr();
  });
});
generateQr();
