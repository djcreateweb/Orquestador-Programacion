# 04 · SUITE DE REGRESIÓN

Cada defecto encontrado se ha convertido en **test automático permanente** para que no
vuelva. La auditoría es reproducible en una orden.

## Cómo ejecutarla

```bash
cd presentia-expira
npm test                 # 78 casos: dominio + flujos + seguridad + migración + AUDITORÍA
```

Sub-suite de auditoría aislada:

```bash
node --test test/auditoria.test.js
```

Semilla rica reproducible (BD en memoria, imprime resumen):

```bash
node auditoria/seed/seed.mjs
```

Verificaciones estáticas (evidencia en `03-EVIDENCIAS/`):

```bash
for f in $(git ls-files 'src/**/*.js'); do node --check "$f"; done   # lint
cd dev-preview && npm audit && npm run build                         # deps + build frontend
```

## Ficheros de la auditoría

| Fichero | Contenido |
|---|---|
| `test/auditoria.test.js` | 50 casos nuevos (C1–C10), incl. regresiones de DEF-001 y DEF-002 |
| `auditoria/seed/seed.mjs` | Semilla rica y reproducible (empleados diversos, jornadas, volumen 5k) |
| `auditoria/00-CATALOGO.md` | Catálogo CU-001…CU-064 + matriz de permisos |
| `auditoria/01-INFORME-AUDITORIA.md` | Veredicto, cobertura, limitaciones |
| `auditoria/02-DEFECTOS.md` | DEF-001, DEF-002 + observaciones |
| `auditoria/03-EVIDENCIAS/` | Salida real de la suite y de las verificaciones |

## Regresiones clave (no deben volver a fallar)

- **DEF-001** → `CU-034 · REGRESIÓN turno de noche` y `CU-025 · Informe horas`.
- **DEF-002** → `CU-045 · inyección CSV neutralizada`.

## Estado actual

```
tests 78 · pass 78 · fail 0
npm audit: found 0 vulnerabilities
build frontend: ✓ 43 módulos, dist generado
lint (node --check): OK en todos los ficheros
```
