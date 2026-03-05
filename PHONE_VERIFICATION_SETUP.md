# Phone Verification Setup - Quick Start

## What Was Done

I've implemented phone verification for the tutor onboarding process using Twilio's Verify API. Here's what was added:

### 1. API Routes Created

- **`app/api/verify-phone/send/route.ts`** - Sends OTP code to phone number
- **`app/api/verify-phone/verify/route.ts`** - Verifies the OTP code

### 2. Frontend Integration

The tutor onboarding page (Step 3) now includes:
- Phone number input field
- "Send Code" button to request OTP
- Verification code input (6 digits)
- "Verify" button to confirm the code
- Visual feedback (verified badge, error messages)
- Form validation that requires phone verification before proceeding

### 3. Environment Variables

Added to `.env.local`:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
```

## Next Steps to Complete Setup

### Step 1: Install Twilio Package

Run this command:
```bash
npm install twilio
```

### Step 2: Set Up Twilio Account

Follow the detailed guide in `TWILIO_SETUP.md` or quick steps:

1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the dashboard
3. Create a Verify Service and get the Service SID
4. Update `.env.local` with your credentials

### Step 3: Verify Test Phone Numbers (Trial Only)

During the free trial, you can only send SMS to verified numbers:

1. Go to Twilio Console → **Phone Numbers** → **Verified Caller IDs**
2. Add and verify the phone numbers you want to test with
3. Use these numbers during development

### Step 4: Test the Flow

1. Start dev server: `npm run dev`
2. Go to tutor onboarding: `http://localhost:3000/onboarding/tutor`
3. Complete Steps 1 and 2
4. On Step 3, enter a verified phone number (e.g., +2348012345678)
5. Click "Send Code"
6. Check your phone for the SMS
7. Enter the 6-digit code
8. Click "Verify"
9. You should see a green "Verified" badge
10. Continue to Step 4

## How It Works

1. User enters phone number in international format (+234...)
2. Clicks "Send Code" → API calls Twilio Verify to send SMS
3. User receives 6-digit code via SMS
4. User enters code and clicks "Verify"
5. API verifies code with Twilio
6. If valid, `phoneVerified` is set to `true`
7. Continue button becomes enabled

## Cost Estimate (Free Trial)

- Free trial includes **$15.50 USD credit**
- Nigeria SMS: ~**$0.035 per message**
- You can send approximately **440 SMS** with trial credit
- Each verification uses 1 SMS (unless user requests resend)

## Production Considerations

When going live:
1. Upgrade Twilio account (removes verified number restriction)
2. Add rate limiting to prevent abuse
3. Consider adding phone number validation
4. Monitor usage in Twilio Console
5. Set up billing alerts

## Troubleshooting

**Server configuration error**
- Make sure all 3 Twilio env variables are set
- Restart dev server after adding variables

**Failed to send code**
- Check phone number format (+234...)
- Verify number is added to Verified Caller IDs (trial only)
- Check Twilio Console logs

**Invalid verification code**
- Codes expire after 10 minutes
- Each code can only be used once
- Request new code if needed

## Files Modified/Created

- ✅ `app/api/verify-phone/send/route.ts` (new)
- ✅ `app/api/verify-phone/verify/route.ts` (new)
- ✅ `app/onboarding/tutor/page.tsx` (already updated)
- ✅ `.env.local` (Twilio variables added)
- ✅ `TWILIO_SETUP.md` (detailed setup guide)
- ⏳ `package.json` (needs `npm install twilio`)

## Ready to Test?

Run these commands:
```bash
# Install Twilio
npm install twilio

# Start dev server
npm run dev
```

Then follow the Twilio setup guide to get your credentials!
