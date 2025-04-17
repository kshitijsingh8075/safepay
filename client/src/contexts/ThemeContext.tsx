import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define the type for the theme context value
export type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

// Create the theme context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Props type for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component that will wrap the app
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // State to track current theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Effect to initialize theme from localStorage or system preference
  useEffect(() => {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || savedTheme === 'light') {
      // Use saved theme if available
      setTheme(savedTheme);
    } else {
      // Otherwise check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Effect to apply theme class to html element and save to localStorage
  useEffect(() => {
    // Get the HTML element
    const root = document.documentElement;
    
    // Apply or remove the dark class based on current theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Provide the theme context to children components
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};