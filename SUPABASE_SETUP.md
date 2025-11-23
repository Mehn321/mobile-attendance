# Supabase Configuration for QR Attendance

## Issue: Login Fails with "Invalid Credentials"

### Root Cause
Supabase likely has **Email Confirmation** enabled, which means:
1. When you sign up, an email is sent to your address
2. You must click the verification link in that email
3. Only after verification can you login

### Fix 1: Disable Email Confirmation (Recommended for Development)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. Under "Confirm email", toggle it **OFF**
5. Click Save
6. Restart your mobile app and try again

### Fix 2: Verify Your Email
If you want to keep email confirmation ON:
1. Check your inbox at `aclonhemday@gmail.com`
2. Look for verification email from Supabase
3. Click the verification link
4. Then login should work

### Fix 3: Use a Different Email
Try signing up with a test account:
- Email: `test@example.com`
- Password: `TestPass123`

### How to Test if it Works
1. Sign up with an email and password
2. Immediately try to login with the same credentials
3. If it works, your Supabase is configured correctly
4. If it still fails after Fix 1, there may be other configuration issues

## Email Confirmation Link Fix (For Built Apps)

### The Problem
By default, Supabase email confirmation links point to `localhost`, which only works during development. Built apps need deep links.

### The Solution
We've implemented deep link handling that works on built apps:

1. **Deep Link Scheme**: `qr-attendance://auth`
2. **Email Link Format**: `qr-attendance://auth?token_hash=XXX&type=email`
3. **Handler**: App automatically opens confirm-email screen when link is clicked
4. **Verification**: App verifies token with Supabase and confirms email

### Configuration Required in Supabase

**Read full setup guide**: [SUPABASE_EMAIL_CONFIG.md](./SUPABASE_EMAIL_CONFIG.md)

**Quick steps:**
1. Go to **Authentication** → **Email Templates** → **Confirm signup**
2. Find the confirmation link section
3. Replace the default URL with:
   ```
   qr-attendance://auth?token_hash={{ .TokenHash }}&type=email
   ```
4. Save

This one change enables email confirmation links to work on:
- ✅ Development builds
- ✅ Production Android APK
- ✅ Production iOS app
- ✅ Web (with fallback URL)

## Email Confirmation Flow (Recommended for Production)

### How It Works
1. **Teacher Signs Up** → App automatically sends verification email
2. **Email Sent** → Teacher sees confirmation screen with message "Please confirm your email first"
3. **Teacher Tries to Login Before Confirming** → App blocks login and shows:
   - Message: "Please confirm your email first to login"
   - Button: "Resend Confirmation Email"
4. **Teacher Confirms Email** → Email link updates Supabase user status
5. **Teacher Can Now Login** → Full access granted

### Implementation Steps

#### Step 1: Enable Email Confirmation in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. Make sure "Confirm email" is **ON** (enabled)
5. Configure email templates if needed
6. Save changes

#### Step 2: Update Sign Up Flow
In your `SignUpTeacher.tsx` or signup component:
```javascript
// After successful signup
if (signupData.needsConfirmation) {
  // Show confirmation screen
  showEmailConfirmationScreen(email);
}
```

#### Step 3: Add Email Confirmation Screen
Create a new component to show when email needs confirmation:
```javascript
// EmailConfirmationScreen.tsx
const EmailConfirmationScreen = ({ email, onResendEmail }) => {
  return (
    <View>
      <Text>Please confirm your email first</Text>
      <Text>We sent a confirmation link to {email}</Text>
      <Button onPress={onResendEmail}>Resend Confirmation Email</Button>
    </View>
  );
};
```

#### Step 4: Block Login if Email Not Confirmed
In your `LoginTeacher.tsx` or login component:
```javascript
// Check email confirmation status before allowing login
const handleLogin = async (email, password) => {
  // First attempt login
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  // If login fails due to unconfirmed email
  if (error?.message.includes('Email not confirmed')) {
    showEmailConfirmationRequired(email);
    return;
  }
  
  // Otherwise proceed with normal login
  navigateToTeacherDashboard();
};
```

#### Step 5: Add Resend Email Function
```javascript
const resendConfirmationEmail = async (email) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });
  
  if (error) {
    showError('Failed to resend email');
  } else {
    showSuccess('Confirmation email sent!');
  }
};
```

## Debugging Steps

When you next try to sign up, check the console logs for messages like:
```
Signup response: {
  error: null,
  data: "User created" | "User needs email confirmation",
  needsConfirmation: {...}
}
```

If you see "needs email confirmation", that confirms email verification is required.
