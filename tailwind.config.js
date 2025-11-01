/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Set 'Inter' as the default sans-serif font
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // New Teal/Green professional theme
        primary: {
          light: '#E0F2F1', // Light teal bg
          DEFAULT: '#00796B', // Main button color
          dark: '#004D40',  // Dark hover
        },
        secondary: {
          light: '#FAFAFA', // Page background
          DEFAULT: '#EEEEEE', // Borders
          dark: '#616161',  // Muted text
          darkest: '#212121', // Headings
        },
      },
      // For sidebar transition
      transitionProperty: {
        'width': 'width',
        'margin': 'margin-left',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}