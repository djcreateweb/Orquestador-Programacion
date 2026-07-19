// MisRegistros.jsx — El empleado ve y exporta SÓLO lo suyo desde el kiosko (§ API
// kiosk/mis-registros). Requiere el token de la micro-sesión (en memoria). Selector
// de rango; exportación CSV/PDF. Fix S-03/K-07: el token de SESIÓN nunca viaja en la
// URL de descarga — antes de descargar se pide un token de DESCARGA de un solo uso y
// vida corta (`solicitarDescarga`, con la sesión en el body) y sólo ése se usa en la
// query del `<a href>`. Si el token de sesión ha caducado, avisa y delega en
// `onSesionCaducada` para volver a pedir el PIN.
import React, { useState, useEffect, useCallback } from "react";
import { fmtHora, fmtFechaCorta, primerDiaMes, ultimoDiaMes, descargar } from "./api.js";
import "./kiosk.css";

export default function MisRegistros({ api, token, tz, empleadoNombre, onVolver, onSesionCaducada }) {
  const hoy = Date.now();
  const [desde, setDesde] = useState(primerDiaMes(hoy, tz));
  const [hasta, setHasta] = useState(ultimoDiaMes(hoy, tz));
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

  // fix S-03/K-07: pide un token de descarga efímero/de un solo uso justo antes de
  // descargar; nunca reutiliza el token de sesión en la URL.
  const exportar = useCallback(async (urlDe) => {
    setError(null);
    try {
      const { descargaToken } = await api.solicitarDescarga(token);
      descargar(urlDe(descargaToken, desde, hasta));
    } catch (e) {
      if (e.code === "SESION_KIOSKO" || e.status === 401) {
        onSesionCaducada && onSesionCaducada();
        return;
      }
      setError(e.mensaje || "No se pudo generar la descarga.");
    }
  }, [api, token, desde, hasta, onSesionCaducada]);

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
          onClick={() => exportar(api.urlMisHorasCsv)}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="pk-btn pk-btn--primario"
          onClick={() => exportar(api.urlMisHorasPdf)}
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
                    <td data-label="Entrada" className="pk-mono pk-nowrap">{fmtHora(j.entrada, tz)}</td>
                    <td data-label="Salida" className="pk-mono pk-nowrap">
                      {j.enCurso ? (
                        <span className="pk-badge pk-badge--en-curso">En curso</span>
                      ) : (
                        fmtHora(j.salida, tz)
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
