import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { roomsApi } from "../../api/rooms.api";
import { money } from "../../utils/format";

function splitAmenities(str) {
    if (!str) return [];
    return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
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
      <span className="text-white/70">{label} </span>
      <span className="font-semibold text-white">{value}</span>
    </span>
    );
}

function StatRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3">
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-black/45">{label}</span>
            <span className="text-sm font-semibold text-black/75">{value}</span>
        </div>
    );
}

export default function RoomDetails() {
    const { roomId, id } = useParams();
    const rid = roomId ?? id;
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [heroSrc, setHeroSrc] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setErr(null);
                const data = await roomsApi.get(rid);
                if (!cancelled) {
                    setRoom(data);
                    setHeroSrc(data?.imageUrl || fallbackImage());
                }
            } catch (e) {
                if (!cancelled) setErr(e?.message || "Failed to load room");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (rid) load();
        return () => {
            cancelled = true;
        };
    }, [rid]);

    const title = `Room #${room?.roomNumber ?? "—"}`;
    const hotelName = room?.hotelName || "Hotel";
    const city = room?.city || "—";
    const price = room?.price ?? null;
    const capacity = room?.capacity ?? null;
    const extendable = !!room?.extendable;

    const amenities = useMemo(() => splitAmenities(room?.amenities), [room?.amenities]);

    const about = useMemo(() => {
        const a = amenities.length
            ? amenities.slice(0, 5).join(", ")
            : "thoughtful, essential comforts";

        const flex = extendable
            ? "with flexible extension options for longer stays"
            : "with a calm, straightforward stay experience";

        return `A refined space in ${hotelName} — ${city}. Designed for quiet comfort and effortless rest, this room offers a balanced atmosphere that feels welcoming from the moment you arrive. ${flex.charAt(0).toUpperCase() + flex.slice(1)}.

Natural light, clean finishes, and a carefully arranged layout create a space that is both practical and relaxing. Enjoy ${a}, along with a polished environment that feels premium without being overstated — ideal for both short visits and extended stays.`;
    }, [amenities, extendable, hotelName, city]);


    // ---------- States ----------
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-14">
                    <div className="rounded-3xl border border-black/10 bg-white p-6">
                        <div className="h-5 w-40 rounded-full bg-black/10" />
                        <div className="mt-4 h-3 w-full max-w-[680px] rounded-full bg-black/10" />
                        <div className="mt-2 h-3 w-full max-w-[520px] rounded-full bg-black/10" />
                        <div className="mt-8 grid gap-6 md:grid-cols-12">
                            <div className="md:col-span-8">
                                <div className="h-40 rounded-3xl bg-black/10" />
                            </div>
                            <div className="md:col-span-4">
                                <div className="h-40 rounded-3xl bg-black/10" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-12">
                    <div className="rounded-3xl border border-red-500/20 bg-white p-6">
                        <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-red-600">
                            Error
                        </div>
                        <div className="mt-2 text-sm text-black/70">{err}</div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button variant="outline" onClick={() => navigate(-1)}>
                                Go back
                            </Button>
                            <Link to="/search">
                                <Button variant="accent">Back to search</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!room) return null;

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="relative h-[58vh] w-full md:h-[70vh]">
                    <img
                        src={heroSrc}
                        alt={title}
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
                                onClick={() => navigate(-1)}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/15"
                                type="button"
                            >
                                ← BACK
                            </button>

                            <Link
                                to={`/hotels/${room.hotelId}`}
                                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] text-white backdrop-blur transition hover:bg-white/15"
                            >
                                VIEW HOTEL
                            </Link>
                        </div>
                    </div>

                    {/* hero text */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="mx-auto max-w-6xl px-5 pb-12 md:pb-14">
                            <div className="text-[11px] tracking-[0.46em] uppercase text-white/75">
                                {city} • {hotelName}
                            </div>

                            <h1 className="mt-3 font-serif text-5xl leading-[1.03] text-white md:text-6xl">
                                {title}
                            </h1>

                            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                {price != null ? (
                                    <InfoPill label="" value={`${money(price)} / night`} />
                                ) : null}

                                {capacity != null ? (
                                    <InfoPill label="Capacity" value={String(capacity)} />
                                ) : null}

                                {extendable ? (
                                    <span className="rounded-full border border-[#C9A24D]/40 bg-[#C9A24D]/20 px-4 py-2 text-sm text-white backdrop-blur">
                    Extendable stay
                  </span>
                                ) : (
                                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
                    Standard stay
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* floating info strip */}
                <div className="relative z-10 -mt-10">
                    <div className="mx-auto max-w-6xl px-5">
                        <div className="rounded-3xl border border-black/10 bg-white/92 p-5 shadow-[0_24px_80px_rgba(11,15,20,0.18)] [box-shadow:0_24px_80px_rgba(11,15,20,0.18),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur">
                            <div className="grid gap-4 md:grid-cols-12 md:items-center">
                                <div className="md:col-span-8">
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                        Overview
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-black/65">{about}</p>

                                    {amenities.length ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {amenities.slice(0, 10).map((a) => (
                                                <span
                                                    key={a}
                                                    className="rounded-full border border-black/10 bg-[#F6F3EE] px-3 py-1 text-[11px] tracking-[0.18em] text-black/70"
                                                >
                          {a.toUpperCase()}
                        </span>
                                            ))}
                                            {amenities.length > 10 ? (
                                                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.18em] text-black/55">
                          +{amenities.length - 10} MORE
                        </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="md:col-span-4">
                                    <div className="rounded-2xl border border-black/10 bg-[#F6F3EE] p-4">
                                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                            Quick book
                                        </div>

                                        <div className="mt-3 flex items-end justify-between">
                                            <div>
                                                <div className="text-xs text-black/55">From</div>
                                                <div className="font-serif text-2xl text-[#0B0F14]">
                                                    {price != null ? money(price) : "—"}
                                                </div>
                                            </div>

                                            <div className="text-right text-xs text-black/55">
                                                <div>Capacity</div>
                                                <div className="font-semibold text-black/75">{capacity ?? "—"}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <Link to={`/book/${room.id}`}>
                                                <Button variant="accent" className="w-full">
                                                    Book this room
                                                </Button>
                                            </Link>
                                            <div className="mt-2 text-xs text-black/45">
                                                No login needed — book as a guest.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTENT */}
            <section className="mx-auto max-w-6xl px-5 pb-14 pt-10">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Left column */}
                    <Card className="p-7 md:col-span-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Room details</div>
                            <Link
                                to={`/hotels/${room.hotelId}`}
                                className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/70 underline decoration-black/20 underline-offset-4 hover:text-black"
                            >
                                View hotel →
                            </Link>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Location</div>
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
                                        <span className="font-medium text-black/80">#{room.roomNumber}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Stay</div>
                                <div className="mt-3 space-y-2 text-sm text-black/70">
                                    <div>
                                        <span className="text-black/45">Price:</span>{" "}
                                        <span className="font-medium text-black/80">
                      {price != null ? money(price) : "—"} / night
                    </span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">Capacity:</span>{" "}
                                        <span className="font-medium text-black/80">{capacity ?? "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-black/45">Extendable:</span>{" "}
                                        <span className="font-medium text-black/80">{extendable ? "Yes" : "No"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {room.problemsAndDamages ? (
                            <div className="mt-6 rounded-3xl border border-[#C9A24D]/25 bg-[#C9A24D]/10 p-6">
                                <div className="text-[11px] tracking-[0.42em] uppercase text-black/55">Condition note</div>
                                <div className="mt-2 text-sm leading-relaxed text-black/70">{room.problemsAndDamages}</div>
                            </div>
                        ) : null}

                        <div className="mt-8">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Amenities</div>

                            <div className="mt-4">
                                {amenities.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {amenities.map((a) => (
                                            <span
                                                key={a}
                                                className="rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2 text-[11px] tracking-[0.22em] text-black/70"
                                            >
                        {a.toUpperCase()}
                      </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/60">
                                        No amenities listed yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Check-in</div>
                                <div className="mt-2 text-sm text-black/65">
                                    Standard check-in is typically mid-afternoon. Exact times can be confirmed at the front desk.
                                </div>
                            </div>
                            <div className="rounded-2xl border border-black/10 bg-white p-5">
                                <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">Policies</div>
                                <div className="mt-2 text-sm text-black/65">
                                    Cancellation windows and special rules can be added later — your booking flow is ready.
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Right column (single booking CTA only) */}
                    <div className="md:col-span-4">
                        <Card className="sticky top-6 p-7">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">At a glance</div>

                            <div className="mt-3 font-serif text-3xl text-[#0B0F14]">
                                {price != null ? money(price) : "—"}
                                <span className="ml-2 text-base text-black/55">/ night</span>
                            </div>

                            <p className="mt-2 text-sm leading-relaxed text-black/60">
                                Book this room as a guest. You’ll pick your dates on the booking page.
                            </p>

                            <div className="mt-5 space-y-2">
                                <StatRow label="Capacity" value={capacity ?? "—"} />
                                <StatRow label="Extendable" value={extendable ? "Yes" : "No"} />
                                <StatRow label="City" value={city} />
                            </div>

                            <div className="mt-4 rounded-2xl border border-[#C9A24D]/20 bg-[#C9A24D]/10 p-4 text-sm text-black/70">
                                Payment is handled at the front desk.
                            </div>

                            <div className="mt-6">
                                <Link to={`/book/${room.id}`}>
                                    <Button variant="accent" className="w-full">
                                        Book this room
                                    </Button>
                                </Link>
                                <div className="mt-3 text-xs text-black/45">
                                    No account required.
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    to="/search"
                                    className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/70 underline decoration-black/20 underline-offset-4 hover:text-black"
                                >
                                    Back to search ←
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
