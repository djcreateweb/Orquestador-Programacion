// 09-timezone-frontend.mjs — HALLAZGO: fmtHora() (tabla) fuerza SIEMPRE Europe/Madrid,
// pero tsAInputLocal()/inputLocalATs() (modales Editar/Añadir marca) usan la zona
// horaria LOCAL DEL PROCESO/NAVEGADOR. Si el admin no está en Europe/Madrid, el valor
// precargado en el modal NO coincide con lo que ve en la tabla → riesgo de guardar una
// hora ABSOLUTA equivocada (desfase de horas) sin ningún aviso.
//
// Se fija process.env.TZ ANTES de cualquier uso de Date/Intl para simular un admin
// cuyo sistema operativo/navegador está en otra zona horaria (América/Nueva York).
process.env.TZ = 'America/New_York';

const { fmtHora, tsAInputLocal, inputLocalATs } = await import('../../manager/api.js');

function assert(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

console.log('Zona horaria resuelta del proceso (simulando el navegador del admin):', Intl.DateTimeFormat().resolvedOptions().timeZone);

// 14:00 en Europe/Madrid (verano, UTC+2) del 13-jul-2026 == 12:00 UTC == 08:00 en New York (UTC-4)
const ts = Date.UTC(2026, 6, 13, 12, 0, 0);

const horaTabla = fmtHora(ts); // lo que el admin VE en Hoy/Registros/Informe
const valorModal = tsAInputLocal(ts); // lo que el admin VE precargado al pulsar "Editar"

console.log('Tabla (fmtHora, Europe/Madrid hardcoded):', horaTabla);
console.log('Modal "Editar marca" (tsAInputLocal, zona LOCAL del proceso):', valorModal);

assert(horaTabla === '14:00', 'la tabla muestra 14:00 (Madrid) sin importar la zona del navegador');
assert(valorModal.endsWith('T08:00'), 'el modal precarga 08:00 (Nueva York) para la MISMA marca -> 6h de discrepancia visual');
assert(!valorModal.endsWith('T14:00'), 'CONFIRMADO: el modal NO coincide con la hora mostrada en la tabla (14:00 vs 08:00)');

// Escenario de corrupción real: el admin quiere fijar la entrada en "14:05" (la hora que
// le ha dicho el empleado, en la convención de Madrid que usa el resto de la app) y teclea
// "14:05" directamente en el campo datetime-local del modal.
const tsGuardado = inputLocalATs('2026-07-13T14:05');
const horaResultanteEnMadrid = fmtHora(tsGuardado);
console.log('Admin teclea "14:05" pensando en hora de Madrid -> se guarda como', new Date(tsGuardado).toISOString(), '-> en Madrid equivale a', horaResultanteEnMadrid);
assert(horaResultanteEnMadrid !== '14:05', `CONFIRMADO — CORRUPCIÓN SILENCIOSA: admin teclea "14:05" esperando 14:05 Madrid, pero el sistema lo interpreta como 14:05 en SU zona local y lo guarda como ${horaResultanteEnMadrid} en Madrid (desfase de ${(new Date(tsGuardado).getTime() - Date.UTC(2026,6,13,12,5,0))/3600000}h)`);

console.log('--- fin 09-timezone-frontend.mjs ---');
