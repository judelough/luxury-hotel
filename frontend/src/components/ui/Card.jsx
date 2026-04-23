import { cn } from "../../utils/cn";

export default function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                "rounded-3xl border border-black/10 bg-white/80 shadow-[0_14px_50px_rgba(0,0,0,0.06)]",
                "transition duration-300",
                "hover:-translate-y-1 hover:shadow-[0_22px_80px_rgba(0,0,0,0.10)] hover:border-black/15",
                className
            )}
            {...props}
        />
    );
}
