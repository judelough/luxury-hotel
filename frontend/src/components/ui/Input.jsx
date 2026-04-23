import { cn } from "../../utils/cn";

export default function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none transition placeholder:text-black/35 focus:border-gold/60 focus:ring-4 focus:ring-gold/15",
                className
            )}
            {...props}
        />
    );
}
