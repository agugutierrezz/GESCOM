import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import CrearReserva from './pages/CrearReserva';
import ListarReserva from './pages/ListarReservas';
import ConsultarDisponibilidad from './pages/ConsultarDisponibilidad';
import ReservaDetalle from './pages/ReservaDetalle';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/reservas/create" element={<CrearReserva />} />
        <Route path="/reservas/view" element={<ListarReserva />} />
        <Route path="/reservas/consulta" element={<ConsultarDisponibilidad />} />
        <Route path="/reservas/:id" element={<ReservaDetalle />} />
      </Routes>
    </Router>
  );
}

export default App;

