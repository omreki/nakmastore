export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#059669",
                "primary-hover": "#047857",
                "primary-light": "#34d399",
                "primary-dark": "#064e3b",
                "primary-bright": "#10b981",
                "primary-accent": "#34d399",
                "accent": "#10b981",
                "secondary": "#a7f3d0",
                "background-light": "#f0fdf4",
                "background-dark": "#022c22",
                "card-dark": "rgba(4, 30, 24, 0.6)",
                "text-main": "#ffffff",
                "text-muted": "#94a3b8",
                "surface": "#ffffff",
                "surface-dark": "#064e3b",
                "surface-highlight": "#065f46",
                "surface-solid": "#ffffff",
                "surface-white": "#ffffff",
                "surface-light": "rgba(255, 255, 255, 0.6)",
                "surface-hover": "rgba(16, 185, 129, 0.1)",
                "surface-gloss": "rgba(255, 255, 255, 0.03)",
                "surface-gloss-hover": "rgba(255, 255, 255, 0.08)",
                "border-glass": "rgba(255, 255, 255, 0.1)",
                "border-gloss": "rgba(255, 255, 255, 0.1)",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"], // Updated from Shop All (was Lexend)
                "body": ["Manrope", "sans-serif"], // Updated from Shop All (was Noto Sans)
                "sans": ["Manrope", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem", // Updated from Shop All
                "lg": "0.5rem", // Updated from Shop All
                "xl": "0.75rem", // Updated from Shop All
                "2xl": "1rem", // Updated from Shop All
                "3xl": "3rem",
                "full": "9999px"
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glossy': '0 14px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
                'gloss-card': '0 20px 40px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                'subtle': '0 2px 10px rgba(0, 0, 0, 0.03)',
                'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
                'glow': '0 0 40px rgba(89, 0, 10, 0.3)',
                'gloss': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
                'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                'float': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            },
            backgroundImage: {
                'glossy-gradient': 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
                'glossy-dark': 'linear-gradient(135deg, #1a0809 0%, #000000 100%)',
                'confirmation-gradient': 'radial-gradient(circle at 50% -20%, #2e0005 0%, #1a0003 40%, #000000 100%)',
                'login-radial': 'radial-gradient(circle at 15% 50%, rgba(89, 0, 10, 0.15), transparent 40%), radial-gradient(circle at 85% 30%, rgba(60, 20, 20, 0.1), transparent 40%)',
                'gradient-mesh': 'radial-gradient(at 50% 0%, rgba(89, 0, 10, 0.25) 0px, transparent 70%), radial-gradient(at 100% 0%, rgba(0, 0, 0, 1) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(89, 0, 10, 0.15) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(20, 20, 20, 1) 0px, transparent 50%)',
                'contact-gradient': 'linear-gradient(to bottom, #1a0507, #050505, #000000)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                float: {
                    '0%': { transform: 'translate(0, 0)' },
                    '100%': { transform: 'translate(30px, 50px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            },
            animation: {
                shimmer: 'shimmer 2s infinite',
                float: 'float 10s infinite ease-in-out alternate',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
            }
        },
    },
    plugins: [],
}
