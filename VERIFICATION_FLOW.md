# Phone Verification Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tutor Onboarding - Step 3                    │
│                    (Contact Information)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  User enters phone number: +2348012345678                       │
│  [Phone Input Field] [Send Code Button]                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User clicks "Send Code"
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: POST /api/verify-phone/send                         │
│  Body: { phone: "+2348012345678" }                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API Route: app/api/verify-phone/send/route.ts         │
│  - Validates phone number                                       │
│  - Checks Twilio credentials                                    │
│  - Calls Twilio Verify API                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Twilio Verify Service                                          │
│  - Generates 6-digit code                                       │
│  - Sends SMS to phone number                                    │
│  - Returns verification status                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  User receives SMS: "Your verification code is: 123456"        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI Updates:                                                    │
│  - Shows verification code input field                          │
│  - Shows blue info box with instructions                        │
│  - "Send Code" button changes to "Resend Code"                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User enters code
                              │
┌─────────────────────────────────────────────────────────────────┐
│  User enters: 1 2 3 4 5 6                                      │
│  [Verification Code Input] [Verify Button]                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User clicks "Verify"
                              │
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: POST /api/verify-phone/verify                       │
│  Body: { phone: "+2348012345678", code: "123456" }            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API Route: app/api/verify-phone/verify/route.ts      │
│  - Validates phone and code                                     │
│  - Checks Twilio credentials                                    │
│  - Calls Twilio Verify Check API                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Twilio Verify Service                                          │
│  - Validates code against phone number                          │
│  - Checks if code is expired (10 min limit)                    │
│  - Returns approved/denied status                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              ┌──────────┐        ┌──────────┐
              │ SUCCESS  │        │  FAILED  │
              └──────────┘        └──────────┘
                    │                   │
                    ▼                   ▼
    ┌───────────────────────┐   ┌──────────────────────┐
    │ UI Updates:           │   │ UI Shows Error:      │
    │ - Green "Verified"    │   │ - Red error message  │
    │   badge appears       │   │ - "Invalid code"     │
    │ - Phone input locked  │   │ - User can retry     │
    │ - phoneVerified=true  │   │                      │
    │ - Continue enabled    │   │                      │
    └───────────────────────┘   └──────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │ User clicks "Continue"                │
    │ Proceeds to Step 4 (Bank Details)    │
    └───────────────────────────────────────┘
```

## State Management

```typescript
// Form Data
formData: {
  phone: string              // Phone number entered
  phoneVerified: boolean     // Verification status
  verificationCode: string   // 6-digit code entered
}

// Verification States
isVerifying: boolean         // Loading state
verificationSent: boolean    // Code sent status
verificationError: string    // Error messages
```

## Validation Logic

```typescript
// Step 3 is valid only when:
isStep3Valid = formData.phone && formData.phoneVerified

// Continue button is:
disabled={!isStep3Valid}
```

## API Endpoints

### POST /api/verify-phone/send
**Request:**
```json
{
  "phone": "+2348012345678"
}
```

**Success Response:**
```json
{
  "success": true,
  "status": "pending",
  "message": "Verification code sent successfully"
}
```

**Error Response:**
```json
{
  "error": "Failed to send verification code"
}
```

### POST /api/verify-phone/verify
**Request:**
```json
{
  "phone": "+2348012345678",
  "code": "123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "verified": true,
  "message": "Phone number verified successfully"
}
```

**Error Response:**
```json
{
  "error": "Invalid verification code"
}
```

## Security Features

1. **Server-side validation** - All verification happens on backend
2. **Time-limited codes** - Expire after 10 minutes
3. **One-time use** - Each code can only be used once
4. **Rate limiting** - Twilio prevents spam
5. **Secure storage** - Credentials in environment variables

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Server configuration error | Missing env variables | Add Twilio credentials |
| Failed to send code | Invalid phone format | Use +234... format |
| Invalid verification code | Wrong/expired code | Request new code |
| Phone number required | Empty phone field | Enter phone number |

## Testing Checklist

- [ ] Install twilio package
- [ ] Set up Twilio account
- [ ] Add credentials to .env.local
- [ ] Verify test phone number (trial)
- [ ] Restart dev server
- [ ] Navigate to onboarding page
- [ ] Complete Steps 1 & 2
- [ ] Enter phone number
- [ ] Click "Send Code"
- [ ] Receive SMS
- [ ] Enter code
- [ ] Click "Verify"
- [ ] See green badge
- [ ] Continue button enabled
- [ ] Proceed to Step 4

## Production Deployment

Before going live:
1. ✅ Upgrade Twilio account
2. ✅ Add payment method
3. ✅ Remove verified number restriction
4. ✅ Set up rate limiting
5. ✅ Monitor usage/costs
6. ✅ Set up billing alerts
7. ✅ Test with real users
8. ✅ Add error logging
