import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { roomsApi } from "../../api/rooms.api";
import { reservationsApi } from "../../api/reservations.api";
import { daysBetween, money } from "../../utils/format";

function splitAmenities(str) {
    if (!str) return [];
    return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(iso, days) {
    if (!iso) return "";
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function safeImg(url) {
    return (
        url ||
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2400&auto=format&fit=crop"
    );
}

function getApiErrorMessage(e) {
    if (!e) return "Booking failed.";
    if (e instanceof Error && !e.response) return e.message || "Booking failed.";

    const status = e?.response?.status;

    // response.data might be an object or a plain string depending on backend/middleware
    const data = e?.response?.data;
    const msgFromData =
        typeof data === "string"
            ? data
            : data?.message || data?.error;

    const msg = msgFromData || e?.message || "Booking failed.";

    if (status === 400) return msg || "Please check your inputs and try again.";
    if (status === 404) return msg || "Resource not found.";
    if (status === 409) return msg || "Room is not available for the selected dates.";
    return msg;
}

// ---------- helpers ----------
function trimOrEmpty(v) {
    return (v ?? "").trim();
}
function normalizeIdNumber(v) {
    return trimOrEmpty(v).replace(/[\s-]/g, "");
}

// safer ISO date parse (avoids timezone surprises)
function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map((n) => Number(n));
    if (!y || !m || !d) return null;

    const dt = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(dt.getTime()) ? null : dt;
}

function yearsBetween(dobIso, todayIso) {
    const dob = parseISODate(dobIso);
    const today = parseISODate(todayIso);
    if (!dob || !today) return null;

    let years = today.getUTCFullYear() - dob.getUTCFullYear();
    const m = today.getUTCMonth() - dob.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) years--;
    return years;
}

function formatIdTypeLabel(v) {
    if (!v) return "—";
    return v
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}
// --------------------------------------

