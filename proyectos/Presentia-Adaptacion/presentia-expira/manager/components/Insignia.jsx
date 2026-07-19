// Insignia.jsx — Badge reutilizable con significado de color CONSTANTE.
// Variantes: exito (verde=correcto) · aviso / en-curso (ámbar=pendiente) ·
//            info (azul) · peligro (rojo=error) · editado (azul admin) · neutral.
// Sin dangerouslySetInnerHTML: sólo texto/children.
import React from "react";

const VARIANTES = new Set([
  "exito",
  "aviso",
  "en-curso",
  "info",
  "peligro",
  "editado",
  "neutral",
]);

/**
 * @param {object} props
 * @param {('exito'|'aviso'|'en-curso'|'info'|'peligro'|'editado'|'neutral')} [props.tipo="info"]
 * @param {boolean} [props.punto=false] muestra un punto de color a la izquierda.
 * @param {React.ReactNode} props.children
 */
export default function Insignia({ tipo = "info", punto = false, children }) {
  const variante = VARIANTES.has(tipo) ? tipo : "info";
  return (
    <span className={`px-insignia px-insignia--${variante}`}>
      {punto ? <span className="px-insignia__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
