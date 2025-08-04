import { createContext, useEffect, useState } from 'react';

export const CabanasContext = createContext([]);

export function CabanasProvider({ children }) {
  const [cabanas, setCabanas] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/cabanas`)
      .then(res => res.json())
      .then(setCabanas);
  }, []);

  return (
    <CabanasContext.Provider value={cabanas}>
      {children}
    </CabanasContext.Provider>
  );
}
