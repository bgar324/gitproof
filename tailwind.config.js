/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card-background)',
        border: 'var(--border-color)',
        hover: 'var(--hover-bg)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        reckless: ['var(--font-reckless)'],
      },
      fontWeight: {
        'reckless-light': '300',
        'reckless-regular': '400',
        'reckless-medium': '500',
        'reckless-semibold': '600',
        'reckless-bold': '700',
      },
      fontStyle: {
        'reckless-italic': 'italic',
      },
    },
  },
  plugins: [],
}
