/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/adapters/inbound/http/views/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
