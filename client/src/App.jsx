import { NavLink, Route, Routes } from "react-router-dom";
import Order from "./pages/Order.jsx";
import Checkout from "./pages/Checkout.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Historial from "./pages/Historial.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🍽️ TPV Restaurante</div>
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
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Order />} />
          <Route path="/pago/:orderId" element={<Checkout />} />
          <Route path="/cocina" element={<Kitchen />} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </main>
    </div>
  );
}
