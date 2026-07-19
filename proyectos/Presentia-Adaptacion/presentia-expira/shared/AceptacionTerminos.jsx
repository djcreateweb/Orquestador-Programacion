// AceptacionTerminos.jsx — Pantalla de aceptación de términos exigida en el PRIMER
// acceso (empleado y admin). Muestra los documentos legales (selector + visor) y
// requiere marcar "He leído y acepto" antes de continuar. Reutilizable en el Manager
// y en el kiosko; estilos autocontenidos vía tokens (shared/aceptacion.css).
import React, { useState } from "react";
import Markdown from "./Markdown.jsx";
import { DOCUMENTOS } from "../legal/contenido.js";
import "./aceptacion.css";

/**
 * @param {object} props
 * @param {Array}  [props.docs=DOCUMENTOS]  documentos a mostrar/aceptar.
 * @param {Function} props.onAceptar        callback al aceptar.
 * @param {Function} [props.onCancelar]     callback opcional (p. ej. salir del kiosko).
 * @param {string} [props.titulo]
 * @param {string} [props.intro]
 * @param {boolean} [props.aceptando=false]  deshabilita el botón mientras se envía.
 * @param {string} [props.error]
 */
export default function AceptacionTerminos({
  docs = DOCUMENTOS,
  onAceptar,
  onCancelar,
  titulo = "Términos y condiciones",
  intro = "Para poder continuar, lee y acepta los términos y condiciones y la información sobre protección de datos. Solo se te pedirá la primera vez.",
  aceptando = false,
  error = null,
}) {
  const [activoId, setActivoId] = useState(docs[0] ? docs[0].id : null);
  const [marcado, setMarcado] = useState(false);
  const doc = docs.find((d) => d.id === activoId) || docs[0] || null;

  return (
    <div className="acepta">
      <div className="acepta__caja" role="dialog" aria-modal="true" aria-labelledby="acepta-titulo">
        <header className="acepta__head">
          <h2 id="acepta-titulo" className="acepta__titulo">{titulo}</h2>
          <p className="acepta__intro">{intro}</p>
        </header>

        {docs.length > 1 ? (
          <nav className="acepta__tabs" aria-label="Documentos">
            {docs.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`acepta__tab ${d.id === activoId ? "acepta__tab--activo" : ""}`}
                onClick={() => setActivoId(d.id)}
              >
                {d.titulo}
              </button>
            ))}
          </nav>
        ) : null}

        <div className="acepta__doc">
          {doc ? <Markdown source={doc.markdown} /> : <p>No hay documentos que mostrar.</p>}
        </div>

        {error ? <div className="acepta__error" role="alert">{error}</div> : null}

        <label className="acepta__check">
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => setMarcado(e.target.checked)}
            disabled={aceptando}
          />
          <span>He leído y <strong>acepto</strong> los términos y condiciones, el aviso legal y la política de privacidad.</span>
        </label>

        <div className="acepta__acciones">
          {onCancelar ? (
            <button type="button" className="acepta__btn acepta__btn--suave" onClick={onCancelar} disabled={aceptando}>
              Cancelar
            </button>
          ) : null}
          <button
            type="button"
            className="acepta__btn acepta__btn--primario"
            onClick={() => onAceptar && onAceptar()}
            disabled={!marcado || aceptando}
          >
            {aceptando ? "Guardando…" : "Aceptar y continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
