// Legal.jsx — Pestaña "Legal" del Manager: visor de los documentos legales del
// módulo (fuente: legal/*.md vía legal/contenido.js), agrupados por categoría, con
// impresión y descarga (.md) para ponerlos a disposición de trabajador, RLT e
// Inspección. Sólo lectura; los textos se editan en legal/*.md y se regeneran.
import React, { useState, useMemo } from "react";
import Markdown from "../../shared/Markdown.jsx";
import { documentosPorCategoria, documentoPorId, DOCUMENTOS } from "../../legal/contenido.js";

export default function Legal() {
  const grupos = useMemo(() => documentosPorCategoria(), []);
  const [activoId, setActivoId] = useState(DOCUMENTOS[0] ? DOCUMENTOS[0].id : null);
  const [filtro, setFiltro] = useState("");
  const doc = documentoPorId(activoId);

  const q = filtro.trim().toLowerCase();
  const coincide = (d) => !q || d.titulo.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q);

  const descargar = () => {
    if (!doc) return;
    const blob = new Blob([doc.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.archivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-panel px-legal">
      <aside className="px-legal__aside" aria-label="Índice de documentos legales">
        <input
          className="px-input px-legal__buscar"
          type="search"
          placeholder="Buscar documento…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Buscar documento legal"
        />
        {grupos.map((g) => {
          const docs = g.documentos.filter(coincide);
          if (docs.length === 0) return null;
          return (
            <div className="px-legal__grupo" key={g.categoria}>
              <p className="px-legal__cat">{g.categoria}</p>
              {docs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`px-legal__item ${d.id === activoId ? "px-legal__item--activo" : ""}`}
                  onClick={() => setActivoId(d.id)}
                >
                  <span className="px-legal__item-titulo">{d.titulo}</span>
                  {d.empleado ? <span className="px-legal__chip" title="Visible también para el empleado en el kiosko">Empleado</span> : null}
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      <div className="px-legal__contenido">
        {doc ? (
          <>
            <div className="px-legal__toolbar">
              <span className="px-text-muted px-legal__ruta">legal/{doc.archivo}</span>
              <div className="px-row">
                <button type="button" className="px-btn px-btn--suave px-btn--sm" onClick={() => window.print()}>
                  Imprimir
                </button>
                <button type="button" className="px-btn px-btn--primario px-btn--sm" onClick={descargar}>
                  Descargar .md
                </button>
              </div>
            </div>
            <div className="px-legal__doc">
              <Markdown source={doc.markdown} />
            </div>
          </>
        ) : (
          <div className="px-estado">No hay documentos legales disponibles.</div>
        )}
      </div>
    </div>
  );
}
