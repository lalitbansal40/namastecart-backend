// services/otp.service.ts

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const generateOtp = (length = 6): string => {
    return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
};

export const saveOtp = (email: string, otp: string, ttl = 60 * 1000) => {
    const normalizedEmail = email.trim().toLowerCase();
    otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + ttl });
};

export const verifyOtp = (email: string, otp: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const data = otpStore.get(normalizedEmail);

    if (!data || data.otp !== otp || Date.now() > data.expiresAt) {
        return false;
    }

    otpStore.delete(normalizedEmail); // remove after success
    return true;
};
