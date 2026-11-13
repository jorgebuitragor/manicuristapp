---
tipo: fuente
tags: [fuentes, meta, metodologia]
actualizado: 2026-11-13
fuentes:
  - raw/2026-11-13-llm-wiki-pattern.md
---

# Fuente: patrón "LLM Wiki"

**Archivo:** `raw/2026-11-13-llm-wiki-pattern.md` · **Aportado por:** el usuario, al pedir la creación del vault.

## Resumen

Propone que un LLM **construya y mantenga de forma incremental un wiki persistente** de markdown, en lugar de redescubrir el conocimiento en cada pregunta (como hace RAG). El conocimiento se compila una vez y se mantiene al día; las referencias cruzadas y las contradicciones ya están resueltas cuando llega la pregunta.

- **Tres capas**: fuentes crudas inmutables → wiki escrito por el LLM → schema (CLAUDE.md) que define convenciones y flujos.
- **Tres operaciones**: *ingest* (procesar una fuente y propagarla a 10–15 páginas), *query* (responder desde el wiki y archivar las buenas respuestas), *lint* (contradicciones, huérfanas, datos obsoletos, huecos).
- **Dos archivos especiales**: `index.md` (catálogo por contenido) y `log.md` (cronológico, con prefijo `## [fecha] operación | título` para poder hacer grep).
- **Herramientas**: Obsidian como visor (vista de grafo, Dataview sobre el frontmatter, Web Clipper, descarga de adjuntos a `raw/assets/`), git para el historial y, opcionalmente, un buscador (`qmd`) cuando el índice no dé abasto.
- Idea de fondo: lo caro de un wiki es el mantenimiento, y para un LLM ese coste es casi cero.

## Cómo se aplicó en este proyecto

| Del patrón | Adaptación en ManicuristApp |
| --- | --- |
| Fuentes crudas | `raw/` **más el propio código del repo** como fuente viva |
| Ingest | Igual, y además una operación **sync** para cuando cambia el código |
| Lint | Incluye comprobar que el wiki no contradice el código |
| Contradicciones | Se centralizan en [[discrepancias]] |
| Schema | `vault/CLAUDE.md` (Claude Code lo carga al trabajar dentro de `vault/`) |
| Formato | Wikilinks de Obsidian, frontmatter YAML con `fuentes:` (rutas de código o raw) |

## Relacionado

[[index]] · [[log]] · [[overview]]
