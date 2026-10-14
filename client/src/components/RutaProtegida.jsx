import { Navigate, useLocation } from "react-router-dom";
import { getSesion } from "../auth.js";

// `sinSedeFija`: la ruta exige una sesión sin límite de sede (la carta,
// que es común a las dos sedes, solo la gestiona el panel principal).
export default function RutaProtegida({ roles, sinSedeFija = false, children }) {
  const sesion = getSesion();
  const location = useLocation();

  if (!sesion || !roles.includes(sesion.rol) || (sinSedeFija && sesion.sede)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
