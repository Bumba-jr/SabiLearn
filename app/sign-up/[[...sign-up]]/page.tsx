import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#FF6B35]/20 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-outfit font-bold text-white mb-2">
                        Join SabiLearn
                    </h1>
                    <p className="text-gray-300 font-inter">
                        Create your account to get started
                    </p>
                </div>

                <SignUp
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'bg-white shadow-2xl',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            socialButtonsBlockButton: 'bg-white border-2 border-gray-200 hover:border-[#FF6B35] transition-colors',
                            socialButtonsBlockButtonText: 'font-inter font-medium',
                            formButtonPrimary: 'bg-[#FF6B35] hover:bg-[#FF6B35]/90 transition-colors',
                            footerActionLink: 'text-[#FF6B35] hover:text-[#FF6B35]/80',
                            identityPreviewText: 'font-inter',
                            formFieldLabel: 'font-inter font-medium',
                            formFieldInput: 'font-inter border-gray-300 focus:border-[#FF6B35] focus:ring-[#FF6B35]',
                        },
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                />
            </div>
        </div>
    );
}
