const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
const statusEl = document.querySelector("#status");
const resultContent = document.querySelector("#resultContent");
const displayName = document.querySelector("#displayName");
const participantCode = document.querySelector("#participantCode");
const functionalScore = document.querySelector("#functionalScore");
const resultRows = document.querySelector("#resultRows");
const passLink = document.querySelector("#passLink");

function row(label, value) {
  return `<div class="result-row"><span>${label}</span><strong>${value ?? "-"}</strong></div>`;
}

function formatResult(item) {
  if (!item) return "-";
  const value = item.primary_value ?? "-";
  const unit = item.primary_unit || "";
  return `${value} ${unit}`.trim();
}

async function loadResult() {
  window.novixotShowConfigWarning("#configStatus");
  if (!token) {
    statusEl.textContent = "Missing token. Open this page from your NOVI Pass.";
    statusEl.className = "status error";
    return;
  }
  if (!window.NOVIxOTSupabase.configured()) {
    window.novixotShowConfigWarning("#status");
    return;
  }
  try {
    const data = await window.NOVIxOTSupabase.getResult(token);
    if (!data) throw new Error("Result not found.");
    displayName.textContent = data.display_name || "NOVI Participant";
    participantCode.textContent = data.participant_code || "";
    functionalScore.textContent = data.functional_score ?? "-";
    const results = data.latest_results || {};
    resultRows.innerHTML = [
      row("Hand Grip", formatResult(results.functional_hand_grip)),
      row("Dead Hang", formatResult(results.functional_dead_hang)),
      row("Recognition", formatResult(results.additional_recognition_game)),
      row("Metabolic", data.metabolic_summary || formatResult(results.metabolic_manual_input))
    ].join("");
    passLink.href = `/pass?token=${encodeURIComponent(token)}`;
    resultContent.classList.remove("hidden");
    statusEl.textContent = "Ready";
    statusEl.className = "status success";
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "status error";
  }
}

loadResult();
