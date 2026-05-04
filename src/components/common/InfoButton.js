import React, { useState, useRef, useEffect } from 'react';

export default function InfoButton({ text, wide }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block ml-1 align-middle">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-terminal-cyan/50 text-terminal-cyan text-[9px] font-mono leading-none hover:bg-terminal-cyan/10 hover:border-terminal-cyan transition-colors cursor-pointer"
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <div className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 ${wide ? 'w-80' : 'w-64'} p-3 rounded border border-terminal-cyan/30 bg-[#0d1117] shadow-lg shadow-terminal-cyan/5`}>
          <p className="text-txt-secondary text-[11px] font-mono leading-relaxed whitespace-normal">
            {text}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-terminal-cyan/30" />
        </div>
      )}
    </span>
  );
}
