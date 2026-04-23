import { cn } from "../../utils/cn";

export default function Button({
                                   variant = "primary",
                                   size = "md",
                                   className,
                                   ...props
                               }) {
    const base =
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
        sm: "px-4 py-2 text-xs tracking-[0.22em] uppercase",
        md: "px-6 py-3 text-xs tracking-[0.24em] uppercase",
        lg: "px-8 py-3.5 text-sm tracking-[0.26em] uppercase",
    };

    const variants = {
        // MAIN CTA (ink)
        primary:
            "bg-[#0B0F14] text-white shadow-[0_3px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.32)]",

        // HERO CTA (warm accent that pops on dark glass)
        accent:
            "bg-[#E2C27A] text-[#0B0F14] shadow-[0_18px_60px_rgba(226,194,122,0.35)] hover:shadow-[0_22px_80px_rgba(226,194,122,0.45)]",

        // SECONDARY
        outline:
            "bg-white/90 text-[#0B0F14] border border-black/20 hover:border-black/35 hover:bg-white",

        // SUBTLE / NAV
        ghost:
            "bg-transparent text-[#0B0F14]/70 hover:text-[#0B0F14] hover:bg-black/5",
    };

    return (
        <button
            className={cn(base, sizes[size], variants[variant], className)}
            {...props}
        />
    );
}
