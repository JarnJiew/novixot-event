# NOVI x OT Public Web

This folder contains the deploy-ready static public mobile pages:

- `register.html` and `register.js`
- `pass.html` and `pass.js`
- `result.html` and `result.js`
- `styles.css`
- `supabase-rest-client.js`
- `public-config-loader.js`
- `public-config.example.js`

## Local Testing

Open the HTML files directly in a browser. Without `public-config.js`, pages show a setup warning and do not call Supabase.

## Public Config

Copy:

```text
public-config.example.js
```

to:

```text
public-config.js
```

Fill only browser-safe values:

- Supabase project URL.
- Supabase anon or publishable key.
- Public register/pass/result URLs.
- Event code.

Never include the private Supabase server credential in this folder.

## Supabase Requirement

Apply these SQL files in order:

1. `database/supabase/schema_supabase_v1.sql`
2. `database/supabase/public_web_rpc_v1.sql`

The public web calls RPC functions. It should not select tables directly from browser code.

## Deployment

Build the static package:

```bat
python scripts\build_public_web_package.py
```

Upload `dist/public-web` to the chosen public HTTPS host. Copy and configure `public-config.js` in the deployed host environment.
