/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.js",
  ],
  safelist: [
    'w-64',
    'w-1/2',
    'rounded-l-lg',
    'rounded-r-lg',
    'bg-gray-200',
    'grid-cols-4',
    'grid-cols-7',
    'h-6',
    'leading-6',
    'h-9',
    'leading-9',
    'shadow-lg',
    'bg-opacity-50',
    'dark:bg-opacity-80'
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { 
          "50": "#eff6ff", 
          "100": "#dbeafe", 
          "200": "#bfdbfe", 
          "300": "#93c5fd", 
          "400": "#60a5fa", 
          "500": "#3b82f6", 
          "600": "#2563eb", 
          "700": "#1d4ed8", 
          "800": "#1e40af", 
          "900": "#1e3a8a" 
        },
        secondary: "#ffffff",
        tertiary: "#f5f5f5",
        quaternary: "#c0cfd0",
        quinary: "#a0bfb9",
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        'body': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      backgroundImage: {
        homepage: "url('https://blog.logrocket.com/wp-content/themes/logrocket/assets/blog-header.png')",
        mainGradient: "linear-gradient(to right , #f1f5f9, #bcd5f7)",
      },
      transitionProperty: {
        'width': 'width'
      },
      textDecoration: ['active'],
    },
  },
  plugins: [
    require('flowbite/plugin')({
      charts: true,
    })
  ],
};
