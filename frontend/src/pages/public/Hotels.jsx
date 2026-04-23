import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { endpoints } from "../../api/endpoints";
import { http } from "../../api/http";

// Cache (fast revisit)
const CACHE_KEY = "luxstay.hotels.v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function guessHotelImage(hotel) {
    if (hotel?.imageUrl) return hotel.imageUrl;
    const seed = encodeURIComponent(hotel?.name || hotel?.hotelName || "hotel");
    return `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80&sig=${seed}`;
}

function readCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.data || !Array.isArray(parsed.data)) return null;
        if (typeof parsed.ts !== "number") return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeCache(data) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // ignore
    }
}

function HotelSkeletonGrid() {
    return (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="h-[360px] animate-pulse rounded-3xl border border-black/10 bg-white"
                />
            ))}
        </div>
    );
}

export default function Hotels() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const chainId = params.get("chainId"); // comes from HotelChains page

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [q, setQ] = useState("");
    const [city, setCity] = useState("All");

    useEffect(() => {
        const controller = new AbortController();

        const cached = readCache();
        const cacheFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;

        // show cached immediately
        if (cached?.data?.length) {
            setHotels(cached.data);
            setHasLoadedOnce(true);
            setLoading(false);
        }

        async function load() {
            try {
                if (cacheFresh) return;

                setLoading(true);

                const data = await http.get(endpoints.hotels);
                const normalized = Array.isArray(data) ? data : [];

                setHotels(normalized);
                writeCache(normalized);
                setHasLoadedOnce(true);
            } catch (e) {
                if (e?.name === "AbortError") return;

                console.error("Failed to load hotels:", e);

                if (cached?.data?.length) {
                    setHasLoadedOnce(true);
                    return;
                }

                setHotels([]);
                setHasLoadedOnce(true);
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cities = useMemo(() => {
        const set = new Set(
            hotels
                .map((h) => (h?.city || "").trim())
                .filter(Boolean)
        );
        return ["All", ...Array.from(set).sort()];
    }, [hotels]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();

        return hotels.filter((h) => {
            const matchesChain =
                !chainId || String(h?.chainId ?? h?.hotelChainId ?? "") === String(chainId);

            const matchesCity = city === "All" || (h?.city || "") === city;

            const name = (h?.name || h?.hotelName || "").toLowerCase();
            const matchesTerm = !term || name.includes(term);

            return matchesChain && matchesCity && matchesTerm;
        });
    }, [hotels, q, city, chainId]);

    // ✅ Clear only search + city (NOT chain filter)
    function clearFilters() {
        setQ("");
        setCity("All");
    }

    // ✅ Clear chain filter (go back to all hotels)
    function clearChainFilter() {
        navigate("/hotels");
    }

    const isFilteringBySearchOrCity = q.trim().length > 0 || city !== "All";
    const showSkeletonInsteadOfEmpty = loading || (!hasLoadedOnce && filtered.length === 0);

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* Header */}
            <section className="border-b border-black/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-12">
                    <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">Hotels</div>

                    <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="font-serif text-5xl leading-tight text-[#0B0F14]">
                                Explore hotels in style.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/60">
                                Browse properties by city and brand — then open a hotel to see details and rooms.
                            </p>
                        </div>

                        {/* ✅ Chain filter banner + clear */}
                        {chainId && (
                            <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-black/10 bg-[#FBF7F0] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-black/60">
                  Chain filter active
                </span>
                                <Button variant="outline" size="sm" onClick={clearChainFilter}>
                                    Clear chain filter
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="mt-8 grid gap-3 sm:grid-cols-12 sm:items-center">
                        <div className="sm:col-span-7">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search hotels…"
                                className="w-full rounded-full border border-black/15 bg-white px-5 py-3 text-sm text-black/80 outline-none transition focus:border-black/30"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full rounded-full border border-black/15 bg-white px-5 py-3 text-sm text-black/80 outline-none transition focus:border-black/30"
                            >
                                {cities.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ✅ Replace “Find a Room” with “Clear filters” */}
                        <div className="sm:col-span-2 sm:flex sm:justify-end">
                            <Button
                                variant={isFilteringBySearchOrCity ? "primary" : "outline"}
                                size="sm"
                                onClick={clearFilters}
                                disabled={!isFilteringBySearchOrCity}
                            >
                                Clear filters
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="mx-auto max-w-6xl px-5 py-14">
                {showSkeletonInsteadOfEmpty ? (
                    <HotelSkeletonGrid />
                ) : filtered.length === 0 ? (
                    // ✅ No “No hotels found” messaging — just a helpful action panel
                    <div className="rounded-3xl border border-black/10 bg-white p-10">
                        <div className="text-sm text-black/60">
                            Try adjusting your filters to see hotels again.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button variant="primary" size="sm" onClick={clearFilters}>
                                Clear filters
                            </Button>

                            {chainId && (
                                <Button variant="outline" size="sm" onClick={clearChainFilter}>
                                    Clear chain filter
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((h) => {
                            const id = h?.id;
                            const name = h?.name || h?.hotelName || "Hotel";
                            const cityName = h?.city || "—";
                            const address = h?.address || h?.streetAddress || "";

                            return (
                                <Card key={id ?? name} className="overflow-hidden">
                                    <div className="group">
                                        <div className="relative h-52 overflow-hidden">
                                            <img
                                                src={guessHotelImage(h)}
                                                alt={name}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
                                            <div className="absolute bottom-4 left-5 right-5">
                                                <div className="font-serif text-2xl text-white drop-shadow">{name}</div>
                                                <div className="mt-1 text-[11px] tracking-[0.30em] uppercase text-white/80">
                                                    {cityName}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white px-7 py-7">
                                            {address ? (
                                                <div className="text-sm text-black/60">{address}</div>
                                            ) : (
                                                <div className="text-sm text-black/45">—</div>
                                            )}

                                            <div className="mt-6 flex items-center justify-between gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/hotels/${id}`)}
                                                >
                                                    View details
                                                </Button>

                                                <button
                                                    onClick={() => navigate(`/search?hotelId=${id}`)}
                                                    className="text-[11px] tracking-[0.28em] uppercase text-black/55 hover:text-black transition"
                                                >
                                                    Rooms →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
