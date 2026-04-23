import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { endpoints } from "../../api/endpoints";
import { http } from "../../api/http";

const description =
    "A refined boutique stay with calm interiors, thoughtful details, and a smooth booking experience. Enjoy elegant spaces, modern comfort, and a location designed to make every arrival feel effortless.";

function StarRow({ rating = 0 }) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(r);
    const empty = 5 - full;

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: full }).map((_, i) => (
                <span key={`f-${i}`} className="text-[#C9A24D]">
          ★
        </span>
            ))}
            {Array.from({ length: empty }).map((_, i) => (
                <span key={`e-${i}`} className="text-white/30">
          ★
        </span>
            ))}
            <span className="ml-2 text-xs tracking-[0.24em] uppercase text-white/80">
        {r > 0 ? `${r.toFixed(0)}/5` : "Unrated"}
      </span>
        </div>
    );
}

function Pill({ children }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-[11px] tracking-[0.28em] uppercase text-white/90 backdrop-blur">
            {children}
        </div>
    );
}

const HERO_FOCUS = {
    1: "50% 30%",
    2: "50% 35%",
    3: "50% 40%",
    4: "50% 45%",
    5: "55% 35%",
    6: "45% 35%",
};

function heroObjectPosition(hotelId) {
    return HERO_FOCUS[Number(hotelId)] || "50% 35%";
}

