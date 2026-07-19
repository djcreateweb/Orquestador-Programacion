// BotonTema.jsx — Botón de tema (claro → oscuro → auto). Un clic cicla el modo,
// lo persiste por dispositivo y lo aplica al <html>. En modo `auto` reacciona en
// caliente si el sistema cambia. Accesible (aria-label, title, foco visible).
import React, { useState, useEffect, useCallback } from "react";
import { CLAVE, leerTema, aplicarTema, guardarTema, siguienteModo, escucharSistema } from "./tema.js";
import "./boton-tema.css";

const ICONO = { claro: "☀️", oscuro: "🌙", auto: "🖥️" };
const NOMBRE = { claro: "Claro", oscuro: "Oscuro", auto: "Auto" };
const DESC = {
  claro: "Tema claro",
  oscuro: "Tema oscuro",
  auto: "Tema automático (sigue al sistema)",
};

/**
 * @param {object} props
 * @param {('claro'|'oscuro'|'auto')} [props.defecto="auto"]  valor global por defecto
 *   (de Ajustes); se adopta solo si el dispositivo no tiene preferencia guardada.
 */
export default function BotonTema({ defecto = "auto" }) {
  const [tema, setTema] = useState(() => leerTema(defecto));

  // Aplica el tema al montar y en cada cambio (con transición suave).
  useEffect(() => { aplicarTema(tema, { transicion: true }); }, [tema]);

  // En `auto`, reacciona a los cambios del sistema (día/noche).
  useEffect(() => escucharSistema(() => { if (tema === "auto") aplicarTema(tema); }), [tema]);

  // Si no hay preferencia de dispositivo, adopta el valor global por defecto (Ajustes).
  useEffect(() => {
    try { if (!window.localStorage.getItem(CLAVE)) setTema(defecto); } catch { /* sin storage */ }
  }, [defecto]);

  const cambiar = useCallback(() => {
    setTema((t) => { const n = siguienteModo(t); guardarTema(n); return n; });
  }, []);

  return (
    <button
      type="button"
      className="px-tema-btn"
      onClick={cambiar}
      aria-label={`${DESC[tema]}. Pulsa para cambiar de tema.`}
      title={DESC[tema]}
    >
      <span className="px-tema-btn__icono" aria-hidden="true">{ICONO[tema]}</span>
      <span className="px-tema-btn__txt">{NOMBRE[tema]}</span>
    </button>
  );
}
