export function waPhoneNumber(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("212")) return digits;
  if (digits.startsWith("0")) return "212" + digits.slice(1);
  return digits;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string {
  return `https://wa.me/${waPhoneNumber(phone)}?text=${encodeURIComponent(message)}`;
}