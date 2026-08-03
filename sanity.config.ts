/**
 * The Sanity CLI (`sanity dev`/`build`/`deploy`/`manage`) requires a
 * `sanity.config.{js,ts}` file in the project root to resolve the Studio's
 * config — there is no CLI option to point it at a different path, so this
 * project's actual config lives at `tools/sanity/config/index.tsx` (matching
 * the rest of this repo's `tools/`-based structure) and this file just
 * re-exports it, rather than duplicating it here.
 */
export { default } from './tools/sanity/config';
