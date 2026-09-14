import Cryptr from "cryptr";

const cryptr = new Cryptr(process.env.ENCRYPTION_KEY!);

export function encrypt(text: string) {
    if (text.trim() === "" || text === null) return ""
    return cryptr.encrypt(text);
}

export function decrypt(text: string) {
    if (text.trim() === "" || text === null) return ""
    return cryptr.decrypt(text);
}