import { Link } from "react-router-dom";

export default function PublicFooter() {
    return (
        <footer className="border-t border-black/10 bg-white">
            <div className="mx-auto max-w-6xl px-5 py-12">
                <div className="grid gap-10 md:grid-cols-12">
                    <div className="md:col-span-5">
                        <div className="flex items-baseline gap-3">
                            <div className="font-serif text-2xl text-[#0B0F14]">LuxStay</div>
                            <div className="text-[10px] tracking-[0.45em] text-black/45">
                                HOTELS
                            </div>
                        </div>

                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/60">
                            Boutique elegance, thoughtfully designed. Discover hotels, compare rooms,
                            and book in minutes with a calm luxury feel.
                        </p>
                    </div>

                    <div className="md:col-span-3">
                        <div className="text-[10px] tracking-[0.45em] text-black/45 uppercase">
                            Useful links
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <Link className="block text-black/65 hover:text-[#0B0F14]" to="/hotel-chains">
                                Hotel Chains
                            </Link>
                            <Link className="block text-black/65 hover:text-[#0B0F14]" to="/search">
                                Search Rooms
                            </Link>
                            <Link className="block text-black/65 hover:text-[#0B0F14]" to="/hotels">
                                Explore Hotels
                            </Link>
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <div className="text-[10px] tracking-[0.45em] text-black/45 uppercase">
                            Contact
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-black/60">
                            <div>Ottawa, ON</div>
                            <div>Support: support@luxstay.demo</div>
                            <div>Hours: Mon–Fri • 9:00–17:00</div>

                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-black/10 pt-6 md:flex-row md:items-center md:justify-between">
                    <div className="text-[11px] tracking-[0.22em] text-black/45">
                        © {new Date().getFullYear()} LuxStay. All rights reserved.
                    </div>
                    <div className="text-[11px] tracking-[0.22em] text-black/45">
                        Crafted with calm luxury • Azed Codes
                    </div>
                </div>
            </div>
        </footer>
    );
}
