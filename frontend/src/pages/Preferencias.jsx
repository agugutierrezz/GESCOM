import { useTheme } from "../context/ThemeContext";
import { usePrefs } from "../context/PrefsContext";
import { toast, ToastContainer } from "react-toastify";
import BotonVolver from "../components/BotonVolver";
import "react-toastify/dist/ReactToastify.css";
import "../styles/pages/prefs.css";

export default function Preferencias() {
  const { theme, setTheme } = useTheme();
  const {
    fijoIngreso, fijoEgreso, horaIngreso, horaEgreso,
    setFijoIngreso, setFijoEgreso, setHoraIngreso, setHoraEgreso
  } = usePrefs();

  const guardar = () => {
    toast.success("Preferencias guardadas");
  };

  return (
    <div className="prefs__wrap">
      <div className="prefs__back"><BotonVolver/></div>
      <h2 className="prefs__title">Preferencias</h2>

      <div className="card prefs__card">

        {/* Modo oscuro */}
        <div className="prefs__row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={e => setTheme(e.target.checked ? "dark" : "light")}
            />
            <span className="toggle__slider" />
            <span>Modo oscuro</span>
          </label>
        </div>

        <hr className="prefs__sep" />

        {/* Ingreso fijo */}
        <div className="prefs__row prefs__row--2">
          <label className="toggle">
            <input
              type="checkbox"
              checked={fijoIngreso}
              onChange={e => setFijoIngreso(e.target.checked)}
            />
            <span className="toggle__slider" />
            <span>Horario de Ingreso Fijo</span>
          </label>
          <input
            type="time"
            className="input"
            step="60"
            value={horaIngreso}
            onChange={e => setHoraIngreso(e.target.value)}
            disabled={!fijoIngreso}
          />
        </div>

        {/* Egreso fijo */}
        <div className="prefs__row prefs__row--2">
          <label className="toggle">
            <input
              type="checkbox"
              checked={fijoEgreso}
              onChange={e => setFijoEgreso(e.target.checked)}
            />
            <span className="toggle__slider" />
            <span>Horario de Egreso Fijo</span>
          </label>
          <input
            type="time"
            className="input"
            step="60"
            value={horaEgreso}
            onChange={e => setHoraEgreso(e.target.value)}
            disabled={!fijoEgreso}
          />
        </div>

        <div className="prefs__actions">
          <button className="btn btn--primary" onClick={guardar}>Guardar</button>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={1800}/>
    </div>
  );
}
