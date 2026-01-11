import React from 'react';

const AddToBagButton = ({ settings, onClick, disabled, loading, price }) => {
    const s = settings.addToCart || {};
    const styles = s.styling || {};
    const isSticky = s.position === 'sticky-bottom'; // Mobile only usually, but handled by parent layout or media query

    // Dynamic Styles for the button itself
    const buttonStyles = {
        width: s.width === 'auto' ? 'auto' : s.width || '100%',
        height: s.height ? `${s.height}px` : '48px',
        marginTop: s.marginTop ? `${s.marginTop}px` : '0px',
        marginBottom: s.marginBottom ? `${s.marginBottom}px` : '0px',
        paddingTop: s.paddingVertical ? `${s.paddingVertical}px` : '12px',
        paddingBottom: s.paddingVertical ? `${s.paddingVertical}px` : '12px',
        paddingLeft: s.paddingHorizontal ? `${s.paddingHorizontal}px` : '24px',
        paddingRight: s.paddingHorizontal ? `${s.paddingHorizontal}px` : '24px',
        backgroundColor: disabled ? '#333' : styles.background,
        color: disabled ? '#666' : styles.text,
        borderWidth: s.borderWidth ? `${s.borderWidth}px` : '0px',
        borderStyle: 'solid',
        borderColor: styles.border || styles.text,
        borderRadius: s.borderRadius ? `${s.borderRadius}px` : '0px',
        fontSize: styles.fontSize ? `${styles.fontSize}px` : '14px',
        fontWeight: styles.fontWeight || 600,
        textTransform: styles.textTransform || 'uppercase',
        letterSpacing: styles.letterSpacing ? `${styles.letterSpacing}px` : 'normal',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };

    // Hover state management would require state or CSS-in-JS. 
    // Since we are using inline styles for dynamic admin config, we can use a wrapper or simple state.
    // simpler: use a ref or state for hover.
    const [isHovered, setIsHovered] = React.useState(false);

    const currentStyle = {
        ...buttonStyles,
        backgroundColor: isHovered && !disabled ? (styles.hoverBackground || styles.background) : buttonStyles.backgroundColor,
        color: isHovered && !disabled ? (styles.hoverText || styles.text) : buttonStyles.color,
        borderColor: isHovered && !disabled ? (styles.hoverBorder || styles.border || styles.text) : buttonStyles.borderColor,
        transform: isHovered && !disabled && s.styling.hoverEffect === 'lift' ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered && !disabled && s.styling.hoverEffect === 'glow' ? `0 0 15px ${styles.background}` : 'none'
    };

    // Alignment wrapper
    const containerClasses = {
        left: 'flex justify-start',
        center: 'flex justify-center',
        right: 'flex justify-end',
        stretch: 'flex', // default width 100% handles this
    }[s.alignment] || 'flex';

    if (loading) {
        return (
            <div className={containerClasses}>
                <button style={currentStyle} disabled>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                </button>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <button
                onClick={onClick}
                disabled={disabled}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={currentStyle}
            >
                {/* Icon */}
                {s.showIcon && s.iconPosition === 'left' && (
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2em' }}>shopping_cart</span>
                )}

                {/* Text */}
                <span>{s.customText || 'Add to Bag'}</span>

                {/* Price if requested (optional feature) */}
                {s.showPrice && <span className="opacity-70 ml-1"> - ${price}</span>}

                {/* Icon Right */}
                {s.showIcon && s.iconPosition === 'right' && (
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2em' }}>shopping_cart</span>
                )}
            </button>
        </div>
    );
};

export default AddToBagButton;
