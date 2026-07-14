import React from 'react';

/**
 * Reusable Input component
 * @param {string} label - label text shown above the input
 * @param {string} error - error message shown below
 * @param {string} placeholder - input placeholder
 * @param {string} type - HTML input type
 * @param {string|number} value - controlled value
 * @param {function} onChange - change handler
 * @param {string} name - input name attribute
 * @param {string} className - additional Tailwind classes for the wrapper
 * @param {React.ReactNode} icon - optional lucide-react icon rendered on the left
 */

const Input = ({
  label,
  error,
  placeholder,
  type = 'text',
  value,
  onChange,
  name,
  className = '',
  icon: Icon,
  id,
  ...rest
}) => {
  const inputId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3 flex items-center text-gray-400 pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={[
            'input w-full',
            Icon ? 'pl-9' : '',
            error ? 'border-red-500 focus:ring-red-400' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
