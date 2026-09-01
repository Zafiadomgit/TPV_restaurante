import { Navigate, useLocation } from "react-router-dom";
import { getSesion } from "../auth.js";

export default function RutaProtegida({ roles, children }) {
  const sesion = getSesion();
  const location = useLocation();

  if (!sesion || !roles.includes(sesion.rol)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
