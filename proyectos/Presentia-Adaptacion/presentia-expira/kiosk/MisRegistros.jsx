// MisRegistros.jsx — El empleado ve y exporta SÓLO lo suyo desde el kiosko (§ API
// kiosk/mis-registros). Requiere el token de la micro-sesión (en memoria). Selector
// de rango; exportación CSV/PDF (descargas con el token en la query). Si el token ha
// caducado, avisa y delega en `onSesionCaducada` para volver a pedir el PIN.
import React, { useState, useEffect, useCallback } from "react";
import { fmtHora, fmtFechaCorta, primerDiaMes, ultimoDiaMes, descargar } from "./api.js";
import "./kiosk.css";

export default function MisRegistros({ api, token, empleadoNombre, onVolver, onSesionCaducada }) {
  const hoy = new Date();
  const [desde, setDesde] = useState(primerDiaMes(hoy));
  const [hasta, setHasta] = useState(ultimoDiaMes(hoy));
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const d = await api.misRegistros(token, desde, hasta);
      setData(d);
    } catch (e) {
      if (e.code === "SESION_KIOSKO" || e.status === 401) {
        onSesionCaducada && onSesionCaducada();
        return;
      }
      setError(e.mensaje || "No se pudieron cargar tus registros.");
    } finally {
      setCargando(false);
    }
  }, [api, token, desde, hasta, onSesionCaducada]);

  useEffect(() => { cargar(); }, [cargar]);

  // Una sola persona (el propio empleado) en la respuesta.
  const persona = data && data.empleados && data.empleados[0];

  return (
    <div className="pk-superficie">
      <button type="button" className="pk-volver" onClick={onVolver}>← Volver</button>
      <h2 className="pk-titulo-pantalla">Mis registros{empleadoNombre ? ` · ${empleadoNombre}` : ""}</h2>

      <div className="pk-acciones" style={{ justifyContent: "flex-start" }}>
        <label className="pk-sr-only" htmlFor="mr-desde">Desde</label>
        <input id="mr-desde" className="pk-btn" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <label className="pk-sr-only" htmlFor="mr-hasta">Hasta</label>
        <input id="mr-hasta" className="pk-btn" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <button
          type="button"
          className="pk-btn"
          onClick={() => descargar(api.urlMisHorasCsv(token, desde, hasta))}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="pk-btn pk-btn--primario"
          onClick={() => descargar(api.urlMisHorasPdf(token, desde, hasta))}
        >
          Exportar PDF
        </button>
      </div>

      {error ? <div className="pk-mensaje pk-mensaje--error" role="alert">{error}</div> : null}

      {cargando && !data ? (
        <div className="pk-estado">Cargando…</div>
      ) : !persona || persona.jornadas.length === 0 ? (
        <div className="pk-estado">No tienes jornadas en el rango seleccionado.</div>
      ) : (
        <>
          <div className="pk-tabla-wrap">
            <table className="pk-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Código</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {persona.jornadas.map((j) => (
                  <tr key={j.codigo}>
                    <td data-label="Fecha" className="pk-nowrap">{fmtFechaCorta(j.fecha)}</td>
                    <td data-label="Código" className="pk-mono pk-nowrap">{j.codigo}</td>
                    <td data-label="Entrada" className="pk-mono pk-nowrap">{fmtHora(j.entrada)}</td>
                    <td data-label="Salida" className="pk-mono pk-nowrap">
                      {j.enCurso ? (
                        <span className="pk-badge pk-badge--en-curso">En curso</span>
                      ) : (
                        fmtHora(j.salida)
                      )}
                    </td>
                    <td data-label="Horas" className="pk-mono pk-nowrap">{j.textoHoras}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pk-total">
            <span>Total del periodo</span>
            <span className="pk-total__valor">{persona.totalTexto || data.totalPeriodoTexto}</span>
          </div>
        </>
      )}
    </div>
  );
}
