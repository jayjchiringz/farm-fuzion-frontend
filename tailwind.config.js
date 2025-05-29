// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class strategy for dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ['Ubuntu', 'sans-serif'],
        baloo: ['Baloo 2', 'cursive'],
      },
      colors: {
        brand: {
          dark: "#00231d",    // Dark Forest
          green: "#0d5b10",   // Pakistan Green
          apple: "#8dc71d",   // Apple Green
        },
      },
    },
  },
  plugins: [],
}
