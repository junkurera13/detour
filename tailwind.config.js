/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          primary: '#fd6b03',
          secondary: '#fd9003',
        },
      },
      fontFamily: {
        sans: ['InstrumentSans_400Regular'],
        medium: ['InstrumentSans_500Medium'],
        semibold: ['InstrumentSans_600SemiBold'],
        bold: ['InstrumentSans_700Bold'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
