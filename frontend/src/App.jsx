import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { CabanasProvider } from './context/CabanasContext';
import { PrefsProvider } from './context/PrefsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import CrearReserva from './pages/CrearReserva';
import ListarReserva from './pages/ListarReservas';
import ConsultarDisponibilidad from './pages/ConsultarDisponibilidad';
import ReservaDetalle from './pages/ReservaDetalle';
import Preferencias from './pages/Preferencias';
import GestionarCabanas from './pages/GestionarCabanas';
import AdminRoute from './components/AdminRoute';
import AdminUsuarios from './pages/AdminUsuarios';
import AdminCabanas from './pages/AdminCabanas';

function PrivateLayout() {
  return (
    <CabanasProvider>
      <PrefsProvider>
        <Outlet />
      </PrefsProvider>
    </CabanasProvider>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute><PrivateLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home/>} />
          <Route path="/reservas/create" element={<CrearReserva/>}/>
          <Route path="/reservas/view" element={ <ListarReserva/>}/>
          <Route path="/reservas/consulta" element={<ConsultarDisponibilidad/>}/>
          <Route path="/reservas/:id" element={<ReservaDetalle/> }/>
          <Route path="/preferencias" element={<Preferencias/>}/>
          <Route path="/cabanas" element={<GestionarCabanas/>}/>
          <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios/></AdminRoute>}/>
          <Route path="/admin/cabanas" element={<AdminRoute><AdminCabanas/></AdminRoute>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

