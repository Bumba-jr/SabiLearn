'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { BookOpen, ChevronDown, Check, Search, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DraftFileInput } from '@/components/onboarding/DraftFileInput';
import { ProfilePhotoInput } from '@/components/onboarding/ProfilePhotoInput';
import {
    validateDraftsWithServer,
    cleanupStaleDraftReferences,
    clearAllDraftReferences
} from '@/lib/utils/draft-restoration';
import { type DraftMetadata, type FileType } from '@/lib/db/draft-operations';

const SUBJECTS = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'Economics', 'Government', 'Literature', 'Geography', 'Computer Science',
];

const GRADE_LEVELS = {
    primary: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    secondary: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'],
};

const EXAM_TYPES = ['WAEC', 'JAMB', 'IGCSE', 'Daily Schoolwork'];

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
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
}

function CustomSelect({ value, onChange, options, placeholder = 'Select...', disabled = false, searchable = false }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = searchable ? options.filter(option => option.label.toLowerCase().includes(searchQuery.toLowerCase())) : options;
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={`w-full px-4 py-3 rounded-lg border text-left font-inter transition-all flex items-center justify-between ${disabled ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 text-gray-900 hover:border-[#FF6B35] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 cursor-pointer'} ${isOpen ? 'border-[#FF6B35] ring-2 ring-[#FF6B35]/20' : ''}`}>
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
            </button>
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-inter focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none" onClick={(e) => e.stopPropagation()} />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-56 py-2">
                        {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                            <button key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false); setSearchQuery(''); }} className={`w-full px-4 py-2.5 text-left font-inter transition-colors flex items-center justify-between ${option.value === value ? 'bg-[#FF6B35]/10 text-[#FF6B35] font-medium' : 'text-gray-700 hover:bg-gray-50'} ${index === filteredOptions.length - 1 ? 'mb-4' : ''}`}>
                                <span>{option.label}</span>
                                {option.value === value && <Check className="w-4 h-4 text-[#FF6B35]" />}
                            </button>
                        )) : <div className="px-4 py-3 text-sm text-gray-500 text-center font-inter">No results found</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TutorOnboardingPage() {
    const router = useRouter();
    const { user } = useUser();
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

    // Load saved data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('tutorOnboardingData');
        const savedStep = localStorage.getItem('tutorOnboardingStep');
        const savedAgreedToTerms = localStorage.getItem('tutorOnboardingAgreedToTerms');

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

        localStorage.setItem('tutorOnboardingData', JSON.stringify(dataToSave));
        localStorage.setItem('tutorOnboardingStep', step.toString());
        localStorage.setItem('tutorOnboardingAgreedToTerms', agreedToTerms.toString());
    }, [formData, step, agreedToTerms]);

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

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', 'intro_video');
            formData.append('clerkUserId', user.id);

            const response = await fetch('/api/drafts/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            toast.success('Video uploaded successfully', {
                description: 'Your intro video has been saved',
            });
        } catch (error) {
            console.error('Video upload error:', error);
            toast.error('Upload failed', {
                description: error instanceof Error ? error.message : 'Failed to upload video',
                duration: 5000,
            });
        }
    };

    const availableLGAs = formData.state ? NIGERIAN_STATES_WITH_LGAS[formData.state] || [] : [];
    const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const stateOptions = Object.keys(NIGERIAN_STATES_WITH_LGAS).sort().map(state => ({ value: state, label: state }));
    const lgaOptions = availableLGAs.map(lga => ({ value: lga, label: lga }));

    useEffect(() => {
        if (user) {
            const nameParts = user.fullName?.split(' ') || ['', ''];
            setFormData(prev => ({ ...prev, firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '', displayName: user.fullName || '' }));
        }
    }, [user]);

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

    const handleGradeLevelToggle = (level: string) => {
        setFormData((prev) => ({ ...prev, gradeLevels: prev.gradeLevels.includes(level) ? prev.gradeLevels.filter((l) => l !== level) : [...prev.gradeLevels, level] }));
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
        if (!user) return;

        // Comprehensive validation check
        const missingFields: string[] = [];

        // Step 1 validation
        if (!formData.firstName) missingFields.push('First Name');
        if (!formData.lastName) missingFields.push('Last Name');
        if (!formData.displayName) missingFields.push('Display Name');
        if (!formData.gender) missingFields.push('Gender');
        if (!formData.dateOfBirth) missingFields.push('Date of Birth');
        if (!formData.state) missingFields.push('State');
        if (!formData.lga) missingFields.push('LGA');

        // Step 2 validation
        if (formData.subjects.length === 0) missingFields.push('At least one Subject');
        if (!formData.experiences.every(exp => exp.post && exp.institute && exp.instituteState && exp.fromYear && exp.toYear && exp.description)) {
            missingFields.push('Complete all Experience fields');
        }
        if (formData.gradeLevels.length === 0 && formData.examTypes.length === 0) {
            missingFields.push('At least one Grade Level or Exam Type');
        }
        if (formData.bio.length < 200) missingFields.push('Bio (minimum 200 characters)');

        // Step 3 validation
        if (!formData.phone) missingFields.push('Phone Number');

        // Step 4 validation
        if (!formData.degreeCertificate) missingFields.push('Degree Certificate');
        if (!formData.governmentId) missingFields.push('Government ID');

        // Step 5 validation
        if (!formData.profilePhoto) missingFields.push('Profile Photo');

        // Step 6 validation
        if (!formData.bankName) missingFields.push('Bank Name');
        if (!formData.accountNumber) missingFields.push('Account Number');
        if (!formData.accountName) missingFields.push('Account Name');

        // Step 7 validation
        if (!agreedToTerms) missingFields.push('Agreement to Terms of Service');

        if (missingFields.length > 0) {
            setError(`Missing required fields:\n• ${missingFields.join('\n• ')}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/onboarding/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkUserId: user.id, name: `${formData.firstName} ${formData.lastName}`, email: user.primaryEmailAddress?.emailAddress, ...formData }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to complete onboarding');
            }

            // Clear saved data after successful submission
            localStorage.removeItem('tutorOnboardingData');
            localStorage.removeItem('tutorOnboardingStep');
            localStorage.removeItem('tutorOnboardingAgreedToTerms');

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
        formData.experiences.every(exp => exp.post && exp.institute && exp.instituteState && exp.fromYear && exp.toYear && exp.description) &&
        (formData.gradeLevels.length > 0 || formData.examTypes.length > 0) &&
        formData.bio.length >= 200;
    const isStep3Valid = formData.phone;
    const isStep4Valid = formData.degreeCertificate && formData.governmentId;
    const isStep5Valid = formData.profilePhoto;
    const isStep6Valid = formData.bankName && formData.accountNumber && formData.accountName;
    const isStep7Valid = agreedToTerms;

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

    const themeColor = '#FF6B35';
    const lightBg = '#FFF5F2';
    const totalSteps = 8;
    const progressPercentage = (step / totalSteps) * 100;
    const [isBottomRightHovered, setIsBottomRightHovered] = useState(false);

    return (
        <div className="min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden" style={{ backgroundColor: lightBg }}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-96 h-96 rounded-full opacity-20 animate-float-diagonal" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, top: '10%', left: '5%', filter: 'blur(40px)' }} />
                <div className="absolute w-[28rem] h-[28rem] rounded-full opacity-15 animate-float-circular" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, top: '50%', right: '5%', animationDelay: '2s', filter: 'blur(50px)' }} />
                <div className="absolute w-80 h-80 rounded-full opacity-18 animate-float-wave" style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)`, bottom: '10%', left: '20%', animationDelay: '4s', filter: 'blur(45px)' }} />

                {/* Bouncing balls - separate, not in wrapper */}
                <BouncingBalls isHovered={isBottomRightHovered} />

                {/* Half circle pie - with hover area wrapper */}
                <div
                    className="absolute pointer-events-auto cursor-pointer z-20"
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
            <div className="w-full bg-white shadow-sm relative z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-[#FF6B35]" />
                        <span className="text-2xl font-outfit font-bold text-gray-900">SabiLearn</span>
                    </div>
                    <div className="bg-[#00D9A5] text-white px-4 py-2 rounded-lg font-inter font-semibold text-sm">TEACHER APPLICATION</div>
                </div>
            </div>
            <div className="w-full bg-white shadow-sm relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%`, backgroundColor: themeColor }} />
                    </div>
                </div>
            </div>
            <div className="flex-1 flex items-start justify-center relative z-10 py-8 px-4">
                <div className="w-full max-w-3xl">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 font-inter font-medium">Step {step} of {totalSteps}</p>
                    </div>
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Personal Details</h2>
                                    <p className="text-gray-600 font-inter text-sm">Tell us a bit about yourself. This information helps us match you with students.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">First Name</label>
                                        <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter" placeholder="e.g. Chukwudi" required />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">Last Name</label>
                                        <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter" placeholder="e.g. Okafor" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-2">Display Name (Public)</label>
                                    <input type="text" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter" placeholder="e.g. Mr. Chukwudi" required />
                                    <p className="text-sm text-gray-500 mt-1 font-inter">This is what parents and students will see.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">Gender</label>
                                        <CustomSelect value={formData.gender} onChange={(value) => setFormData({ ...formData, gender: value })} options={genderOptions} placeholder="Select Gender" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">Date of Birth</label>
                                        <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">State of Residence</label>
                                        <CustomSelect value={formData.state} onChange={(value) => setFormData({ ...formData, state: value, lga: '' })} options={stateOptions} placeholder="Select State" searchable />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 font-inter font-medium mb-2">LGA</label>
                                        <CustomSelect value={formData.lga} onChange={(value) => setFormData({ ...formData, lga: value })} options={lgaOptions} placeholder="Select LGA" disabled={!formData.state} searchable />
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-8">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Teaching Details</h2>
                                    <p className="text-gray-600 font-inter text-sm">Share your teaching expertise and experience.</p>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-3">Subjects You Teach (select at least one)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {SUBJECTS.map((subject) => (
                                            <button key={subject} type="button" onClick={() => handleSubjectToggle(subject)} className={`px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 ${formData.subjects.includes(subject) ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF6B35]'}`}>{subject}</button>
                                        ))}
                                        {!showCustomSubject ? (
                                            <button type="button" onClick={() => setShowCustomSubject(true)} className="px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] flex items-center justify-center gap-2">
                                                <Plus className="w-4 h-4" />Add Subject
                                            </button>
                                        ) : (
                                            <div className="col-span-2 md:col-span-4 flex gap-2">
                                                <input type="text" value={newCustomSubject} onChange={(e) => setNewCustomSubject(e.target.value)} placeholder="Enter subject name" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSubject())} />
                                                <button type="button" onClick={handleAddCustomSubject} className="px-4 py-3 rounded-lg bg-[#FF6B35] text-white font-inter font-medium hover:bg-[#FF6B35]/90 transition-all">Add</button>
                                                <button type="button" onClick={() => { setShowCustomSubject(false); setNewCustomSubject(''); }} className="px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-inter font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    {formData.subjects.filter(s => !SUBJECTS.includes(s)).length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {formData.subjects.filter(s => !SUBJECTS.includes(s)).map((subject) => (
                                                <div key={subject} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg font-inter text-sm">
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
                                    <label className="block text-gray-700 font-inter font-medium mb-3">Teaching Experience</label>
                                    {formData.experiences.map((experience, index) => (
                                        <div key={index} className="mb-6 p-6 border-2 border-gray-200 rounded-lg relative">
                                            {formData.experiences.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveExperience(index)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">Post/Position</label>
                                                        <input type="text" value={experience.post} onChange={(e) => handleExperienceChange(index, 'post', e.target.value)} placeholder="e.g. Mathematics Tutor" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter text-sm" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">Institute/Organization</label>
                                                        <input type="text" value={experience.institute} onChange={(e) => handleExperienceChange(index, 'institute', e.target.value)} placeholder="e.g. Private Tutoring" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter text-sm" required />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">Institute State</label>
                                                        <CustomSelect value={experience.instituteState} onChange={(value) => handleExperienceChange(index, 'instituteState', value)} options={stateOptions} placeholder="Select State" searchable />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">From Year</label>
                                                        <input type="number" value={experience.fromYear} onChange={(e) => handleExperienceChange(index, 'fromYear', e.target.value)} placeholder="2017" min="1950" max={new Date().getFullYear()} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter text-sm" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">To Year</label>
                                                        <input type="number" value={experience.toYear} onChange={(e) => handleExperienceChange(index, 'toYear', e.target.value)} placeholder="2020" min="1950" max={new Date().getFullYear()} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter text-sm" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 font-inter font-medium mb-2 text-sm">Description</label>
                                                    <textarea value={experience.description} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} rows={3} placeholder="e.g. Provided one-on-one tutoring for JAMB and WAEC candidates with 90% success rate." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all resize-none font-inter text-sm" required />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddExperience} className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] font-inter font-medium transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" />Add Another Experience
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-3">Grade Levels (select at least one)</label>
                                    <div className="mb-4">
                                        <p className="text-sm font-inter font-semibold text-gray-700 mb-2">Primary</p>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {GRADE_LEVELS.primary.map((level) => (
                                                <label key={level} className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[#FF6B35] transition-all">
                                                    <input type="checkbox" checked={formData.gradeLevels.includes(level)} onChange={() => handleGradeLevelToggle(level)} className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]" />
                                                    <span className="text-sm font-inter text-gray-700">{level}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-inter font-semibold text-gray-700 mb-2">Secondary</p>
                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                            {GRADE_LEVELS.secondary.map((level) => (
                                                <label key={level} className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-[#FF6B35] transition-all">
                                                    <input type="checkbox" checked={formData.gradeLevels.includes(level)} onChange={() => handleGradeLevelToggle(level)} className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]" />
                                                    <span className="text-sm font-inter text-gray-700">{level}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-3">Exam Preparation</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {EXAM_TYPES.map((examType) => (
                                            <button key={examType} type="button" onClick={() => handleExamTypeToggle(examType)} className={`px-4 py-3 rounded-lg font-inter font-medium transition-all duration-200 border-2 ${formData.examTypes.includes(examType) ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF6B35]'}`}>
                                                {examType}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-2">Bio (minimum 200 characters)</label>
                                    <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={6} maxLength={760} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all resize-none font-inter" placeholder="Tell students about yourself, your teaching experience, and what makes you a great tutor..." required />
                                    <p className={`text-sm mt-2 font-inter ${formData.bio.length < 200 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {formData.bio.length}/760 characters {formData.bio.length < 200 && `(${200 - formData.bio.length} more needed)`}
                                    </p>
                                </div>

                                {/* Validation Helper */}
                                {!isStep2Valid && (
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-sm font-inter font-semibold text-yellow-800 mb-2">Please complete the following:</p>
                                        <ul className="text-sm text-yellow-700 space-y-1 font-inter">
                                            {formData.subjects.length === 0 && <li>• Select at least one subject</li>}
                                            {!formData.experiences.every(exp => exp.post && exp.institute && exp.instituteState && exp.fromYear && exp.toYear && exp.description) && <li>• Fill all experience fields</li>}
                                            {formData.gradeLevels.length === 0 && formData.examTypes.length === 0 && <li>• Select at least one grade level or exam type</li>}
                                            {formData.bio.length < 200 && <li>• Bio must be at least 200 characters (currently {formData.bio.length})</li>}
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
                                                className="text-[#FF6B35] font-inter font-medium hover:underline text-sm"
                                            >
                                                Skip for now →
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-inter font-medium mb-2">Phone Number</label>
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
                                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="+234 800 000 0000"
                                            required
                                        />
                                        {!formData.phoneVerified && (
                                            <button
                                                type="button"
                                                onClick={handleSendVerificationCode}
                                                disabled={isVerifying || !formData.phone}
                                                className="px-6 py-3 rounded-lg bg-[#FF6B35] text-white font-inter font-medium hover:bg-[#FF6B35]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-center text-lg font-semibold tracking-widest focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter"
                                                placeholder="000000"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyCode}
                                                disabled={isVerifying || formData.verificationCode.length !== 6}
                                                className="px-6 py-3 rounded-lg bg-[#FF6B35] text-white font-inter font-medium hover:bg-[#FF6B35]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Verification</h2>
                                    <p className="text-gray-600 font-inter text-sm">Upload documents to verify your expertise. Approved tutors earn 3x more.</p>
                                </div>

                                {/* Degree Certificate */}
                                <DraftFileInput
                                    fileType="degree_certificate"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    maxSize={5 * 1024 * 1024}
                                    label="Degree Certificate"
                                    description="Upload your university degree or teaching certificate (PDF, JPG, PNG - Max 5MB)"
                                    value={formData.degreeCertificate}
                                    draftMetadata={draftMetadata.degree_certificate}
                                    onChange={(file) => setFormData({ ...formData, degreeCertificate: file })}
                                    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'degree_certificate')}
                                    clerkUserId={user?.id || ''}
                                />

                                {/* Government ID */}
                                <DraftFileInput
                                    fileType="government_id"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    maxSize={5 * 1024 * 1024}
                                    label="Government ID (NIN/Passport)"
                                    description="Upload a valid government-issued ID (NIN, Driver's License, Passport - Max 5MB)"
                                    value={formData.governmentId}
                                    draftMetadata={draftMetadata.government_id}
                                    onChange={(file) => setFormData({ ...formData, governmentId: file })}
                                    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'government_id')}
                                    clerkUserId={user?.id || ''}
                                />

                                {/* NYSC Certificate (Optional) */}
                                <DraftFileInput
                                    fileType="nysc_certificate"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    maxSize={5 * 1024 * 1024}
                                    label="NYSC Certificate (Optional)"
                                    description="Upload your NYSC discharge certificate if applicable (Max 5MB)"
                                    value={formData.nyscCertificate}
                                    draftMetadata={draftMetadata.nysc_certificate}
                                    onChange={(file) => setFormData({ ...formData, nyscCertificate: file })}
                                    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'nysc_certificate')}
                                    clerkUserId={user?.id || ''}
                                />
                            </div>
                        )}
                        {step === 5 && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Profile Media</h2>
                                    <p className="text-gray-600 font-inter text-sm">Parents trust tutors they can see and hear.</p>
                                </div>

                                {/* Profile Photo */}
                                <ProfilePhotoInput
                                    value={formData.profilePhoto}
                                    draftMetadata={draftMetadata.profile_photo}
                                    onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
                                    onDraftRestore={(metadata) => handleDraftRestore(metadata, 'profile_photo')}
                                    clerkUserId={user?.id || ''}
                                />

                                {/* Intro Video */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-gray-700 font-inter font-semibold">Intro Video (2 min)</label>
                                        <span className="text-xs font-inter font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Highly Recommended</span>
                                    </div>

                                    {/* Draft restoration UI for intro video */}
                                    {draftMetadata.intro_video && !formData.introVideo && (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">
                                                        Draft found: {draftMetadata.intro_video.original_filename}
                                                    </p>
                                                    <p className="text-xs text-blue-700">
                                                        Uploaded {new Date(draftMetadata.intro_video.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDraftRestore(draftMetadata.intro_video!, 'intro_video')}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center relative">
                                        {formData.introVideo ? (
                                            <div className="space-y-3">
                                                {/* Action Buttons at Top */}
                                                <div className="flex items-center justify-center gap-3 mb-4 relative z-20">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowVideoModal(true)}
                                                        className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white font-inter font-medium hover:bg-[#FF6B35]/90 transition-all text-sm"
                                                    >
                                                        Preview Video
                                                    </button>
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file && file.size <= 100 * 1024 * 1024) {
                                                                    setFormData({ ...formData, introVideo: file });
                                                                    await handleIntroVideoUpload(file);
                                                                } else if (file) {
                                                                    toast.error('File too large', {
                                                                        description: 'Video must be less than 100MB',
                                                                        duration: 5000,
                                                                    });
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <span className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-inter font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-block text-sm">Change Video</span>
                                                    </label>
                                                </div>
                                                {/* Video Thumbnail with Play Button */}
                                                <div
                                                    className="relative w-full h-64 bg-black rounded-lg overflow-hidden cursor-pointer group border-2 border-dashed border-gray-400"
                                                    onClick={() => setShowVideoModal(true)}
                                                >
                                                    <video
                                                        src={URL.createObjectURL(formData.introVideo)}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                                                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <svg className="w-8 h-8 text-[#FF6B35] ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-green-600 font-inter flex items-center justify-center gap-2">
                                                    <Check className="w-4 h-4" />
                                                    {formData.introVideo.name}
                                                </p>
                                            </div>
                                        ) : isRecording ? (
                                            <div className="space-y-4">
                                                {/* Live Camera Preview - Full Width */}
                                                <div className="relative w-full">
                                                    <video
                                                        ref={liveVideoRef}
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                        className="w-full h-96 bg-black rounded-lg object-cover border-2 border-dashed border-red-400"
                                                    />
                                                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full z-10">
                                                        <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div>
                                                        <span className="text-sm font-inter font-semibold">REC {recordingTime}s</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 font-inter">Recording... {recordingTime}s / 120s</p>
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="px-6 py-2.5 rounded-lg bg-red-500 text-white font-inter font-medium hover:bg-red-600 transition-all"
                                                >
                                                    Stop Recording
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <h3 className="font-inter font-semibold text-gray-900 mb-2">Record a quick intro</h3>
                                                <p className="text-sm text-gray-500 font-inter mb-4">Introduce yourself, your subjects, and why you love teaching.</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={startRecording}
                                                        className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-inter font-medium hover:bg-gray-800 transition-all flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                        </svg>
                                                        Record Now
                                                    </button>
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file && file.size <= 100 * 1024 * 1024) {
                                                                    setFormData({ ...formData, introVideo: file });
                                                                    await handleIntroVideoUpload(file);
                                                                } else if (file) {
                                                                    toast.error('File too large', {
                                                                        description: 'Video must be less than 100MB',
                                                                        duration: 5000,
                                                                    });
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                        <span className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-inter font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all inline-block">
                                                            Upload File
                                                        </span>
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Payout Details */}
                        {step === 6 && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Payout Details</h2>
                                    <p className="text-gray-600 font-inter text-sm">Where should we send your earnings?</p>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-inter font-semibold mb-2">Bank Name</label>
                                    <CustomSelect
                                        value={formData.bankName}
                                        onChange={(value) => setFormData({ ...formData, bankName: value })}
                                        options={[
                                            { value: '9mobile 9Payment Service Bank', label: '9mobile 9Payment Service Bank' },
                                            { value: 'Abbey Mortgage Bank', label: 'Abbey Mortgage Bank' },
                                            { value: 'Above Only MFB', label: 'Above Only MFB' },
                                            { value: 'Access Bank', label: 'Access Bank' },
                                            { value: 'Access Bank (Diamond)', label: 'Access Bank (Diamond)' },
                                            { value: 'Accion Microfinance Bank', label: 'Accion Microfinance Bank' },
                                            { value: 'Ahmadu Bello University Microfinance Bank', label: 'Ahmadu Bello University Microfinance Bank' },
                                            { value: 'Airtel Smartcash PSB', label: 'Airtel Smartcash PSB' },
                                            { value: 'AKU Microfinance Bank', label: 'AKU Microfinance Bank' },
                                            { value: 'ALAT by WEMA', label: 'ALAT by WEMA' },
                                            { value: 'Amju Unique MFB', label: 'Amju Unique MFB' },
                                            { value: 'ASO Savings and Loans', label: 'ASO Savings and Loans' },
                                            { value: 'Astrapolaris MFB', label: 'Astrapolaris MFB' },
                                            { value: 'Bainescredit MFB', label: 'Bainescredit MFB' },
                                            { value: 'Bowen Microfinance Bank', label: 'Bowen Microfinance Bank' },
                                            { value: 'Carbon', label: 'Carbon' },
                                            { value: 'CEMCS Microfinance Bank', label: 'CEMCS Microfinance Bank' },
                                            { value: 'Chanelle Microfinance Bank Limited', label: 'Chanelle Microfinance Bank Limited' },
                                            { value: 'Citibank Nigeria', label: 'Citibank Nigeria' },
                                            { value: 'Coronation Merchant Bank', label: 'Coronation Merchant Bank' },
                                            { value: 'Ecobank Nigeria', label: 'Ecobank Nigeria' },
                                            { value: 'Ekondo Microfinance Bank', label: 'Ekondo Microfinance Bank' },
                                            { value: 'Eyowo', label: 'Eyowo' },
                                            { value: 'Fairmoney Microfinance Bank', label: 'Fairmoney Microfinance Bank' },
                                            { value: 'Fidelity Bank', label: 'Fidelity Bank' },
                                            { value: 'Firmus MFB', label: 'Firmus MFB' },
                                            { value: 'First Bank of Nigeria', label: 'First Bank of Nigeria' },
                                            { value: 'First City Monument Bank', label: 'First City Monument Bank' },
                                            { value: 'FSDH Merchant Bank Limited', label: 'FSDH Merchant Bank Limited' },
                                            { value: 'Globus Bank', label: 'Globus Bank' },
                                            { value: 'GoMoney', label: 'GoMoney' },
                                            { value: 'Guaranty Trust Bank', label: 'Guaranty Trust Bank' },
                                            { value: 'Hackman Microfinance Bank', label: 'Hackman Microfinance Bank' },
                                            { value: 'Hasal Microfinance Bank', label: 'Hasal Microfinance Bank' },
                                            { value: 'Heritage Bank', label: 'Heritage Bank' },
                                            { value: 'Ibile Microfinance Bank', label: 'Ibile Microfinance Bank' },
                                            { value: 'Infinity MFB', label: 'Infinity MFB' },
                                            { value: 'Jaiz Bank', label: 'Jaiz Bank' },
                                            { value: 'Keystone Bank', label: 'Keystone Bank' },
                                            { value: 'Kuda Bank', label: 'Kuda Bank' },
                                            { value: 'Lagos Building Investment Company Plc.', label: 'Lagos Building Investment Company Plc.' },
                                            { value: 'Links MFB', label: 'Links MFB' },
                                            { value: 'Living Trust Mortgage Bank', label: 'Living Trust Mortgage Bank' },
                                            { value: 'Lotus Bank', label: 'Lotus Bank' },
                                            { value: 'Mayfair MFB', label: 'Mayfair MFB' },
                                            { value: 'Mint MFB', label: 'Mint MFB' },
                                            { value: 'Moniepoint MFB', label: 'Moniepoint MFB' },
                                            { value: 'MTN Momo PSB', label: 'MTN Momo PSB' },
                                            { value: 'Optimus Bank', label: 'Optimus Bank' },
                                            { value: 'Paga', label: 'Paga' },
                                            { value: 'PalmPay', label: 'PalmPay' },
                                            { value: 'Parallex Bank', label: 'Parallex Bank' },
                                            { value: 'Parkway - ReadyCash', label: 'Parkway - ReadyCash' },
                                            { value: 'Paycom', label: 'Paycom' },
                                            { value: 'Petra Mircofinance Bank Plc', label: 'Petra Mircofinance Bank Plc' },
                                            { value: 'Polaris Bank', label: 'Polaris Bank' },
                                            { value: 'Providus Bank', label: 'Providus Bank' },
                                            { value: 'QuickFund MFB', label: 'QuickFund MFB' },
                                            { value: 'Rand Merchant Bank', label: 'Rand Merchant Bank' },
                                            { value: 'Refuge Mortgage Bank', label: 'Refuge Mortgage Bank' },
                                            { value: 'Renmoney MFB', label: 'Renmoney MFB' },
                                            { value: 'Rubies MFB', label: 'Rubies MFB' },
                                            { value: 'Sparkle Microfinance Bank', label: 'Sparkle Microfinance Bank' },
                                            { value: 'Stanbic IBTC Bank', label: 'Stanbic IBTC Bank' },
                                            { value: 'Standard Chartered Bank', label: 'Standard Chartered Bank' },
                                            { value: 'Sterling Bank', label: 'Sterling Bank' },
                                            { value: 'Suntrust Bank', label: 'Suntrust Bank' },
                                            { value: 'TAJ Bank', label: 'TAJ Bank' },
                                            { value: 'Tangerine Money', label: 'Tangerine Money' },
                                            { value: 'TCF MFB', label: 'TCF MFB' },
                                            { value: 'Titan Bank', label: 'Titan Bank' },
                                            { value: 'Titan Paystack', label: 'Titan Paystack' },
                                            { value: 'Union Bank of Nigeria', label: 'Union Bank of Nigeria' },
                                            { value: 'United Bank For Africa', label: 'United Bank For Africa' },
                                            { value: 'Unity Bank', label: 'Unity Bank' },
                                            { value: 'VFD Microfinance Bank Limited', label: 'VFD Microfinance Bank Limited' },
                                            { value: 'Wema Bank', label: 'Wema Bank' },
                                            { value: 'Zenith Bank', label: 'Zenith Bank' },
                                        ]}
                                        placeholder="Select Bank"
                                        searchable
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-inter font-semibold mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={formData.accountNumber}
                                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        maxLength={10}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all font-inter"
                                        placeholder="0123456789"
                                        required
                                    />

                                    {formData.firstName && formData.lastName && (
                                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                                            <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-blue-800 font-inter font-semibold mb-1">Account Name</p>
                                                <p className="text-base text-blue-900 font-inter font-bold">{(formData.firstName + ' ' + formData.lastName).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 7: Platform Rules */}
                        {step === 7 && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Platform Rules</h2>
                                    <p className="text-gray-600 font-inter text-sm">Please review our professional code of conduct.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-700 font-inter font-semibold">1</span>
                                        </div>
                                        <div>
                                            <h3 className="font-inter font-semibold text-gray-900 mb-1">15% Platform Fee:</h3>
                                            <p className="text-gray-600 font-inter text-sm">SabiLearn charges a service fee on completed lessons to maintain the platform and marketing.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-700 font-inter font-semibold">2</span>
                                        </div>
                                        <div>
                                            <h3 className="font-inter font-semibold text-gray-900 mb-1">No Off-Platform Payments:</h3>
                                            <p className="text-gray-600 font-inter text-sm">Accepting direct payments from parents will lead to immediate permanent ban.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-gray-700 font-inter font-semibold">3</span>
                                        </div>
                                        <div>
                                            <h3 className="font-inter font-semibold text-gray-900 mb-1">Professionalism:</h3>
                                            <p className="text-gray-600 font-inter text-sm">Lateness or no-shows for scheduled lessons are strictly penalized.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 w-5 h-5 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                                        />
                                        <span className="text-gray-700 font-inter text-sm">
                                            I have read and agree to the <a href="#" className="text-[#FF6B35] underline font-medium">Terms of Service</a> and <a href="#" className="text-[#FF6B35] underline font-medium">Code of Conduct</a>.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 8: Review Application */}
                        {step === 8 && !isSubmitted && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 mb-2">Review Application</h2>
                                    <p className="text-gray-600 font-inter text-sm">Double check your details before submitting.</p>
                                </div>

                                {/* Personal Information Card */}
                                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold text-gray-900">Personal Information</h3>
                                    </div>
                                    <div className="flex items-start gap-6">
                                        <div className="w-24 h-24 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-gray-300">
                                            {formData.profilePhoto ? (
                                                <img src={URL.createObjectURL(formData.profilePhoto)} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Full Name</p>
                                                <p className="text-base font-inter font-semibold text-gray-900">{formData.firstName} {formData.lastName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Display Name</p>
                                                <p className="text-base font-inter font-semibold text-gray-900">{formData.displayName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Gender</p>
                                                <p className="text-base font-inter text-gray-900">{formData.gender}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Date of Birth</p>
                                                <p className="text-base font-inter text-gray-900">{formData.dateOfBirth}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Location</p>
                                                <p className="text-base font-inter text-gray-900">{formData.lga}, {formData.state}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Phone</p>
                                                <p className="text-base font-inter text-gray-900">{formData.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Teaching Details Card */}
                                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold text-gray-900">Teaching Details</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-2">Subjects</p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.subjects.map((subject, index) => (
                                                    <span key={index} className="px-3 py-1.5 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg text-sm font-inter font-medium">
                                                        {subject}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-2">Grade Levels</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.gradeLevels.map((level, index) => (
                                                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-inter">
                                                            {level}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-2">Exam Preparation</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.examTypes.map((exam, index) => (
                                                        <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-inter">
                                                            {exam}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-2">Bio</p>
                                            <p className="text-sm font-inter text-gray-700 leading-relaxed">{formData.bio}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Experience Card */}
                                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold text-gray-900">Experience</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.experiences.map((exp, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-inter font-semibold text-gray-900">{exp.post}</p>
                                                        <p className="text-sm font-inter text-gray-600">{exp.institute}, {exp.instituteState}</p>
                                                    </div>
                                                    <span className="text-xs font-inter text-gray-500 whitespace-nowrap">{exp.fromYear} - {exp.toYear}</span>
                                                </div>
                                                <p className="text-sm font-inter text-gray-700">{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Verification & Documents Card */}
                                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-[#FF6B35]" />
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold text-gray-900">Verification & Documents</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-inter font-semibold text-green-900">Degree Certificate</p>
                                                <p className="text-xs font-inter text-green-700">{formData.degreeCertificate?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-inter font-semibold text-green-900">Government ID</p>
                                                <p className="text-xs font-inter text-green-700">{formData.governmentId?.name}</p>
                                            </div>
                                        </div>
                                        {formData.nyscCertificate && (
                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-inter font-semibold text-green-900">NYSC Certificate</p>
                                                    <p className="text-xs font-inter text-green-700">{formData.nyscCertificate?.name}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-inter font-semibold text-green-900">Profile Photo</p>
                                                <p className="text-xs font-inter text-green-700">{formData.profilePhoto ? 'Uploaded' : 'Not uploaded'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Media Preview Card */}
                                {formData.introVideo && (
                                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-outfit font-bold text-gray-900">Intro Video</h3>
                                        </div>
                                        <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 group cursor-pointer" onClick={() => setShowVideoModal(true)}>
                                            <video
                                                src={URL.createObjectURL(formData.introVideo)}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                                                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <svg className="w-8 h-8 text-[#FF6B35] ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p className="text-white font-inter text-sm font-semibold drop-shadow-lg">Click to preview your intro video</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payout Details Card */}
                                <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-outfit font-bold text-gray-900">Payout Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Bank Name</p>
                                            <p className="text-base font-inter font-semibold text-gray-900">{formData.bankName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Account Number</p>
                                            <p className="text-base font-inter font-semibold text-gray-900">{formData.accountNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-inter font-semibold uppercase mb-1">Account Name</p>
                                            <p className="text-base font-inter font-semibold text-gray-900">{formData.accountName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-inter">
                                        <span className="font-semibold">Important:</span> By submitting, you confirm all provided information is accurate and complete.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Success Screen */}
                        {isSubmitted && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-12 h-12 text-green-600" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 mb-4">Application Submitted!</h2>
                                <p className="text-gray-600 font-inter mb-2">
                                    Thank you, {formData.firstName}. Our team will review your credentials within <span className="font-semibold text-gray-900">24-48 hours</span>.
                                </p>

                                <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-inter font-semibold text-gray-700">Status</span>
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-inter font-semibold rounded-full">PENDING REVIEW</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                                    </div>
                                    <p className="text-sm text-gray-600 font-inter">We'll notify you via email once approved.</p>
                                </div>

                                <button
                                    onClick={() => router.push('/dashboard/tutor')}
                                    className="mt-8 px-8 py-3 rounded-lg bg-gray-900 text-white font-inter font-semibold hover:bg-gray-800 transition-all"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        )}

                        {/* Video Modal */}
                        {showVideoModal && formData.introVideo && (
                            <div
                                className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 overflow-y-auto"
                                style={{ zIndex: 9999 }}
                                onClick={() => setShowVideoModal(false)}
                            >
                                <div
                                    className="relative bg-black rounded-lg max-w-2xl w-full my-8"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close button inside the modal */}
                                    <button
                                        onClick={() => setShowVideoModal(false)}
                                        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-black/70"
                                    >
                                        <span className="font-inter text-sm font-medium">Close</span>
                                        <X className="w-5 h-5" />
                                    </button>
                                    <video
                                        ref={videoRef}
                                        src={URL.createObjectURL(formData.introVideo)}
                                        controls
                                        autoPlay
                                        className="w-full rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-red-800 font-inter font-semibold mb-1">Please complete the following:</p>
                                        <p className="text-red-700 font-inter text-sm whitespace-pre-line">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                    {!isSubmitted && (
                        <div className="flex justify-between items-center">
                            <button type="button" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1 || isSubmitting} className={`px-6 py-3 rounded-lg font-inter font-medium transition-all ${step === 1 ? 'bg-white/50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-white/90 shadow-md'}`}>Back</button>
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
                                {step < 8 ? (
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
                                                (step === 5 && !isStep5Valid) ||
                                                (step === 6 && !isStep6Valid) ||
                                                (step === 7 && !isStep7Valid)
                                            }
                                            className="px-8 py-3 rounded-lg font-inter font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            Continue
                                        </button>
                                    )
                                ) : (
                                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 rounded-lg font-inter font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg" style={{ backgroundColor: themeColor }}>
                                        {isSubmitting ? (<><svg className="animate-spin h-4 w-4 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Submitting...</>) : ('Submit Application')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
