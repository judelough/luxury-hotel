import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { roomsApi } from "../../api/rooms.api";
import { money } from "../../utils/format";

const SORTS = [
    { value: "featured", label: "Featured" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "capacity_desc", label: "Capacity: High → Low" },
];

// ✅ Cache (fast revisit)
const CACHE_KEY = "luxstay.rooms.search.v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

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

function pickThumb(r) {
    return (
        r?.imageUrl ||
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"
    );
}

// Old-style input look
function Field({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-[11px] tracking-[0.35em] uppercase text-black/45">
                {label}
            </div>
            {children}
        </div>
    );
}

function TextInput(props) {
    return (
        <input
            {...props}
            className={[
                "w-full rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm text-black/80",
                "outline-none transition",
                "focus:border-black/20 focus:ring-2 focus:ring-[#C9A24D]/20",
                props.className || "",
            ].join(" ")}
        />
    );
}

function RoomsSkeletonGrid() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="h-[360px] animate-pulse rounded-3xl border border-black/10 bg-white"
                />
            ))}
        </div>
    );
}

export default function SearchRooms() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const resultsRef = useRef(null);

    const hotelIdParam = params.get("hotelId");
    const hotelId = hotelIdParam ? Number(hotelIdParam) : null;

    const initialCity = params.get("city") || "";
    const initialCapacity = Number(params.get("capacity") || 1);

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [err, setErr] = useState(null);

    // Filters
    const [city, setCity] = useState(initialCity);
    const [capacity, setCapacity] = useState(initialCapacity);
    const [maxPrice, setMaxPrice] = useState("");
    const [amenity, setAmenity] = useState("");
    const [extendableOnly, setExtendableOnly] = useState(false);

    // UX
    const [sortBy, setSortBy] = useState("featured");

    useEffect(() => {
        let cancelled = false;

        const cached = readCache();
        const cacheFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;

        // ✅ Instant paint from cache
        if (cached?.data?.length) {
            setRooms(cached.data);
            setHasLoadedOnce(true);
            setLoading(false);
        }

        async function load() {
            try {
                setErr(null);

                // ✅ If cache is fresh, skip network
                if (cacheFresh) return;

                setLoading(true);
                const data = await roomsApi.list();
                if (cancelled) return;

                const normalized = Array.isArray(data) ? data : [];
                setRooms(normalized);
                writeCache(normalized);
                setHasLoadedOnce(true);
            } catch (e) {
                if (cancelled) return;
                // keep cached data if we already had it
                setErr(e?.message || "Failed to load rooms");
                setHasLoadedOnce(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(() => {
        const list = rooms
            .filter((r) => (hotelId ? Number(r.hotelId) === hotelId : true))
            .filter((r) =>
                city ? (r.city || "").toLowerCase().includes(city.toLowerCase()) : true
            )
            .filter((r) => (capacity ? Number(r.capacity) >= Number(capacity) : true))
            .filter((r) => (maxPrice ? Number(r.price) <= Number(maxPrice) : true))
            .filter((r) => (extendableOnly ? !!r.extendable : true))
            .filter((r) =>
                amenity
                    ? (r.amenities || "").toLowerCase().includes(amenity.toLowerCase())
                    : true
            );

        const sorted = [...list];

        if (sortBy === "price_asc") sorted.sort((a, b) => Number(a.price) - Number(b.price));
        if (sortBy === "price_desc") sorted.sort((a, b) => Number(b.price) - Number(a.price));
        if (sortBy === "capacity_desc")
            sorted.sort((a, b) => Number(b.capacity) - Number(a.capacity));

        if (sortBy === "featured") {
            sorted.sort((a, b) => {
                const aScore = (Number(a.capacity) || 0) * 2 - (Number(a.price) || 0) / 120;
                const bScore = (Number(b.capacity) || 0) * 2 - (Number(b.price) || 0) / 120;
                return bScore - aScore;
            });
        }

        return sorted;
    }, [rooms, hotelId, city, capacity, maxPrice, extendableOnly, amenity, sortBy]);

    const resetFilters = () => {
        setCity(initialCity);
        setCapacity(initialCapacity);
        setMaxPrice("");
        setAmenity("");
        setExtendableOnly(false);
        setSortBy("featured");
    };

    const clearHotelFilter = () => navigate("/search");

    const applyAndScroll = () => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const showSkeletons = loading || (!hasLoadedOnce && filtered.length === 0);

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* Top header band */}
            <section className="border-b border-black/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-10">
                    <div className="grid gap-6 md:grid-cols-12 md:items-end">
                        <div className="md:col-span-8">
                            <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                Search rooms
                            </div>

                            <h1 className="mt-3 font-serif text-5xl leading-[1.04] text-[#0B0F14]">
                                Find your next stay.
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/60">
                                Filter by city, capacity, price, amenities — then book in minutes. Clean, calm, and
                                built for browsing.
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-black/55">
                <span className="rounded-full border border-black/10 bg-[#F6F3EE] px-3 py-1">
                  Results:{" "}
                    <span className="font-semibold text-[#0B0F14]">
                    {showSkeletons ? "…" : filtered.length}
                  </span>
                </span>

                                {hotelId ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A24D]/35 bg-[#C9A24D]/10 px-3 py-1 text-[#0B0F14]">
                    Hotel filter: <span className="font-semibold">#{hotelId}</span>
                    <button
                        onClick={clearHotelFilter}
                        className="ml-1 text-[11px] tracking-[0.18em] uppercase text-black/70 underline decoration-black/30 underline-offset-4 hover:text-black"
                        type="button"
                        title="Show all hotels"
                    >
                      Clear
                    </button>
                  </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="md:col-span-4 md:flex md:justify-end">
                            <div className="flex w-full flex-col gap-3 md:w-[320px]">
                                <div className="rounded-2xl border border-black/10 bg-[#F6F3EE] p-4">
                                    <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">
                                        Sort by
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F14] outline-none focus:ring-2 focus:ring-[#C9A24D]/30"
                                    >
                                        {SORTS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button variant="ghost" onClick={resetFilters}>
                                    Reset filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main */}
            <section className="mx-auto max-w-6xl px-5 py-10">
                <div className="grid gap-6 md:grid-cols-12">
                    {/* Filters Sidebar */}
                    <div className="md:col-span-4">
                        <Card className="sticky top-6 overflow-hidden p-0">
                            <div className="border-b border-black/10 bg-white px-6 py-6">
                                <div className="text-[11px] tracking-[0.42em] uppercase text-black/45">
                                    Filters
                                </div>
                                <div className="mt-2 text-sm text-black/60">
                                    Refine results with a calm, precise search.
                                </div>
                            </div>

                            <div className="bg-white px-6 py-6">
                                <div className="space-y-5">
                                    <Field label="City">
                                        <TextInput
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="Ottawa"
                                        />
                                    </Field>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Min guests">
                                            <TextInput
                                                type="number"
                                                min={1}
                                                value={capacity}
                                                onChange={(e) => setCapacity(e.target.value)}
                                            />
                                        </Field>

                                        <Field label="Max price">
                                            <TextInput
                                                type="number"
                                                min={0}
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                placeholder="250"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Amenity contains">
                                        <TextInput
                                            value={amenity}
                                            onChange={(e) => setAmenity(e.target.value)}
                                            placeholder="WiFi, AC, balcony…"
                                        />
                                    </Field>

                                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#F6F3EE] px-4 py-4 text-sm text-black/70">
                                        <div>
                                            <div className="text-[11px] tracking-[0.35em] uppercase text-black/45">
                                                Extendable only
                                            </div>
                                            <div className="mt-1 text-xs text-black/55">
                                                Show rooms you can extend.
                                            </div>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={extendableOnly}
                                            onChange={(e) => setExtendableOnly(e.target.checked)}
                                            className="h-5 w-5 accent-[#C9A24D]"
                                        />
                                    </label>

                                    <div className="flex gap-3">
                                        <Button variant="primary" onClick={applyAndScroll}>
                                            Apply
                                        </Button>
                                        <Button variant="outline" onClick={resetFilters}>
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-8 rounded-2xl border border-black/10 bg-[#0B0F14] p-5">
                                    <div className="text-[11px] tracking-[0.42em] uppercase text-white/60">
                                        Tip
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                                        Start broad, then tighten price & amenities. The best stays hide in the middle.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Results */}
                    <div ref={resultsRef} className="md:col-span-8">
                        {err && (
                            <div className="mb-6 rounded-3xl border border-red-200 bg-white p-8 text-sm text-red-700">
                                {err}
                            </div>
                        )}

                        {showSkeletons ? (
                            <RoomsSkeletonGrid />
                        ) : filtered.length === 0 ? (
                            // ✅ No “No rooms found” — just a calm action panel
                            <div className="rounded-3xl border border-black/10 bg-white p-10">
                                <div className="text-sm text-black/60">
                                    Try adjusting your filters to see rooms again.
                                </div>
                                <div className="mt-5">
                                    <Button variant="primary" onClick={resetFilters}>
                                        Reset filters
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {filtered.map((r) => {
                                    const img = pickThumb(r);

                                    return (
                                        <Card
                                            key={r.id}
                                            className={[
                                                "group border border-black/10 bg-white/90",
                                                "rounded-3xl overflow-hidden", // ✅ ensure card itself is always rounded
                                                "transition-transform will-change-transform transform-gpu",
                                                "hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(11,15,20,0.18)]",
                                            ].join(" ")}
                                        >

                                            <div className="relative aspect-[16/11] w-full overflow-hidden rounded-t-3xl transform-gpu">
                                                <img
                                                    src={img}
                                                    alt={`Room ${r.roomNumber}`}
                                                    className="h-full w-full object-cover transform-gpu transition duration-700 group-hover:scale-[1.04]"
                                                />

                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.10)_0%,rgba(11,15,20,0.10)_40%,rgba(11,15,20,0.65)_100%)]" />

                                                <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-white backdrop-blur">
                                                    {money(r.price)} <span className="text-white/70">/ night</span>
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] tracking-[0.22em] text-white/90 backdrop-blur">
                              {r.city || "—"}
                            </span>
                                                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] tracking-[0.22em] text-white/90 backdrop-blur">
                              Room #{r.roomNumber}
                            </span>
                                                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] tracking-[0.22em] text-white/90 backdrop-blur">
                              Capacity {r.capacity}
                            </span>
                                                        {r.extendable ? (
                                                            <span className="rounded-full border border-[#C9A24D]/40 bg-[#C9A24D]/20 px-3 py-1 text-[11px] tracking-[0.22em] text-white backdrop-blur">
                                Extendable
                              </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-3 font-serif text-2xl text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)] line-clamp-1">
                                                        {r.hotelName || "Hotel"}
                                                    </div>

                                                    <div className="mt-1 text-sm text-white/75 line-clamp-2">
                                                        Amenities: {r.amenities || "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-black/60">
                                                        {r.extendable
                                                            ? "Flexible stay options available"
                                                            : "Standard booking"}
                                                    </div>

                                                    <Link
                                                        to={`/rooms/${r.id}`}
                                                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F6F3EE] px-4 py-2 text-[11px] font-semibold tracking-[0.28em] text-[#0B0F14] transition hover:border-[#C9A24D]/40 hover:bg-white"
                                                    >
                                                        VIEW <span className="text-[#C9A24D]">→</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <div className="h-10" />
                    </div>
                </div>
            </section>
        </div>
    );
}
