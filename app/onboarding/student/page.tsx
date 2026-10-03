'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BookOpen, ChevronDown, Check, Search, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DraftFileInput } from '@/components/onboarding/DraftFileInput';
import { FixedSelect } from '@/components/FixedSelect';
import { ProfilePhotoInput } from '@/components/onboarding/ProfilePhotoInput';

import {
    validateDraftsWithServer,
    cleanupStaleDraftReferences,
    clearAllDraftReferences
} from '@/lib/utils/draft-restoration';
import { type DraftMetadata, type FileType } from '@/lib/db/draft-operations';
import gsap from 'gsap';

const SUBJECTS = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'Government', 'Literature', 'Geography', 'Computer Science',
];

const GRADE_LEVELS = {
    primary: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    secondary: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'],
};

const EXAM_TYPES = ['WAEC', 'JAMB', 'IGCSE', 'Daily Schoolwork'];

const NIGERIAN_BANKS = [
    { value: 'Access Bank', label: 'Access Bank', logo: 'https://nigerianbanks.xyz/logo/access-bank.png' },
    { value: 'Access Bank (Diamond)', label: 'Access Bank (Diamond)', logo: 'https://nigerianbanks.xyz/logo/access-bank-diamond.png' },
    { value: 'ALAT by WEMA', label: 'ALAT by WEMA', logo: 'https://nigerianbanks.xyz/logo/alat-by-wema.png' },
    { value: 'ASO Savings and Loans', label: 'ASO Savings and Loans', logo: 'https://nigerianbanks.xyz/logo/asosavings.png' },
    { value: 'Bowen Microfinance Bank', label: 'Bowen Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'CEMCS Microfinance Bank', label: 'CEMCS Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/cemcs-microfinance-bank.png' },
    { value: 'Citibank Nigeria', label: 'Citibank Nigeria', logo: 'https://nigerianbanks.xyz/logo/citibank-nigeria.png' },
    { value: 'Ecobank Nigeria', label: 'Ecobank Nigeria', logo: 'https://nigerianbanks.xyz/logo/ecobank-nigeria.png' },
    { value: 'Ekondo Microfinance Bank', label: 'Ekondo Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/ekondo-microfinance-bank.png' },
    { value: 'Fidelity Bank', label: 'Fidelity Bank', logo: 'https://nigerianbanks.xyz/logo/fidelity-bank.png' },
    { value: 'First Bank of Nigeria', label: 'First Bank of Nigeria', logo: 'https://nigerianbanks.xyz/logo/first-bank-of-nigeria.png' },
    { value: 'First City Monument Bank', label: 'First City Monument Bank', logo: 'https://nigerianbanks.xyz/logo/first-city-monument-bank.png' },
    { value: 'Globus Bank', label: 'Globus Bank', logo: 'https://nigerianbanks.xyz/logo/globus-bank.png' },
    { value: 'Guaranty Trust Bank', label: 'Guaranty Trust Bank', logo: 'https://nigerianbanks.xyz/logo/guaranty-trust-bank.png' },
    { value: 'Heritage Bank', label: 'Heritage Bank', logo: 'https://nigerianbanks.xyz/logo/heritage-bank.png' },
    { value: 'Jaiz Bank', label: 'Jaiz Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Keystone Bank', label: 'Keystone Bank', logo: 'https://nigerianbanks.xyz/logo/keystone-bank.png' },
    { value: 'Kuda Bank', label: 'Kuda Bank', logo: 'https://nigerianbanks.xyz/logo/kuda-bank.png' },
    { value: 'Lotus Bank', label: 'Lotus Bank', logo: 'https://nigerianbanks.xyz/logo/lotus-bank.png' },
    { value: 'Moniepoint MFB', label: 'Moniepoint MFB', logo: 'https://nigerianbanks.xyz/logo/moniepoint-mfb-ng.png' },
    { value: 'OPay', label: 'OPay', logo: 'https://nigerianbanks.xyz/logo/paycom.png' },
    { value: 'Paga', label: 'Paga', logo: 'https://nigerianbanks.xyz/logo/paga.png' },
    { value: 'PalmPay', label: 'PalmPay', logo: 'https://nigerianbanks.xyz/logo/palmpay.png' },
    { value: 'Parallex Bank', label: 'Parallex Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Polaris Bank', label: 'Polaris Bank', logo: 'https://nigerianbanks.xyz/logo/polaris-bank.png' },
    { value: 'Providus Bank', label: 'Providus Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Rubies MFB', label: 'Rubies MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Sparkle Microfinance Bank', label: 'Sparkle Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/sparkle-microfinance-bank.png' },
    { value: 'Stanbic IBTC Bank', label: 'Stanbic IBTC Bank', logo: 'https://nigerianbanks.xyz/logo/stanbic-ibtc-bank.png' },
    { value: 'Standard Chartered Bank', label: 'Standard Chartered Bank', logo: 'https://nigerianbanks.xyz/logo/standard-chartered-bank.png' },
    { value: 'Sterling Bank', label: 'Sterling Bank', logo: 'https://nigerianbanks.xyz/logo/sterling-bank.png' },
    { value: 'Suntrust Bank', label: 'Suntrust Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'TAJ Bank', label: 'TAJ Bank', logo: 'https://nigerianbanks.xyz/logo/taj-bank.png' },
    { value: 'TCF MFB', label: 'TCF MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Titan Trust Bank', label: 'Titan Trust Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Union Bank of Nigeria', label: 'Union Bank of Nigeria', logo: 'https://nigerianbanks.xyz/logo/union-bank-of-nigeria.png' },
    { value: 'United Bank For Africa', label: 'United Bank For Africa', logo: 'https://nigerianbanks.xyz/logo/united-bank-for-africa.png' },
    { value: 'Unity Bank', label: 'Unity Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'VFD', label: 'VFD', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Wema Bank', label: 'Wema Bank', logo: 'https://nigerianbanks.xyz/logo/wema-bank.png' },
    { value: 'Zenith Bank', label: 'Zenith Bank', logo: 'https://nigerianbanks.xyz/logo/zenith-bank.png' },
    // Additional Banks
    { value: '9mobile 9Payment Service Bank', label: '9mobile 9Payment Service Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Abbey Mortgage Bank', label: 'Abbey Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Above Only MFB', label: 'Above Only MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Accion Microfinance Bank', label: 'Accion Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Ahmadu Bello University Microfinance Bank', label: 'Ahmadu Bello University Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Airtel Smartcash PSB', label: 'Airtel Smartcash PSB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'AKU Microfinance Bank', label: 'AKU Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Amju Unique MFB', label: 'Amju Unique MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Astrapolaris MFB', label: 'Astrapolaris MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Bainescredit MFB', label: 'Bainescredit MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Carbon', label: 'Carbon', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Chanelle Microfinance Bank Limited', label: 'Chanelle Microfinance Bank Limited', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Coronation Merchant Bank', label: 'Coronation Merchant Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Eyowo', label: 'Eyowo', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Fairmoney Microfinance Bank', label: 'Fairmoney Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Firmus MFB', label: 'Firmus MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'FSDH Merchant Bank Limited', label: 'FSDH Merchant Bank Limited', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'GoMoney', label: 'GoMoney', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Greenwich Merchant Bank', label: 'Greenwich Merchant Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Hackman Microfinance Bank', label: 'Hackman Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Hasal Microfinance Bank', label: 'Hasal Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Ibile Microfinance Bank', label: 'Ibile Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Infinity MFB', label: 'Infinity MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Lagos Building Investment Company Plc', label: 'Lagos Building Investment Company Plc', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Links MFB', label: 'Links MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Living Trust Mortgage Bank', label: 'Living Trust Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Mayfair MFB', label: 'Mayfair MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Mint MFB', label: 'Mint MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'MTN Momo PSB', label: 'MTN Momo PSB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Nova Merchant Bank', label: 'Nova Merchant Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Optimus Bank', label: 'Optimus Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Parkway - ReadyCash', label: 'Parkway - ReadyCash', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Paycom', label: 'Paycom', logo: 'https://nigerianbanks.xyz/logo/paycom.png' },
    { value: 'Petra Microfinance Bank Plc', label: 'Petra Microfinance Bank Plc', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'QuickFund MFB', label: 'QuickFund MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Rand Merchant Bank', label: 'Rand Merchant Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Refuge Mortgage Bank', label: 'Refuge Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Renmoney MFB', label: 'Renmoney MFB', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Brent Mortgage Bank', label: 'Brent Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Cellulant', label: 'Cellulant', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Covenant Microfinance Bank', label: 'Covenant Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Etranzact', label: 'Etranzact', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'FBN Merchant Bank', label: 'FBN Merchant Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Flutterwave', label: 'Flutterwave', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Fortis Microfinance Bank', label: 'Fortis Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Gateway Mortgage Bank', label: 'Gateway Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Haggai Mortgage Bank Limited', label: 'Haggai Mortgage Bank Limited', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Infinity Trust Mortgage Bank', label: 'Infinity Trust Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Interswitch', label: 'Interswitch', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Mutual Trust Microfinance Bank', label: 'Mutual Trust Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'New Prudential Bank', label: 'New Prudential Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'NPF Microfinance Bank', label: 'NPF Microfinance Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'One Finance', label: 'One Finance', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Page MFBank', label: 'Page MFBank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Payattitude Online', label: 'Payattitude Online', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Paystack', label: 'Paystack', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'SafeTrust Mortgage Bank', label: 'SafeTrust Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Tangerine Money', label: 'Tangerine Money', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Titan Paystack', label: 'Titan Paystack', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'Trustbond Mortgage Bank', label: 'Trustbond Mortgage Bank', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
    { value: 'VFD Microfinance Bank Limited', label: 'VFD Microfinance Bank Limited', logo: 'https://nigerianbanks.xyz/logo/default-image.png' },
];

const NIGERIAN_STATES_WITH_LGAS: Record<string, string[]> = {
    'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South'],
    'Adamawa': ['Demsa', 'Fufure', 'Ganye', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde'],
    'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo'],
    'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South'],
    'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa'],
    'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama'],
    'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East'],
    'Borno': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa'],
    'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase'],
    'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East'],
    'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North'],
    'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East'],
    'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West'],
    'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South'],
    'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe'],
    'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte'],
    'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse'],
    'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
    'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala'],
    'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa'],
    'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo'],
    'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji'],
    'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East'],
    'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
    'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi'],
    'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga'],
    'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North'],
    'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-West'],
    'Osun': ['Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire'],
    'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North'],
    'Plateau': ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North'],
    'Rivers': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru'],
    'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo'],
    'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol'],
    'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam'],
    'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum'],
    'FCT': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council']
};

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

