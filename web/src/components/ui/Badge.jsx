import React from 'react';

/**
 * Badge component
 * @param {string} variant - primary | success | danger | warning | gray
 * @param {React.ReactNode} children - badge content
 * @param {string} className - additional Tailwind classes
 */

const variantClasses = {
  primary: 'badge-primary',
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  gray: 'badge-gray',
};

const Badge = ({ variant = 'gray', children, className = '' }) => {
  return (
    <span
      className={[
        'badge',
        variantClasses[variant] ?? variantClasses.gray,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
};

export default Badge;
