// AvisoTratamiento.jsx — Aviso RGPD de tratamiento de datos que se muestra la
// PRIMERA VEZ en el kiosko (§ diseño / cumplimiento). Informa del fin (registro de
// jornada, art. 34.9 ET), datos tratados, conservación y ausencia de biometría y
// geolocalización (D-011). Sólo texto (sin dangerouslySetInnerHTML).
//
// La aceptación se guarda en localStorage (una marca booleana, NUNCA el token de
// sesión). El host puede sobreescribir el texto del responsable con `responsable`.
import React, { useState, useEffect } from "react";
import Markdown from "../shared/Markdown.jsx";
import { documentoPorId } from "../legal/contenido.js";
import "./kiosk.css";

const CLAVE_DEFECTO = "presentia.avisoTratamiento.v1";

/**
 * @param {object} props
 * @param {Function} [props.onAceptar]   callback tras aceptar.
 * @param {string}   [props.responsable] nombre del responsable del tratamiento.
 * @param {string}   [props.persistKey]  clave de localStorage para recordar la aceptación.
 * @param {boolean}  [props.forzar=false] fuerza mostrarlo aunque ya se aceptara.
 */
export default function AvisoTratamiento({
  onAceptar,
  responsable = "la dirección del centro (responsable del tratamiento)",
  persistKey = CLAVE_DEFECTO,
  forzar = false,
}) {
  const [visible, setVisible] = useState(false);
  const [verMas, setVerMas] = useState(false);
  const clausula = documentoPorId("clausula-informativa");

  useEffect(() => {
    let aceptado = false;
    try {
      aceptado = window.localStorage.getItem(persistKey) === "1";
    } catch {
      aceptado = false; // sin acceso a storage: se muestra (fail-safe informativo)
    }
    setVisible(forzar || !aceptado);
  }, [persistKey, forzar]);

  if (!visible) return null;

  const aceptar = () => {
    try {
      window.localStorage.setItem(persistKey, "1");
    } catch {
      /* si no hay storage, se acepta sólo para esta sesión */
    }
    setVisible(false);
    onAceptar && onAceptar();
  };

  return (
    <div className="pk-aviso-overlay" role="dialog" aria-modal="true" aria-labelledby="pk-aviso-titulo">
      <div className="pk-aviso">
        <h2 id="pk-aviso-titulo" className="pk-aviso__titulo">Información sobre el tratamiento de datos</h2>
        <div className="pk-aviso__cuerpo">
          <p>
            Este dispositivo registra tu jornada laboral (entradas y salidas) en
            cumplimiento del artículo 34.9 del Estatuto de los Trabajadores.
          </p>
          <p><strong>Responsable:</strong> {responsable}.</p>
          <p><strong>Finalidad:</strong> control horario y registro de la jornada.</p>
          <p><strong>Datos tratados:</strong></p>
          <ul>
            <li>Tu nombre y las marcas de entrada y salida.</li>
            <li>La fecha, la hora y el código de la jornada.</li>
          </ul>
          <p>
            <strong>No se recogen datos biométricos ni de geolocalización.</strong> La
            identificación se hace con tu PIN personal.
          </p>
          <p>
            <strong>Conservación:</strong> el registro se conserva durante el plazo legal
            (mínimo 4 años). Puedes ejercer tus derechos de acceso, rectificación,
            supresión y oposición ante el responsable indicado.
          </p>
          {clausula ? (
            <button type="button" className="pk-enlace-legal" onClick={() => setVerMas((v) => !v)} aria-expanded={verMas}>
              {verMas ? "Ocultar la información completa" : "Ver la información completa"}
            </button>
          ) : null}
          {verMas && clausula ? (
            <div className="pk-aviso__mas">
              <Markdown source={clausula.markdown} />
            </div>
          ) : null}
        </div>
        <div className="pk-aviso__acciones">
          <button type="button" className="pk-btn pk-btn--primario" onClick={aceptar}>
            He leído y lo entiendo
          </button>
        </div>
      </div>
    </div>
  );
}
