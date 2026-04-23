import { Outlet } from "react-router-dom";
import PublicNav from "./PublicNav";
import PublicFooter from "./PublicFooter";

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-champagne text-ink">
            <PublicNav />
            <main className="min-h-[75vh]">{<Outlet />}</main>
            <PublicFooter />
        </div>
    );
}
