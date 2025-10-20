import './Input.css';

export default function Input({
  label,
  type = 'text',
  name,
  placeholder,
  leftIcon,
  rightIcon,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  ...props
}) {
  const inputClass = error ? 'input input-error' : 'input';

  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      {leftIcon || rightIcon ? (
        <div className={error ? 'input-icon-wrapper input-error' : 'input-icon-wrapper'}>
          {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
          <input
            id={name}
            type={type}
            name={name}
            placeholder={placeholder}
            className="input-with-icon"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            required={required}
            {...props}
          />
          {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
        </div>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          className={inputClass}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          required={required}
          {...props}
        />
      )}
      
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
