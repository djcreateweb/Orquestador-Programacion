// InformeHoras.jsx — Pestaña "Informe de horas" (§3): por empleado, sus jornadas y
// horas (mono, "168 h 30 m"); selector de rango (por defecto el mes en curso); caja
// info con "Total del periodo"; botones Exportar CSV y PDF (descarga del servidor).
import React, { useState, useEffect, useCallback } from "react";
import Insignia from "../components/Insignia.jsx";
import {
  fmtHora,
  fmtFechaCorta,
  primerDiaMes,
  ultimoDiaMes,
  descargar,
} from "../api.js";

export default function InformeHoras({ api }) {
  const hoy = new Date();
  const [desde, setDesde] = useState(primerDiaMes(hoy));
  const [hasta, setHasta] = useState(ultimoDiaMes(hoy));
  const [empleadoId, setEmpleadoId] = useState("");
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { desde, hasta };
      if (empleadoId) params.empleadoId = empleadoId;
      const d = await api.informe(params);
      setData(d);
    } catch (e) {
      setError(e.mensaje || "No se pudo cargar el informe.");
    } finally {
      setCargando(false);
    }
  }, [api, desde, hasta, empleadoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const params = () => {
    const p = { desde, hasta };
    if (empleadoId) p.empleadoId = empleadoId;
    return p;
  };
  const exportarCsv = () => descargar(api.urlInformeCsv(params()), `informe-${desde}_${hasta}.csv`);
  const exportarPdf = () => descargar(api.urlInformePdf(params()), `informe-${desde}_${hasta}.pdf`);

  const empleadosOpts = data ? data.empleados : [];

  return (
    <div className="px-panel">
      <div className="px-filtros">
        <label className="px-campo">
          <span className="px-campo__label">Desde</span>
          <input className="px-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Hasta</span>
          <input className="px-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Empleado</span>
          <select className="px-select" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
            <option value="">Todos</option>
            {empleadosOpts.map((e) => (
              <option key={e.empleadoId} value={e.empleadoId}>{e.nombre}</option>
            ))}
          </select>
        </label>
        <div className="px-spacer" />
        <button type="button" className="px-btn px-btn--suave" onClick={exportarCsv}>Exportar CSV</button>
        <button type="button" className="px-btn px-btn--primario" onClick={exportarPdf}>Exportar PDF</button>
      </div>

      {error ? <div className="px-error" role="alert">{error}</div> : null}

      {cargando && !data ? (
        <div className="px-estado">Cargando…</div>
      ) : !data || data.empleados.length === 0 ? (
        <div className="px-estado">No hay horas registradas en el rango seleccionado.</div>
      ) : (
        <>
          {data.empleados.map((emp) => (
            <div className="px-panel" key={emp.empleadoId} style={{ boxShadow: "none" }}>
              <div className="px-panel__head">
                <h3 className="px-panel__title">{emp.nombre}</h3>
                <Insignia tipo="info">
                  Total: <span className="px-mono">{emp.totalTexto}</span>
                </Insignia>
              </div>
              <div className="px-tabla-wrap">
                <table className="px-tabla">
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
                    {emp.jornadas.map((j) => (
                      <tr key={j.codigo}>
                        <td data-label="Fecha" className="px-nowrap">{fmtFechaCorta(j.fecha)}</td>
                        <td data-label="Código" className="px-mono px-nowrap">{j.codigo}</td>
                        <td data-label="Entrada" className="px-mono px-nowrap">{fmtHora(j.entrada)}</td>
                        <td data-label="Salida" className="px-mono px-nowrap">
                          {j.enCurso ? <Insignia tipo="en-curso" punto>En curso</Insignia> : fmtHora(j.salida)}
                        </td>
                        <td data-label="Horas" className="px-mono px-nowrap">{j.textoHoras}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="px-info-box" style={{ marginTop: "1rem" }}>
            <span className="px-info-box__label">Total del periodo</span>
            <span className="px-info-box__valor">{data.totalPeriodoTexto}</span>
          </div>
        </>
      )}
    </div>
  );
}
