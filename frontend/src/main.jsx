import ReactDOM from 'react-dom/client';
import App from './App';
import { CabanasProvider } from './context/CabanasContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <CabanasProvider>
      <App />
  </CabanasProvider>
);
