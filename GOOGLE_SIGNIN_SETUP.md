# Google Sign-In Setup

Google Sign-In uses the **Google Identity Services (GIS) token flow**: the button
returns an ID token to the browser, which is posted to `POST /auth/google`. The API
verifies it with `google-auth-library`, finds-or-creates the user, and issues the same
`accessToken`/`refreshToken` cookies as email/password login. No redirect URIs required.

## 1. Create an OAuth Client ID

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**, then fill in app name + support email.
   - Scopes: `openid`, `email`, `profile` (the defaults are enough).
   - While the consent screen is in **Testing**, add your Google account under **Test users**
     (or click **Publish app** to allow anyone).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorized JavaScript origins** — add every origin the button loads from
     (exact scheme + host + port, **no path, no trailing slash**):
     - `http://localhost:3010`  ← local web dev (`next dev -p 3010`)
     - `https://agentb.netlify.app`
     - `https://agentbazaar.vercel.app`
     - any custom production domain
   - **Authorized redirect URIs**: leave empty — the token flow does not use them.
4. Click **Create** and copy the **Client ID**
   (looks like `1234567890-abcdef.apps.googleusercontent.com`).

## 2. Set the environment variables

The **same** Client ID goes in two variables — the API verifies tokens, the web app
renders the button:

```
GOOGLE_CLIENT_ID="<your-client-id>.apps.googleusercontent.com"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="<your-client-id>.apps.googleusercontent.com"
```

- **Local:** add both to your root `.env`.
- **Production:** set `GOOGLE_CLIENT_ID` in the **API** host (Vercel) and
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the **web** host (Netlify). `NEXT_PUBLIC_*` is
  inlined at build time, so redeploy the web app after setting it.

> If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is unset, the button simply doesn't render —
> email/password login is unaffected.

## 3. Apply the database change

The `User` model changed: `passwordHash` is now optional, and `googleId` + `avatarUrl`
were added. Sync it (requires `DATABASE_URL` and `DIRECT_URL` in your env):

```
pnpm db:push
```

## How accounts link

- New Google user → account created (verified email, auto-generated unique username, no password).
- Google email matches an existing email/password account → the Google identity is
  linked to it, so both sign-in methods work.
- An existing Google-only user who tries email/password login gets a clear message to
  continue with Google.
