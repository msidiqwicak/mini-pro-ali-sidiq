export const generateSlug = (name) => {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    return `${base}-${Date.now()}`;
};
export const generateReferralCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};
export const generateQRCode = () => {
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    return `QR-${random}-${Date.now()}`;
};
