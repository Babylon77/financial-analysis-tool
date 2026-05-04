import React, { useState, useEffect } from 'react';
import { formatNumberInput } from '../utils/formatters';

const MoneyInput = ({
  name,
  id,
  value,
  onChange,
  onValueChange,
  placeholder = "0",
  required = false,
  showPrefix = true,
  className = "terminal-input w-full",
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumberInput(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;

    if (inputValue === '') {
      setDisplayValue('');
      if (onValueChange) onValueChange(0);
      else if (onChange) onChange({ target: { name, value: '' } });
      return;
    }

    const cleanValue = inputValue.replace(/[^\d]/g, '');
    if (cleanValue === '') return;

    const formatted = formatNumberInput(cleanValue);
    setDisplayValue(formatted);

    if (onValueChange) onValueChange(parseFloat(cleanValue) || 0);
    else if (onChange) onChange({ target: { name, value: cleanValue } });
  };

  const inputEl = (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      id={id}
      value={displayValue}
      onChange={handleInputChange}
      required={required}
      className={`${className}${showPrefix ? ' pl-7' : ''}`}
      placeholder={placeholder}
      {...props}
    />
  );

  if (!showPrefix) return inputEl;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted">$</span>
      {inputEl}
    </div>
  );
};

export default MoneyInput; 