const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export function getPrimaryAdminEmail() {
  return adminEmails[0] || null;
}

export function getAdminTelegramUsername() {
  return process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_USERNAME?.trim().replace(/^@/, "") || null;
}
