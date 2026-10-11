# Google sign-in setup

Google Auth Platform project: aetherhold-defense. Create an External audience and add test users while testing. Create a Web application OAuth client with this exact authorized redirect URI:

```
https://aetherhold-defense.ljournllagas.workers.dev/api/auth/callback
```

The app uses a server authorization-code callback, so a JavaScript origin is not required. If adding one, use `https://aetherhold-defense.ljournllagas.workers.dev` without a path. No Google API key or Firebase project is required.

Configure the Worker secrets from the project folder; prompts accept credentials without printing them:

```powershell
rtk proxy npx wrangler secret put GOOGLE_CLIENT_ID
rtk proxy npx wrangler secret put GOOGLE_CLIENT_SECRET
```

Both secret names were verified on 2026-10-11; values were not inspected. Worker variables configure APP_ORIGIN and ACCOUNT_LOGIN_REQUIRED. During controlled acceptance login enforcement remains disabled (`0`); authenticated accounts use cloud saves, guests retain compatibility. After real Google acceptance set enforcement to `1` and deploy. Missing configuration never enables guest access unless enforcement is explicitly `0`.

Account deletion requires the signed Google `auth_time` claim. In Google Auth Platform Settings, enable the authentication-time session metadata setting referenced by Google's OIDC documentation. The deletion flow requests this claim. Google consent/account selection alone does not establish recent authentication: if your Google session is older than five minutes, sign out/sign in on Google's site and retry. Missing metadata fails safely without deleting the account.

For local development create a separate OAuth client, register `http://localhost:5173/api/auth/callback`, and put client credentials plus `APP_ORIGIN=http://localhost:5173` in the git-ignored `.dev.vars`. Run Wrangler on port 8787 and Vite on 5173; Vite already proxies /api. The localhost cookie is development-only; production sessions use a Secure, HttpOnly, host-only cookie. Do not commit credentials or paste them into chat.

Before public release, move the Google audience to production as appropriate and supply the branding/privacy information Google requires. Use normal Chrome/Edge for sign-in; Google may block embedded browsers.

References: [Google Auth Platform setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Google OIDC and auth_time settings](https://developers.google.com/identity/openid-connect/openid-connect), [Google supported OAuth parameters](https://developers.google.com/identity/openid-connect/reference).
