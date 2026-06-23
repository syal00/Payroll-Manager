import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        midnight: {
          bg: "#0A1024",
          "bg-2": "#0d142e",
          surface: "#151C33",
          "surface-2": "#1b2342",
        },
        copper: {
          DEFAULT: "#B87333",
          bright: "#D89556",
          deep: "#8a541f",
        },
        pearl: {
          DEFAULT: "#F4EDE4",
          dim: "#BFC5D4",
        },
      },
      animation: {
        "float-y": "floatY 5s ease-in-out infinite",
        "float-y-2": "floatY2 6s ease-in-out infinite",
        "spin-slow": "spin 30s linear infinite",
        "marquee-fwd": "marquee 40s linear infinite",
        "marquee-rev": "marquee 50s linear infinite reverse",
        "bar-grow": "barGrow 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
      keyframes: {
        floatY: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        floatY2: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(-1.5deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        barGrow: {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
