import { NavLink, Route, Routes } from "react-router-dom";
import Order from "./pages/Order.jsx";
import Checkout from "./pages/Checkout.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Historial from "./pages/Historial.jsx";
import Caja from "./pages/Caja.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🥙 TPV Kebab House</div>
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
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Order />} />
          <Route path="/pago/:orderId" element={<Checkout />} />
          <Route path="/cocina" element={<Kitchen />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/caja" element={<Caja />} />
        </Routes>
      </main>
    </div>
  );
}
