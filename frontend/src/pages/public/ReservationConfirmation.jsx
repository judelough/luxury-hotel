import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { endpoints } from "../../api/endpoints";
import { money } from "../../utils/format";
import { http } from "../../api/http";

// Only used for static assets (logos/images) if needed; API calls use http.js
const ASSET_BASE =
    (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "") ||
    "http://localhost:8080";


/** pick first non-empty value */
function pick(...vals) {
    for (const v of vals) {
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
}

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function nightsBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(`${checkIn}T00:00:00`);
    const b = new Date(`${checkOut}T00:00:00`);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

function fallbackImage() {
    return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2400&auto=format&fit=crop";
}

function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

function InfoPill({ label, value, tone = "default" }) {
    const toneCls =
        tone === "gold"
            ? "border-[#C9A24D]/40 bg-[#C9A24D]/15 text-white"
            : "border-white/15 bg-white/10 text-white";

    return (
        <span className={cn("rounded-full border px-4 py-2 text-sm backdrop-blur", toneCls)}>
      <span className="text-white/70">{label ? `${label} ` : ""}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
    );
}

function badgeTone(value) {
    const v = String(value || "").toUpperCase();
    if (v.includes("CANCEL")) return "border-red-200/30 bg-red-500/15 text-white";
    if (v.includes("PEND")) return "border-amber-200/30 bg-amber-400/15 text-white";
    if (v.includes("ACTIVE") || v.includes("CONFIRMED")) return "border-[#C9A24D]/40 bg-[#C9A24D]/15 text-white";
    return "border-white/15 bg-white/10 text-white";
}

function paymentTone(value) {
    const v = String(value || "").toUpperCase();
    if (v.includes("PAID")) return "border-emerald-200/30 bg-emerald-400/15 text-white";
    if (v.includes("UNPAID")) return "border-amber-200/30 bg-amber-400/15 text-white";
    if (v.includes("REFUND")) return "border-sky-200/30 bg-sky-400/15 text-white";
    return "border-white/15 bg-white/10 text-white";
}

async function fetchJson(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) {
        let detail = "";
        try {
            const payload = await res.json();
            detail = payload?.message || payload?.error || "";
        } catch {
            // ignore
        }
        if (res.status === 404) throw new Error(detail || "Not found (404).");
        throw new Error(detail || `Request failed (HTTP ${res.status}).`);
    }
    return res.json();
}

function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/**
 * Minimal, dependency-free PDF generator (text receipt).
 * Produces a real .pdf file that the browser can download.
 */
function pdfEscape(s) {
    return String(s ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)");
}

