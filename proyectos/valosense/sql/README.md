# SQL · ValoSense

Un único dump completo de la base de datos `valosense`. Esquema + datos consolidados.

MySQL local (XAMPP): `127.0.0.1:3307`, usuario `root` sin contraseña.

## Restaurar

```bash
"C:/xampp/mysql/bin/mysql.exe" -h 127.0.0.1 -P 3307 -u root < sql/valosense.sql
```

O en phpMyAdmin: pestaña "Importar" sobre el server (sin seleccionar BD: el dump ya crea `valosense`).

## Contenido

- 25 agentes + 123 metas por mapa (tiers S/A/B).
- 275 lineups aprobados con descripciones únicas.
- 45 vídeos de entrenamiento (por rango y categoría).
- 19 usuarios de prueba (incluye admin).
- 17 mensajes demo (usuarios 20↔8) que muestran los 5 tipos de chat.

## Regenerar el dump

Si la BD real cambia y queremos dejarla reflejada en el repo:

```bash
"C:/xampp/mysql/bin/mysqldump.exe" -h 127.0.0.1 -P 3307 -u root \
  --default-character-set=utf8mb4 --skip-dump-date --skip-comments \
  --add-drop-table --routines --triggers --single-transaction \
  valosense > sql/valosense.sql
```

Luego reañadir manualmente la cabecera con el `CREATE DATABASE IF NOT EXISTS` al principio.
