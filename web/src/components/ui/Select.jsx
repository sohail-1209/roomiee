import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select dropdown component
 * @param {string} label - label shown above the select
 * @param {string} error - error message shown below
 * @param {Array<{value: string, label: string}>} options - dropdown options
 * @param {string} value - controlled selected value
 * @param {function} onChange - change handler
 * @param {string} name - select name attribute
 * @param {string} placeholder - default empty option label
 * @param {string} className - additional Tailwind classes for the wrapper
 */

const Select = ({
  label,
  error,
  options = [],
  value,
  onChange,
  name,
  placeholder = 'Select an option',
  className = '',
  id,
  ...rest
}) => {
  const selectId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          className={[
            'input w-full appearance-none pr-9',
            error ? 'border-red-500 focus:ring-red-400' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} />
        </span>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
