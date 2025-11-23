# Quick Email Confirmation Fix for Built App

## One-Time Supabase Setup (5 minutes)

### Step 1: Open Supabase Email Template
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Authentication** in left menu
4. Click **Email Templates** tab
5. Click **Edit** on "Confirm signup" template

### Step 2: Update Confirmation Link
Find this line in the template:
```
{{ .SiteURL }}/auth/v1/callback?token_hash={{ .TokenHash }}&type=email
```

Replace it with:
```
qr-attendance://auth?token_hash={{ .TokenHash }}&type=email
```

Click **Save**

### Step 3: Configure Redirect URLs
1. Go back to **Authentication** section
2. Click **URL Configuration** tab
3. Add to **Redirect URLs**:
   ```
   qr-attendance://auth
   qr-attendance://auth?token_hash=*
   ```
4. Click **Save**

**Done!** ✅

## What Happens Now

When user clicks email confirmation link:
- Link format: `qr-attendance://auth?token_hash=ABC123&type=email`
- App opens automatically (if installed)
- Confirmation screen appears
- Token verified with Supabase
- Email confirmed in backend

## Works On

✅ Development app  
✅ Android APK (production build)  
✅ iOS app (production build)  
✅ Expo Go  
✅ EAS Build apps  

## Testing

1. Sign up with valid email in app
2. Check email inbox
3. Click confirmation link from phone
4. App opens and confirms email
5. See "Email Confirmed!" message
6. Redirect to login

## If It Doesn't Work

**Link not opening app?**
- Make sure app is installed on device (not just running in Expo)
- On Android: May prompt "Open with" dialog first time
- Rebuild app if you changed app.json

**"Invalid confirmation link" error?**
- Make sure Supabase email template was updated
- Check that token_hash in URL is complete
- Tokens expire after 1 hour - resend if needed

**Email not received?**
- Check spam/junk folder
- Check email address is correct
- Wait a few seconds (email can be slow)

## Code Already Implemented

You don't need to change any code! We've already set up:
- ✅ Deep link handlers in `app/_layout.tsx`
- ✅ Confirmation screen in `app/(auth)/confirm-email.tsx`
- ✅ Deep link scheme in `app.json`
- ✅ Email templates with verification

Just configure Supabase and you're done!

## Questions?

See full guide: [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md)
