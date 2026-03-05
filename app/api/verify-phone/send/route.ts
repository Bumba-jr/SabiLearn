import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!accountSid || !authToken || !verifyServiceSid) {
            console.error('Missing Twilio credentials');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const client = twilio(accountSid, authToken);

        // Send verification code using Twilio Verify API
        const verification = await client.verify.v2
            .services(verifyServiceSid)
            .verifications.create({
                to: phone,
                channel: 'sms',
            });

        return NextResponse.json({
            success: true,
            status: verification.status,
            message: 'Verification code sent successfully',
        });
    } catch (error) {
        console.error('Error sending verification code:', error);
        return NextResponse.json(
            { error: 'Failed to send verification code' },
            { status: 500 }
        );
    }
}
