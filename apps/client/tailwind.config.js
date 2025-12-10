export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EBF5FF",
          100: "#DBEEFF",
          200: "#BEE0FF",
          300: "#8FD0FF",
          400: "#5FBFFB",
          DEFAULT: "#2563EB",
          700: "#1E40AF",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        mdsoft: "0 10px 30px rgba(2,6,23,0.06)",
        mdsoft_dark: "0 10px 30px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
