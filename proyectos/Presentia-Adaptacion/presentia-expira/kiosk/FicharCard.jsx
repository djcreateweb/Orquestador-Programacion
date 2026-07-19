// FicharCard.jsx — Tarjeta grande VERDE del menú del kiosko (§ diseño). Las de
// cocina serían azules; ésta es la de fichaje, en verde de empleado. Al pulsarla
// abre la pantalla de fichaje (el host decide la navegación con `onOpen`).
import React from "react";
import "./kiosk.css";

/**
 * @param {object} props
 * @param {Function} props.onOpen  se invoca al pulsar la tarjeta.
 * @param {string} [props.titulo="Fichar"]
 * @param {string} [props.subtitulo="Registra tu entrada o salida"]
 * @param {boolean} [props.visible=true]  si el ajuste "mostrarEnKiosko" está activo.
 */
export default function FicharCard({
  onOpen,
  titulo = "Fichar",
  subtitulo = "Registra tu entrada o salida",
  visible = true,
}) {
  if (!visible) return null;
  return (
    <div className="pk-root">
      <button type="button" className="pk-card" onClick={onOpen}>
        <span className="pk-card__icono" aria-hidden="true">🕒</span>
        <span className="pk-card__texto">
          <span className="pk-card__titulo">{titulo}</span>
          <span className="pk-card__sub">{subtitulo}</span>
        </span>
      </button>
    </div>
  );
}
