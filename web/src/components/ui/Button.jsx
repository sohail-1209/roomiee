import React from 'react';
import Spinner from './Spinner';

/**
 * Reusable Button component
 * @param {string} variant - primary | secondary | outline | danger | ghost
 * @param {string} size - sm | md | lg | xl
 * @param {boolean} loading - shows spinner and disables interaction
 * @param {boolean} disabled - disables the button
 * @param {function} onClick - click handler
 * @param {React.ReactNode} children - button content
 * @param {string} type - button | submit | reset
 * @param {string} className - additional Tailwind classes
 */

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const sizeClasses = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-lg px-8 py-4 text-base',
};

const spinnerSizeMap = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'md',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  type = 'button',
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'btn',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        isDisabled ? 'opacity-60 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && (
        <Spinner
          size={spinnerSizeMap[size] ?? 'sm'}
          className="mr-2 shrink-0"
        />
      )}
      {children}
    </button>
  );
};

export default Button;
