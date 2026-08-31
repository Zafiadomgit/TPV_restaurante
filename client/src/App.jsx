import { NavLink, Route, Routes } from "react-router-dom";
import Order from "./pages/Order.jsx";
import Checkout from "./pages/Checkout.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Historial from "./pages/Historial.jsx";
import Caja from "./pages/Caja.jsx";
import Panel from "./pages/Panel.jsx";
import Recogida from "./pages/Recogida.jsx";
import GestionMenu from "./pages/GestionMenu.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🥙 TPV California</div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Pedidos
          </NavLink>
          <NavLink to="/cocina" className={({ isActive }) => (isActive ? "active" : "")}>
            Cocina
          </NavLink>
          <NavLink to="/historial" className={({ isActive }) => (isActive ? "active" : "")}>
            Historial
          </NavLink>
          <NavLink to="/caja" className={({ isActive }) => (isActive ? "active" : "")}>
            Caja
          </NavLink>
          <NavLink to="/carta" className={({ isActive }) => (isActive ? "active" : "")}>
            Carta
          </NavLink>
          <NavLink to="/panel" className={({ isActive }) => (isActive ? "active" : "")}>
            Panel
          </NavLink>
          <NavLink to="/recogida" className={({ isActive }) => (isActive ? "active" : "")}>
            Recogida
          </NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Order />} />
          <Route path="/pago/:orderId" element={<Checkout />} />
          <Route path="/cocina" element={<Kitchen />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/carta" element={<GestionMenu />} />
          <Route path="/panel" element={<Panel />} />
          <Route path="/recogida" element={<Recogida />} />
        </Routes>
      </main>
    </div>
  );
}