export default function BookRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [loadingRoom, setLoadingRoom] = useState(true);

    const [pageLoadErr, setPageLoadErr] = useState(null);
    const [apiErr, setApiErr] = useState(null);

    // Customer form
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [idNumber, setIdNumber] = useState("");
    const [idType, setIdType] = useState("PASSPORT");
    const [email, setEmail] = useState("");

    // Booking form
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [notes, setNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const cooldownTimerRef = useRef(null);

    const confirmAreaRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoadingRoom(true);
                setPageLoadErr(null);
                setApiErr(null); // clear stale reservation errors when changing room
                const data = await roomsApi.get(roomId);
                if (!cancelled) setRoom(data);
            } catch (e) {
                if (!cancelled) setPageLoadErr(e?.message || "Failed to load room");
            } finally {
                if (!cancelled) setLoadingRoom(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [roomId]);

    // smart date UX: if user sets check-in and checkout is empty/invalid, push checkout to +1 day
    useEffect(() => {
        if (!checkIn) return;
        if (!checkOut) {
            setCheckOut(addDaysISO(checkIn, 1));
            return;
        }
        const n = daysBetween(checkIn, checkOut);
        if (n <= 0) setCheckOut(addDaysISO(checkIn, 1));
    }, [checkIn]); // intentionally only when checkIn changes

    // ✅ Clear API error automatically when user changes dates
    useEffect(() => {
        if (!apiErr) return;

        setApiErr(null);
        setCooldown(false);

        if (cooldownTimerRef.current) {
            clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkIn, checkOut]);

    // cleanup cooldown timer on unmount
    useEffect(() => {
        return () => {
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        };
    }, []);

    const nights = useMemo(() => daysBetween(checkIn, checkOut), [checkIn, checkOut]);

    const subtotal = useMemo(() => {
        const rate = room?.price ? Number(room.price) : 0;
        return nights > 0 ? rate * nights : 0;
    }, [room?.price, nights]);

    const serviceFee = useMemo(
        () => (subtotal > 0 ? Math.round(subtotal * 0.03 * 100) / 100 : 0),
        [subtotal]
    );

    const total = useMemo(() => subtotal + serviceFee, [subtotal, serviceFee]);

    const amenityList = useMemo(() => splitAmenities(room?.amenities), [room?.amenities]);

    const validation = useMemo(() => {
        const issues = [];

        const tFullName = trimOrEmpty(fullName);
        const tAddress = trimOrEmpty(address);
        const tEmail = trimOrEmpty(email).toLowerCase();
        const tIdNumber = normalizeIdNumber(idNumber);
        const tNotes = notes ?? "";

        if (tFullName.length < 3) issues.push("Full name is required (min 3 characters).");
        if (tAddress.length < 3) issues.push("Address is required (min 3 characters).");

        if (tEmail.length < 5) issues.push("Email is required.");
        if (tEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tEmail))
            issues.push("Email format looks invalid.");

        const today = todayISO();
        const dobDate = parseISODate(dateOfBirth);
        const todayDate = parseISODate(today);

        if (!dateOfBirth) {
            issues.push("Date of birth is required.");
        } else if (!dobDate) {
            issues.push("Date of birth format is invalid.");
        } else if (todayDate && dobDate > todayDate) {
            issues.push("Date of birth cannot be in the future.");
        } else {
            const age = yearsBetween(dateOfBirth, today);
            if (age == null) issues.push("Date of birth is invalid.");
            else if (age < 16) issues.push("Guest must be at least 16 years old.");
            else if (age > 120) issues.push("Date of birth looks unrealistic.");
        }

        if (tIdNumber.length < 3) issues.push("ID number is required (min 3 characters).");
        if (tIdNumber.length > 64) issues.push("ID number is too long.");
        if (tIdNumber && !/^[a-z0-9]+$/i.test(tIdNumber))
            issues.push("ID number can only contain letters and numbers.");

        const inDate = parseISODate(checkIn);
        const outDate = parseISODate(checkOut);
        const todayD = parseISODate(today);

        if (!checkIn) issues.push("Check-in date is required.");
        if (!checkOut) issues.push("Check-out date is required.");
        if (checkIn && !inDate) issues.push("Check-in date format is invalid.");
        if (checkOut && !outDate) issues.push("Check-out date format is invalid.");
        if (inDate && todayD && inDate < todayD) issues.push("Check-in cannot be in the past.");

        if (inDate && outDate) {
            if (outDate <= inDate) issues.push("Check-out must be after check-in.");
            const maxNights = 30;
            if (nights > maxNights) issues.push(`Stay cannot exceed ${maxNights} nights.`);
        }

        if (tNotes && tNotes.length > 1000) issues.push("Notes must be 1000 characters or less.");

        return issues;
    }, [fullName, address, dateOfBirth, idNumber, email, checkIn, checkOut, nights, notes]);

    const canSubmit = useMemo(() => {
        return room && validation.length === 0 && nights > 0 && !submitting && !cooldown;
    }, [room, validation.length, nights, submitting, cooldown]);

    function scrollToConfirmArea() {
        requestAnimationFrame(() => {
            confirmAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    async function onConfirm() {
        // hard guard against double submit (even if button state glitches)
        if (submitting || cooldown) return;

        if (!canSubmit) {
            if (validation.length > 0) scrollToConfirmArea();
            return;
        }

        setApiErr(null);
        setSubmitting(true);

        try {
            const reservation = await reservationsApi.create({
                roomId: Number(roomId),
                startDate: checkIn,
                endDate: checkOut,
                customer: {
                    fullName: trimOrEmpty(fullName),
                    address: trimOrEmpty(address),
                    dateOfBirth,
                    idType,
                    idNumber: normalizeIdNumber(idNumber),
                    email: trimOrEmpty(email).toLowerCase(),
                },
                notes: trimOrEmpty(notes) ? trimOrEmpty(notes) : null,
            });

            navigate(`/reservations/${reservation.id}/confirmation`);
        } catch (e) {
            setApiErr(getApiErrorMessage(e));
            scrollToConfirmArea();

            setCooldown(true);
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            cooldownTimerRef.current = setTimeout(() => {
                setCooldown(false);
                cooldownTimerRef.current = null;
            }, 1500);
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingRoom) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-black/55">Loading…</div>
            </div>
        );
    }

    if (pageLoadErr && !room) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-red-600">{pageLoadErr}</div>
            </div>
        );
    }

    const hero = safeImg(room?.imageUrl);
    const hotelName = room?.hotelName || "Hotel";
    const city = room?.city || "—";
    const roomLabel = `Room #${room?.roomNumber ?? "—"}`;

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* Sticky floating error toast */}
            {apiErr ? (
                <div className="fixed left-0 right-0 top-4 z-[999] mx-auto max-w-6xl px-5">
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 shadow-[0_18px_60px_rgba(11,15,20,0.18)]">
                        <div className="flex items-start justify-between gap-4">
                            <div className="text-sm text-red-800">
                                <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-red-700">
                                    Booking issue
                                </div>
                                <div className="mt-1">{apiErr}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setApiErr(null)}
                                className="shrink-0 rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.20em] text-red-700 hover:bg-red-50"
                            >
                                DISMISS
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* HERO */}
            <section className="relative border-b border-black/10 bg-[#F6F3EE]">
                <div
                    className="relative h-[46vh] min-h-[420px] w-full bg-[#0B0F14] pb-16"
                    style={{
                        backgroundImage: `url(${hero})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center center",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.35)_0%,rgba(11,15,20,0.20)_40%,rgba(11,15,20,0.82)_100%)]" />
                    <div className="absolute inset-0 [box-shadow:inset_0_-120px_160px_rgba(0,0,0,0.55)]" />

                    <div className="absolute left-0 right-0 top-0">
                        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/15"
                                type="button"
                            >
                                ← BACK
                            </button>

                            <Link
                                to={`/rooms/${roomId}`}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/15"
                            >
                                ROOM DETAILS
                            </Link>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="mx-auto max-w-6xl px-5 pb-12">
                            <div className="text-[11px] tracking-[0.46em] uppercase text-white/75">
                                BOOKING • {city} • {hotelName}
                            </div>
                            <h1 className="mt-3 font-serif text-5xl leading-[1.03] text-white md:text-6xl">
                                Complete your reservation
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 mb-5">
                                You’re booking as a guest for now — we’ll use your ID and email to find (or create) your
                                customer profile.
                            </p>
                        </div>
                    </div>

                    <div className="absolute left-0 right-0 bottom-0 z-20 translate-y-[40%]">
                        <div className="mx-auto max-w-6xl px-5">
                            <div className="rounded-3xl border border-black/10 bg-white/92 p-5 shadow-[0_30px_120px_rgba(11,15,20,0.18)] backdrop-blur">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-black/65">
                                        <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">
                                            {roomLabel}
                                        </span>

                                        <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">
                                            Rate:{" "}
                                            <span className="font-semibold text-[#0B0F14]">{money(room?.price)}</span>
                                            <span className="text-black/50"> / night</span>
                                        </span>

                                        {room?.extendable ? (
                                            <span className="rounded-full border border-[#C9A24D]/35 bg-[#C9A24D]/10 px-4 py-2 text-black/75">
                                                Extendable stay
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2">
                                                Standard stay
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] tracking-[0.30em] uppercase text-black/45">
                                            Secure checkout soon
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN */}
            <section className="mx-auto max-w-6xl px-5 pb-14 pt-10 mt-10">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* LEFT: Forms */}
                    <div className="space-y-6 md:col-span-8">
                        {/* Step 1 */}
                        <Card className="p-0 overflow-hidden">
                            <div className="border-b border-black/10 bg-white px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Step 1</div>
                                        <div className="mt-2 font-serif text-2xl text-[#0B0F14]">Guest details</div>
                                        <div className="mt-1 text-sm text-black/60">
                                            Used to find-or-create your customer record.
                                        </div>
                                    </div>
                                    <div className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2 text-[11px] tracking-[0.22em] text-black/55">
                                        ID + EMAIL REQUIRED
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white px-6 py-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">
                                            Full name
                                        </div>
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">
                                            Address
                                        </div>
                                        <Input
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Street, City, Country"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">Email</div>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                        />
                                        <div className="mt-1 text-xs text-black/45">
                                            We use this (with your ID) to find-or-create your customer record.
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">
                                            Date of birth
                                        </div>
                                        <Input
                                            type="date"
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">ID type</div>
                                        <select
                                            className="w-full rounded-2xl border border-black/10 bg-[#FBF7F0] px-4 py-3 text-sm outline-none focus:border-gold/60 focus:ring-4 focus:ring-gold/15"
                                            value={idType}
                                            onChange={(e) => setIdType(e.target.value)}
                                        >
                                            <option value="PASSPORT">{formatIdTypeLabel("PASSPORT")}</option>
                                            <option value="DRIVER_LICENSE">{formatIdTypeLabel("DRIVER_LICENSE")}</option>
                                            <option value="NATIONAL_ID">{formatIdTypeLabel("NATIONAL_ID")}</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">ID number</div>
                                        <Input
                                            value={idNumber}
                                            onChange={(e) => setIdNumber(e.target.value)}
                                            placeholder="Document number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Step 2 */}
                        <Card className="p-0 overflow-hidden">
                            <div className="border-b border-black/10 bg-white px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Step 2</div>
                                        <div className="mt-2 font-serif text-2xl text-[#0B0F14]">Stay details</div>
                                        <div className="mt-1 text-sm text-black/60">Pick dates and add a note (optional).</div>
                                    </div>

                                    <div className="rounded-full border border-[#C9A24D]/35 bg-[#C9A24D]/10 px-4 py-2 text-[11px] tracking-[0.22em] text-black/65">
                                        {nights > 0 ? `${nights} NIGHT${nights === 1 ? "" : "S"}` : "SELECT DATES"}
                                    </div>
                                </div>
                            </div>

                            {/* confirm area anchor for scroll */}
                            <div className="bg-white px-6 py-6" ref={confirmAreaRef}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">Check-in</div>
                                        <Input
                                            type="date"
                                            value={checkIn}
                                            min={todayISO()}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">Check-out</div>
                                        <Input
                                            type="date"
                                            value={checkOut}
                                            min={checkIn ? addDaysISO(checkIn, 1) : todayISO()}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="mb-2 text-[11px] tracking-[0.28em] uppercase text-black/55">Notes (optional)</div>
                                        <textarea
                                            className="w-full min-h-[110px] rounded-2xl border border-black/10 bg-[#FBF7F0] px-4 py-3 text-sm outline-none focus:border-gold/60 focus:ring-4 focus:ring-gold/15"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="e.g., Late check-in requested"
                                            maxLength={1000}
                                        />
                                        <div className="mt-1 flex items-center justify-between text-xs text-black/45">
                                            <span>Optional, up to 1000 chars.</span>
                                            <span>{notes?.length || 0}/1000</span>
                                        </div>
                                    </div>
                                </div>

                                {validation.length > 0 ? (
                                    <div className="mt-5 rounded-3xl border border-black/10 bg-[#F6F3EE] p-5">
                                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                            Before you confirm
                                        </div>
                                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/65">
                                            {validation.slice(0, 6).map((v) => (
                                                <li key={v}>{v}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}

                                {/* Error right above Confirm button */}
                                {apiErr ? (
                                    <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                                        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-red-700">
                                            Couldn’t confirm reservation
                                        </div>
                                        <div className="mt-2">{apiErr}</div>
                                        <div className="mt-3 text-xs text-red-700/80">
                                            Tip: adjust your dates — the room may already be booked in that period.
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mt-6">
                                    <Button variant="accent" className="w-full" disabled={!canSubmit} onClick={onConfirm}>
                                        {submitting ? "Confirming..." : cooldown ? "Please wait..." : "Confirm reservation"}
                                    </Button>

                                    <div className="mt-3 text-xs text-black/45">
                                        Backend creates the customer automatically and prevents overlapping bookings.
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: Summary */}
                    <div className="md:col-span-4">
                        <Card className="sticky top-6 overflow-hidden p-0">
                            <div className="relative h-44 overflow-hidden bg-[#0B0F14]">
                                <img
                                    src={hero}
                                    alt={roomLabel}
                                    className="absolute inset-0 block h-full w-full object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.20)_0%,rgba(11,15,20,0.78)_100%)]" />
                                <div className="absolute left-5 right-5 bottom-5">
                                    <div className="text-[11px] tracking-[0.46em] uppercase text-white/75">Summary</div>
                                    <div className="mt-2 font-serif text-2xl text-white">{hotelName}</div>
                                    <div className="mt-1 text-sm text-white/75">
                                        {city} • {roomLabel}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white px-6 py-6">
                                <div className="space-y-2 text-sm text-black/70">
                                    <div className="flex justify-between">
                                        <span>Rate</span>
                                        <span className="font-semibold text-[#0B0F14]">{money(room?.price)}/night</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Nights</span>
                                        <span className="font-semibold text-[#0B0F14]">{nights > 0 ? nights : "—"}</span>
                                    </div>

                                    <div className="mt-3 h-px w-full bg-black/10" />

                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-[#0B0F14]">{money(subtotal)}</span>
                                    </div>

                                    <div className="flex justify-between text-black/60">
                                        <span>Service fee (3%)</span>
                                        <span className="font-medium">{money(serviceFee)}</span>
                                    </div>

                                    <div className="mt-3 h-px w-full bg-black/10" />

                                    <div className="flex justify-between text-base">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-semibold text-[#0B0F14]">{money(total)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-3xl border border-black/10 bg-[#F6F3EE] p-5">
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Amenities</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(amenityList.length ? amenityList.slice(0, 10) : ["—"]).map((a) => (
                                            <span
                                                key={a}
                                                className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.18em] text-black/70"
                                            >
                                                {a === "—" ? "NOT LISTED" : a.toUpperCase()}
                                            </span>
                                        ))}
                                        {amenityList.length > 10 ? (
                                            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.18em] text-black/55">
                                                +{amenityList.length - 10} MORE
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <Button variant="outline" className="w-full" onClick={() => navigate("/search")}>
                                        Back to search
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="h-10" />
            </section>
        </div>
    );
}
