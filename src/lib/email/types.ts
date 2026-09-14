export type SmtpConfig = {
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName?: string | null;
    isVerified: boolean;
    lastVerifiedAt?: string | null;
    lastError?: string | null;
    testEmail?: string | null;
};