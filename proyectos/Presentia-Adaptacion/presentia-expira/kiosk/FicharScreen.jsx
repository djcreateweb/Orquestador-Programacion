// FicharScreen.jsx — Pantalla de fichaje del kiosko (§ diseño).
// Flujo: elegir empleado → introducir PIN (POST entrar) → token en estado de React
// (memoria, NO localStorage) → panel con avatar / "Hola {nombre}" / reloj en vivo /
// estado / botón único enorme (ENTRADA verde / SALIDA rojo) → fichar.
// El token caduca en ~90 s; si POST fichar devuelve 401 SESION_KIOSKO se vuelve a
// pedir el PIN. Antirrebote: el botón se deshabilita mientras hay petición en curso.
// Si el servidor no responde, se muestra un error amable y se puede reintentar.
import React, { useState, useEffect, useCallback, useRef } from "react";
import { fmtReloj, fmtFechaLarga, fmtHora, iniciales } from "./api.js";
import AvisoTratamiento from "./AvisoTratamiento.jsx";
import MisRegistros from "./MisRegistros.jsx";
import InfoLegal from "./InfoLegal.jsx";
import AceptacionTerminos from "../shared/AceptacionTerminos.jsx";
import "./kiosk.css";

const TZ = "Europe/Madrid";

/** Reloj en vivo aislado: 1 tick/segundo, se limpia al desmontar. */
function Reloj() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <div className="pk-reloj">{fmtReloj(ahora, TZ)}</div>
      <div className="pk-fecha">{fmtFechaLarga(ahora, TZ)}</div>
    </div>
  );
}

function Avatar({ empleado, className }) {
  if (empleado?.avatarUrl) {
    return <img className={className} src={empleado.avatarUrl} alt="" />;
  }
  return <span className={className} aria-hidden="true">{iniciales(empleado?.nombre)}</span>;
}

