import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { hotelChainsApi } from "../../api/hotelChains.api";

export default function ChainsList() {
    const [chains, setChains] = useState([]);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        hotelChainsApi
            .list()
            .then(setChains)
            .catch((e) => setErr(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-6xl px-5 py-12">
            <div className="mb-6">
                <div className="text-xs tracking-[0.3em] text-black/45">HOTEL CHAINS</div>
                <h1 className="mt-2 font-serif text-4xl">Explore LuxStay collections</h1>
                <p className="mt-2 text-sm text-black/60">Elegant brands across cities, curated for comfort.</p>
            </div>

            {loading && <div className="text-sm text-black/55">Loading chains…</div>}
            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="grid gap-5 md:grid-cols-2">
                {chains.map((c) => (
                    <Card key={c.id} className="p-6">
                        <div className="text-xs tracking-[0.25em] text-black/45">CHAIN</div>
                        <div className="mt-2 font-serif text-2xl">{c.chainName}</div>
                        <div className="mt-2 text-sm text-black/60">
                            {c.headquarterAddress || "Headquarter address not provided."}
                        </div>
                        <div className="mt-4 text-xs tracking-[0.18em] text-black/40">
                            HOTELS: {c.numberOfHotels ?? "—"}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
