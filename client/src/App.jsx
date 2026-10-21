import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import { getSede, SEDES } from "./sede.js";

// Opción del menú del personal. Es un <button> y no un enlace <a> a
// propósito: en el TPV táctil, ciertos gestos (mantener pulsado, el "clic
// central" de algunos drivers táctiles, Ctrl) abrían Caja/Panel/Recogida
// en pestañas o ventanas nuevas y se acumulaban pantallas. Un botón
// siempre navega dentro de la misma ventana.
function BotonNav({ to, end = false, className = "", children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activo = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <button
      type="button"
      className={`nav-boton ${activo ? "active" : ""} ${className}`.trim()}
      aria-current={activo ? "page" : undefined}
      onClick={() => {
        if (pathname !== to) navigate(to);
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(getSesion());
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Kiosco y monitor de recogida: pantallas de cliente a pantalla
  // completa (tema oscuro, ver "Kiosco" en styles.css). Sin sesión no se
  // muestra la barra del personal — el cliente no debe ver "Acceso
  // personal" ni la nav; el personal entra desde el enlace discreto de
  // la bienvenida o directamente en /login. Con sesión (caja usando el
  // kiosco) la barra se queda para poder navegar.
  const pantallaCliente = pathname === "/" || pathname === "/recogida";
  // La pantalla del ticket al terminar el pedido (/pago/:id) también es
  // del cliente: sin sesión no lleva barra (a petición del dueño, el
  // cliente no debe ver "Acceso personal"). No se le pone app-kiosco
  // porque tiene su propio diseño claro.
  const pantallaPago = pathname.startsWith("/pago/");
  const mostrarTopbar = !(pantallaCliente || pantallaPago) || !!sesion;

  useEffect(() => onSesionCambio(() => setSesion(getSesion())), []);

  const salir = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <div className={`app ${pantallaCliente ? "app-kiosco" : ""} ${pathname === "/recogida" ? "app-recogida" : ""} ${pathname === "/cocina" ? "app-cocina" : ""}`}>
      {mostrarTopbar && (
        <header className="topbar">
          <div className="brand">
            <img src="/brand/svg/logo-monocromo-blanco.svg" alt="California" className="brand-logo" />
          </div>
          <div className="topbar-derecha">
          <nav>
            {(!sesion || sesion.rol === "caja") && (
              <BotonNav to="/" end>
                Pedidos
              </BotonNav>
          )}
          {(sesion?.rol === "caja" || sesion?.rol === "cocina") && (
            <BotonNav to="/cocina">
              Cocina
            </BotonNav>
          )}
          {sesion?.rol === "caja" && (
            <BotonNav to="/historial">
              Historial
            </BotonNav>
          )}
          {sesion?.rol === "caja" && (
            <BotonNav to="/caja">
              Caja
            </BotonNav>
          )}
          {sesion?.rol === "panel" && (
            <BotonNav to="/panel">
              Panel
            </BotonNav>
          )}
          {/* La carta es la misma para las dos sedes: solo el panel
              principal (sin sede fija) la gestiona. */}
          {sesion?.rol === "panel" && !sesion.sede && (
            <BotonNav to="/carta">
              Carta
            </BotonNav>
          )}
          {(sesion?.rol === "caja" || sesion?.rol === "cocina") && (
            <BotonNav to="/recogida">
              Recogida
            </BotonNav>
          )}
        </nav>
        <div className="topbar-sesion">
          {sesion ? (
            <>
              {/* Sede del DISPOSITIVO (ver sede.js), no de la sesión — solo
                  tiene sentido para caja/cocina, que están atadas a un
                  local físico; el panel ve las dos sedes desde cualquier
                  sitio. */}
              {(sesion.rol === "caja" || sesion.rol === "cocina") && getSede() && (
                <span className="topbar-sede">{SEDES[getSede()].nombre}</span>
              )}
              {sesion.rol === "panel" && sesion.sede && SEDES[sesion.sede] && (
                <span className="topbar-sede">{SEDES[sesion.sede].nombre}</span>
              )}
              <button className="btn-salir" onClick={salir}>
                {NOMBRE_ROL[sesion.rol]} · Salir
              </button>
            </>
          ) : (
            <BotonNav to="/login" className="btn-acceso">
              Acceso personal
            </BotonNav>
          )}
        </div>
        </div>
      </header>
      )}
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
              <RutaProtegida roles={["panel"]} sinSedeFija>
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