// Basic text wrap for PDF (approx char-based)
function wrapText(text, maxChars = 78) {
    const t = String(text ?? "").trim();
    if (!t) return [];
    const words = t.split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (test.length <= maxChars) line = test;
        else {
            if (line) lines.push(line);
            line = w;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// Minimal, dependency-free "nice receipt" PDF generator (Helvetica)
function buildReceiptPdf({
                             title = "LuxStay — Receipt",
                             subtitleLeft = "",
                             subtitleRight = "",
                             sections = [], // [{ title, rows: [{k,v}], noteLines?: [] }]
                             footerLines = [],
                         }) {
    const w = 612; // Letter
    const h = 792;

    const ops = [];
    const push = (s) => ops.push(s);

    // helpers
    const setFont = (size) => push(`/F1 ${size} Tf`);
    const textAt = (x, y, text) => {
        push("BT");
        push("1 0 0 1 0 0 Tm");
        push(`${x} ${y} Td`);
        push(`(${pdfEscape(text)}) Tj`);
        push("ET");
    };
    const line = (x1, y1, x2, y2) => {
        push("q");
        push("0.85 w");
        push(`${x1} ${y1} m`);
        push(`${x2} ${y2} l`);
        push("S");
        push("Q");
    };
    const rectStroke = (x, y, rw, rh) => {
        push("q");
        push("0.85 w");
        push(`${x} ${y} ${rw} ${rh} re`);
        push("S");
        push("Q");
    };

    // Layout
    const marginX = 54;
    let y = 742;

    // Header
    setFont(22);
    textAt(marginX, y, title);
    y -= 22;

    setFont(10);
    if (subtitleLeft) textAt(marginX, y, subtitleLeft);
    if (subtitleRight) textAt(marginX, y - 14, subtitleRight);
    y -= 28;

    line(marginX, y, w - marginX, y);
    y -= 18;

    // Receipt card box
    const boxTop = y + 10;
    const boxX = marginX;
    const boxW = w - marginX * 2;

    // We'll measure height as we go; draw at end with rectStroke
    const startY = y;
    let minY = y;

    const leftX = marginX + 16;
    const rightX = w - marginX - 16;

    const row = (k, v, { bold = false, size = 11 } = {}) => {
        setFont(bold ? size + 1 : size);
        // left
        textAt(leftX, y, k);
        // right (approx right align by shifting based on string length)
        const s = String(v ?? "—");
        const approxCharW = (bold ? 0.58 : 0.55) * (size + (bold ? 1 : 0)); // crude
        const textW = s.length * approxCharW * 1.9; // tuned visually
        const rx = Math.max(leftX + 250, rightX - textW);
        textAt(rx, y, s);
        y -= 16;
        minY = Math.min(minY, y);
    };

    const sectionTitle = (t) => {
        setFont(10);
        textAt(leftX, y, t.toUpperCase());
        y -= 14;
        minY = Math.min(minY, y);
        line(leftX, y + 6, rightX, y + 6);
        y -= 10;
        minY = Math.min(minY, y);
    };

    for (const s of sections) {
        if (y < 130) break; // single-page safety
        sectionTitle(s.title);

        for (const r of s.rows || []) {
            if (y < 130) break;
            row(r.k, r.v, r.style || {});
        }

        if (s.noteLines?.length) {
            y -= 2;
            setFont(10);
            for (const nl of s.noteLines) {
                if (y < 130) break;
                const lines = wrapText(nl, 88);
                for (const l of lines) {
                    textAt(leftX, y, l);
                    y -= 13;
                }
            }
            minY = Math.min(minY, y);
        }

        y -= 10;
        minY = Math.min(minY, y);
    }

    // Footer
    line(marginX, y + 6, w - marginX, y + 6);
    y -= 14;
    setFont(9);
    for (const f of footerLines) {
        if (y < 70) break;
        textAt(marginX, y, f);
        y -= 12;
    }

    // Draw the "card" box around the content (stroke only)
    const boxBottom = minY - 8;
    const boxH = boxTop - boxBottom;
    rectStroke(boxX, boxBottom, boxW, boxH);

    const stream = ops.join("\n");
    const streamBytes = new TextEncoder().encode(stream);

    // Objects
    const objects = [];
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
    objects.push(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
    );
    objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
    objects.push(
        `5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );

    // Build xref
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(pdf.length);
        pdf += obj;
    }
    const xrefStart = pdf.length;
    pdf += "xref\n";
    pdf += `0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += "trailer\n";
    pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += "startxref\n";
    pdf += `${xrefStart}\n`;
    pdf += "%%EOF";

    return new Blob([pdf], { type: "application/pdf" });
}



export default function ReservationConfirmation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [resv, setResv] = useState(null);
    const [room, setRoom] = useState(null);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    // hero like RoomDetails.jsx
    const [heroSrc, setHeroSrc] = useState("");

    async function loadAll(signal) {
        setLoading(true);
        setErr(null);
        setRoom(null);

        try {
            // ✅ API call via http.js (uses VITE_API_BASE_URL)
            const reservation = await http.get(endpoints.reservationById(id), { signal });
            setResv(reservation);

            const rid = pick(reservation?.roomId);
            if (rid !== undefined && rid !== null && rid !== "") {
                // ✅ API call via http.js (no hardcoded localhost)
                const roomDto = await http.get(`/api/v2/rooms/${rid}`, { signal });
                setRoom(roomDto);
                setHeroSrc(roomDto?.imageUrl || fallbackImage());
            } else {
                setHeroSrc(fallbackImage());
            }
        } catch (e) {
            if (e?.name === "AbortError") return;
            setErr(e?.message || "Failed to load confirmation.");
            setResv(null);
            setRoom(null);
            setHeroSrc(fallbackImage());
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        const controller = new AbortController();
        loadAll(controller.signal);
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ---- mapping based on your actual JSON ----
    const reservationId = pick(resv?.id, id);
    const status = String(pick(resv?.status, "ACTIVE")); // ACTIVE
    const paymentStatus = String(pick(resv?.paymentStatus, "UNPAID")); // UNPAID

    const startDate = pick(resv?.startDate);
    const endDate = pick(resv?.endDate);
    const nights = useMemo(() => nightsBetween(startDate, endDate), [startDate, endDate]);

    const roomId = pick(resv?.roomId, room?.id, "—");
    const hotelName = pick(room?.hotelName, "Hotel");
    const city = pick(room?.city, "—");
    const roomNumber = room?.roomNumber ?? null;
    const roomTitle = roomNumber != null ? `Room #${roomNumber}` : "Room";

    const rate = Number(pick(room?.price, 0));
    const subtotal = useMemo(() => (nights > 0 ? rate * nights : 0), [nights, rate]);
    const serviceFee = useMemo(() => (subtotal ? Math.round(subtotal * 0.03 * 100) / 100 : 0), [subtotal]);
    const total = useMemo(() => subtotal + serviceFee, [subtotal, serviceFee]);

    const customer = resv?.customer || null;
    const customerName = pick(customer?.fullName, "Guest");
    const customerEmail = pick(customer?.email, null);
    const customerId = pick(customer?.id, resv?.customerId, "—");
    const notes = pick(resv?.notes, null);

    function downloadReceiptPdf() {
        const linesNotes = notes ? wrapText(`Notes: ${notes}`, 90) : [];

        const sections = [
            {
                title: "Reservation",
                rows: [
                    { k: "Reservation ID", v: `#${reservationId}` },
                    { k: "Status", v: status },
                    { k: "Payment", v: paymentStatus },
                    { k: "Created at", v: String(pick(resv?.createdAt, "—")) },
                ],
            },
            {
                title: "Stay",
                rows: [
                    { k: "Hotel", v: hotelName },
                    { k: "City", v: city },
                    { k: "Room", v: `${roomTitle} (ID: ${roomId})` },
                    { k: "Dates", v: `${fmtDate(startDate)} → ${fmtDate(endDate)}` },
                    { k: "Nights", v: `${nights}` },
                ],
            },
            {
                title: "Guest",
                rows: [
                    { k: "Name", v: customerName },
                    { k: "Customer ID", v: customerId },
                    ...(customerEmail ? [{ k: "Email", v: customerEmail }] : []),
                ],
                noteLines: linesNotes,
            },
            {
                title: "Charges",
                rows: [
                    { k: "Nightly rate", v: money(rate) },
                    { k: "Subtotal", v: money(subtotal) },
                    { k: "Service fee (3%)", v: money(serviceFee) },
                    { k: "Total", v: money(total), style: { bold: true, size: 12 } },
                ],
            },
        ];

        const blob = buildReceiptPdf({
            title: "LuxStay — Reservation Receipt",
            subtitleLeft: `${hotelName} • ${roomTitle}`,
            subtitleRight: `${fmtDate(startDate)} → ${fmtDate(endDate)}  •  ${nights} night${nights === 1 ? "" : "s"}`,
            sections,
            footerLines: [
                "Keep this receipt for check-in.",
                `Reservation ID: #${reservationId}`,
                "Thank you for choosing LuxStay.",
            ],
        });

        downloadBlob(`luxstay-receipt-${reservationId}.pdf`, blob);
    }


    // ---------- UI states ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-12">
                    <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_120px_rgba(11,15,20,0.10)]">
                        <div className="h-4 w-40 rounded bg-black/10" />
                        <div className="mt-4 h-10 w-3/4 rounded bg-black/10" />
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="h-24 rounded-2xl bg-black/10" />
                            <div className="h-24 rounded-2xl bg-black/10" />
                            <div className="h-24 rounded-2xl bg-black/10" />
                        </div>
                        <div className="mt-6 h-12 rounded-2xl bg-black/10" />
                    </div>
                </div>
            </div>
        );
    }

    if (err || !resv) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-12">
                    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_30px_120px_rgba(11,15,20,0.10)]">
                        <div className="border-b border-black/10 bg-[#0B0F14] px-8 py-7 text-white">
                            <div className="text-[11px] tracking-[0.46em] uppercase text-white/70">Reservation</div>
                            <div className="mt-2 font-serif text-3xl">We couldn’t load this confirmation</div>
                            <div className="mt-2 text-sm text-white/70">{err || "Reservation not found."}</div>
                        </div>

                        <div className="px-8 py-7">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="accent" onClick={() => loadAll()}>
                                    Try again
                                </Button>
                                <Button variant="outline" onClick={() => navigate("/search")}>
                                    Back to search
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------- final UI ----------
    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* HERO (same style as RoomDetails.jsx) */}
            <section className="relative overflow-hidden">
                <div className="relative h-[58vh] w-full md:h-[70vh]">
                    <img
                        src={heroSrc || fallbackImage()}
                        alt={`${hotelName} • ${roomTitle}`}
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={() => setHeroSrc(fallbackImage())}
                    />

                    {/* cinematic overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.38)_0%,rgba(11,15,20,0.26)_38%,rgba(11,15,20,0.84)_100%)]" />
                    <div className="absolute inset-0 [box-shadow:inset_0_-160px_200px_rgba(0,0,0,0.62)]" />

                    {/* top actions */}
                    <div className="absolute left-0 right-0 top-0">
                        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
                            <button
                                onClick={() => navigate("/search")}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/15"
                                type="button"
                            >
                                ← BACK TO SEARCH
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.22em] backdrop-blur", badgeTone(status))}>
                  {String(status).toUpperCase()}
                </span>
                                <span className={cn("rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.22em] backdrop-blur", paymentTone(paymentStatus))}>
                  {String(paymentStatus).toUpperCase()}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* hero text */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="mx-auto max-w-6xl px-5 pb-12 md:pb-14">
                            <div className="text-[11px] tracking-[0.46em] uppercase text-white/75">
                                RESERVATION CONFIRMATION
                            </div>

                            <h1 className="mt-3 font-serif text-5xl leading-[1.03] text-white md:text-6xl">
                                You’re booked.
                            </h1>

                            <div className="mt-3 text-sm text-white/75">
                                {hotelName} • {roomTitle} • <span className="font-semibold text-white">#{reservationId}</span>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <InfoPill label="" value={`${fmtDate(startDate)} → ${fmtDate(endDate)}`} />
                                <InfoPill label="" value={`${nights} night${nights === 1 ? "" : "s"}`} />
                                {rate ? <InfoPill label="" value={`${money(rate)} / night`} tone="gold" /> : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* floating receipt strip */}
                <div className="relative z-10 -mt-10">
                    <div className="mx-auto max-w-6xl px-5">
                        <div className="rounded-3xl border border-black/10 bg-white/92 p-6 shadow-[0_24px_80px_rgba(11,15,20,0.18)] [box-shadow:0_24px_80px_rgba(11,15,20,0.18),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur">
                            <div className="grid gap-4 md:grid-cols-12 md:items-center">
                                <div className="md:col-span-8">
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Stay summary</div>

                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/65">
                                        <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">{roomTitle}</span>
                                        <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">
                      {fmtDate(startDate)} → {fmtDate(endDate)}
                    </span>
                                        <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">
                      {nights} night{nights === 1 ? "" : "s"}
                    </span>
                                        {notes ? (
                                            <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-black/60">
                        Notes added
                      </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="md:col-span-4">
                                    <div className="rounded-2xl border border-black/10 bg-[#F6F3EE] p-4">
                                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Total</div>
                                        <div className="mt-2 font-serif text-3xl text-[#0B0F14]">{money(total)}</div>
                                        <div className="mt-1 text-xs text-black/45">
                                            Subtotal {money(subtotal)} + fee {money(serviceFee)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                {roomId && roomId !== "—" ? (
                                    <Link to={`/rooms/${roomId}`}>
                                        <Button variant="outline">View room</Button>
                                    </Link>
                                ) : null}

                                <Button variant="outline" onClick={downloadReceiptPdf}>
                                    Download receipt (PDF)
                                </Button>

                                <Button variant="accent" onClick={() => navigate("/search")}>
                                    Book another stay
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="mx-auto max-w-6xl px-5 pb-14 pt-10">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left */}
                    <Card className="p-7 md:col-span-8">
                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Receipt</div>
                        <div className="mt-2 font-serif text-3xl text-[#0B0F14]">Reservation details</div>
                        <div className="mt-2 text-sm text-black/60">
                            Keep this page for check-in — your reservation ID is{" "}
                            <span className="font-semibold text-black/80">#{reservationId}</span>.
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {/* Guest */}
                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Guest</div>
                                <div className="mt-3 space-y-2 text-sm text-black/70">
                                    <div>
                                        <span className="text-black/45">Name:</span>{" "}
                                        <span className="font-medium text-black/80">{customerName}</span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">Customer ID:</span>{" "}
                                        <span className="font-medium text-black/80">{customerId}</span>
                                    </div>
                                    {customerEmail ? (
                                        <div>
                                            <span className="text-black/45">Email:</span>{" "}
                                            <span className="font-medium text-black/80">{customerEmail}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Stay */}
                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Stay</div>
                                <div className="mt-3 space-y-2 text-sm text-black/70">
                                    <div>
                                        <span className="text-black/45">Hotel:</span>{" "}
                                        <span className="font-medium text-black/80">{hotelName}</span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">City:</span>{" "}
                                        <span className="font-medium text-black/80">{city}</span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">Room:</span>{" "}
                                        <span className="font-medium text-black/80">{roomTitle}</span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">Payment:</span>{" "}
                                        <span className="font-medium text-black/80">{paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="rounded-2xl border border-black/10 bg-white p-5 md:col-span-2">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Dates</div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-black/70">
                                    <div>
                                        <div className="text-black/45">Start</div>
                                        <div className="font-medium text-black/80">{fmtDate(startDate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-black/45">End</div>
                                        <div className="font-medium text-black/80">{fmtDate(endDate)}</div>
                                    </div>
                                    <div>
                                        <div className="text-black/45">Nights</div>
                                        <div className="font-medium text-black/80">{nights}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {notes ? (
                                <div className="rounded-3xl border border-black/10 bg-[#F6F3EE] p-6 md:col-span-2">
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Notes</div>
                                    <div className="mt-2 text-sm leading-relaxed text-black/70">{notes}</div>
                                </div>
                            ) : null}

                            {/* Instructions */}
                            <div className="rounded-3xl border border-[#C9A24D]/25 bg-[#C9A24D]/10 p-6 md:col-span-2">
                                <div className="text-[11px] tracking-[0.42em] uppercase text-black/55">
                                    Check-in instructions
                                </div>
                                <ul className="mt-3 space-y-2 text-sm text-black/70">
                                    <li className="flex gap-3">
                                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#C9A24D]" />
                                        Bring a valid government ID matching your reservation details.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#C9A24D]" />
                                        Keep your reservation ID <span className="font-semibold text-black/80">#{reservationId}</span> ready at the front desk.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#C9A24D]" />
                                        Confirm your stay dates: <span className="font-semibold text-black/80">{fmtDate(startDate)} → {fmtDate(endDate)}</span>.
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-[7px] h-2 w-2 rounded-full bg-[#C9A24D]" />
                                        Payment is currently marked as <span className="font-semibold text-black/80">{paymentStatus}</span>.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Right */}
                    <div className="md:col-span-4">
                        <Card className="sticky top-6 p-7">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Payment summary</div>

                            <div className="mt-5 space-y-3 text-sm text-black/70">
                                <div className="flex justify-between">
                                    <span>Nightly rate</span>
                                    <span className="font-semibold text-black/80">{money(rate)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Nights</span>
                                    <span className="font-semibold text-black/80">{nights}</span>
                                </div>

                                <div className="h-px bg-black/10" />

                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-black/80">{money(subtotal)}</span>
                                </div>

                                <div className="flex justify-between text-black/60">
                                    <span>Service fee (3%)</span>
                                    <span>{money(serviceFee)}</span>
                                </div>

                                <div className="h-px bg-black/10" />

                                <div className="flex justify-between text-base">
                                    <span className="font-semibold text-black/80">Total</span>
                                    <span className="font-semibold text-black/80">{money(total)}</span>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-black/10 bg-[#F6F3EE] p-4 text-sm text-black/70">
                                <span className="text-black/55">Status:</span>{" "}
                                <span className="font-semibold text-black/80">{status}</span>
                                <br />
                                <span className="text-black/55">Payment:</span>{" "}
                                <span className="font-semibold text-black/80">{paymentStatus}</span>
                            </div>

                            <div className="mt-6 grid gap-3">
                                <Button variant="accent" onClick={downloadReceiptPdf}>
                                    Download receipt (PDF)
                                </Button>

                                {roomId && roomId !== "—" ? (
                                    <Link to={`/rooms/${roomId}`} className="block">
                                        <Button variant="outline" className="w-full">
                                            View room
                                        </Button>
                                    </Link>
                                ) : null}

                                <Button variant="outline" onClick={() => navigate("/search")}>
                                    Book another stay
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
