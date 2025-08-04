import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CabanasProvider } from './context/CabanasContext';
import { HashRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <CabanasProvider>
      <App />
  </CabanasProvider>
);
