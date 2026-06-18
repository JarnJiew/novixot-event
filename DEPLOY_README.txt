NOVI x OT Public Web Deployment

Option A - Vercel Dashboard:
1. Create a new Vercel project named novixot-event.
2. Import/upload/connect this dist/public-web folder or repo root depending on workflow.
3. Ensure vercel.json is included.
4. Deploy.
5. Test:
   /register
   /pass
   /result

Option B - Vercel CLI, only if user approves:
vercel --prod

If clean routes do not work, test:
- /register.html
- /pass.html
- /result.html

Security:
- Do not include private server credentials in public files.
- public-config.js should contain only Supabase URL and anon/publishable key.
