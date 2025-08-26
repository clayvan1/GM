import React, { createContext, useContext, useState } from 'react';

const StateContext = createContext();

const initialState = {
  chat: false,
  cart: false,
  userProfile: false,
  notification: false,
};

export const ContextProvider = ({ children }) => {
  const [screenSize, setScreenSize] = useState(undefined);
  const [currentColor, setCurrentColor] = useState('#03C9D7');
  const [currentMode, setCurrentMode] = useState('Light');
  const [themeSettings, setThemeSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState(true);
  const [isClicked, setIsClicked] = useState(initialState);

  // Corrected userRole initialization with explicit "undefined" string check
  const [userRole, setUserRole] = useState(() => {
    const storedUser = localStorage.getItem('user'); // Line 24

    // Check if storedUser exists, is not an empty string, AND is not the literal string "undefined"
    if (storedUser && storedUser !== '' && storedUser !== 'undefined') { // Line 25
      try {
        const parsedUser = JSON.parse(storedUser); // Line 26
        return parsedUser.role || null;
      } catch (e) {
        console.error("Failed to parse 'user' from localStorage:", e); // Line 29
        // IMPORTANT: If you encounter this, it means the stored data is corrupted.
        // It's often a good idea to clear the corrupted item from localStorage
        // to prevent this error on subsequent loads.
        localStorage.removeItem('user');
        return null;
      }
    }
    // If storedUser is null, an empty string, or the string "undefined", return null
    return null;
  });

  const setMode = (e) => {
    setCurrentMode(e.target.value);
    localStorage.setItem('themeMode', e.target.value);
  };

  const setColor = (color) => {
    setCurrentColor(color);
    localStorage.setItem('colorMode', color);
  };

  const handleClick = (clicked) => setIsClicked({ ...initialState, [clicked]: true });

  return (
    <StateContext.Provider
      value={{
        currentColor,
        currentMode,
        activeMenu,
        screenSize,
        setScreenSize,
        handleClick,
        isClicked,
        initialState,
        setIsClicked,
        setActiveMenu,
        setCurrentColor,
        setCurrentMode,
        setMode,
        setColor,
        themeSettings,
        setThemeSettings,
        userRole,
        setUserRole,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStateContext = () => useContext(StateContext);