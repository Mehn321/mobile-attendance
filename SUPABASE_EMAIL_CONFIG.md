# Supabase Email Confirmation Setup for Built App

## Problem
The default Supabase email confirmation links redirect to `localhost`, which only works during development. Built apps need proper configuration to handle email links.

## Solution
Configure Supabase to use deep links that work on built mobile apps.

## Step-by-Step Setup

### 1. Configure Supabase Email Template

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Click **Edit** on the "Confirm signup" email template
5. Find the confirmation link section (usually contains `{{ .ConfirmationURL }}`)

**Replace this:**
```
{{ .SiteURL }}/auth/v1/callback?token_hash={{ .TokenHash }}&type=email
```

**With this:**
```
qr-attendance://auth?token_hash={{ .TokenHash }}&type=email
```

6. Click **Save**

### 2. Configure Supabase Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Under "Redirect URLs", add both URLs:
   ```
   qr-attendance://auth
   qr-attendance://auth?token_hash=*
   https://<your-app-domain>/auth/v1/callback
   ```

3. Save changes

### 3. Configure Site URL (Important)

1. Still in **Authentication** → **URL Configuration**
2. Set **Site URL** to your app's primary URL:
   - Development: `http://localhost:19000`
   - Production: `https://yourdomain.com` (or your actual domain)

3. Save

## How It Works

### Development Flow
1. User signs up → Supabase sends email with link: `qr-attendance://auth?token_hash=...&type=email`
2. User opens email → Link triggers deep link handler
3. App receives deep link → Routes to `confirm-email` screen
4. Screen verifies token with Supabase → Confirms email ✅

### Built App Flow (Android/iOS)
1. User signs up → Supabase sends email with link: `qr-attendance://auth?token_hash=...&type=email`
2. User opens email on phone → Link opens app automatically (via registered scheme)
3. App receives deep link → Routes to `confirm-email` screen
4. Screen verifies token with Supabase → Confirms email ✅

## Deep Link Configuration (Already Done in Code)

### app.json
- **iOS**: Configured `associatedDomains` for Supabase domains
- **Android**: Configured `intentFilters` to intercept `qr-attendance://` links
- **Scheme**: `qr-attendance` - the custom URL scheme for your app

### app/_layout.tsx
- Listens for initial deep links when app opens
- Listens for new deep links while app is running
- Routes to `confirm-email` screen with token

### app/(auth)/confirm-email.tsx
- Receives `token_hash` and `type` from deep link
- Uses `supabase.auth.verifyOtp()` to confirm email
- Shows success/error messages
- Redirects to login on success

## Testing

### Test with Development Build

1. Run app in development:
   ```bash
   npm run start  # or npx expo start
   ```

2. Create account with valid email

3. Check email inbox for confirmation link

4. Click the link in the email (on your device, not computer)

5. Should see "Confirming your email..." then "Email Confirmed!" screen

6. Should redirect to login

### Test with Built App (Android)

1. Build APK:
   ```bash
   eas build --platform android --local
   ```

2. Install on device

3. Create account with valid email

4. Check email on device

5. Click link → Should open app and confirm email

### Test with Built App (iOS)

1. Build for simulator:
   ```bash
   eas build --platform ios --local
   ```

2. Open in Xcode Simulator

3. Create account with valid email

4. Check email

5. Click link → Should open app and confirm email

## Troubleshooting

### Email link doesn't open app

**Check:**
1. Deep link URL in email matches `qr-attendance://...`
2. `app.json` has correct `scheme` configuration
3. App is installed on device (not just development mode)
4. For Android: App is default handler for `qr-attendance://` links

**Fix:**
- Rebuild app if you changed `app.json`
- For Android: May need to open link in external browser first to prompt "Open with" dialog

### "Invalid confirmation link" error

**Check:**
1. Token in URL is complete (not truncated)
2. Token hasn't expired (usually 1 hour limit)
3. User's email address matches in Supabase

**Fix:**
- Use "Resend Confirmation Email" button to get new token
- Confirm email quickly after signing up

### Email not received

**Check:**
1. Email address is spelled correctly
2. Check spam/junk folder
3. Supabase project allows email sending

**Fix:**
- Check Supabase email logs in Dashboard
- May need to configure SMTP for production

## Email Template Customization

You can customize the confirmation email in Supabase:

1. Go to **Authentication** → **Email Templates** → **Confirm signup**
2. Edit HTML/text
3. Keep the token link: `qr-attendance://auth?token_hash={{ .TokenHash }}&type=email`
4. Add your branding, instructions, etc.

Example custom link text:
```html
<a href="qr-attendance://auth?token_hash={{ .TokenHash }}&type=email">
  Confirm My Email
</a>
```

## Production Checklist

- [ ] Email template uses `qr-attendance://auth?token_hash=...` format
- [ ] Redirect URLs configured in Supabase
- [ ] Site URL matches your production domain
- [ ] App built with correct bundle ID/package name
- [ ] Deep link handler added to app (_layout.tsx)
- [ ] confirm-email.tsx screen exists
- [ ] Tested with built app on device
- [ ] Email sending working (check Supabase logs)
- [ ] Token verification working (test with confirm-email screen)

## Important Files

- `app.json` - Deep link scheme and platform configuration
- `app/_layout.tsx` - Deep link event listeners
- `app/(auth)/confirm-email.tsx` - Email confirmation handler
- `hooks/useAuth.ts` - Auth logic with email confirmation check
- `app/(auth)/email-confirmation.tsx` - Post-signup confirmation screen
- `app/(auth)/email-confirmation-required.tsx` - Login-time confirmation screen

## Links

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Expo Deep Linking Docs](https://docs.expo.dev/guides/deep-linking/)
- [Expo Build Docs](https://docs.expo.dev/build/introduction/)
