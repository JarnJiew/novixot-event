(function () {
  function config() {
    return window.NOVIXOT_PUBLIC || {};
  }

  function configured() {
    const c = config();
    return Boolean(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
  }

  async function rpc(functionName, payload) {
    if (!configured()) {
      throw new Error("Public Supabase config is missing.");
    }
    const c = config();
    const response = await fetch(`${c.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: c.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${c.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload || {})
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = { message: text };
    }
    if (!response.ok) {
      const message = data && (data.message || data.error || data.details);
      throw new Error(message || `Supabase RPC failed: ${response.status}`);
    }
    return data;
  }

  window.NOVIxOTSupabase = {
    configured,
    registerParticipant(payload) {
      return rpc("public_register_participant", { payload });
    },
    getPass(token) {
      return rpc("public_get_pass", { p_token: token });
    },
    getResult(token) {
      return rpc("public_get_result", { p_token: token });
    }
  };
})();
