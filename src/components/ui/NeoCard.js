import React from 'react';
import './Neo.css';

const NeoCard = ({
    children,
    className = '',
    padding = 'medium',
    hoverEffect = false
}) => {
    const paddingClass = {
        none: 'neo-card-p-none',
        small: 'neo-card-p-sm',
        medium: 'neo-card-p-md',
        large: 'neo-card-p-lg'
    }[padding];

    const hoverClass = hoverEffect ? 'neo-card-hover' : '';

    return (
        <div className={`neo-card ${paddingClass} ${hoverClass} ${className}`}>
            {children}
        </div>
    );
};

export default NeoCard;
