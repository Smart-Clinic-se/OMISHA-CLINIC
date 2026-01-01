import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

/**
 * Reusable Select Component with Portal & Smart Positioning
 * * Features:
 * - Portals the dropdown to document.body (avoids overflow issues)
 * - Auto-flips upwards if near the bottom of the screen
 * - Fully accessible (keyboard support)
 */
export default function Select({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select...",
    icon,
    className = "",
    name,
    required = false,
    disabled = false,
    size = "md", // "sm" | "md"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Store coordinates and placement (top/bottom)
    const [coords, setCoords] = useState({ left: 0, width: 0, top: null, bottom: null });

    const sizeClasses = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3"
    };

    // Calculate position with Smart Flip logic
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;

            // Logic: If less than 220px below (approx menu height) & more space above, FLIP UP
            const shouldFlip = spaceBelow < 220 && rect.top > spaceBelow;

            setCoords({
                left: rect.left,
                width: rect.width,
                // If flipping, anchor to bottom (distance from bottom of screen to top of input)
                bottom: shouldFlip ? (viewportHeight - rect.top + 6) : null,
                // If normal, anchor to top (distance from top of screen to bottom of input)
                top: shouldFlip ? null : (rect.bottom + 6)
            });
        }
    }, [isOpen]);

    // Close dropdown handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideContainer = containerRef.current && containerRef.current.contains(event.target);
            const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

            if (!clickedInsideContainer && !clickedInsideDropdown) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("resize", () => setIsOpen(false));
            window.addEventListener("scroll", () => setIsOpen(false), true);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", () => setIsOpen(false));
            window.removeEventListener("scroll", () => setIsOpen(false), true);
        };
    }, [isOpen]);

    const handleSelect = (option) => {
        if (disabled) return;

        const newValue = typeof option === 'object' ? option.value : option;

        // Mimic a native event for compatibility with existing handlers
        const syntheticEvent = {
            target: {
                name: name,
                value: newValue
            }
        };

        onChange(syntheticEvent);
        setIsOpen(false);
    };

    // Helper to get display label
    const getDisplayLabel = (val) => {
        if (!val) return "";
        const found = options.find(opt => (typeof opt === 'object' ? opt.value === val : opt === val));
        if (!found) return val; // Fallback
        return typeof found === 'object' ? found.label : found;
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const currentLabel = getDisplayLabel(value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    {label}
                </label>
            )}

            {/* Main Button */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={handleKeyDown}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full rounded-xl border-2 outline-none transition-all cursor-pointer flex items-center justify-between
                    ${sizeClasses[size] || sizeClasses.md}
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800'}
                    ${isOpen
                        ? 'ring-2 ring-indigo-500 border-transparent bg-white dark:bg-slate-800 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    <span className={`font-bold truncate ${!value ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {value ? currentLabel : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </div>

            {/* Hidden Native Input for Form Submission/Validation */}
            <select
                name={name}
                value={value || ""}
                onChange={() => { }}
                required={required}
                className="sr-only"
                tabIndex={-1}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt, idx) => {
                    const val = typeof opt === 'object' ? opt.value : opt;
                    const lbl = typeof opt === 'object' ? opt.label : opt;
                    return <option key={idx} value={val}>{lbl}</option>;
                })}
            </select>

            {/* Dropdown Menu Portal */}
            {isOpen && !disabled && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'fixed',
                        top: coords.top ?? 'auto',
                        bottom: coords.bottom ?? 'auto',
                        left: coords.left,
                        width: coords.width,
                        zIndex: 9999
                    }}
                    className={`
                        bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar 
                        ${coords.bottom ? 'animate-fade-in-up origin-bottom mb-1' : 'animate-fade-in-down origin-top mt-1'}
                    `}
                >
                    <div className="p-1" role="listbox">
                        {options.map((option, idx) => {
                            // Corrected variable usage here
                            const val = typeof option === 'object' ? option.value : option;
                            const lbl = typeof option === 'object' ? option.label : option;
                            const isSelected = value === val;

                            return (
                                <div
                                    key={idx}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        px-4 py-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors
                                        ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                    `}
                                >
                                    <span className="truncate">{lbl}</span>
                                    {isSelected && <Check className="w-4 h-4" />}
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-sm">No options</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}