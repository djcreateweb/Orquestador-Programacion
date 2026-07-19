// Markdown.jsx — Renderiza markdown a elementos React de forma SEGURA. NO usa
// dangerouslySetInnerHTML: construye nodos React a partir del árbol de bloques/tokens
// de markdown-parse.js (puro y testeable). Estilo vía prosa.css (tokens, cero hardcode).
import React from "react";
import { parsearMarkdown, parsearInline } from "./markdown-parse.js";
import "./prosa.css";

/** Renderiza texto con saltos de línea suaves (\n → <br/>). */
function ConSaltos({ texto }) {
  const lineas = String(texto ?? "").split("\n");
  return (
    <>
      {lineas.map((ln, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <br /> : null}
          <EnLinea texto={ln} />
        </React.Fragment>
      ))}
    </>
  );
}

/** Renderiza el texto en línea (negrita, cursiva, código, enlaces). */
function EnLinea({ texto }) {
  const tokens = parsearInline(texto);
  return (
    <>
      {tokens.map((tk, i) => {
        if (tk.t === "bold") return <strong key={i}>{tk.v}</strong>;
        if (tk.t === "italic") return <em key={i}>{tk.v}</em>;
        if (tk.t === "code") return <code key={i} className="prosa__code">{tk.v}</code>;
        if (tk.t === "link") {
          return (
            <a key={i} className="prosa__link" href={tk.href} target="_blank" rel="noopener noreferrer">
              {tk.v}
            </a>
          );
        }
        return <React.Fragment key={i}>{tk.v}</React.Fragment>;
      })}
    </>
  );
}

/**
 * @param {object} props
 * @param {string} props.source  documento markdown.
 * @param {string} [props.className]
 */
export default function Markdown({ source, className = "" }) {
  const bloques = parsearMarkdown(source);
  return (
    <div className={`prosa ${className}`.trim()}>
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case "h1": return <h1 key={i} className="prosa__h1"><EnLinea texto={b.texto} /></h1>;
          case "h2": return <h2 key={i} className="prosa__h2"><EnLinea texto={b.texto} /></h2>;
          case "h3": return <h3 key={i} className="prosa__h3"><EnLinea texto={b.texto} /></h3>;
          case "h4": return <h4 key={i} className="prosa__h4"><EnLinea texto={b.texto} /></h4>;
          case "hr": return <hr key={i} className="prosa__hr" />;
          case "codigo": return <pre key={i} className="prosa__pre"><code>{b.texto}</code></pre>;
          case "cita": return <blockquote key={i} className="prosa__cita"><ConSaltos texto={b.texto} /></blockquote>;
          case "ul":
            return (
              <ul key={i} className="prosa__ul">
                {b.items.map((it, j) => <li key={j}><EnLinea texto={it} /></li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="prosa__ol">
                {b.items.map((it, j) => <li key={j}><EnLinea texto={it} /></li>)}
              </ol>
            );
          case "tabla":
            return (
              <div key={i} className="prosa__tabla-wrap">
                <table className="prosa__tabla">
                  <thead>
                    <tr>{b.cabecera.map((c, j) => <th key={j}><EnLinea texto={c} /></th>)}</tr>
                  </thead>
                  <tbody>
                    {b.filas.map((fila, r) => (
                      <tr key={r}>{fila.map((c, j) => <td key={j}><EnLinea texto={c} /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={i} className="prosa__p"><ConSaltos texto={b.texto} /></p>;
        }
      })}
    </div>
  );
}
