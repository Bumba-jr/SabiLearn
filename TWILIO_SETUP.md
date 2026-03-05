# Twilio Phone Verification Setup Guide

This guide will help you set up Twilio's free trial for phone verification in the SabiLearn tutor onboarding flow.

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account
3. Verify your email address
4. Complete the phone verification for your account

## Step 2: Get Your Account Credentials

1. After logging in, you'll be on the Twilio Console Dashboard
2. Find your **Account SID** and **Auth Token** in the "Account Info" section
3. Copy these values - you'll need them for `.env.local`

## Step 3: Create a Verify Service

1. In the Twilio Console, navigate to **Explore Products** → **Verify** → **Services**
2. Click **Create new Service**
3. Give it a name (e.g., "SabiLearn Phone Verification")
4. Click **Create**
5. Copy the **Service SID** (starts with "VA...")

## Step 4: Configure Environment Variables

Add these values to your `.env.local` file:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 5: Install Twilio SDK

Run this command in your project directory:

```bash
npm install twilio
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the tutor onboarding page
3. Fill in the first two steps
4. On Step 3, enter a phone number in international format (e.g., +2348012345678)
5. Click "Send Code"
6. Check your phone for the SMS with the 6-digit code
7. Enter the code and click "Verify"

## Free Trial Limitations

- **$15.50 USD credit** included with trial
- Can send SMS to **verified phone numbers only** during trial
- To verify a phone number for testing:
  1. Go to **Phone Numbers** → **Verified Caller IDs**
  2. Click **Add a new number**
  3. Enter the phone number and verify it
- Each SMS costs approximately **$0.0075 - $0.04** depending on country
- Nigeria SMS costs approximately **$0.035** per message

## Going to Production

When ready for production:

1. Upgrade your Twilio account (no trial restrictions)
2. Add a payment method
3. You can send SMS to any phone number
4. Consider adding rate limiting to prevent abuse
5. Monitor usage in the Twilio Console

## Troubleshooting

### "Missing Twilio credentials" error
- Check that all three environment variables are set in `.env.local`
- Restart your development server after adding the variables

### "Failed to send verification code" error
- Verify the phone number is in international format (+234...)
- Check that the phone number is verified in Twilio Console (trial accounts only)
- Check Twilio Console logs for detailed error messages

### "Invalid verification code" error
- Codes expire after 10 minutes
- Each code can only be used once
- Request a new code if needed

## Alternative Free Providers

If you prefer not to use Twilio, here are alternatives:

1. **Vonage (Nexmo)** - Free trial with $2 credit
2. **MessageBird** - Free trial with €10 credit
3. **AWS SNS** - Free tier includes 100 SMS/month (requires AWS account)

## Support

- Twilio Documentation: [https://www.twilio.com/docs/verify/api](https://www.twilio.com/docs/verify/api)
- Twilio Support: [https://support.twilio.com](https://support.twilio.com)
