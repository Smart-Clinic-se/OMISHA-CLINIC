import { useEffect, useRef } from 'react';

/**
 * Hook to navigate form fields using the Enter key.
 * 
 * @param {Object} options Configuration options
 * @param {boolean} options.enable - Whether to enable the behavior (default: true)
 * @param {string} options.selector - CSS selector for focusable elements (default: 'input, select, textarea')
 * @returns {Object} ref - The ref to attach to the container (form or div)
 */
export const useEnterNavigation = ({ enable = true, selector = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled])' } = {}) => {
    const formRef = useRef(null);

    useEffect(() => {
        if (!enable) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                // Allow default behavior for textareas if Shift is pressed (new line)
                if (e.target.tagName === 'TEXTAREA' && !e.shiftKey) {
                    // If just Enter in textarea, we might want to let it add a newline? 
                    // Or navigate? Usually Enter in textarea adds newline.
                    // Let's assume Enter navigates, Shift+Enter adds newline for consistency with user request "go to next field".
                    // But standard textarea behavior is newline.
                    // Let's check if the user wants to override textarea behavior. 
                    // "if i fill some field and press enter it should go to next field"
                    // I'll assume navigation for now, but respect Shift+Enter for newline.
                } else if (e.target.tagName === 'TEXTAREA' && e.shiftKey) {
                    return; // Allow newline
                }

                // If the target is a button, allow default behavior (click)
                if (e.target.tagName === 'BUTTON') {
                    return;
                }

                // Prevent default submission
                e.preventDefault();

                const container = formRef.current;
                if (!container) return;

                // Get all focusable elements
                const elements = Array.from(container.querySelectorAll(selector));

                // Filter out hidden or invisible elements just in case
                const focusableElements = elements.filter(el => {
                    return el.offsetParent !== null && !el.disabled && el.tabIndex !== -1;
                });

                const index = focusableElements.indexOf(e.target);

                if (index > -1 && index < focusableElements.length - 1) {
                    // Focus next element
                    focusableElements[index + 1].focus();
                } else {
                    // If it's the last element, we might want to submit?
                    // Or just blur?
                    // For now, let's try to find a submit button and click it?
                    // Or just do nothing.
                    // User said "go to next field".
                    // If last field, maybe focus the submit button?
                    const submitBtn = container.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.focus();
                        // Optional: submitBtn.click();
                    }
                }
            }
        };

        const container = formRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (container) {
                container.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [enable, selector]);

    return formRef;
};
