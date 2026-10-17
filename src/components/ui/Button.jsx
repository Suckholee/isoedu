import React from 'react';

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={`iso-button iso-button--${variant} ${className}`} {...props} />;
}
