import { createContext, useEffect, useState } from 'react';

export const CabanasContext = createContext([]);

export function CabanasProvider({ children }) {
  const [cabanas, setCabanas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/cabanas')
      .then(res => res.json())
      .then(setCabanas);
  }, []);

  return (
    <CabanasContext.Provider value={cabanas}>
      {children}
    </CabanasContext.Provider>
  );
}
