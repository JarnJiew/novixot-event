(function () {
  const fallback = {
    EVENT_CODE: "NOVI_OT_2026",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    PUBLIC_REGISTRATION_URL: "",
    PUBLIC_PASS_BASE_URL: "",
    PUBLIC_RESULT_BASE_URL: "",
    QR_PAYLOAD_MODE: "public_url"
  };

  window.NOVIXOT_PUBLIC = Object.assign({}, fallback, window.NOVIXOT_PUBLIC_CONFIG || {});

  window.novixotConfigReady = function novixotConfigReady() {
    const config = window.NOVIXOT_PUBLIC;
    return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  };

  window.novixotShowConfigWarning = function novixotShowConfigWarning(target) {
    if (window.novixotConfigReady()) return false;
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) {
      el.textContent = "Public config is not set. Copy public-config.example.js to public-config.js and fill only public Supabase values.";
      el.classList.add("warning");
    }
    return true;
  };
})();
