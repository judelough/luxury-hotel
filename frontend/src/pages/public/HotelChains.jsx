import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endpoints } from "../../api/endpoints";
import { http } from "../../api/http";

// Only needed for image URLs (logos). API calls go through http.js.
const API_BASE =
    (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "") ||
    "http://localhost:8080";

// Cache (so revisiting the page feels instant)
const CACHE_KEY = "luxstay.hotelChains.v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FALLBACK_LOGO = "placeholder.png";

/**
 * Convert a chain name to a logo filename:
 * - trim
 * - lowercase
 * - spaces -> underscores
 * - collapse multiple spaces/underscores
 * - remove characters that are unsafe for filenames (keeps letters/numbers/_-)
 * - .png
 */
function chainNameToLogoFile(chainName) {
    const cleaned = String(chainName || "")
        .split("&")[0]
        .replace(/\b(hotel|hotels|inn|inns|group|groups|resort|resorts|suite|suites)\b/gi, "")
        .trim();

    const safe = cleaned
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/[^a-z0-9_-]/g, "");

    if (!safe) return FALLBACK_LOGO;
    return `${safe}.png`;
}

function getLogoSrc(chainName) {
    const file = chainNameToLogoFile(chainName);
    return `${API_BASE}/images/logos/${file}`;
}

function getFallbackLogoSrc() {
    return `${API_BASE}/images/logos/${FALLBACK_LOGO}`;
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

export default function HotelChains() {
    const navigate = useNavigate();
    const [chains, setChains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [error, setError] = useState("");
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const cached = readCache();
        const cacheFresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;

        // show cached immediately
        if (cached?.data?.length) {
            setChains(cached.data);
            setHasLoadedOnce(true);
            setLoading(false);
        }

        async function load() {
            try {
                setError("");

                // skip network if cache is fresh
                if (cacheFresh) return;

                // ✅ Always use shared http client (uses VITE_API_BASE_URL)
                const data = await http.get(endpoints.hotelChains);

                const normalized = Array.isArray(data) ? data : [];
                setChains(normalized);
                writeCache(normalized);
                setHasLoadedOnce(true);
            } catch (e) {
                if (e?.name === "AbortError") return;

                console.error("Failed to load hotel chains:", e);

                // keep cached if available
                if (cached?.data?.length) {
                    setError("Couldn’t refresh chains right now. Showing last saved results.");
                    setHasLoadedOnce(true);
                    return;
                }

                setChains([]);
                setHasLoadedOnce(true);
                setError("Couldn’t load chains right now.");
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return chains;
        return chains.filter((c) => (c?.name || "").toLowerCase().includes(term));
    }, [chains, q]);

    return (
        <div className="min-h-screen bg-[#F6F3EE]">
            {/* HERO */}
            <section className="border-b border-black/10 bg-white">
                <div className="mx-auto max-w-6xl px-5 py-14">
                    <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="text-[11px] tracking-[0.45em] uppercase text-black/45">
                                Hotel Chains
                            </div>

                            <h1 className="mt-3 font-serif text-5xl text-[#0B0F14] md:text-6xl">
                                Explore iconic brands
                            </h1>

                            <p className="mt-4 max-w-xl text-sm text-black/60">
                                Discover world-class hotel groups and explore their curated portfolios of luxury and comfort.
                            </p>

                            {!!error && (
                                <div className="mt-4 inline-flex rounded-2xl border border-black/10 bg-[#FBF7F0] px-4 py-2 text-xs text-black/70">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Search */}
                        <div className="w-full md:max-w-[380px]">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search brands…"
                                className="w-full rounded-2xl border border-black/10 bg-[#FBF7F0] px-5 py-3 text-sm outline-none focus:border-[#C9A24D]/60 focus:ring-2 focus:ring-[#C9A24D]/20"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* GRID */}
            <section className="mx-auto max-w-6xl px-5 py-14">
                {loading || (!hasLoadedOnce && filtered.length === 0) ? (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[300px] animate-pulse rounded-3xl border border-black/10 bg-white" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-3xl border border-black/10 bg-white p-10 text-sm text-black/60">
                        Try a different search term.
                    </div>
                ) : (
                    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((c) => {
                            const id = c.id;
                            const name = c.name;
                            const hotelsCount = c.hotelsCount ?? 0;

                            return (
                                <article
                                    key={id}
                                    className={[
                                        "group relative overflow-hidden rounded-3xl border border-black/10",
                                        "bg-white/80 backdrop-blur",
                                        "shadow-[0_16px_60px_rgba(11,15,20,0.10)]",
                                        "transition will-change-transform",
                                        "hover:-translate-y-1 hover:shadow-[0_28px_110px_rgba(11,15,20,0.18)]",
                                    ].join(" ")}
                                >
                                    <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                                        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#C9A24D]/15 blur-3xl" />
                                        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
                                    </div>

                                    <div className="relative flex h-44 items-center justify-center bg-gradient-to-b from-white to-[#FBF7F0]">
                                        <img
                                            src={getLogoSrc(name)}
                                            alt={name}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => {
                                                if (e.currentTarget.src !== getFallbackLogoSrc()) {
                                                    e.currentTarget.src = getFallbackLogoSrc();
                                                }
                                            }}
                                            className="max-h-28 max-w-[80%] object-contain transition duration-300 group-hover:scale-[1.06]"
                                        />
                                    </div>

                                    <div className="relative rounded-b-3xl bg-[#FBF7F0] px-7 py-7">
                                        <h3 className="font-serif text-2xl text-[#0B0F14]">{name}</h3>

                                        <p className="mt-2 text-sm text-black/60">
                                            Hotels in this chain: <span className="font-medium text-black/80">{hotelsCount}</span>
                                        </p>

                                        <button
                                            onClick={() => navigate(`/hotels?chainId=${id}`)}
                                            className={[
                                                "mt-6 inline-flex items-center justify-center rounded-full",
                                                "bg-[#0B0F14] px-5 py-3 text-[11px] uppercase tracking-[0.3em] text-white",
                                                "shadow-[0_10px_25px_rgba(11,15,20,0.18)] transition",
                                                "hover:shadow-[0_16px_40px_rgba(11,15,20,0.28)]",
                                                "active:translate-y-[1px]",
                                            ].join(" ")}
                                        >
                                            View Hotels
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
