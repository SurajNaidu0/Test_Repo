/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            keyframes: {
                spin: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.2)' },
                    '50%': { boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' },
                    '100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.2)' },
                },
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            animation: {
                spin: 'spin 1s ease-in-out infinite',
                fadeInUp: 'fadeInUp 0.5s ease-out',
                pulseGlow: 'pulseGlow 2s infinite',
                gradientShift: 'gradientShift 3s ease infinite',
            },
        },
    },
    plugins: [],
};