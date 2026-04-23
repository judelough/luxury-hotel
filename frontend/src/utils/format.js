export function money(n) {
    if (n == null) return "";
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(Number(n));
}

export function fmtDate(d) {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(date);
}

export function daysBetween(checkIn, checkOut) {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) ? Math.max(diff, 0) : 0;
}
