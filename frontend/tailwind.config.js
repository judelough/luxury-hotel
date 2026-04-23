/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"DM Serif Display"', "serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                ink: "#121417",
                night: "#0B0F14",
                champagne: "#FBF7F0",
                parchment: "#F4EDE2",
                gold: "#C6A15B",
                goldSoft: "#E6D3A6",
                roseMist: "#EAD7D3",
                sage: "#D7E2D6",
            },
            boxShadow: {
                soft: "0 10px 30px rgba(0,0,0,0.08)",
                glow: "0 0 0 1px rgba(198,161,91,0.25), 0 18px 60px rgba(0,0,0,0.18)",
            },
            backgroundImage: {
                "hero-overlay":
                    "linear-gradient(90deg, rgba(11,15,20,0.82) 0%, rgba(11,15,20,0.55) 40%, rgba(11,15,20,0.15) 100%)",
                grain:
                    "radial-gradient(circle at 1px 1px, rgba(18,20,23,0.08) 1px, transparent 0)",
            },
        },
    },
    plugins: [],
};
