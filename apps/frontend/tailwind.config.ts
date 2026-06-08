import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        transit: {
          ink: "#102030",
          muted: "#486170",
          mist: "#f6faf9",
          blue: "#0d4f7c",
          teal: "#087c70",
          green: "#16875d"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      fontSize: {
        readable: ["1.0625rem", { lineHeight: "1.65" }]
      },
      boxShadow: {
        soft: "0 18px 45px rgb(16 32 48 / 0.10)"
      }
    }
  },
  plugins: []
} satisfies Config;