export default function FicharScreen({ api, onSalir }) {
  const [vista, setVista] = useState("empleados"); // empleados | pin | panel | registros
  const [empleados, setEmpleados] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [pin, setPin] = useState("");
  const [sesion, setSesion] = useState(null); // { token, empleado, estado }
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // --- Carga de empleados ---
  const cargarEmpleados = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const d = await api.empleados();
      setEmpleados(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e.mensaje || "No se pudo cargar la lista de empleados.");
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => { cargarEmpleados(); }, [cargarEmpleados]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const mostrarToast = useCallback((tipo, ts) => {
    setToast({ tipo, hora: fmtHora(ts, TZ), id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // --- PIN ---
  const irAPin = (emp) => {
    setSeleccion(emp);
    setPin("");
    setError(null);
    setVista("pin");
  };
  const pulsarTecla = (d) => setPin((p) => (p.length >= 8 ? p : p + d));
  const borrar = () => setPin((p) => p.slice(0, -1));

  const entrar = async () => {
    if (enviando || pin.length < 4) return;
    setEnviando(true);
    setError(null);
    try {
      const d = await api.entrar(seleccion.id, pin);
      setSesion(d);
      setPin("");
      // La primera vez (aceptado=false) hay que aceptar los términos antes del panel.
      setVista(d.aceptado ? "panel" : "aceptar");
    } catch (e) {
      setPin("");
      setError(e.mensaje || "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // --- Aceptación de términos (solo el primer acceso del empleado) ---
  const aceptarTerminos = async () => {
    if (enviando || !sesion) return;
    setEnviando(true);
    setError(null);
    try {
      await api.aceptarTerminos(sesion.token);
      setSesion((s) => ({ ...s, aceptado: true }));
      setVista("panel");
    } catch (e) {
      if (e.code === "SESION_KIOSKO" || e.status === 401) {
        setSesion(null);
        setPin("");
        setError("La sesión ha caducado. Introduce tu PIN de nuevo.");
        setVista("pin");
      } else {
        setError(e.mensaje || "No se pudo registrar la aceptación. Inténtalo de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  // --- Fichar (antirrebote + manejo de sesión caducada) ---
  const fichar = async () => {
    if (enviando || !sesion) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await api.fichar(sesion.token);
      mostrarToast(r.tipo, r.ts);
      // La respuesta de fichar trae estado como texto ('abierta'/'cerrada'); para el
      // panel necesitamos el estado completo. Se refresca; si no se puede, se deriva
      // de forma determinista del tipo recién fichado.
      let estadoNuevo;
      try {
        const s2 = await api.estado(sesion.token);
        estadoNuevo = s2.estado;
      } catch {
        estadoNuevo =
          r.tipo === "entrada"
            ? { dentro: true, desde: r.ts, siguienteTipo: "salida", codigo: r.codigo, fecha: sesion.estado.fecha }
            : { dentro: false, desde: null, siguienteTipo: "entrada", codigo: r.codigo, fecha: sesion.estado.fecha };
      }
      setSesion((s) => ({ ...s, estado: estadoNuevo }));
    } catch (e) {
      if (e.code === "SESION_KIOSKO" || e.status === 401) {
        // Token caducado: se vuelve a pedir el PIN conservando al empleado.
        setSesion(null);
        setPin("");
        setError("La sesión ha caducado. Introduce tu PIN de nuevo.");
        setVista("pin");
      } else {
        setError(e.mensaje || "No se pudo fichar. Inténtalo de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const salirEmpleado = () => {
    setSesion(null);
    setSeleccion(null);
    setPin("");
    setError(null);
    setVista("empleados");
  };

  // ------------------------------------------------------------------ Render
  return (
    <div className="pk-root">
      <AvisoTratamiento />
      <div className="pk-pantalla">
        {/* Paso 1: elegir empleado */}
        {vista === "empleados" ? (
          <div className="pk-superficie">
            {onSalir ? (
              <button type="button" className="pk-volver" onClick={onSalir}>← Volver al menú</button>
            ) : null}
            <h2 className="pk-titulo-pantalla">¿Quién ficha?</h2>
            {error ? <div className="pk-mensaje pk-mensaje--error" role="alert">{error}</div> : null}
            {cargando ? (
              <div className="pk-estado">Cargando…</div>
            ) : empleados.length === 0 ? (
              <div className="pk-estado">No hay empleados disponibles.</div>
            ) : (
              <div className="pk-empleados">
                {empleados.map((e) => (
                  <button key={e.id} type="button" className="pk-empleado" onClick={() => irAPin(e)}>
                    <Avatar empleado={e} className="pk-empleado__avatar" />
                    <span className="pk-empleado__nombre">{e.nombre}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="pk-enlace-legal" onClick={() => setVista("legal")}>
              Información legal y protección de datos
            </button>
          </div>
        ) : null}

        {/* Paso 2: PIN */}
        {vista === "pin" ? (
          <div className="pk-superficie">
            <button type="button" className="pk-volver" onClick={salirEmpleado}>← Cambiar de empleado</button>
            <div className="pk-hola">
              <Avatar empleado={seleccion} className="pk-hola__avatar" />
              <div className="pk-hola__nombre">{seleccion?.nombre}</div>
              <div className="pk-hola__estado">Introduce tu PIN</div>
            </div>

            {error ? <div className="pk-mensaje pk-mensaje--error" role="alert">{error}</div> : null}

            <div className="pk-pin-puntos" aria-hidden="true">
              {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                <span key={i} className={`pk-pin-punto ${i < pin.length ? "pk-pin-punto--lleno" : ""}`} />
              ))}
            </div>

            <div className="pk-teclado">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button key={d} type="button" className="pk-tecla" onClick={() => pulsarTecla(d)} disabled={enviando}>
                  {d}
                </button>
              ))}
              <button type="button" className="pk-tecla pk-tecla--accion" onClick={borrar} disabled={enviando}>
                Borrar
              </button>
              <button type="button" className="pk-tecla" onClick={() => pulsarTecla("0")} disabled={enviando}>
                0
              </button>
              <button
                type="button"
                className="pk-tecla pk-tecla--accion"
                onClick={entrar}
                disabled={enviando || pin.length < 4}
              >
                {enviando ? "…" : "Entrar"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Paso 3: panel de fichaje */}
        {vista === "panel" && sesion ? (
          <div className="pk-superficie">
            <button type="button" className="pk-volver" onClick={salirEmpleado}>← Salir</button>
            <div className="pk-hola">
              <Avatar empleado={sesion.empleado} className="pk-hola__avatar" />
              <div className="pk-hola__nombre">Hola, {sesion.empleado.nombre}</div>
              <div className="pk-hola__estado">
                {sesion.estado.dentro ? (
                  <span className="pk-badge pk-badge--dentro">
                    <span className="pk-badge__dot" aria-hidden="true" />
                    Dentro desde {fmtHora(sesion.estado.desde, TZ)}
                  </span>
                ) : (
                  <span className="pk-badge pk-badge--fuera">
                    <span className="pk-badge__dot" aria-hidden="true" />
                    Fuera
                  </span>
                )}
              </div>
            </div>

            <Reloj />

            {error ? <div className="pk-mensaje pk-mensaje--error" role="alert">{error}</div> : null}

            {sesion.estado.siguienteTipo === "salida" ? (
              <button
                type="button"
                className="pk-boton-ficha pk-boton-ficha--salida"
                onClick={fichar}
                disabled={enviando}
              >
                {enviando ? "Registrando…" : "FICHAR SALIDA"}
              </button>
            ) : (
              <button
                type="button"
                className="pk-boton-ficha pk-boton-ficha--entrada"
                onClick={fichar}
                disabled={enviando}
              >
                {enviando ? "Registrando…" : "FICHAR ENTRADA"}
              </button>
            )}

            <div className="pk-acciones">
              <button type="button" className="pk-btn" onClick={() => setVista("registros")}>
                Ver mis registros
              </button>
              <button type="button" className="pk-btn" onClick={() => setVista("legal")}>
                Información legal
              </button>
              <button type="button" className="pk-btn" onClick={salirEmpleado}>
                Terminar
              </button>
            </div>
          </div>
        ) : null}

        {/* Aceptación de términos: primer acceso del empleado, antes del panel */}
        {vista === "aceptar" && sesion ? (
          <AceptacionTerminos
            onAceptar={aceptarTerminos}
            onCancelar={salirEmpleado}
            aceptando={enviando}
            error={error}
            titulo={`Bienvenido/a, ${sesion.empleado.nombre}`}
            intro="Antes de fichar por primera vez debes leer y aceptar los términos y condiciones y la información sobre protección de datos. Solo se te pedirá esta vez."
          />
        ) : null}

        {/* Información legal (accesible con o sin sesión) */}
        {vista === "legal" ? (
          <InfoLegal onVolver={() => setVista(sesion ? "panel" : "empleados")} />
        ) : null}

        {/* Paso opcional: mis registros */}
        {vista === "registros" && sesion ? (
          <MisRegistros
            api={api}
            token={sesion.token}
            empleadoNombre={sesion.empleado.nombre}
            onVolver={() => setVista("panel")}
            onSesionCaducada={() => {
              setSesion(null);
              setPin("");
              setError("La sesión ha caducado. Introduce tu PIN de nuevo.");
              setVista("pin");
            }}
          />
        ) : null}
      </div>

      {/* Toast con la hora al fichar */}
      {toast ? (
        <div className="pk-toast-zona" role="status" aria-live="polite">
          <div className={`pk-toast pk-toast--${toast.tipo === "salida" ? "salida" : "entrada"}`}>
            <span>{toast.tipo === "salida" ? "Salida registrada" : "Entrada registrada"}</span>
            <span className="pk-toast__hora">{toast.hora}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
