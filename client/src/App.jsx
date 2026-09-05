import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import Order from "./pages/Order.jsx";
import Checkout from "./pages/Checkout.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Historial from "./pages/Historial.jsx";
import Caja from "./pages/Caja.jsx";
import Panel from "./pages/Panel.jsx";
import Recogida from "./pages/Recogida.jsx";
import GestionMenu from "./pages/GestionMenu.jsx";
import Login from "./pages/Login.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";
import { getSesion, cerrarSesion, onSesionCambio, NOMBRE_ROL } from "./auth.js";

export default function App() {
  const [sesion, setSesion] = useState(getSesion());
  const navigate = useNavigate();

  useEffect(() => onSesionCambio(() => setSesion(getSesion())), []);

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/brand/svg/logo-monocromo-blanco.svg" alt="California" className="brand-logo" />
        </div>
        <div className="topbar-derecha">
        <nav>
          {(!sesion || sesion.rol === "caja") && (
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              Pedidos
            </NavLink>
          )}
          {(sesion?.rol === "caja" || sesion?.rol === "cocina") && (
            <NavLink to="/cocina" className={({ isActive }) => (isActive ? "active" : "")}>
              Cocina
            </NavLink>
          )}
          {sesion?.rol === "caja" && (
            <NavLink to="/historial" className={({ isActive }) => (isActive ? "active" : "")}>
              Historial
            </NavLink>
          )}
          {sesion?.rol === "caja" && (
            <NavLink to="/caja" className={({ isActive }) => (isActive ? "active" : "")}>
              Caja
            </NavLink>
          )}
          {sesion?.rol === "caja" && (
            <NavLink to="/carta" className={({ isActive }) => (isActive ? "active" : "")}>
              Carta
            </NavLink>
          )}
          {sesion?.rol === "panel" && (
            <NavLink to="/panel" className={({ isActive }) => (isActive ? "active" : "")}>
              Panel
            </NavLink>
          )}
          {(sesion?.rol === "caja" || sesion?.rol === "cocina") && (
            <NavLink to="/recogida" className={({ isActive }) => (isActive ? "active" : "")}>
              Recogida
            </NavLink>
          )}
        </nav>
        <div className="topbar-sesion">
          {sesion ? (
            <button className="btn-salir" onClick={salir}>
              {NOMBRE_ROL[sesion.rol]} · Salir
            </button>
          ) : (
            <NavLink to="/login" className="btn-acceso">
              Acceso personal
            </NavLink>
          )}
        </div>
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Order />} />
          <Route path="/pago/:orderId" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/cocina"
            element={
              <RutaProtegida roles={["cocina", "caja"]}>
                <Kitchen />
              </RutaProtegida>
            }
          />
          <Route
            path="/historial"
            element={
              <RutaProtegida roles={["caja"]}>
                <Historial />
              </RutaProtegida>
            }
          />
          <Route
            path="/caja"
            element={
              <RutaProtegida roles={["caja"]}>
                <Caja />
              </RutaProtegida>
            }
          />
          <Route
            path="/carta"
            element={
              <RutaProtegida roles={["caja"]}>
                <GestionMenu />
              </RutaProtegida>
            }
          />
          <Route
            path="/panel"
            element={
              <RutaProtegida roles={["panel"]}>
                <Panel />
              </RutaProtegida>
            }
          />
          {/* Pública a propósito: es un tablero para un monitor de cara
              al cliente que nadie atiende, no puede depender de un login
              que expire — ver GET /api/orders para la vista reducida
              que recibe sin sesión. */}
          <Route path="/recogida" element={<Recogida />} />
        </Routes>
      </main>
    </div>
  );
}
