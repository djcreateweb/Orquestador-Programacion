// InfoLegal.jsx — Pantalla del kiosko con la información legal dirigida al EMPLEADO
// (cláusula informativa RGPD y política de privacidad), fuente legal/*.md. Accesible
// desde el aviso de tratamiento y desde el panel de fichaje. Sólo lectura.
import React, { useState } from "react";
import Markdown from "../shared/Markdown.jsx";
import { documentosEmpleado, documentoPorId } from "../legal/contenido.js";
import "./kiosk.css";

export default function InfoLegal({ onVolver, docInicial }) {
  const docs = documentosEmpleado();
  const [activoId, setActivoId] = useState(docInicial || (docs[0] && docs[0].id) || null);
  const doc = documentoPorId(activoId);

  return (
    <div className="pk-superficie">
      <button type="button" className="pk-volver" onClick={onVolver}>← Volver</button>
      <h2 className="pk-titulo-pantalla">Información legal y tus derechos</h2>

      {docs.length > 1 ? (
        <div className="pk-legal-tabs">
          {docs.map((d) => (
            <button
              type="button"
              key={d.id}
              className={`pk-btn ${d.id === activoId ? "pk-btn--primario" : ""}`}
              onClick={() => setActivoId(d.id)}
            >
              {d.titulo}
            </button>
          ))}
        </div>
      ) : null}

      {doc ? (
        <div className="pk-legal-doc">
          <Markdown source={doc.markdown} />
        </div>
      ) : (
        <div className="pk-estado">No hay información legal disponible.</div>
      )}
    </div>
  );
}