function BouncingBalls({ isHovered }: { isHovered: boolean }) {
    const [balls, setBalls] = useState<Ball[]>([
        { x: 180, y: 180, vx: 0.5, vy: 0.3, radius: 12 },
        { x: 130, y: 150, vx: -0.3, vy: 0.4, radius: 12 },
        { x: 150, y: 120, vx: 0.4, vy: -0.35, radius: 12 },
    ]);

    const containerSize = 256;
    const circleRadius = 256;

    useEffect(() => {
        const animate = () => {
            setBalls(prevBalls => {
                const newBalls = prevBalls.map(ball => ({ ...ball }));

                // Speed multiplier when hovered - increased to 5x for dramatic effect
                const speedMultiplier = isHovered ? 5 : 1;

                // Update positions
                newBalls.forEach(ball => {
                    ball.x += ball.vx * speedMultiplier;
                    ball.y += ball.vy * speedMultiplier;
                });

                // Check for ball-to-ball collisions
                for (let i = 0; i < newBalls.length; i++) {
                    for (let j = i + 1; j < newBalls.length; j++) {
                        const ball1 = newBalls[i];
                        const ball2 = newBalls[j];

                        const dx = ball2.x - ball1.x;
                        const dy = ball2.y - ball1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = ball1.radius + ball2.radius;

                        // If balls are colliding or very close
                        if (distance <= minDistance) {
                            // Prevent division by zero
                            const actualDistance = Math.max(distance, 0.1);

                            // Normalize collision vector
                            const nx = dx / actualDistance;
                            const ny = dy / actualDistance;

                            // Calculate relative velocity
                            const dvx = ball1.vx - ball2.vx;
                            const dvy = ball1.vy - ball2.vy;

                            // Relative velocity along collision normal
                            const dvn = dvx * nx + dvy * ny;

                            // Don't resolve if velocities are separating
                            if (dvn > 0) {
                                // Apply impulse (simplified for equal mass)
                                ball1.vx -= dvn * nx;
                                ball1.vy -= dvn * ny;
                                ball2.vx += dvn * nx;
                                ball2.vy += dvn * ny;
                            }

                            // Separate overlapping balls
                            const overlap = minDistance - actualDistance + 1;
                            const separateX = (overlap / 2) * nx;
                            const separateY = (overlap / 2) * ny;

                            ball1.x -= separateX;
                            ball1.y -= separateY;
                            ball2.x += separateX;
                            ball2.y += separateY;
                        }
                    }
                }

                // Check for wall collisions
                newBalls.forEach(ball => {
                    const dx = ball.x - containerSize;
                    const dy = ball.y - containerSize;
                    const distanceFromCorner = Math.sqrt(dx * dx + dy * dy);

                    if (distanceFromCorner + ball.radius > circleRadius) {
                        const angle = Math.atan2(dy, dx);
                        const normalX = Math.cos(angle);
                        const normalY = Math.sin(angle);
                        const dotProduct = ball.vx * normalX + ball.vy * normalY;
                        ball.vx = ball.vx - 2 * dotProduct * normalX;
                        ball.vy = ball.vy - 2 * dotProduct * normalY;
                        const targetDistance = circleRadius - ball.radius - 2;
                        ball.x = containerSize + normalX * targetDistance;
                        ball.y = containerSize + normalY * targetDistance;
                    }

                    // Boundary checks
                    if (ball.x > containerSize - ball.radius) {
                        ball.x = containerSize - ball.radius;
                        ball.vx = -Math.abs(ball.vx);
                    }
                    if (ball.y > containerSize - ball.radius) {
                        ball.y = containerSize - ball.radius;
                        ball.vy = -Math.abs(ball.vy);
                    }
                    if (ball.x < ball.radius) {
                        ball.x = ball.radius;
                        ball.vx = Math.abs(ball.vx);
                    }
                    if (ball.y < ball.radius) {
                        ball.y = ball.radius;
                        ball.vy = Math.abs(ball.vy);
                    }
                });

                return newBalls;
            });
        };
        const interval = setInterval(animate, 1000 / 60);
        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <div className="absolute" style={{ width: containerSize, height: containerSize, bottom: 0, right: 0, overflow: 'hidden' }}>
            {balls.map((ball, index) => (
                <div
                    key={index}
                    className="absolute rounded-full shadow-lg transition-all duration-300"
                    style={{
                        width: ball.radius * 2,
                        height: ball.radius * 2,
                        left: ball.x - ball.radius,
                        top: ball.y - ball.radius,
                        backgroundColor: '#FFFFFF',
                        opacity: isHovered ? 1 : 0.9
                    }}
                />
            ))}
        </div>
    );
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; logo?: string }[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
}

function CustomSelect(props: CustomSelectProps) {
    return <FixedSelect {...props} />;
}

export default function StudentOnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [serverSaveState, setServerSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const serverLoadedRef = useRef(false);
    const [missingItems, setMissingItems] = useState<Array<{ label: string; step: number; focusId?: string }>>([]);

    const focusField = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = el.matches('input, textarea, select, button') ? el : el.querySelector('input, textarea, select, button');
        (focusable as HTMLElement | null)?.focus({ preventScroll: true });
    };

    const goToMissingItem = (item: { label: string; step: number; focusId?: string }) => {
        setStep(item.step);
        setMissingItems([]);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { if (item.focusId) focusField(item.focusId); }, 300);
    };
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCustomSubject, setShowCustomSubject] = useState(false);
    const [newCustomSubject, setNewCustomSubject] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const formContainerRef = useRef<HTMLFormElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const progressHeaderRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        gender: '',
        dateOfBirth: '',
        state: 'Kaduna',
        lga: '',
        bio: '',
        subjects: [] as string[],
        experiences: [{
            post: '',
            institute: '',
            instituteState: '',
            fromYear: '',
            toYear: '',
            description: '',
        }],
        gradeLevels: [] as string[],
        examTypes: [] as string[],
        phone: '',
        phoneVerified: false,
        verificationCode: '',
        degreeCertificate: null as File | null,
        governmentId: null as File | null,
        nyscCertificate: null as File | null,
        profilePhoto: null as File | null,
        introVideo: null as File | null,
        location: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        hourlyRate: '',
    });

    // Draft storage state
    const [draftMetadata, setDraftMetadata] = useState<Record<FileType, DraftMetadata | null>>({
        degree_certificate: null,
        government_id: null,
        nysc_certificate: null,
        profile_photo: null,
        intro_video: null,
    });
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
    const [draftError, setDraftError] = useState<string | null>(null);

    // Profile photo preview URL (for HEIC conversion)
    const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<string | null>(null);

    // Auto-fill name fields from user metadata or email
    useEffect(() => {
        if (user && !formData.firstName && !formData.lastName) {
            // Try to get name from user metadata first
            const userMetadata = user.user_metadata;
            let firstName = userMetadata?.first_name || userMetadata?.given_name || '';
            let lastName = userMetadata?.last_name || userMetadata?.family_name || '';
            let fullName = userMetadata?.full_name || userMetadata?.name || '';

            // If no metadata, try to extract from email
            if (!firstName && !lastName && user.email) {
                const emailName = user.email.split('@')[0];
                // Remove numbers and special characters
                const cleanName = emailName.replace(/[0-9._-]/g, ' ').trim();
                const nameParts = cleanName.split(' ').filter(part => part.length > 0);

                if (nameParts.length > 0) {
                    firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
                    if (nameParts.length > 1) {
                        lastName = nameParts.slice(1).map((part: string) =>
                            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                        ).join(' ');
                    }
                }
            }

            // If we have a full name but not first/last, split it
            if (fullName && !firstName && !lastName) {
                const nameParts = fullName.split(' ').filter((part: string) => part.length > 0);
                if (nameParts.length > 0) {
                    firstName = nameParts[0];
                    if (nameParts.length > 1) {
                        lastName = nameParts.slice(1).join(' ');
                    }
                }
            }

            // Set the form data with auto-filled values
            if (firstName || lastName) {
                const displayName = `${firstName} ${lastName}`.trim();
                setFormData(prev => ({
                    ...prev,
                    firstName,
                    lastName,
                    displayName: displayName || firstName,
                }));
            }
        }
    }, [user]);

    // Load saved data from localStorage on mount
    useEffect(() => {
        // Children and completed accounts never re-onboard: the parent does
        // everything, so send them straight to their dashboard.
        (async () => {
            try {
                const res = await fetch('/api/dashboard', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (data.onboardingCompleted && data.role === 'student') {
                    router.push('/dashboard/student');
                } else if (data.onboardingCompleted && data.role) {
                    router.push(`/dashboard/${data.role}`);
                }
            } catch { /* not signed in — continue */ }
        })();

        const savedData = localStorage.getItem('studentOnboardingData');
        const savedStep = localStorage.getItem('studentOnboardingStep');
        const savedAgreedToTerms = localStorage.getItem('studentOnboardingAgreedToTerms');

        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }

        if (savedStep) {
            setStep(parseInt(savedStep));
        }

        if (savedAgreedToTerms) {
            setAgreedToTerms(savedAgreedToTerms === 'true');
        }

        // Server progress wins only if newer than localStorage
        async function loadServerProgress() {
            try {
                const res = await fetch('/api/onboarding/progress');
                if (!res.ok) return;
                const { progress } = await res.json();
                if (!progress?.form_data) return;
                const localSavedAt = localStorage.getItem('studentOnboardingSavedAt') || '';
                if (progress.last_saved_at && progress.last_saved_at > localSavedAt) {
                    const { step: serverStep, ...serverFields } = progress.form_data;
                    setFormData((prev: typeof formData) => ({ ...prev, ...serverFields }));
                    if (typeof serverStep === 'number') setStep(serverStep);
                }
            } catch {
                // Offline or not signed in — localStorage still applies
            } finally {
                serverLoadedRef.current = true;
            }
        }
        loadServerProgress();
    }, []);

    // Save data to localStorage whenever formData or step changes
    useEffect(() => {
        // Don't save files to localStorage (they're too large)
        const dataToSave = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            displayName: formData.displayName,
            gender: formData.gender,
            dateOfBirth: formData.dateOfBirth,
            state: formData.state,
            lga: formData.lga,
            bio: formData.bio,
            subjects: formData.subjects,
            experiences: formData.experiences,
            gradeLevels: formData.gradeLevels,
            examTypes: formData.examTypes,
            phone: formData.phone,
            phoneVerified: formData.phoneVerified,
            location: formData.location,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountName: formData.accountName,
            hourlyRate: formData.hourlyRate,
            // Note: Files (degreeCertificate, governmentId, nyscCertificate, profilePhoto, introVideo) 
            // cannot be saved to localStorage and will need to be re-uploaded if page is refreshed
        };

        localStorage.setItem('studentOnboardingData', JSON.stringify(dataToSave));
        localStorage.setItem('studentOnboardingStep', step.toString());
        localStorage.setItem('studentOnboardingAgreedToTerms', agreedToTerms.toString());
        localStorage.setItem('studentOnboardingSavedAt', new Date().toISOString());
    }, [formData, step, agreedToTerms]);

    // Auto-save progress to Supabase (debounced)
    useEffect(() => {
        if (!user || !serverLoadedRef.current) return;
        if (!formData.firstName && !formData.lastName && !formData.bio) return;
        setServerSaveState('saving');
        const timer = setTimeout(async () => {
            try {
                const res = await fetch('/api/onboarding/progress', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: 'student',
                        step,
                        formData: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            displayName: formData.displayName,
                            gender: formData.gender,
                            dateOfBirth: formData.dateOfBirth,
                            state: formData.state,
                            lga: formData.lga,
                            bio: formData.bio,
                            subjects: formData.subjects,
                            gradeLevels: formData.gradeLevels,
                            examTypes: formData.examTypes,
                            phone: formData.phone,
                            phoneVerified: formData.phoneVerified,
                            step,
                        },
                    }),
                });
                const data = await res.json().catch(() => ({}));
                setServerSaveState(data.saved ? 'saved' : 'error');
            } catch {
                setServerSaveState('error');
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData, step, agreedToTerms, user]);

    // Handle HEIC conversion for profile photo preview
    useEffect(() => {
        async function createPreview() {
            if (formData.profilePhoto) {
                const file = formData.profilePhoto;
                const isHEIC = file.type === 'image/heic' ||
                    file.type === 'image/heif' ||
                    file.name.toLowerCase().endsWith('.heic') ||
                    file.name.toLowerCase().endsWith('.heif');

                if (isHEIC) {
                    try {
                        const heic2any = (await import('heic2any')).default;
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: 'image/jpeg',
                            quality: 0.9
                        });
                        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                        const url = URL.createObjectURL(blob);
                        setProfilePhotoPreviewUrl(url);
                    } catch (error) {
                        console.error('HEIC conversion error:', error);
                        setProfilePhotoPreviewUrl(null);
                    }
                } else {
                    const url = URL.createObjectURL(file);
                    setProfilePhotoPreviewUrl(url);
                }
            } else {
                if (profilePhotoPreviewUrl) {
                    URL.revokeObjectURL(profilePhotoPreviewUrl);
                    setProfilePhotoPreviewUrl(null);
                }
            }
        }

        createPreview();

        return () => {
            if (profilePhotoPreviewUrl) {
                URL.revokeObjectURL(profilePhotoPreviewUrl);
            }
        };
    }, [formData.profilePhoto]);

    // Auto-set account name from user's name when account number is complete
    useEffect(() => {
        if (formData.accountNumber.length === 10 && formData.bankName && formData.firstName && formData.lastName) {
            const fullName = `${formData.firstName} ${formData.lastName}`.toUpperCase();
            setFormData(prev => ({ ...prev, accountName: fullName }));
        }
    }, [formData.accountNumber, formData.bankName, formData.firstName, formData.lastName]);

    // Load and validate drafts on mount
    useEffect(() => {
        async function loadDrafts() {
            if (!user?.id) return;

            try {
                setIsLoadingDrafts(true);
                setDraftError(null);

                // Validate drafts with server
                const validatedDrafts = await validateDraftsWithServer(user.id);

                // Update state with validated drafts
                const draftsMap: Record<FileType, DraftMetadata | null> = {
                    degree_certificate: null,
                    government_id: null,
                    nysc_certificate: null,
                    profile_photo: null,
                    intro_video: null,
                };

                Object.entries(validatedDrafts).forEach(([fileType, metadata]) => {
                    draftsMap[fileType as FileType] = metadata as DraftMetadata;
                });

                setDraftMetadata(draftsMap);

                // Cleanup stale references
                await cleanupStaleDraftReferences(user.id);
            } catch (error) {
                console.error('Failed to load drafts:', error);
                setDraftError('Failed to load saved files. You can continue without them.');
            } finally {
                setIsLoadingDrafts(false);
            }
        }

        loadDrafts();
    }, [user?.id]);

    // Helper function to restore a draft file
    const handleDraftRestore = async (metadata: DraftMetadata, fileType: FileType) => {
        try {
            // Fetch signed URL for the draft
            const response = await fetch(`/api/drafts/download/${metadata.id}`);
            if (!response.ok) throw new Error('Failed to get download URL');

            const { signedUrl } = await response.json();

            // Fetch the file
            const fileResponse = await fetch(signedUrl);
            const blob = await fileResponse.blob();
            const file = new File([blob], metadata.original_filename, { type: metadata.mime_type });

            // Update form state based on file type
            const fieldMap: Record<FileType, string> = {
                degree_certificate: 'degreeCertificate',
                government_id: 'governmentId',
                nysc_certificate: 'nyscCertificate',
                profile_photo: 'profilePhoto',
                intro_video: 'introVideo',
            };

            const fieldName = fieldMap[fileType];
            setFormData(prev => ({ ...prev, [fieldName]: file }));
        } catch (error) {
            console.error('Failed to restore draft:', error);
            alert('Failed to restore file. Please upload again.');
        }
    };

    // Helper function to upload intro video
    const handleIntroVideoUpload = async (file: File) => {
        if (!user?.id) {
            toast.error('Authentication required', {
                description: 'Please sign in to upload videos',
            });
            return;
        }

        // Check file size (10MB limit for better compatibility with Next.js)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File too large', {
                description: `Video must be less than 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please compress your video or record a shorter clip.`,
                duration: 7000,
            });
            return;
        }

        // Show upload progress toast
        const uploadToast = toast.loading('Uploading video...', {
            description: 'Please wait while we upload your intro video'
        });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', 'intro_video');
            formData.append('authUserId', user.id);

            console.log('Uploading video:', {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                type: file.type
            });

            const response = await fetch('/api/drafts/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('Upload response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Upload failed';

                try {
                    const errorData = await response.json();
                    console.error('Upload error response:', errorData);
                    errorMessage = errorData.error || errorData.details || 'Upload failed';
                } catch (parseError) {
                    // If we can't parse JSON, it might be a Next.js error page
                    const textResponse = await response.text();
                    console.error('Upload error (non-JSON):', textResponse.substring(0, 500));

                    if (response.status === 413) {
                        errorMessage = 'File too large for server. Please use a video under 10MB.';
                    } else if (response.status === 400) {
                        errorMessage = 'The video file is too large or in an unsupported format. Please use a smaller video (under 10MB) in MP4 or WebM format.';
                    } else {
                        errorMessage = `Upload failed with status ${response.status}. Please try a smaller video file.`;
                    }
                }

                toast.dismiss(uploadToast);
                throw new Error(errorMessage);
            }

            toast.dismiss(uploadToast);
            toast.success('Video uploaded successfully', {
                description: 'Your intro video has been saved',
            });
        } catch (error) {
            console.error('Video upload error:', error);
            toast.dismiss(uploadToast);
            toast.error('Upload failed', {
                description: error instanceof Error ? error.message : 'Failed to upload video. Please try a smaller file.',
                duration: 7000,
            });
        }
    };

    const availableLGAs = formData.state ? NIGERIAN_STATES_WITH_LGAS[formData.state] || [] : [];
    const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const stateOptions = Object.keys(NIGERIAN_STATES_WITH_LGAS).sort().map(state => ({ value: state, label: state }));
    const lgaOptions = availableLGAs.map(lga => ({ value: lga, label: lga }));

    const handleSubjectToggle = (subject: string) => {
        setFormData((prev) => ({ ...prev, subjects: prev.subjects.includes(subject) ? prev.subjects.filter((s) => s !== subject) : [...prev.subjects, subject] }));
    };

    const handleAddCustomSubject = () => {
        if (newCustomSubject.trim() && !formData.subjects.includes(newCustomSubject.trim())) {
            setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, newCustomSubject.trim()] }));
            setNewCustomSubject('');
            setShowCustomSubject(false);
        }
    };

    const handleRemoveSubject = (subject: string) => {
        setFormData((prev) => ({ ...prev, subjects: prev.subjects.filter((s) => s !== subject) }));
    };

    // A child is in exactly ONE grade level — selecting replaces the previous pick.
    const handleGradeLevelToggle = (level: string) => {
        setFormData((prev) => ({ ...prev, gradeLevels: prev.gradeLevels.includes(level) ? [] : [level] }));
    };

    const handleExamTypeToggle = (examType: string) => {
        setFormData((prev) => ({ ...prev, examTypes: prev.examTypes.includes(examType) ? prev.examTypes.filter((e) => e !== examType) : [...prev.examTypes, examType] }));
    };

    const handleAddExperience = () => {
        setFormData((prev) => ({ ...prev, experiences: [...prev.experiences, { post: '', institute: '', instituteState: '', fromYear: '', toYear: '', description: '' }] }));
    };

    const handleRemoveExperience = (index: number) => {
        if (formData.experiences.length > 1) {
            setFormData((prev) => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
        }
    };

    const handleExperienceChange = (index: number, field: string, value: string) => {
        setFormData((prev) => ({ ...prev, experiences: prev.experiences.map((exp, i) => i === index ? { ...exp, [field]: value } : exp) }));
    };

    const handleSendVerificationCode = async () => {
        if (!formData.phone || formData.phone.length < 10) {
            setVerificationError('Please enter a valid phone number');
            return;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const response = await fetch('/api/verify-phone/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send verification code');
            }

            setVerificationSent(true);
            setVerificationError(null);
        } catch (err) {
            setVerificationError(err instanceof Error ? err.message : 'Failed to send code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.verificationCode || formData.verificationCode.length !== 6) {
            setVerificationError('Please enter the 6-digit code');
            return;
        }

        setIsVerifying(true);
        setVerificationError(null);

        try {
            const response = await fetch('/api/verify-phone/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.phone, code: formData.verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid verification code');
            }

            setFormData(prev => ({ ...prev, phoneVerified: true }));
            setVerificationError(null);
        } catch (err) {
            setVerificationError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            setRecordingStream(stream);
            chunksRef.current = [];

            // Show live preview
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.play();
            }

            // Create MediaRecorder with proper options
            const options = { mimeType: 'video/webm;codecs=vp8,opus' };
            let recorder: MediaRecorder;

            try {
                recorder = new MediaRecorder(stream, options);
            } catch (e) {
                // Fallback if codec not supported
                recorder = new MediaRecorder(stream);
            }

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const file = new File([blob], `intro-video-${Date.now()}.webm`, { type: 'video/webm' });
                setFormData(prev => ({ ...prev, introVideo: file }));

                // Upload the recorded video
                await handleIntroVideoUpload(file);

                // Clean up
                stream.getTracks().forEach(track => track.stop());
                setRecordingStream(null);
                chunksRef.current = [];

                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }
            };

            // Request data every 100ms for smoother recording
            recorder.start(100);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= 120) {
                        stopRecording();
                        return 120;
                    }
                    return newTime;
                });
            }, 1000);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please check permissions and try again.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        setIsRecording(false);
        setMediaRecorder(null);

        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
            setRecordingStream(null);
        }

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Your session ended. Please sign in again to submit your application.', { duration: 8000 });
            router.push('/sign-in');
            return;
        }

        // Comprehensive validation check — each item links to its field
        const items: Array<{ label: string; step: number; focusId?: string }> = [];

        // Step 1 validation
        if (!formData.firstName) items.push({ label: 'First Name', step: 1, focusId: 'field-firstName' });
        if (!formData.lastName) items.push({ label: 'Last Name', step: 1, focusId: 'field-lastName' });
        if (!formData.displayName) items.push({ label: 'Display Name', step: 1, focusId: 'field-firstName' });
        if (!formData.gender) items.push({ label: 'Gender', step: 1, focusId: 'field-gender' });
        if (!formData.dateOfBirth) items.push({ label: 'Date of Birth', step: 1, focusId: 'field-dateOfBirth' });
        if (!formData.state) items.push({ label: 'State of Residence', step: 1, focusId: 'field-state' });
        if (!formData.lga) items.push({ label: 'LGA', step: 1, focusId: 'field-lga' });

        // Step 2 validation
        if (formData.subjects.length === 0) items.push({ label: 'At least one Subject', step: 2, focusId: 'section-subjects' });
        if (formData.gradeLevels.length === 0 && formData.examTypes.length === 0) {
            items.push({ label: 'Class / Grade Level or Exam Type', step: 2, focusId: 'section-gradelevels' });
        }

        // Step 3 validation
        if (!formData.phone) items.push({ label: 'Phone Number', step: 3, focusId: 'field-phone' });

        // Step 4 validation — a restored draft counts as uploaded
        if (!formData.profilePhoto && !draftMetadata.profile_photo) items.push({ label: 'Profile Photo', step: 4, focusId: 'field-profilePhoto' });

        // Step 5 validation
        if (!agreedToTerms) items.push({ label: 'Agreement to Terms of Service', step: 5, focusId: 'field-terms' });

        if (items.length > 0) {
            setMissingItems(items);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setMissingItems([]);
        try {
            const response = await fetch('/api/onboarding/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authUserId: user.id, name: `${formData.firstName} ${formData.lastName}`, email: user.email, ...formData }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error([data.error, data.details].filter(Boolean).join(' — ') || 'Failed to complete onboarding');
            }

            // Clear saved data after successful submission
            localStorage.removeItem('studentOnboardingData');
            localStorage.removeItem('studentOnboardingStep');
            localStorage.removeItem('studentOnboardingAgreedToTerms');

            // Clear draft references
            clearAllDraftReferences();

            // Show success screen
            setIsSubmitted(true);
            setIsSubmitting(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = formData.firstName && formData.lastName && formData.displayName && formData.gender && formData.dateOfBirth && formData.state && formData.lga;
    const isStep2Valid = formData.subjects.length > 0 &&
        (formData.gradeLevels.length > 0 || formData.examTypes.length > 0);
    const isStep3Valid = formData.phone;
    const isStep4Valid = !!formData.profilePhoto || !!draftMetadata.profile_photo;
    const isStep5Valid = agreedToTerms;

    // Debug helper - you can check console to see what's missing
    useEffect(() => {
        if (step === 2) {
            console.log('Step 2 Validation:', {
                hasSubjects: formData.subjects.length > 0,
                subjectsCount: formData.subjects.length,
                experiencesValid: formData.experiences.every(exp => exp.post && exp.institute && exp.instituteState && exp.fromYear && exp.toYear && exp.description),
                experiences: formData.experiences,
                hasGradeLevelsOrExams: formData.gradeLevels.length > 0 || formData.examTypes.length > 0,
                gradeLevelsCount: formData.gradeLevels.length,
                examTypesCount: formData.examTypes.length,
                bioLength: formData.bio.length,
                bioValid: formData.bio.length >= 200,
                isStep2Valid
            });
        }
    }, [step, formData, isStep2Valid]);

    // GSAP Animation when step changes
    useEffect(() => {
        if (formContainerRef.current) {
            // Animate form content
            gsap.fromTo(
                formContainerRef.current,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.98
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power3.out'
                }
            );

            // Animate form fields with stagger
            const formElements = formContainerRef.current.querySelectorAll('.animate-field');
            if (formElements.length > 0) {
                gsap.fromTo(
                    formElements,
                    {
                        opacity: 0,
                        y: 20
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: 'power2.out',
                        delay: 0.2
                    }
                );
            }
        }

        // Animate sidebar progress header
        if (progressHeaderRef.current) {
            gsap.fromTo(
                progressHeaderRef.current,
                {
                    scale: 0.95,
                    opacity: 0.8
                },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    ease: 'back.out(1.2)'
                }
            );
        }

        // Animate sidebar step items
        if (sidebarRef.current) {
            const stepItems = sidebarRef.current.querySelectorAll('.sidebar-step-item');
            gsap.fromTo(
                stepItems,
                {
                    x: -20,
                    opacity: 0
                },
                {
                    x: 0,
                    opacity: 1,
                    duration: 0.4,
                    stagger: 0.05,
                    ease: 'power2.out',
                    delay: 0.1
                }
            );
        }
    }, [step]);

    const themeColor = '#3B82F6';
    const lightBg = '#FFF5F2';
    const totalSteps = 5;
    const progressPercentage = (step / totalSteps) * 100;
    const [isBottomRightHovered, setIsBottomRightHovered] = useState(false);

    const steps = [
        { number: 1, title: 'Personal Details', subtitle: 'Basic info', icon: '👤' },
        { number: 2, title: 'Learning Details', subtitle: 'Subjects & Goals', icon: '📚' },
        { number: 3, title: 'Contact Info', subtitle: 'Phone verification', icon: '📞' },
        { number: 4, title: 'Profile Photo', subtitle: 'A friendly face', icon: '📸' },
        { number: 5, title: 'Review & Agree', subtitle: 'Final check', icon: '✓' },
    ];

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
                        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-outfit font-bold text-gray-900 mb-2">Application submitted! 🎉</h2>
                        <p className="text-gray-500 font-inter text-sm mb-6">
                            Your student account is ready. Find a tutor and start learning — your parent can follow your progress from their dashboard.
                        </p>
                        <button
                            onClick={() => router.push('/find-tutors')}
                            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold py-3.5 rounded-xl font-inter transition-colors"
                        >
                            Find a Tutor
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/student')}
                            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl font-inter transition-colors"
                        >
                            Go to My Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-500 relative overflow-visible" style={{ backgroundColor: lightBg }}>
                {/* Background decorations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute w-96 h-96 rounded-full opacity-20 animate-float-diagonal" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, top: '10%', left: '5%', filter: 'blur(40px)' }} />
                    <div className="absolute w-[28rem] h-[28rem] rounded-full opacity-15 animate-float-circular" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, top: '50%', right: '5%', animationDelay: '2s', filter: 'blur(50px)' }} />
                    <div className="absolute w-80 h-80 rounded-full opacity-18 animate-float-wave" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, bottom: '10%', left: '20%', animationDelay: '4s', filter: 'blur(45px)' }} />

                    {/* Bouncing balls - separate, not in wrapper */}
                    <BouncingBalls isHovered={isBottomRightHovered} />

                    {/* Half circle pie - with hover area wrapper */}
                    <div
                        className="absolute pointer-events-auto cursor-pointer z-0"
                        style={{
                            bottom: 0,
                            right: 0,
                            width: '256px',
                            height: '256px'
                        }}
                        onMouseEnter={() => setIsBottomRightHovered(true)}
                        onMouseLeave={() => setIsBottomRightHovered(false)}
                    >
                        {/* Animated border ring on hover */}
                        {isBottomRightHovered && (
                            <div
                                className="absolute w-[32rem] h-[32rem] rounded-full pointer-events-none animate-soft-pulse transition-all duration-500 ease-out"
                                style={{
                                    bottom: '-16rem',
                                    right: '-16rem',
                                    border: `6px solid ${themeColor}`,
                                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                                    opacity: 0.6,
                                    transform: 'translate(32px, 32px) scale(1.1)'
                                }}
                            />
                        )}

                        {/* Main pie circle */}
                        <div
                            className={`absolute w-[32rem] h-[32rem] rounded-full overflow-hidden transition-all duration-500 ease-out pointer-events-none ${isBottomRightHovered ? 'animate-soft-pulse' : ''}`}
                            style={{
                                bottom: '-16rem',
                                right: '-16rem',
                                border: `4px solid ${themeColor}`,
                                backgroundColor: themeColor,
                                opacity: isBottomRightHovered ? 0.35 : 0.25,
                                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                                transform: isBottomRightHovered ? 'translate(32px, 32px) scale(1.1)' : 'translate(0, 0) scale(1)',
                                boxShadow: isBottomRightHovered ? `0 0 40px 10px rgba(255, 107, 53, 0.3)` : 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Left Sidebar - Desktop/Tablet only */}
                <div ref={sidebarRef} className="hidden md:flex md:w-80 lg:w-96 bg-white relative z-10 flex-col shadow-sm">
                    {/* Logo */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#FF8C5A] flex items-center justify-center shadow-md">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-outfit font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">SabiLearn</span>
                        </div>
                    </div>

                    {/* Progress Header */}
                    <div ref={progressHeaderRef} className="px-8 py-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                        <p className="text-xs font-inter font-semibold text-gray-500 uppercase tracking-wider mb-1">Application Progress</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-outfit font-bold text-gray-900">{Math.round(progressPercentage)}%</span>
                            <span className="text-sm font-inter text-gray-500">Complete</span>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        <div className="space-y-1">
                            {steps.map((s, index) => {
                                const isCompleted = s.number < step;
                                const isCurrent = s.number === step;
                                const isUpcoming = s.number > step;

                                return (
                                    <div
                                        key={s.number}
                                        className={`sidebar-step-item relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer group ${isCurrent
                                            ? 'bg-blue-50 border-l-4 border-[#3B82F6]'
                                            : isCompleted
                                                ? 'hover:bg-gray-50'
                                                : 'opacity-50 cursor-not-allowed'
                                            }`}
                                        onClick={() => {
                                            if (isCompleted || isCurrent) {
                                                setStep(s.number);
                                            }
                                        }}
                                    >
                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`absolute left-8 top-14 w-0.5 h-8 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'
                                                    }`}
                                            />
                                        )}

                                        {/* Icon/Status */}
                                        <div className="relative z-10 flex-shrink-0">
                                            {isCompleted ? (
                                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                                                </div>
                                            ) : isCurrent ? (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md ring-4 ring-[#3B82F6]/20" style={{ backgroundColor: themeColor }}>
                                                    <div className="w-3 h-3 rounded-full bg-white"></div>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className={`font-inter font-semibold text-sm leading-tight mb-0.5 ${isCurrent
                                                ? 'text-[#3B82F6]'
                                                : isCompleted
                                                    ? 'text-gray-900'
                                                    : 'text-gray-400'
                                                }`}>
                                                {s.title}
                                            </p>
                                            <p className={`font-inter text-xs leading-tight ${isCurrent
                                                ? 'text-[#3B82F6]'
                                                : isCompleted
                                                    ? 'text-gray-500'
                                                    : 'text-gray-400'
                                                }`}>
                                                {s.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className=" w-full flex-1 flex flex-col ">
                    <div className="flex-1 flex flex-col relative z-20">
                        {/* Mobile Header */}
                        <div className="md:hidden w-full bg-white shadow-sm border-b border-gray-100">
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#FF8C5A] flex items-center justify-center shadow-md">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-xl font-outfit font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">SabiLearn</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Progress Bar */}
                        <div className="md:hidden w-full bg-white shadow-sm border-b border-gray-100">
                            <div className="px-6 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-inter font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                                    <span className="text-sm font-inter font-bold text-gray-900">{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300 ease-out rounded-full"
                                        style={{
                                            width: `${progressPercentage}%`,
                                            background: `linear-gradient(to right, ${themeColor}, #FF8C5A)`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="flex-1 flex items-center justify-center py-8 px-4 overflow-visible">
                            <div className="w-full max-w-4xl">
                                {/* Mobile Step Indicator */}
                                <div className="md:hidden text-center mb-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                                            <span className="text-xs font-inter font-bold text-white">{step}</span>
                                        </div>
                                        <span className="text-sm text-gray-600 font-inter font-medium">of {totalSteps}</span>
                                    </div>
                                </div>
                                <form ref={formContainerRef} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
                                    {step === 1 && (
                                        <div className="space-y-6">
                                            <div className="mb-6 animate-field">
                                                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Personal Details</h2>
                                                <p className="text-gray-600 font-inter text-sm">Tell us a bit about yourself. This information helps us match you with students.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-field">
                                                <div>
                                                    <label id="field-firstName" className="block text-gray-700 font-inter font-medium mb-2">First Name</label>
                                                    <input id="field-firstName-input" type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter" placeholder="e.g. Chukwudi" required />
                                                </div>
                                                <div>
                                                    <label id="field-lastName" className="block text-gray-700 font-inter font-medium mb-2">Last Name</label>
                                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter" placeholder="e.g. Okafor" required />
                                                </div>
                                            </div>
                                            <div className="animate-field">
                                                <label className="block text-gray-700 font-inter font-medium mb-2">Display Name (Public)</label>
                                                <input type="text" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter" placeholder="e.g. Mr. Chukwudi" required />
                                                <p className="text-sm text-gray-500 mt-1 font-inter">This is what parents and students will see.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-field">
                                                <div className="isolate">
                                                    <label id="field-gender" className="block text-gray-700 font-inter font-medium mb-2">Gender</label>
                                                    <CustomSelect value={formData.gender} onChange={(value) => setFormData({ ...formData, gender: value })} options={genderOptions} placeholder="Select Gender" />
                                                </div>
                                                <div>
                                                    <label id="field-dateOfBirth" className="block text-gray-700 font-inter font-medium mb-2">Date of Birth</label>
                                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter" required />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-field">
                                                <div className="isolate">
                                                    <label id="field-state" className="block text-gray-700 font-inter font-medium mb-2">State of Residence</label>
                                                    <CustomSelect value={formData.state} onChange={(value) => setFormData({ ...formData, state: value, lga: '' })} options={stateOptions} placeholder="Select State" searchable />
                                                </div>
                                                <div className="isolate">
                                                    <label id="field-lga" className="block text-gray-700 font-inter font-medium mb-2">LGA</label>
                                                    <CustomSelect value={formData.lga} onChange={(value) => setFormData({ ...formData, lga: value })} options={lgaOptions} placeholder="Select LGA" disabled={!formData.state} searchable />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 2 && (
                                        <div className="space-y-8">
                                            <div className="mb-6">
                                                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Learning Details</h2>
                                                <p className="text-gray-600 font-inter text-sm">Tell us what you want to learn and your goals.</p>
                                            </div>
                                            <div>
                                                <label id="section-subjects" className="block text-gray-700 font-inter font-medium mb-3">Subjects You Want to Learn (select at least one)</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {SUBJECTS.map((subject) => (
                                                        <button key={subject} type="button" onClick={() => handleSubjectToggle(subject)} className={`px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 ${formData.subjects.includes(subject) ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#3B82F6]'}`}>{subject}</button>
                                                    ))}
                                                    {!showCustomSubject ? (
                                                        <button type="button" onClick={() => setShowCustomSubject(true)} className="px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#3B82F6] hover:text-[#3B82F6] flex items-center justify-center gap-2">
                                                            <Plus className="w-4 h-4" />Add Subject
                                                        </button>
                                                    ) : (
                                                        <div className="col-span-2 md:col-span-4 flex gap-2">
                                                            <input type="text" value={newCustomSubject} onChange={(e) => setNewCustomSubject(e.target.value)} placeholder="Enter subject name" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSubject())} />
                                                            <button type="button" onClick={handleAddCustomSubject} className="px-4 py-3 rounded-lg bg-[#3B82F6] text-white font-inter font-medium hover:bg-[#3B82F6]/90 transition-all">Add</button>
                                                            <button type="button" onClick={() => { setShowCustomSubject(false); setNewCustomSubject(''); }} className="px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-inter font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                                        </div>
                                                    )}
                                                </div>
                                                {formData.subjects.filter(s => !SUBJECTS.includes(s)).length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {formData.subjects.filter(s => !SUBJECTS.includes(s)).map((subject) => (
                                                            <div key={subject} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#3B82F6] text-white rounded-lg font-inter text-sm">
                                                                {subject}
                                                                <button type="button" onClick={() => handleRemoveSubject(subject)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label id="section-gradelevels" className="block text-gray-700 font-inter font-medium mb-3">Class / Grade Level <span className="text-gray-400 font-normal">(pick the one you're currently in)</span></label>
                                                <div className="mb-4">
                                                    <p className="text-sm font-inter font-semibold text-gray-700 mb-2">Primary</p>
                                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                        {GRADE_LEVELS.primary.map((level) => (
                                                            <button key={level} type="button" onClick={() => handleGradeLevelToggle(level)} className={`px-3 py-2.5 rounded-lg border-2 font-inter text-sm font-medium transition-all ${formData.gradeLevels.includes(level) ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#3B82F6]'}`}>
                                                                {level}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="text-sm font-inter font-semibold text-gray-700 mb-2">Secondary</p>
                                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                        {GRADE_LEVELS.secondary.map((level) => (
                                                            <button key={level} type="button" onClick={() => handleGradeLevelToggle(level)} className={`px-3 py-2.5 rounded-lg border-2 font-inter text-sm font-medium transition-all ${formData.gradeLevels.includes(level) ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#3B82F6]'}`}>
                                                                {level}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 font-inter font-medium mb-3">Exam Preparation</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {EXAM_TYPES.map((examType) => (
                                                        <button key={examType} type="button" onClick={() => handleExamTypeToggle(examType)} className={`px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 ${formData.examTypes.includes(examType) ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#3B82F6]'}`}>
                                                            {examType}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label id="bio-input-label" className="block text-gray-700 font-inter font-medium mb-2">About You <span className="text-gray-400 font-normal">(optional — share your learning goals)</span></label>
                                                <textarea id="bio-input" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={6} maxLength={760} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all resize-none font-inter" placeholder="e.g. I want to improve my Maths ahead of JAMB and I enjoy learning with real-life examples..." required />
                                                <p className="text-sm mt-2 font-inter text-gray-500">{formData.bio.length}/760 characters</p>
                                            </div>

                                            {/* Validation Helper */}
                                            {!isStep2Valid && (
                                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-sm font-inter font-semibold text-yellow-800 mb-2">Please complete the following:</p>
                                                    <ul className="text-sm text-yellow-700 space-y-1 font-inter">
                                                        {formData.subjects.length === 0 && (
                                                            <li>•{' '}
                                                                <button type="button" onClick={() => focusField('section-subjects')} className="underline decoration-yellow-400 underline-offset-2 hover:text-yellow-900 cursor-pointer">
                                                                    Select at least one subject
                                                                </button>
                                                            </li>
                                                        )}
                                                        {formData.gradeLevels.length === 0 && formData.examTypes.length === 0 && (
                                                            <li>•{' '}
                                                                <button type="button" onClick={() => focusField('section-gradelevels')} className="underline decoration-yellow-400 underline-offset-2 hover:text-yellow-900 cursor-pointer">
                                                                    Select at least one grade level or exam type
                                                                </button>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {step === 3 && (
                                        <div className="space-y-6">
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Contact Information</h2>
                                                        <p className="text-gray-600 font-inter text-sm">Verify your phone number to continue.</p>
                                                    </div>
                                                    {!formData.phoneVerified && formData.phone && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setStep(4)}
                                                            className="text-[#3B82F6] font-inter font-medium hover:underline text-sm"
                                                        >
                                                            Skip for now →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label id="field-phone" className="block text-gray-700 font-inter font-medium mb-2">Phone Number</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, phone: e.target.value });
                                                            setVerificationSent(false);
                                                            setFormData(prev => ({ ...prev, phoneVerified: false, verificationCode: '' }));
                                                        }}
                                                        disabled={formData.phoneVerified}
                                                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        placeholder="+234 800 000 0000"
                                                        required
                                                    />
                                                    {!formData.phoneVerified && (
                                                        <button
                                                            type="button"
                                                            onClick={handleSendVerificationCode}
                                                            disabled={isVerifying || !formData.phone}
                                                            className="px-6 py-3 rounded-lg bg-[#3B82F6] text-white font-inter font-medium hover:bg-[#3B82F6]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        >
                                                            {isVerifying ? 'Sending...' : verificationSent ? 'Resend Code' : 'Send Code'}
                                                        </button>
                                                    )}
                                                    {formData.phoneVerified && (
                                                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                                                            <Check className="w-5 h-5 text-green-600" />
                                                            <span className="text-sm font-inter font-medium text-green-700">Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-2 font-inter">Enter your phone number in international format (e.g., +234...)</p>
                                            </div>

                                            {verificationSent && !formData.phoneVerified && (
                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm text-blue-800 font-inter mb-4">
                                                        We've sent a 6-digit verification code to {formData.phone}
                                                    </p>
                                                    <div className="flex gap-3">
                                                        <input
                                                            type="text"
                                                            value={formData.verificationCode}
                                                            onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                            maxLength={6}
                                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-center text-lg font-semibold tracking-widest focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all font-inter"
                                                            placeholder="000000"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleVerifyCode}
                                                            disabled={isVerifying || formData.verificationCode.length !== 6}
                                                            className="px-6 py-3 rounded-lg bg-[#3B82F6] text-white font-inter font-medium hover:bg-[#3B82F6]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isVerifying ? 'Verifying...' : 'Verify'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {verificationError && (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm text-red-600 font-inter">{verificationError}</p>
                                                </div>
                                            )}

                                            {!formData.phoneVerified && (
                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-sm text-blue-800 font-inter">
                                                        <span className="font-semibold">Optional:</span> Phone verification helps build trust with students. You can skip this step and verify later from your dashboard.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {step === 4 && (
                                        <div className="space-y-6">
                                            <div className="mb-6">
                                                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Profile Photo</h2>
                                                <p className="text-gray-600 font-inter text-sm">Add a friendly photo so tutors recognize you in class.</p>
                                            </div>

                                            <div id="field-profilePhoto">
                                            <ProfilePhotoInput
                                                value={formData.profilePhoto}
                                                draftMetadata={draftMetadata.profile_photo}
                                                onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
                                                onDraftRestore={(metadata) => handleDraftRestore(metadata, 'profile_photo')}
                                                authUserId={user?.id || ''}
                                            />
                                            </div>
                                        </div>
                                    )}
{/* Step 7: Platform Rules */}
                                    {step === 5 && (
                                        <div className="space-y-6">
                                            <div className="mb-6">
                                                <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Review & Agree</h2>
                                                <p className="text-gray-600 font-inter text-sm">A few house rules before you start learning with SabiLearn.</p>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-700 font-inter font-semibold">1</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-inter font-semibold text-gray-900 mb-1">Be On Time:</h3>
                                                        <p className="text-gray-600 font-inter text-sm">Join your lessons punctually — repeated lateness or no-shows affect your account.</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-700 font-inter font-semibold">2</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-inter font-semibold text-gray-900 mb-1">Keep It On SabiLearn:</h3>
                                                        <p className="text-gray-600 font-inter text-sm">All lessons and payments stay on SabiLearn — it keeps you and your parents safe.</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-700 font-inter font-semibold">3</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-inter font-semibold text-gray-900 mb-1">Be Respectful:</h3>
                                                        <p className="text-gray-600 font-inter text-sm">Treat your tutors and classmates with courtesy during every lesson.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        id="field-terms"
                                                        type="checkbox"
                                                        checked={agreedToTerms}
                                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                        className="mt-1 w-5 h-5 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]"
                                                    />
                                                    <span className="text-gray-700 font-inter text-sm">
                                                        I have read and agree to the <a href="#" className="text-[#3B82F6] underline font-medium">Terms of Service</a> and <a href="#" className="text-[#3B82F6] underline font-medium">Code of Conduct</a>.
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {(missingItems.length > 0 || error) && (
                                        <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <p className="text-red-800 font-inter font-semibold mb-1">Please complete the following:</p>
                                                    {missingItems.length > 0 ? (
                                                        <ul className="text-red-700 font-inter text-sm space-y-1">
                                                            {missingItems.map((item, i) => (
                                                                <li key={i}>
                                                                    •{' '}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => goToMissingItem(item)}
                                                                        className="underline decoration-red-300 underline-offset-2 hover:text-red-900 cursor-pointer text-left"
                                                                    >
                                                                        {item.label}
                                                                    </button>
                                                                    <span className="text-red-400"> (Step {item.step})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-red-700 font-inter text-sm whitespace-pre-line">{error}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                                {!isSubmitted && (
                                    <div className="flex justify-between items-center relative z-10">
                                        {user && (
                                            <span className="absolute -top-5 right-0 text-xs font-inter text-gray-500" role="status">
                                                {serverSaveState === 'saving' && 'Saving…'}
                                                {serverSaveState === 'saved' && '✓ Progress saved'}
                                                {serverSaveState === 'error' && 'Saved on this device only'}
                                            </span>
                                        )}
                                        <button type="button" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1 || isSubmitting} className={`px-6 py-3 rounded-lg font-inter font-medium transition-all ${step === 1 ? 'bg-white/50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-white/90 shadow-md cursor-pointer'}`}>Back</button>
                                        <div className="flex items-center gap-3">
                                            {step === 3 && !formData.phoneVerified && formData.phone && (
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(step + 1)}
                                                    className="px-6 py-3 rounded-lg font-inter font-medium transition-all text-gray-600 hover:text-gray-800 underline"
                                                >
                                                    Skip for now
                                                </button>
                                            )}
                                            {step < 5 ? (
                                                step === 3 && formData.phoneVerified ? (
                                                    <button type="button" onClick={() => setStep(step + 1)} className="px-8 py-3 rounded-lg font-inter font-semibold transition-all text-white shadow-lg" style={{ backgroundColor: themeColor }}>Continue</button>
                                                ) : step === 3 ? null : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(step + 1)}
                                                        disabled={
                                                            (step === 1 && !isStep1Valid) ||
                                                            (step === 2 && !isStep2Valid) ||
                                                            (step === 4 && !isStep4Valid) ||
                                                            (step === 5 && !isStep5Valid)
                                                        }
                                                        className="px-8 py-3 rounded-lg font-inter font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white shadow-lg"
                                                        style={{ backgroundColor: themeColor }}
                                                    >
                                                        Continue
                                                    </button>
                                                )
                                            ) : (
                                                <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 rounded-lg font-inter font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white shadow-lg" style={{ backgroundColor: themeColor }}>
                                                    {isSubmitting ? (<><svg className="animate-spin h-4 w-4 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Submitting...</>) : ('Submit Application')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Simple Footer */}
                    <footer className=" py-8 mt-12">
                        <div className="max-w-7xl mx-auto px-4">

                            {/* 
                            <div className="flex flex-wrap items-center justify-center gap-6 mb-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="font-inter">SSL Encrypted</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="font-inter">NDPR Compliant</span>
                                </div>
                            </div>

                            <div className="text-center text-sm text-gray-500 mb-4">
                                <p className="font-inter">&copy; 2024 SabiLearn Nigeria. All rights reserved.</p>
                            </div> */}

                            {/* Powered By */}
                            <div className="text-center text-xs text-gray-400">
                                <p className="font-inter">Secured by Paystack • Powered by Vercel</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