export default function HotelDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                // ✅ uses VITE_API_BASE_URL via http.js
                const data = await http.get(endpoints.hotelById(id));

                if (!cancelled) setHotel(data);
            } catch (e) {
                console.error("Failed to load hotel:", e);
                if (!cancelled) setHotel(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const viewRoomsUrl = useMemo(() => `/search?hotelId=${id}`, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-16 text-sm text-black/60">
                    Loading hotel…
                </div>
            </div>
        );
    }

    if (!hotel) {
        return (
            <div className="min-h-screen bg-[#F6F3EE]">
                <div className="mx-auto max-w-6xl px-5 py-16">
                    <div className="rounded-3xl border border-black/10 bg-white p-10">
                        <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                            LuxStay
                        </div>
                        <h1 className="mt-3 font-serif text-4xl text-[#0B0F14]">
                            Hotel not found
                        </h1>
                        <p className="mt-3 text-sm text-black/60">
                            This hotel may have been removed or the link is incorrect.
                        </p>
                        <div className="mt-8">
                            <Button variant="primary" onClick={() => navigate(-1)}>
                                Go back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const name = hotel?.name || hotel?.hotelName || "Hotel";
    const city = hotel?.city || "—";
    const address = hotel?.address || hotel?.streetAddress || "—";
    const chainName = hotel?.chainName || hotel?.hotelChainName || "";
    const rating = hotel?.rating ?? 0;

    const heroImage =
        hotel?.imageUrl ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80";

    async function copyAddress() {
        try {
            await navigator.clipboard?.writeText(address);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        } catch {
            // ignore
        }
    }

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* HERO */}
            <section className="relative isolate">
                {/* background */}
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt={name}
                        style={{ objectPosition: heroObjectPosition(hotel?.id) }}
                        className="h-[72vh] w-full object-cover"
                    />

                    {/* ✅ Strong scrim overlay for bright images */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/35 to-black/70" />
                    <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_30%_30%,rgba(0,0,0,0.25),transparent_60%)]" />
                </div>

                {/* content */}
                <div className="relative mx-auto flex h-[72vh] max-w-6xl flex-col px-5 pt-10 pb-24">
                    {/* top row */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={() => navigate("/hotels")}
                            className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/25 px-4 py-2 text-[11px] tracking-[0.28em] uppercase text-white/90 backdrop-blur transition hover:bg-black/35"
                        >
                            ← Back
                        </button>

                        <div className="hidden sm:block">
                            <StarRow rating={rating} />
                        </div>
                    </div>

                    {/* main stack */}
                    <div className="mt-10 max-w-3xl">
                        <div className="text-[11px] tracking-[0.45em] uppercase text-white/75">
                            Hotel details
                        </div>

                        <h1 className="mt-4 font-serif text-5xl leading-[1.02] text-white drop-shadow-[0_14px_40px_rgba(0,0,0,0.55)] md:text-6xl">
                            {name}
                        </h1>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Pill>📍 {city}</Pill>
                            {chainName ? <Pill>✦ {chainName}</Pill> : null}
                            <Pill>✉ {hotel?.email || "contact@luxstay.com"}</Pill>
                        </div>

                        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-white/80">
                            A calm, elevated stay experience — refined spaces, thoughtful service,
                            and details designed for comfort. Browse rooms and reserve in minutes.
                        </p>

                        {/* ✅ Buttons never overlap strip now */}
                        <div className="mt-10 flex flex-wrap gap-3">
                            <Button variant="accent" size="lg" onClick={() => navigate(viewRoomsUrl)}>
                                View Rooms
                            </Button>

                            <Button
                                variant="outline"
                                size="lg"
                                className="border-white/28 bg-black/28 text-white hover:bg-black/38"
                                onClick={copyAddress}
                            >
                                {copied ? "Copied ✓" : "Copy Address"}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ✅ Floating info strip (NOT absolute anymore) */}
            <section className="relative z-20 mx-auto max-w-6xl px-5 -mt-24">
                <div className="grid gap-4 rounded-[28px] border border-white/18 bg-white/14 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:grid-cols-12">
                    {/* Location */}
                    <div className="md:col-span-8">
                        <div className="text-[11px] tracking-[0.42em] uppercase text-white/70">
                            Location
                        </div>

                        <div className="mt-3 text-sm leading-relaxed text-white/90">
                            {address}
                        </div>

                        <div className="mt-3 text-xs tracking-[0.22em] uppercase text-white/60">
                            Tip: use “Copy Address” to paste into Google Maps.
                        </div>
                    </div>

                    {/* Quick facts */}
                    <div className="md:col-span-4 md:flex md:justify-end">
                        <div className="w-full rounded-2xl border border-white/18 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] md:w-[260px]">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-white/70">
                                Quick facts
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-white/90">
                                <div>
                                    <span className="text-white/60">City:</span>{" "}
                                    <span className="font-medium">{city}</span>
                                </div>

                                <div>
                                    <span className="text-white/60">Rating:</span>{" "}
                                    <span className="font-medium">{rating ? `${rating}/5` : "—"}</span>
                                </div>

                                {chainName ? (
                                    <div>
                                        <span className="text-white/60">Chain:</span>{" "}
                                        <span className="font-medium">{chainName}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTENT SECTIONS */}
            <section className="mx-auto max-w-6xl px-5 py-14">
                <div className="grid gap-8 md:grid-cols-12">
                    {/* Left column */}
                    <div className="md:col-span-7">
                        <div className="rounded-3xl border border-black/10 bg-white p-8">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                Overview
                            </div>

                            <h2 className="mt-4 font-serif text-3xl text-[#0B0F14]">
                                A stay worth remembering.
                            </h2>

                            <p className="mt-4 text-sm leading-relaxed text-black/60">
                                {description}
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-black/10 bg-[#F6F3EE] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)]">
                                    <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">
                                        Check-in
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-black/75">
                                        3:00 PM
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-black/10 bg-[#F6F3EE] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)]">
                                    <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">
                                        Check-out
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-black/75">
                                        11:00 AM
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA block */}
                        <div className="mt-8 rounded-3xl border border-black/10 bg-white p-8">
                            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                                <div>
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                        Ready to book
                                    </div>
                                    <div className="mt-2 font-serif text-2xl text-[#0B0F14]">
                                        Explore available rooms for this hotel.
                                    </div>
                                    <div className="mt-2 text-sm text-black/60">
                                        Filter by dates, capacity, price, and amenities.
                                    </div>
                                </div>

                                <Button variant="primary" size="lg" onClick={() => navigate(viewRoomsUrl)}>
                                    Find Rooms
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="md:col-span-5">
                        <div className="rounded-3xl border border-black/10 bg-[#FBFAF7] p-8">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                Highlights
                            </div>

                            <div className="mt-5 space-y-4 text-sm text-black/60">
                                <div className="flex gap-3">
                                    <span className="text-[#C9A24D]">✦</span>
                                    <span>Elegant interiors and calm atmosphere</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[#C9A24D]">✦</span>
                                    <span>Seamless booking flow for guests</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[#C9A24D]">✦</span>
                                    <span>Perfect for business & leisure stays</span>
                                </div>
                            </div>

                            <div className="mt-8 overflow-hidden rounded-2xl border border-black/10">
                                <img
                                    src={heroImage}
                                    alt={`${name} preview`}
                                    className="h-44 w-full object-cover object-center"
                                />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.25em] uppercase text-black/55">
                  Premium
                </span>
                                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.25em] uppercase text-black/55">
                  Quiet
                </span>
                                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] tracking-[0.25em] uppercase text-black/55">
                  Refined
                </span>
                            </div>

                            <div className="mt-8">
                                <Button variant="outline" onClick={() => navigate("/hotels")}>
                                    Back to Hotels
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-12" />
        </div>
    );
}
