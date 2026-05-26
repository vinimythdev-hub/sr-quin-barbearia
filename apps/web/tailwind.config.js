/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: "#0f0e0d",
          carbon: "#181615",
          clay: "#2c2826",
          gold: "#d4af37",
          copper: "#cf8a5f",
          tijolo: "#b2533e",
          sand: "#ece9e2",
        }
      },
      boxShadow: {
        'retro-sm': '2px 2px 0px 0px #2c2826',
        'retro-md': '4px 4px 0px 0px #2c2826',
        'retro-lg': '6px 6px 0px 0px #2c2826',
        'retro-gold-sm': '2px 2px 0px 0px #d4af37',
        'retro-gold-md': '4px 4px 0px 0px #d4af37',
        'retro-copper-sm': '2px 2px 0px 0px #cf8a5f',
        'retro-copper-md': '4px 4px 0px 0px #cf8a5f',
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        display: ["var(--font-cinzel)", "serif"],
      },
    },
  },
  plugins: [],
}
