import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  // On mobile, sidebar starts closed; on desktop, it starts open
  // Use a media query to avoid forced reflow during initialization
  const [isOpen, setIsOpen] = useState(() => {
    // Use matchMedia to avoid forced reflow - this is more performant
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(min-width: 768px)').matches;
    }
    // Fallback: assume desktop if matchMedia not available
    return true;
  });

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Close sidebar when clicking outside on mobile
  // Use matchMedia listener to avoid forced reflows
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    
    // Handler function that doesn't cause reflow
    const handleMediaChange = (e) => {
      setIsOpen(e.matches);
    };

    // Modern browsers support addEventListener on MediaQueryList
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
