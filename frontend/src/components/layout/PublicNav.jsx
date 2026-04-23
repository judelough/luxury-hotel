import { Link, NavLink, useNavigate } from "react-router-dom";
import Button from "../ui/Button";

const navLinkBase =
    "relative text-xs tracking-[0.14em] uppercase transition-all duration-300 " +
    "after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#C9A24D] " +
    "after:transition-all after:duration-300";

export default function PublicNav() {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                {/* LOGO */}
                <Link to="/" className="flex items-baseline gap-3">
          <span className="font-serif text-4xl leading-none text-[#0B0F14]">
            LuxStay
          </span>
                    <span className="text-[11px] tracking-[0.45em] text-black/45">
            HOTELS
          </span>
                </Link>

                {/* NAV LINKS */}
                <nav className="hidden items-center gap-9 md:flex">
                    <NavLink
                        to="/hotel-chains"
                        className={({ isActive }) =>
                            `${navLinkBase} ${
                                isActive
                                    ? "text-[#C9A24D] after:w-full"
                                    : "text-black/70 hover:text-[#C9A24D] hover:after:w-full"
                            }`
                        }
                    >
                        View Hotel Chains
                    </NavLink>

                    <NavLink
                        to="/hotels"
                        className={({ isActive }) =>
                            `${navLinkBase} ${
                                isActive
                                    ? "text-[#C9A24D] after:w-full"
                                    : "text-black/70 hover:text-[#C9A24D] hover:after:w-full"
                            }`
                        }
                    >
                        Explore Hotels
                    </NavLink>

                    <NavLink
                        to="/search"
                        className={({ isActive }) =>
                            `${navLinkBase} ${
                                isActive
                                    ? "text-[#C9A24D] after:w-full"
                                    : "text-black/70 hover:text-[#C9A24D] hover:after:w-full"
                            }`
                        }
                    >
                        Find a Room
                    </NavLink>
                </nav>

                {/* ACTIONS */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/search")}
                    >
                        Search
                    </Button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/search")}
                    >
                        Book Now
                    </Button>
                </div>
            </div>
        </header>
    );
}
