import React from 'react';
import './Neo.css';

const NeoButton = ({
    children,
    variant = 'primary',
    size = 'medium',
    className = '',
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false
}) => {
    const variantClass = `neo-btn-${variant}`;
    const sizeClass = {
        small: 'neo-btn-sm',
        medium: 'neo-btn-md',
        large: 'neo-btn-lg'
    }[size];

    const widthClass = fullWidth ? 'neo-btn-full' : '';

    return (
        <button
            type={type}
            className={`neo-btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default NeoButton;
