// Solicitudes.jsx — Pestaña "Solicitudes" (§3): sub-pestañas Pendientes/Aprobadas/
// Rechazadas; cada línea: empleado · tipo · cambio propuesto · motivo · estado
// (insignia). Botones Aprobar/Rechazar con comentario opcional. Contador de pendientes.
import React, { useState, useEffect, useCallback } from "react";
import Insignia from "../components/Insignia.jsx";
import { fmtHora } from "../api.js";

const ESTADOS = [
  { clave: "pendiente", etiqueta: "Pendientes" },
  { clave: "aprobada", etiqueta: "Aprobadas" },
  { clave: "rechazada", etiqueta: "Rechazadas" },
];

const INSIGNIA_ESTADO = {
  pendiente: { tipo: "en-curso", texto: "Pendiente" },
  aprobada: { tipo: "exito", texto: "Aprobada" },
  rechazada: { tipo: "peligro", texto: "Rechazada" },
};

/** Describe el cambio propuesto en texto plano (sin HTML). */
function describirCambio(cambio, tz) {
  if (!cambio || typeof cambio !== "object") return "—";
  const tipo = cambio.tipo ? ` (${cambio.tipo})` : "";
  const hora = cambio.ts != null ? ` a las ${fmtHora(cambio.ts, tz)}` : "";
  if (cambio.accion === "anadir") return `Añadir marca${tipo}${hora}`;
  if (cambio.accion === "editar") return `Editar marca${tipo}${hora}`;
  return "Cambio de corrección";
}

function Resolver({ solicitud, accion, tz, onConfirmar, onCancelar }) {
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const esAprobar = accion === "aprobar";

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await onConfirmar(solicitud.id, comentario.trim() || null);
    } catch (e) {
      setError(e.mensaje || "No se pudo completar la acción.");
      setEnviando(false);
    }
  };

  return (
    <div className="px-modal-overlay" role="dialog" aria-modal="true" onMouseDown={onCancelar}>
      <div className="px-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="px-modal__title">{esAprobar ? "Aprobar solicitud" : "Rechazar solicitud"}</h3>
        <p className="px-modal__sub">
          {solicitud.empleadoNombre} · {describirCambio(solicitud.cambio, tz)}
        </p>
        <div className="px-modal__body">
          {error ? <div className="px-error" role="alert">{error}</div> : null}
          <label className="px-campo">
            <span className="px-campo__label">Comentario (opcional)</span>
            <textarea
              className="px-textarea"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Añade una nota si lo necesitas."
            />
          </label>
        </div>
        <div className="px-modal__acciones">
          <button type="button" className="px-btn px-btn--suave" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="button"
            className={`px-btn ${esAprobar ? "px-btn--exito" : "px-btn--peligro"}`}
            onClick={confirmar}
            disabled={enviando}
          >
            {enviando ? "Procesando…" : esAprobar ? "Aprobar" : "Rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Solicitudes({ api, tz, onToast, onPendientesChange }) {
  const [estado, setEstado] = useState("pendiente");
  const [lista, setLista] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [resolver, setResolver] = useState(null); // { solicitud, accion }

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const d = await api.solicitudes(estado);
      setLista(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e.mensaje || "No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  }, [api, estado]);

  const refrescarPendientes = useCallback(async () => {
    try {
      const d = await api.solicitudes("pendiente");
      const n = Array.isArray(d) ? d.length : 0;
      setPendientes(n);
      onPendientesChange && onPendientesChange(n);
    } catch {
      /* el contador es informativo; no bloquea */
    }
  }, [api, onPendientesChange]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { refrescarPendientes(); }, [refrescarPendientes]);

  const tras = () => { cargar(); refrescarPendientes(); };

  const aprobar = async (id, comentario) => {
    await api.aprobar(id, comentario);
    setResolver(null);
    onToast && onToast("Solicitud aprobada.", "exito");
    tras();
  };
  const rechazar = async (id, comentario) => {
    await api.rechazar(id, comentario);
    setResolver(null);
    onToast && onToast("Solicitud rechazada.", "info");
    tras();
  };

  return (
    <div className="px-panel">
      <div className="px-tabs" role="tablist" aria-label="Estado de solicitudes">
        {ESTADOS.map((e) => (
          <button
            key={e.clave}
            type="button"
            role="tab"
            aria-selected={estado === e.clave}
            className={`px-tab ${estado === e.clave ? "px-tab--activo" : ""}`}
            onClick={() => setEstado(e.clave)}
          >
            {e.etiqueta}
            {e.clave === "pendiente" && pendientes > 0 ? (
              <span className="px-tab__contador">{pendientes}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? <div className="px-error" role="alert">{error}</div> : null}

      {cargando && lista.length === 0 ? (
        <div className="px-estado">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="px-estado">No hay solicitudes en este estado.</div>
      ) : (
        <div>
          {lista.map((s) => {
            const ins = INSIGNIA_ESTADO[s.estado] || INSIGNIA_ESTADO.pendiente;
            return (
              <div className="px-solicitud" key={s.id}>
                <div className="px-solicitud__info">
                  <div className="px-solicitud__linea">
                    <span className="px-solicitud__nombre">{s.empleadoNombre}</span>
                    <Insignia tipo="neutral">{s.tipo}</Insignia>
                    <Insignia tipo={ins.tipo}>{ins.texto}</Insignia>
                  </div>
                  <div className="px-solicitud__linea">
                    <strong>Cambio:</strong> {describirCambio(s.cambio, tz)}
                  </div>
                  <div className="px-solicitud__motivo">Motivo: {s.motivo}</div>
                </div>
                {s.estado === "pendiente" ? (
                  <div className="px-solicitud__acciones">
                    <button
                      type="button"
                      className="px-btn px-btn--exito px-btn--sm"
                      onClick={() => setResolver({ solicitud: s, accion: "aprobar" })}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="px-btn px-btn--peligro px-btn--sm"
                      onClick={() => setResolver({ solicitud: s, accion: "rechazar" })}
                    >
                      Rechazar
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {resolver ? (
        <Resolver
          solicitud={resolver.solicitud}
          accion={resolver.accion}
          tz={tz}
          onConfirmar={resolver.accion === "aprobar" ? aprobar : rechazar}
          onCancelar={() => setResolver(null)}
        />
      ) : null}
    </div>
  );
}
