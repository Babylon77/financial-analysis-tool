import React, { useState, useEffect } from 'react';
import { formatNumberInput, parseNumberInput } from '../utils/formatters';

const MoneyInput = ({
  name,
  id,
  value,
  onChange,
  placeholder = "0",
  required = false,
  className = "focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md",
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Update display value when prop value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumberInput(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      onChange({
        target: {
          name,
          value: ''
        }
      });
      return;
    }

    // Remove any non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Don't allow input if it's not a valid number
    if (cleanValue === '') return;

    // Format for display
    const formatted = formatNumberInput(cleanValue);
    setDisplayValue(formatted);

    // Send clean numeric value to parent
    onChange({
      target: {
        name,
        value: cleanValue
      }
    });
  };

  return (
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">$</span>
      </div>
      <input
        type="text"
        name={name}
        id={id}
        value={displayValue}
        onChange={handleInputChange}
        required={required}
        className={className}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default MoneyInput; 