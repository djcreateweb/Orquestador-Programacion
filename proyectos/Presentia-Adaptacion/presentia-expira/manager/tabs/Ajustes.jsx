// Ajustes.jsx — Pestaña "Ajustes" (§3): jornada estándar (min→h), redondeo (min) y
// toggles (mostrar "Fichar" en kiosko, exigir PIN, varias marcas/día, imprimir
// ticket). Guardar con PUT. Sólo se envían las claves editables aquí.
import React, { useState, useEffect, useCallback } from "react";

function Toggle({ id, on, onChange, disabled }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={`px-toggle ${on ? "px-toggle--on" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="px-toggle__bola" />
      <span className="px-sr-only">{on ? "Activado" : "Desactivado"}</span>
    </button>
  );
}

const TOGGLES = [
  { clave: "mostrarEnKiosko", nombre: "Mostrar «Fichar» en el kiosko", desc: "Muestra la tarjeta de fichaje en la pantalla del kiosko." },
  { clave: "exigirPin", nombre: "Exigir PIN", desc: "Pide el PIN del empleado para poder fichar." },
  { clave: "variasMarcasDia", nombre: "Varias marcas por día", desc: "Permite varias entradas y salidas al día (pausas)." },
  { clave: "imprimirTicket", nombre: "Imprimir ticket", desc: "Imprime un ticket cada vez que alguien ficha." },
];

// Sólo estas claves se editan aquí (§3). El resto de ajustes se dejan intactos.
function editables(cfg) {
  return {
    jornadaEstandarMin: cfg.jornadaEstandarMin,
    redondeoMin: cfg.redondeoMin,
    temaPorDefecto: cfg.temaPorDefecto,
    mostrarEnKiosko: cfg.mostrarEnKiosko,
    exigirPin: cfg.exigirPin,
    variasMarcasDia: cfg.variasMarcasDia,
    imprimirTicket: cfg.imprimirTicket,
  };
}

export default function Ajustes({ api, onToast }) {
  const [form, setForm] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const cfg = await api.ajustesGet();
      setForm(editables(cfg));
    } catch (e) {
      setError(e.mensaje || "No se pudieron cargar los ajustes.");
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (clave, valor) => setForm((f) => ({ ...f, [clave]: valor }));

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const cfg = await api.ajustesPut(form);
      setForm(editables(cfg)); // refleja la normalización del servidor
      onToast && onToast("Ajustes guardados.", "exito");
    } catch (e) {
      setError(e.mensaje || "No se pudieron guardar los ajustes.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || !form) {
    return <div className="px-panel"><div className="px-estado">Cargando…</div></div>;
  }

  const horasJornada = (Number(form.jornadaEstandarMin) / 60).toFixed(2).replace(/\.00$/, "");

  return (
    <div className="px-panel">
      {error ? <div className="px-error" role="alert">{error}</div> : null}

      <div className="px-filtros">
        <label className="px-campo">
          <span className="px-campo__label">Jornada estándar (min)</span>
          <input
            className="px-input px-input--mono"
            type="number"
            min="0"
            max="1440"
            value={form.jornadaEstandarMin}
            onChange={(e) => set("jornadaEstandarMin", Number(e.target.value))}
          />
          <span className="px-panel__hint">Equivale a {horasJornada} h.</span>
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Redondeo (min)</span>
          <input
            className="px-input px-input--mono"
            type="number"
            min="0"
            max="120"
            value={form.redondeoMin}
            onChange={(e) => set("redondeoMin", Number(e.target.value))}
          />
          <span className="px-panel__hint">0 = sin redondeo.</span>
        </label>
        <label className="px-campo">
          <span className="px-campo__label">Tema por defecto</span>
          <select
            className="px-select"
            value={form.temaPorDefecto}
            onChange={(e) => set("temaPorDefecto", e.target.value)}
          >
            <option value="auto">Automático (sistema)</option>
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
          <span className="px-panel__hint">Para dispositivos sin preferencia propia.</span>
        </label>
      </div>

      <div>
        {TOGGLES.map((t) => (
          <div className="px-toggle-row" key={t.clave}>
            <div className="px-toggle-row__texto">
              <label htmlFor={`aj-${t.clave}`} className="px-toggle-row__nombre">{t.nombre}</label>
              <span className="px-toggle-row__desc">{t.desc}</span>
            </div>
            <Toggle
              id={`aj-${t.clave}`}
              on={!!form[t.clave]}
              onChange={(v) => set(t.clave, v)}
              disabled={guardando}
            />
          </div>
        ))}
      </div>

      <div className="px-modal__acciones" style={{ marginTop: "1.25rem" }}>
        <button type="button" className="px-btn px-btn--suave" onClick={cargar} disabled={guardando}>
          Descartar
        </button>
        <button type="button" className="px-btn px-btn--primario" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
