/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Structure + action
        navy: {
          900: "#0E1F3B",
          700: "#1E3A66",
        },
        // Gold, split by role (see docs/design/brand-kit-refined.html)
        gold: {
          500: "#C9A227", // SIGNAL only: progress fill, marks on dark
          700: "#8A6A16", // INTERACTIVE on light: focus ring, selected marker, links
        },
        paper: "#FAF9F6",
        ink: "#10192B",
        line: {
          DEFAULT: "#D9DEE7",
          strong: "#C3CAD6",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      maxWidth: {
        form: "40rem",
      },
    },
  },
  plugins: [],
};
