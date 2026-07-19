// Hoy.jsx — Pestaña "Hoy" (§3): KPIs Dentro ahora / Salidas (personas que ya se han
// ido) / Personas hoy + lista de marcas del día (hora en mono). Autorefresco ~15s.
import React, { useState, useEffect, useCallback, useRef } from "react";
import Insignia from "../components/Insignia.jsx";
import { fmtHora, fmtFechaCorta } from "../api.js";

const INTERVALO_MS = 15000;

export default function Hoy({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const d = await api.hoy();
      if (!montado.current) return;
      setData(d);
      setError(null);
    } catch (e) {
      if (!montado.current) return;
      setError(e.mensaje || "No se pudo cargar la información de hoy.");
    } finally {
      if (montado.current) setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    montado.current = true;
    cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => {
      montado.current = false;
      clearInterval(id);
    };
  }, [cargar]);

  if (cargando && !data) return <div className="px-estado">Cargando…</div>;

  return (
    <div>
      {error ? <div className="px-error" role="alert">{error}</div> : null}

      {data ? (
        <>
          <div className="px-kpis">
            <div className="px-kpi px-kpi--acento">
              <div className="px-kpi__valor">{data.dentroAhora}</div>
              <div className="px-kpi__label">Dentro ahora</div>
            </div>
            <div className="px-kpi">
              <div className="px-kpi__valor">{data.salidas}</div>
              <div className="px-kpi__label">Salidas</div>
            </div>
            <div className="px-kpi">
              <div className="px-kpi__valor">{data.personasHoy}</div>
              <div className="px-kpi__label">Personas hoy</div>
            </div>
          </div>

          <div className="px-panel">
            <div className="px-panel__head">
              <div>
                <h3 className="px-panel__title">Marcas del día</h3>
                <p className="px-panel__hint">
                  {fmtFechaCorta(data.fecha)} · se actualiza automáticamente
                </p>
              </div>
            </div>

            {data.marcas.length === 0 ? (
              <div className="px-estado">Aún no hay marcas registradas hoy.</div>
            ) : (
              <div className="px-tabla-wrap">
                <table className="px-tabla">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Tipo</th>
                      <th>Hora</th>
                      <th>Código</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.marcas.map((m, i) => (
                      <tr key={`${m.codigo}-${m.ts}-${i}`}>
                        <td data-label="Empleado">{m.empleadoNombre}</td>
                        <td data-label="Tipo">
                          {m.tipo === "entrada" ? (
                            <Insignia tipo="exito" punto>Entrada</Insignia>
                          ) : (
                            <Insignia tipo="peligro" punto>Salida</Insignia>
                          )}
                        </td>
                        <td data-label="Hora" className="px-mono px-nowrap">{fmtHora(m.ts)}</td>
                        <td data-label="Código" className="px-mono px-nowrap">{m.codigo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
