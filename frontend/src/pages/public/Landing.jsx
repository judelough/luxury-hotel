import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function Landing() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0];


    const [city, setCity] = useState("Ottawa");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [capacity, setCapacity] = useState(2);

    const canSearch = useMemo(() => {
        if (!city || !checkIn || !checkOut) return false;
        if (checkOut <= checkIn) return false;
        if (Number(capacity) < 1) return false;
        return true;
    }, [city, checkIn, checkOut, capacity]);


    const hero =
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=2400&q=80";

    function onSearch() {
        const params = new URLSearchParams({
            city,
            checkIn,
            checkOut,
            capacity: String(capacity),
        });
        navigate(`/search?${params.toString()}`);
    }

    return (
        <div className="bg-champagne">
            {/* HERO */}
            <section className="relative">
                <div
                    className="h-[86vh] w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${hero})` }}
                >
                    {/* Strong directional overlay for readable text */}
                    <div className="h-full w-full bg-[linear-gradient(90deg,rgba(11,15,20,0.88)_0%,rgba(11,15,20,0.60)_45%,rgba(11,15,20,0.18)_100%)]">
                        <div className="mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-14">
                            <div className="max-w-3xl">
                                <div className="text-xs tracking-[0.45em] uppercase text-white/85">
                                    LUXURY STAYS • EFFORTLESS BOOKING
                                </div>

                                <h1 className="mt-4 font-serif text-5xl leading-[1.02] text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)] md:text-6xl">
                                    Find a room that feels like it was made for you.
                                </h1>

                                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 drop-shadow-[0_6px_18px_rgba(0,0,0,0.60)]">
                                    Explore elegant hotels, premium amenities, and a booking experience
                                    designed to be calm, polished, and beautiful.
                                </p>
                            </div>

                            {/* SEARCH BAR */}
                            <div className="mt-10">
                                <div className="mx-auto max-w-5xl">
                                    <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 backdrop-blur-xl shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
                                        <div className="grid gap-3 md:grid-cols-12 md:gap-4">
                                            <div className="md:col-span-4">
                                                <div className="mb-2 text-[11px] tracking-[0.22em] text-white/75">
                                                    CITY
                                                </div>
                                                <Input
                                                    className="bg-white text-base font-medium"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder="Ottawa"
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <div className="mb-2 text-[11px] tracking-[0.22em] text-white/75">
                                                    CHECK-IN
                                                </div>
                                                <Input
                                                    className="bg-white text-sm"
                                                    type="date"
                                                    min={today}
                                                    value={checkIn}
                                                    onChange={(e) => {
                                                        setCheckIn(e.target.value);

                                                        // Reset check-out if it becomes invalid
                                                        if (checkOut && e.target.value >= checkOut) {
                                                            setCheckOut("");
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <div className="mb-2 text-[11px] tracking-[0.22em] text-white/75">
                                                    CHECK-OUT
                                                </div>
                                                <Input
                                                    className="bg-white text-sm"
                                                    type="date"
                                                    min={checkIn || today}
                                                    disabled={!checkIn}
                                                    value={checkOut}
                                                    onChange={(e) => setCheckOut(e.target.value)}
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <div className="mb-2 text-[11px] tracking-[0.22em] text-white/75">
                                                    GUESTS
                                                </div>
                                                <Input
                                                    className="bg-white/70 text-sm"
                                                    type="number"
                                                    min={1}
                                                    value={capacity}
                                                    onChange={(e) => setCapacity(Number(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div className="text-sm text-white/70">
                                                Filter by price, amenities, and extendable rooms on the results page.
                                            </div>
                                            <Button
                                                variant="accent"
                                                size="lg"
                                                disabled={!canSearch}
                                                onClick={onSearch}
                                            >
                                                Search Rooms
                                            </Button>


                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                    Boutique hotels
                  </span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                    Premium amenities
                  </span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 backdrop-blur">
                    Elegant booking flow
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* fade into page */}
                <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-full bg-gradient-to-b from-transparent to-champagne" />
            </section>

            {/* separator */}
            <div className="mx-auto max-w-6xl px-5">
                <div className="h-px w-full bg-black/10" />
            </div>

            {/* ABOUT */}
            <section className="mx-auto max-w-6xl px-5 py-20">
                <div className="grid items-center gap-10 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <div className="text-xs tracking-[0.3em] text-black/45">
                            REFINED EXPERIENCE
                        </div>
                        <h2 className="mt-3 font-serif text-4xl leading-tight text-ink">
                            Elegance in every detail.
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-black/65">
                            LuxStay is designed like a boutique brand: quiet luxury, soft tones,
                            refined typography, and an interface that feels calm — even when it’s
                            handling serious hotel operations behind the scenes.
                        </p>

                        <ul className="mt-7 space-y-3 text-sm text-black/70">
                            <li>• Seamless room discovery and booking flow</li>
                            <li>• Clean hotel & chain browsing for guests</li>
                            <li>• Built to scale into customer & admin dashboards later</li>
                        </ul>

                        <div className="mt-8">
                            <Button variant="accent" onClick={() => navigate("/hotel-chains")}>
                                View Hotel Chains
                            </Button>

                        </div>
                    </div>

                    <div className="md:col-span-6">
                        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/60 shadow-soft">
                            <img
                                alt="Hotel lobby"
                                className="h-[380px] w-full object-cover"
                                src="https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=1600&q=80"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* separator */}
            <div className="mx-auto max-w-6xl px-5">
                <div className="h-px w-full bg-black/10" />
            </div>

            {/* FEATURES */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-5 py-20">
                    <div className="text-center">
                        <div className="text-xs tracking-[0.3em] text-black/45">LUXURY FEATURES</div>
                        <h2 className="mt-3 font-serif text-4xl text-ink">What LuxStay does best</h2>
                        <p className="mt-3 text-sm text-black/60">
                            Simple, refined, and built for real-world workflows.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {[
                            {
                                title: "Central Discovery",
                                desc: "Search rooms by city, dates, capacity, price, and amenities — with elegant filtering.",
                            },
                            {
                                title: "Hotel Details",
                                desc: "Each hotel page highlights the brand, location, and context behind the stay.",
                            },
                            {
                                title: "Fast Guest Booking",
                                desc: "Book without login — the system creates your customer profile automatically.",
                            },
                        ].map((f) => (
                            <Card key={f.title} className="p-7">
                                <div className="text-xs tracking-[0.25em] text-black/45">FEATURE</div>
                                <div className="mt-3 font-serif text-2xl text-ink">{f.title}</div>
                                <p className="mt-3 text-sm leading-relaxed text-black/65">{f.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* separator */}
            <div className="mx-auto max-w-6xl px-5">
                <div className="h-px w-full bg-black/10" />
            </div>

            {/* TESTIMONIALS (CHAMPAGNE GRADIENT) */}
            <section className="bg-gradient-to-r from-[#f6f0e7] to-[#fffdf9]">
                <div className="mx-auto max-w-6xl px-5 py-24 md:py-28">
                    <div className="text-center">
                        <div className="text-xs tracking-[0.3em] text-black/45">TESTIMONIALS</div>
                        <h2 className="mt-3 font-serif text-4xl text-ink">What our clients say</h2>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {[
                            {
                                quote:
                                    "This system transformed the way we operate across multiple locations. Intuitive, elegant, dependable.",
                                name: "Olivia Marceau",
                                role: "Operations Director, Aurum Hotels",
                            },
                            {
                                quote:
                                    "Exceptional design meets powerful features. Our team adapted instantly — the experience feels premium.",
                                name: "Thomas Greene",
                                role: "General Manager, Grand Crest",
                            },
                            {
                                quote:
                                    "Clients love the calm booking flow, and our staff love how clean everything feels to manage.",
                                name: "Aisha Rahman",
                                role: "Concierge Lead, Golden Sands",
                            },
                            {
                                quote:
                                    "A premium tool for premium service. LuxStay really delivers — the UI feels like a luxury brand.",
                                name: "Carlos Mendez",
                                role: "Director of Guest Experience",
                            },
                        ].map((t) => (
                            <Card key={t.name} className="p-7">
                                <blockquote className="text-sm italic leading-relaxed text-black/70">
                                    “{t.quote}”
                                </blockquote>
                                <div className="mt-5 text-sm font-semibold text-ink">{t.name}</div>
                                <div className="text-xs tracking-[0.12em] text-black/45">{t.role}</div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* separator */}
            <div className="mx-auto max-w-6xl px-5">
                <div className="h-px w-full bg-black/10" />
            </div>

            {/* GALLERY (WHITE) */}
            <section className="bg-white">
                <div className="mx-auto max-w-6xl px-5 py-20">
                    <div className="text-center">
                        <div className="text-xs tracking-[0.3em] text-black/45">GALLERY</div>
                        <h2 className="mt-3 font-serif text-4xl text-ink">Our beautiful spaces</h2>
                        <p className="mt-3 text-sm text-black/60">
                            A taste of the atmosphere LuxStay represents.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {[
                            "https://images.unsplash.com/photo-1506813211037-0b52e02d19b7?auto=format&fit=crop&w=1400&q=80",
                            "https://images.unsplash.com/photo-1564193495687-031783e9e06c?auto=format&fit=crop&w=1400&q=80",
                            "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=1400&q=80",
                        ].map((src) => (
                            <div
                                key={src}
                                className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-soft"
                            >
                                <img
                                    src={src}
                                    alt="Gallery"
                                    className="h-[440px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>



            {/* FINAL CTA */}
            <section className=" mx-auto max-w-6xl px-5 py-20">
                <Card className="overflow-hidden">
                    <div className="grid items-center gap-6 p-8 md:grid-cols-12 md:p-10">
                        <div className="md:col-span-8">
                            <div className="text-xs tracking-[0.3em] text-black/45">READY</div>
                            <div className="mt-2 font-serif text-4xl text-ink">
                                Experience elegance in every stay.
                            </div>
                            <p className="mt-3 text-sm text-black/65">
                                Start by searching rooms in your city — the rest is designed to feel effortless.
                            </p>
                        </div>
                        <div className="md:col-span-4 md:flex md:justify-end">
                            <Button variant="primary" size="lg" onClick={() => navigate("/search")}>
                                Find a Room
                            </Button>

                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
}
