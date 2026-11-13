# Vault de ManicuristApp — Schema

Este archivo define cómo se estructura y mantiene el vault de conocimiento del proyecto. Sigue el patrón *LLM Wiki* (ver [`raw/2026-11-13-llm-wiki-pattern.md`](raw/2026-11-13-llm-wiki-pattern.md)): **el humano cura fuentes y hace preguntas; el LLM escribe y mantiene el wiki.**

El vault se abre en Obsidian con `vault/` como raíz.

## Capas

| Capa | Ruta | Quién escribe | Regla |
| --- | --- | --- | --- |
| Fuentes crudas | `raw/` | El humano | **Inmutables.** El LLM las lee, nunca las edita. |
| Adjuntos | `raw/assets/` | El humano / Obsidian | Imágenes y archivos descargados de las fuentes. |
| Código | `../` (el repo) | Humanos + LLM | Fuente de verdad de *cómo funciona* la app. El wiki lo cita, no lo copia. |
| Wiki | `wiki/` | **Solo el LLM** | Síntesis, entidades, conceptos, decisiones. |
| Schema | `CLAUDE.md` (este archivo) | Humano + LLM juntos | Se co-evoluciona; cambios se anotan en `wiki/log.md`. |

Hay **dos tipos de fuente**:

1. **Documentos en `raw/`** — requisitos, notas de reuniones, feedback de usuarias, capturas, artículos, specs de diseño. Nombre: `YYYY-MM-DD-slug.md` (o la extensión original).
2. **El código del repo** — es una fuente *viva*. Cuando cambia, el wiki se re-sincroniza (operación `sync`). Si el wiki y el código se contradicen, **gana el código** y la contradicción se registra.

## Estructura de `wiki/`

```text
wiki/
  index.md          # Catálogo de todas las páginas (leer PRIMERO en cada consulta)
  log.md            # Registro cronológico append-only
  overview.md       # Síntesis de alto nivel del proyecto
  dominio/          # Entidades de negocio: cita, cliente, esmalte, esmaltero…
  arquitectura/     # Conceptos técnicos transversales: multi-tenancy, offline, UI…
  integraciones/    # Servicios externos/nativos: notificaciones, Google Calendar, storage
  pendientes/       # Roadmap, deuda técnica, discrepancias
  fuentes/          # Una página-resumen por cada fuente de raw/
  consultas/        # Respuestas valiosas archivadas (se crea al primer uso)
```

## Formato de página

- Idioma: **español**. Identificadores de código, tablas y rutas tal cual (`nail_polishes`, `useMovePolish`).
- Nombre de archivo: `kebab-case.md`, **único en todo el vault** (Obsidian resuelve `[[enlaces]]` por nombre).
- Enlaces internos: wikilinks de Obsidian `[[cita]]` o `[[cita|Citas]]`.
- Referencias a código: ruta relativa a la raíz del repo en backticks, con línea si aporta: `hooks/useAppointments.ts:139`.
- Frontmatter YAML obligatorio:

```yaml
---
tipo: entidad | concepto | integracion | pendiente | fuente | consulta | overview
tags: [citas, supabase]
actualizado: 2026-11-13
fuentes:            # rutas de código y/o páginas de raw/ que respaldan la página
  - hooks/useAppointments.ts
  - raw/2026-11-13-algo.md
---
```

- Estructura sugerida: un párrafo de resumen → secciones → `## Relacionado` con wikilinks al final.
- Afirmaciones no verificadas o inferidas se marcan con `> [!question]`. Contradicciones con `> [!warning]` y además se listan en [[discrepancias]].
- No copiar bloques grandes de código: resumir y enlazar al archivo.

## Operaciones

### Ingest (nueva fuente en `raw/`)

1. Leer la fuente completa (imágenes en `raw/assets/` por separado si las hay).
2. Comentar con el humano los puntos clave antes de escribir (salvo que pida hacerlo en lote).
3. Crear `wiki/fuentes/<slug>.md` con el resumen.
4. Actualizar todas las páginas de dominio/arquitectura/pendientes afectadas (una fuente suele tocar varias).
5. Si contradice al código o a otra página → `> [!warning]` + entrada en [[discrepancias]].
6. Actualizar `index.md` y añadir entrada en `log.md`.

### Sync (el código cambió)

1. Ver el último commit sincronizado en `log.md` (`grep "^## \[" wiki/log.md | grep sync | tail -1`).
2. `git log --stat <último>..HEAD` para ver qué cambió.
3. Actualizar las páginas cuyas `fuentes:` incluyan archivos modificados; crear páginas para conceptos nuevos.
4. Cerrar en [[discrepancias]] / [[deuda-tecnica]] lo que el cambio haya resuelto.
5. Entrada en `log.md` con el hash hasta el que se sincronizó.

Hacer `sync` al terminar cualquier tarea de código que cambie comportamiento, esquema o convenciones.

### Query (pregunta)

1. Leer `index.md`, luego las páginas relevantes; ir al código si hace falta precisión.
2. Responder citando páginas (`[[...]]`) y archivos.
3. Si la respuesta tiene valor duradero (comparación, análisis, decisión), archivarla en `wiki/consultas/` y enlazarla desde index y páginas relacionadas.
4. Entrada en `log.md`.

### Lint (chequeo de salud)

Buscar y reportar (y corregir lo trivial):
- Contradicciones entre páginas o entre wiki y código.
- Afirmaciones obsoletas (rutas/funciones que ya no existen: verificar con `grep`).
- Páginas huérfanas (sin enlaces entrantes) y wikilinks rotos.
- Conceptos mencionados sin página propia.
- `fuentes:` que apuntan a archivos inexistentes.
- Preguntas abiertas (`[!question]`) que ya se pueden responder.

Entrada en `log.md` con el resultado.

## index.md y log.md

- **index.md**: catálogo por categoría. Cada página: `- [[nombre]] — resumen de una línea`. Se actualiza en cada ingest/sync/query archivada.
- **log.md**: append-only, entradas nuevas **al final**. Prefijo fijo para poder hacer grep:

```text
## [YYYY-MM-DD] <operación> | <título>
```

Operaciones válidas: `init`, `ingest`, `sync`, `query`, `lint`, `schema`.
