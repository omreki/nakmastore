export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "var(--color-primary)",
                "primary-hover": "var(--color-primary-hover)",
                "primary-light": "var(--color-primary-light)",
                "primary-dark": "var(--color-primary-dark)",
                "primary-bright": "var(--color-primary-bright)",
                "primary-accent": "var(--color-primary-accent)",
                "accent": "var(--color-accent)",
                "secondary": "var(--color-secondary)",
                "background-light": "var(--color-background-light)",
                "background-dark": "var(--color-background-dark)",
                "navbar-bg": "var(--color-navbar-bg)",
                "navbar-text": "var(--color-navbar-text)",
                "card-dark": "rgba(0, 0, 0, 0.6)",
                "text-main": "var(--color-text-main)",
                "text-muted": "var(--color-text-muted)",
                "surface": "#ffffff",
                "surface-dark": "#000000",
                "surface-highlight": "#0a0a0a",
                "surface-solid": "#ffffff",
                "surface-white": "#ffffff",
                "surface-light": "rgba(255, 255, 255, 0.6)",
                "surface-hover": "rgba(0, 0, 0, 0.1)",
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
                'glossy-dark': 'linear-gradient(135deg, #30136a 0%, #1e0c42 100%)',
                'confirmation-gradient': 'radial-gradient(circle at 50% -20%, #b82063 0%, #30136a 40%, #1e0c42 100%)',
                'login-radial': 'radial-gradient(circle at 15% 50%, rgba(184, 32, 99, 0.15), transparent 40%), radial-gradient(circle at 85% 30%, rgba(216, 105, 40, 0.1), transparent 40%)',
                'gradient-mesh': 'radial-gradient(at 50% 0%, rgba(184, 32, 99, 0.25) 0px, transparent 70%), radial-gradient(at 100% 0%, rgba(48, 19, 106, 1) 0px, transparent 50%), radial-gradient(at 90% 90%, rgba(216, 105, 40, 0.15) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(30, 13, 106, 1) 0px, transparent 50%)',
                'contact-gradient': 'linear-gradient(to bottom, #30136a, #1e0c42, #000000)',
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
