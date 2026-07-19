// PresentiaSection.jsx — Contenedor del Manager de Presentia (§3).
// Cabecera "Fichajes" + subtítulo + insignia de modo (ADMIN/TÉCNICO, siempre azul)
// + navegación de 5 sub-pestañas. La sesión es la del host; no maneja tokens.
//
//   <PresentiaSection rol="local_admin" apiBase="/presentia" />
//
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { crearApiManager } from "./api.js";
import Toast, { useToast } from "./components/Toast.jsx";
import Hoy from "./tabs/Hoy.jsx";
import Registros from "./tabs/Registros.jsx";
import InformeHoras from "./tabs/InformeHoras.jsx";
import Solicitudes from "./tabs/Solicitudes.jsx";
import Ajustes from "./tabs/Ajustes.jsx";
import Legal from "./tabs/Legal.jsx";
import AceptacionTerminos from "../shared/AceptacionTerminos.jsx";
import BotonTema from "../shared/BotonTema.jsx";
import "./presentia.css";

const SUBPESTANAS = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "registros", etiqueta: "Registros" },
  { clave: "informe", etiqueta: "Informe de horas" },
  { clave: "solicitudes", etiqueta: "Solicitudes" },
  { clave: "ajustes", etiqueta: "Ajustes" },
  { clave: "legal", etiqueta: "Legal" },
];

/** Insignia de modo: TÉCNICO (technician) o ADMIN (local_admin). Siempre azul admin. */
function InsigniaModo({ rol }) {
  const esTecnico = rol === "technician";
  return (
    <span className="px-modo" title={esTecnico ? "Rol técnico" : "Rol administrador"}>
      <span className="px-modo__llave" aria-hidden="true">🔑</span>
      {esTecnico ? "Modo técnico" : "Modo admin"}
    </span>
  );
}

/**
 * @param {object} props
 * @param {('local_admin'|'technician')} props.rol  rol del actor (sesión del host).
 * @param {string} [props.apiBase="/presentia"]  prefijo de rutas del módulo.
 * @param {string} [props.pestanaInicial="hoy"]
 */
export default function PresentiaSection({ rol = "local_admin", apiBase = "/presentia", pestanaInicial = "hoy" }) {
  const api = useMemo(() => crearApiManager(apiBase), [apiBase]);
  const [activa, setActiva] = useState(pestanaInicial);
  const [pendientes, setPendientes] = useState(0);
  const [aceptado, setAceptado] = useState(null); // null = comprobando; true/false
  const [aceptando, setAceptando] = useState(false);
  const [errorAcepta, setErrorAcepta] = useState(null);
  const [temaDefecto, setTemaDefecto] = useState("auto"); // valor global (Ajustes)
  const { toast, mostrar, ocultar } = useToast();

  const onToast = useCallback((mensaje, tipo, hora) => mostrar(mensaje, tipo, hora), [mostrar]);

  // Comprobación de aceptación de términos (exigida en el primer acceso).
  useEffect(() => {
    let vivo = true;
    api
      .terminos()
      .then((d) => { if (vivo) setAceptado(!!(d && d.aceptado)); })
      .catch(() => { if (vivo) setAceptado(false); }); // ante la duda, exigir aceptación
    return () => { vivo = false; };
  }, [api]);

  const aceptarTerminos = useCallback(async () => {
    setAceptando(true);
    setErrorAcepta(null);
    try {
      await api.aceptarTerminos();
      setAceptado(true);
    } catch (e) {
      setErrorAcepta((e && e.mensaje) || "No se pudo registrar la aceptación. Inténtalo de nuevo.");
    } finally {
      setAceptando(false);
    }
  }, [api]);

  // Contador de pendientes + tema por defecto global (§3). Solo tras aceptar términos.
  useEffect(() => {
    if (aceptado !== true) return undefined;
    let vivo = true;
    api
      .solicitudes("pendiente")
      .then((d) => { if (vivo) setPendientes(Array.isArray(d) ? d.length : 0); })
      .catch(() => { /* el contador es informativo */ });
    api
      .ajustesGet()
      .then((c) => { if (vivo && c && c.temaPorDefecto) setTemaDefecto(c.temaPorDefecto); })
      .catch(() => { /* el tema por defecto es opcional */ });
    return () => { vivo = false; };
  }, [api, aceptado]);

  if (aceptado === null) {
    return (
      <section className="px-root">
        <div className="px-panel"><div className="px-estado">Cargando…</div></div>
      </section>
    );
  }
  if (aceptado === false) {
    return (
      <section className="px-root">
        <AceptacionTerminos
          onAceptar={aceptarTerminos}
          aceptando={aceptando}
          error={errorAcepta}
          intro="Antes de acceder al panel de Presentia debes leer y aceptar los términos y condiciones y la información sobre protección de datos. Solo se te pedirá la primera vez."
        />
      </section>
    );
  }

  return (
    <section className="px-root">
      <header className="px-header">
        <div className="px-header__titles">
          <h2 className="px-title">Fichajes</h2>
          <p className="px-subtitle">Registro de jornada · control horario del equipo</p>
        </div>
        <div className="px-header__acciones">
          <BotonTema defecto={temaDefecto} />
          <InsigniaModo rol={rol} />
        </div>
      </header>

      <nav className="px-tabs" role="tablist" aria-label="Secciones de fichajes">
        {SUBPESTANAS.map((p) => (
          <button
            key={p.clave}
            type="button"
            role="tab"
            aria-selected={activa === p.clave}
            className={`px-tab ${activa === p.clave ? "px-tab--activo" : ""}`}
            onClick={() => setActiva(p.clave)}
          >
            {p.etiqueta}
            {p.clave === "solicitudes" && pendientes > 0 ? (
              <span className="px-tab__contador">{pendientes}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <div>
        {activa === "hoy" ? <Hoy api={api} /> : null}
        {activa === "registros" ? <Registros api={api} onToast={onToast} /> : null}
        {activa === "informe" ? <InformeHoras api={api} /> : null}
        {activa === "solicitudes" ? (
          <Solicitudes api={api} onToast={onToast} onPendientesChange={setPendientes} />
        ) : null}
        {activa === "ajustes" ? <Ajustes api={api} onToast={onToast} /> : null}
        {activa === "legal" ? <Legal /> : null}
      </div>

      <Toast toast={toast} onClose={ocultar} />
    </section>
  );
}
