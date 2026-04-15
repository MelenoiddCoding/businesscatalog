import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff3eb",
          100: "#ffe3d2",
          200: "#ffc6a5",
          300: "#ffa36b",
          400: "#ff7c33",
          500: "#ee6c2b",
          600: "#d85a1c",
          700: "#b64718",
          800: "#933817",
          900: "#772f16"
        }
      },
      boxShadow: {
        soft: "0 12px 40px -24px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
