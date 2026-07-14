import React from 'react';

/**
 * Textarea component
 * @param {string} label - label shown above
 * @param {string} error - error message shown below
 * @param {number} rows - number of visible text rows (default 4)
 * @param {string} value - controlled value
 * @param {function} onChange - change handler
 * @param {string} name - textarea name attribute
 * @param {string} placeholder - placeholder text
 * @param {string} className - additional Tailwind classes for the wrapper
 */

const Textarea = ({
  label,
  error,
  rows = 4,
  value,
  onChange,
  name,
  placeholder,
  className = '',
  id,
  ...rest
}) => {
  const textareaId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          'input w-full resize-y',
          error ? 'border-red-500 focus:ring-red-400' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${textareaId}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
