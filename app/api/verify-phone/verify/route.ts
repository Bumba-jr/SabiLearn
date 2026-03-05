import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json(
                { error: 'Phone number and verification code are required' },
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

        // Verify the code using Twilio Verify API
        const verificationCheck = await client.verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({
                to: phone,
                code: code,
            });

        if (verificationCheck.status === 'approved') {
            return NextResponse.json({
                success: true,
                verified: true,
                message: 'Phone number verified successfully',
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid verification code' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
