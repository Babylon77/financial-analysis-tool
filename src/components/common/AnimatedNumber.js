import React, { useState, useEffect, useRef } from 'react';

const AnimatedNumber = ({
  value,
  format = 'currency',
  duration = 600,
  className = '',
  colorBySign = true,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const animationRef = useRef(null);

  useEffect(() => {
    if (prevValue.current === value) return;

    const startValue = prevValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    prevValue.current = value;

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration]);

  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === 'percent') {
      return `${val.toFixed(1)}%`;
    }
    if (format === 'number') {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
    }
    return val.toString();
  };

  const colorClass = colorBySign
    ? value > 0
      ? 'text-terminal-green'
      : value < 0
        ? 'text-terminal-red'
        : 'text-terminal-amber'
    : '';

  return (
    <span className={`data-cell ${colorClass} ${className}`}>
      {formatValue(displayValue)}
    </span>
  );
};

export default AnimatedNumber;
