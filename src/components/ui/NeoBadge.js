import React from 'react';
import './Neo.css';

const NeoBadge = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variantClass = `neo-badge-${variant}`;

    return (
        <span className={`neo-badge ${variantClass} ${className}`}>
            {children}
        </span>
    );
};

export default NeoBadge;
