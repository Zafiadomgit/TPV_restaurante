import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { guardarSesion, NOMBRE_ROL } from "../auth.js";

const RUTA_INICIAL = { caja: "/caja", cocina: "/cocina", panel: "/panel" };

export default function Login() {
  const [rol, setRol] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const elegirRol = (r) => {
    setRol(r);
    setPin("");
    setError("");
  };

  const pulsar = (digito) => {
    if (enviando) return;
    setError("");
    setPin((prev) => (prev.length >= 4 ? prev : prev + digito));
  };

  const borrar = () => {
    if (enviando) return;
    setError("");
    setPin((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!rol || pin.length !== 4) return;
    let cancelado = false;
    setEnviando(true);
    api
      .login(rol, pin)
      .then(({ token }) => {
        if (cancelado) return;
        guardarSesion(rol, token);
        const destino = location.state?.from || RUTA_INICIAL[rol];
        navigate(destino, { replace: true });
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e.message);
        setPin("");
      })
      .finally(() => {
        if (!cancelado) setEnviando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, rol]);

  if (!rol) {
    return (
      <div className="login-page">
        <h1>Acceso personal</h1>
        <p>Selecciona tu rol para continuar</p>
        <div className="login-roles">
          <button className="login-rol-btn" onClick={() => elegirRol("caja")}>
            Caja
          </button>
          <button className="login-rol-btn" onClick={() => elegirRol("cocina")}>
            Cocina
          </button>
          <button className="login-rol-btn" onClick={() => elegirRol("panel")}>
            Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <button className="login-volver" onClick={() => elegirRol(null)}>
        ◀ Cambiar rol
      </button>
      <h1>{NOMBRE_ROL[rol]}</h1>
      <p>Introduce el PIN</p>

      <div className="login-pin-display">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`login-pin-dot${pin.length > i ? " lleno" : ""}`} />
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="login-teclado">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => pulsar(d)} disabled={enviando}>
            {d}
          </button>
        ))}
        <button className="login-tecla-borrar" onClick={borrar} disabled={enviando}>
          ⌫
        </button>
        <button onClick={() => pulsar("0")} disabled={enviando}>
          0
        </button>
        <div />
      </div>
    </div>
  );
}
