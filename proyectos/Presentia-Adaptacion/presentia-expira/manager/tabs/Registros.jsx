// Registros.jsx — Pestaña "Registros" (§3): tabla filtrable (empleado + rango),
// una fila por jornada. "en curso" en ámbar; insignia "editado". Acciones por fila:
// Editar (marca + nueva hora + motivo obligatorio) y Añadir marca (tipo + hora +
// motivo). Exportar CSV (generado en cliente).
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Insignia from "../components/Insignia.jsx";
import {
  fmtHora,
  fmtFechaCorta,
  primerDiaMes,
  ultimoDiaMes,
  tsAInputLocal,
  inputLocalATs,
  descargarCsvCliente,
} from "../api.js";

function Modal({ titulo, sub, children, onCerrar }) {
  return (
    <div className="px-modal-overlay" role="dialog" aria-modal="true" onMouseDown={onCerrar}>
      <div className="px-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="px-modal__title">{titulo}</h3>
        {sub ? <p className="px-modal__sub">{sub}</p> : null}
        {children}
      </div>
    </div>
  );
}

function EditarMarcaModal({ jornada, tz, onGuardar, onCerrar }) {
  const [marcaId, setMarcaId] = useState(jornada.marcas[0]?.id ?? "");
  const marcaSel = jornada.marcas.find((m) => m.id === Number(marcaId));
  const [hora, setHora] = useState(marcaSel ? tsAInputLocal(marcaSel.ts, tz) : "");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cambiarMarca = (id) => {
    setMarcaId(id);
    const m = jornada.marcas.find((x) => x.id === Number(id));
    if (m) setHora(tsAInputLocal(m.ts, tz));
  };

  const enviar = async () => {
    setError(null);
    if (!motivo.trim()) { setError("El motivo es obligatorio."); return; }
    const tsNuevo = inputLocalATs(hora, tz);
    if (tsNuevo == null) { setError("La fecha/hora no es válida."); return; }
    setEnviando(true);
    try {
      await onGuardar({ marcaId: Number(marcaId), tsNuevo, motivo: motivo.trim() });
    } catch (e) {
      setError(e.mensaje || "No se pudo guardar el cambio.");
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Editar marca"
      sub={`Jornada ${jornada.codigo} · ${jornada.empleadoNombre}`}
      onCerrar={onCerrar}
    >
      <div className="px-modal__body">
        {error ? <div className="px-error" role="alert">{error}</div> : null}
        <label className="px-campo">
          <span className="px-campo__label">Marca</span>
          <select className="px-select" value={marcaId} onChange={(e) => cambiarMarca(e.target.value)}>
            {jornada.marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.tipo === "entrada" ? "Entrada" : "Salida"} · {fmtHora(m.ts, tz)}
                {m.editado ? " (editada)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Nueva hora</span>
          <input
            className="px-input px-input--mono"
            type="datetime-local"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Motivo (obligatorio)</span>
          <textarea
            className="px-textarea"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: el empleado olvidó fichar la salida."
          />
        </label>
      </div>
      <div className="px-modal__acciones">
        <button type="button" className="px-btn px-btn--suave" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="px-btn px-btn--primario" onClick={enviar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

function AnadirMarcaModal({ jornada, tz, onGuardar, onCerrar }) {
  const [tipo, setTipo] = useState("entrada");
  const [hora, setHora] = useState(tsAInputLocal(jornada.entrada ?? Date.now(), tz));
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const enviar = async () => {
    setError(null);
    if (!motivo.trim()) { setError("El motivo es obligatorio."); return; }
    const ts = inputLocalATs(hora, tz);
    if (ts == null) { setError("La fecha/hora no es válida."); return; }
    setEnviando(true);
    try {
      await onGuardar({ jornadaId: jornada.id, tipo, ts, motivo: motivo.trim() });
    } catch (e) {
      setError(e.mensaje || "No se pudo añadir la marca.");
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Añadir marca"
      sub={`Jornada ${jornada.codigo} · ${jornada.empleadoNombre}`}
      onCerrar={onCerrar}
    >
      <div className="px-modal__body">
        {error ? <div className="px-error" role="alert">{error}</div> : null}
        <label className="px-campo">
          <span className="px-campo__label">Tipo</span>
          <select className="px-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Hora</span>
          <input
            className="px-input px-input--mono"
            type="datetime-local"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Motivo (obligatorio)</span>
          <textarea
            className="px-textarea"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: se añade la entrada que no llegó a registrarse."
          />
        </label>
      </div>
      <div className="px-modal__acciones">
        <button type="button" className="px-btn px-btn--suave" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="px-btn px-btn--primario" onClick={enviar} disabled={enviando}>
          {enviando ? "Guardando…" : "Añadir"}
        </button>
      </div>
    </Modal>
  );
}

/** Añadir jornada COMPLETA (entrada+salida) para un día SIN ninguna marca previa (fix A-04). */
function AnadirJornadaModal({ api, tz, onGuardar, onCerrar }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("");
  const ahora = Date.now();
  const [horaEntrada, setHoraEntrada] = useState(tsAInputLocal(ahora, tz));
  const [horaSalida, setHoraSalida] = useState(tsAInputLocal(ahora, tz));
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    api.empleados().then((d) => { if (vivo) setEmpleados(Array.isArray(d) ? d : []); }).catch(() => {});
    return () => { vivo = false; };
  }, [api]);

  const enviar = async () => {
    setError(null);
    if (!empleadoId) { setError("Elige un empleado."); return; }
    if (!motivo.trim()) { setError("El motivo es obligatorio."); return; }
    const entrada = inputLocalATs(horaEntrada, tz);
    const salida = inputLocalATs(horaSalida, tz);
    if (entrada == null || salida == null) { setError("La fecha/hora no es válida."); return; }
    setEnviando(true);
    try {
      await onGuardar({ empleadoId, entrada, salida, motivo: motivo.trim() });
    } catch (e) {
      setError(e.mensaje || "No se pudo crear la jornada.");
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Añadir jornada olvidada"
      sub="Para un día SIN ninguna marca registrada (entrada + salida en un solo paso)."
      onCerrar={onCerrar}
    >
      <div className="px-modal__body">
        {error ? <div className="px-error" role="alert">{error}</div> : null}
        <label className="px-campo">
          <span className="px-campo__label">Empleado</span>
          <select className="px-select" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
            <option value="">Elige uno…</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}{e.activo === false ? " (inactivo)" : ""}</option>
            ))}
          </select>
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Entrada</span>
          <input
            className="px-input px-input--mono"
            type="datetime-local"
            value={horaEntrada}
            onChange={(e) => setHoraEntrada(e.target.value)}
          />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Salida</span>
          <input
            className="px-input px-input--mono"
            type="datetime-local"
            value={horaSalida}
            onChange={(e) => setHoraSalida(e.target.value)}
          />
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Motivo (obligatorio)</span>
          <textarea
            className="px-textarea"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: el empleado olvidó fichar todo el día; confirmado con el encargado."
          />
        </label>
      </div>
      <div className="px-modal__acciones">
        <button type="button" className="px-btn px-btn--suave" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" className="px-btn px-btn--primario" onClick={enviar} disabled={enviando}>
          {enviando ? "Guardando…" : "Crear jornada"}
        </button>
      </div>
    </Modal>
  );
}

export default function Registros({ api, tz, onToast }) {
  const hoy = Date.now();
  const [desde, setDesde] = useState(primerDiaMes(hoy, tz));
  const [hasta, setHasta] = useState(ultimoDiaMes(hoy, tz));
  const [empleadoId, setEmpleadoId] = useState("");
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [editar, setEditar] = useState(null);
  const [anadir, setAnadir] = useState(null);
  const [anadirJornada, setAnadirJornada] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { desde, hasta };
      if (empleadoId) params.empleadoId = empleadoId;
      const d = await api.registros(params);
      setFilas(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(e.mensaje || "No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  }, [api, desde, hasta, empleadoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Opciones de empleado a partir de lo cargado (no hay endpoint de plantilla).
  const empleados = useMemo(() => {
    const m = new Map();
    for (const f of filas) if (f.empleadoId != null) m.set(f.empleadoId, f.empleadoNombre);
    return [...m.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), "es"));
  }, [filas]);

  const guardarEdicion = async (payload) => {
    await api.editarMarca(payload);
    setEditar(null);
    onToast && onToast("Marca actualizada.", "exito");
    cargar();
  };
  const guardarAdicion = async (payload) => {
    await api.anadirMarca(payload);
    setAnadir(null);
    onToast && onToast("Marca añadida.", "exito");
    cargar();
  };
  const guardarJornada = async (payload) => {
    await api.crearJornada(payload);
    setAnadirJornada(false);
    onToast && onToast("Jornada creada.", "exito");
    cargar();
  };

  const exportarCsv = () => {
    const cab = ["Empleado", "Fecha", "Entrada", "Salida", "Código", "En curso", "Editado"];
    const cuerpo = filas.map((f) => [
      f.empleadoNombre,
      fmtFechaCorta(f.fecha),
      fmtHora(f.entrada, tz),
      f.enCurso ? "" : fmtHora(f.salida, tz),
      f.codigo,
      f.enCurso ? "sí" : "no",
      f.editado ? "sí" : "no",
    ]);
    descargarCsvCliente([cab, ...cuerpo], `registros-${desde}_${hasta}.csv`);
  };

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
            {empleados.map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </label>
        <div className="px-spacer" />
        <button type="button" className="px-btn px-btn--suave" onClick={() => setAnadirJornada(true)}>
          Añadir jornada olvidada
        </button>
        <button type="button" className="px-btn px-btn--suave" onClick={exportarCsv} disabled={filas.length === 0}>
          Exportar CSV
        </button>
      </div>

      {error ? <div className="px-error" role="alert">{error}</div> : null}

      {cargando && filas.length === 0 ? (
        <div className="px-estado">Cargando…</div>
      ) : filas.length === 0 ? (
        <div className="px-estado">No hay jornadas en el rango seleccionado.</div>
      ) : (
        <div className="px-tabla-wrap">
          <table className="px-tabla">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Código</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td data-label="Empleado">{f.empleadoNombre}</td>
                  <td data-label="Fecha" className="px-nowrap">{fmtFechaCorta(f.fecha)}</td>
                  <td data-label="Entrada" className="px-mono px-nowrap">{fmtHora(f.entrada, tz)}</td>
                  <td data-label="Salida" className="px-mono px-nowrap">
                    {f.enCurso ? <Insignia tipo="en-curso" punto>En curso</Insignia> : fmtHora(f.salida, tz)}
                  </td>
                  <td data-label="Código" className="px-mono px-nowrap">{f.codigo}</td>
                  <td data-label="Estado">
                    {f.requiereCorreccion ? <Insignia tipo="aviso" punto>Requiere corrección</Insignia> : null}
                    {f.editado ? <Insignia tipo="editado">Editado</Insignia> : null}
                    {!f.requiereCorreccion && !f.editado ? <span className="px-text-muted">—</span> : null}
                  </td>
                  <td className="px-cell-acciones">
                    <div className="px-td-acciones">
                      <button type="button" className="px-btn px-btn--suave px-btn--sm" onClick={() => setEditar(f)} disabled={f.marcas.length === 0}>
                        Editar
                      </button>
                      <button type="button" className="px-btn px-btn--suave px-btn--sm" onClick={() => setAnadir(f)}>
                        Añadir marca
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editar ? (
        <EditarMarcaModal jornada={editar} tz={tz} onGuardar={guardarEdicion} onCerrar={() => setEditar(null)} />
      ) : null}
      {anadir ? (
        <AnadirMarcaModal jornada={anadir} tz={tz} onGuardar={guardarAdicion} onCerrar={() => setAnadir(null)} />
      ) : null}
      {anadirJornada ? (
        <AnadirJornadaModal api={api} tz={tz} onGuardar={guardarJornada} onCerrar={() => setAnadirJornada(false)} />
      ) : null}
    </div>
  );
}
