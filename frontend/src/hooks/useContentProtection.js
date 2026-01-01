import { useEffect } from 'react';

/**
 * Custom hook to prevent casual content extraction.
 * Intercepts common browser shortcuts for saving, printing, and developer tools.
 * Disables the right-click context menu.
 */
const useContentProtection = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl (Windows/Linux) or Meta (Mac)
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Block Save: Ctrl+S / Cmd+S
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }

      // Block Print: Ctrl+P / Cmd+P
      if (isCmdOrCtrl && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        return false;
      }

      // Block View Source: Ctrl+U / Cmd+U
      if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Deter Developer Tools: F12 or Ctrl+Shift+I / Cmd+Opt+I
      if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && (e.key === 'i' || e.key === 'I'))) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};

export default useContentProtection;
