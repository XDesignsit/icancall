/**
 * Joins class names, dropping falsy values.
 *
 * The design system is class-driven: every component here composes the
 * existing selectors in `globals.css` rather than introducing new ones.
 * Those class names are also shipped by the standalone HTML exports, so
 * they must never be renamed.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
