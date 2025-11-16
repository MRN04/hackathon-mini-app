/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        privacy: {
          dark: "#0a0a0a",
          darker: "#050505",
          accent: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
