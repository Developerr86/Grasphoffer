import React from 'react';
import './Neo.css';

const NeoInput = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    name,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`neo-input-group ${className}`}>
            {label && (
                <label className="neo-input-label">
                    {label}
                </label>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`neo-input ${error ? 'neo-input-error' : ''}`}
                {...props}
            />
            {error && <span className="neo-input-error-text">{error}</span>}
        </div>
    );
};

export default NeoInput;
