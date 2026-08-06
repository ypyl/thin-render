// expressions.ts — pure expression resolution utilities (no React).
//
// Shared internally by the React renderer (via hooks.ts) and the generic
// renderer (renderer-generic.ts). Not exported as public API.
import { getByPath } from "./store.js";

/**
 * Recursively resolve `$state`, `$item`, and `$index` expression objects in a
 * plain params/props record. Arrays pass through without resolution.
 *
 * - `{ $state: "/path" }` → `getByPath(getState(), "/path")` (read-once value)
 * - `{ $item: "field" }`  → `"${basePath}/field"` (absolute path string, not a value)
 * - `{ $item: "" }`        → `basePath` (the repeat scope path itself)
 * - Plain objects recurse; all other values pass through.
 */
export function resolveExpressions(
  params: Record<string, unknown>,
  getState: () => unknown,
  basePath?: string,
  index?: string | number,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(params)) {
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val)
    ) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.$state === "string") {
        out[key] = getByPath(getState(), obj.$state);
      } else if (typeof obj.$item === "string") {
        out[key] = basePath
          ? obj.$item === ""
            ? basePath
            : `${basePath}/${obj.$item}`
          : undefined;
      } else if ("$index" in obj) {
        out[key] = (obj.$index as boolean) ? index : undefined;
      } else {
        out[key] = resolveExpressions(obj, getState, basePath, index);
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Resolve a repeat.path expression to an absolute store path string.
 * - string → passthrough
 * - `{ $item: "<field>" }` → resolved against basePath
 * - `{ $state: "<path>" }` → reads store value at <path> (read-once)
 * - otherwise → undefined
 */
export function resolveRepeatPath(
  expr: unknown,
  getState?: () => unknown,
  basePath?: string,
): string | undefined {
  // $item expression
  if (
    expr !== null &&
    typeof expr === "object" &&
    !Array.isArray(expr) &&
    typeof (expr as Record<string, unknown>).$item === "string"
  ) {
    const field = (expr as { $item: string }).$item;
    if (!basePath) return undefined;
    return field === "" ? basePath : `${basePath}/${field}`;
  }

  // $state expression — read from store (no subscription)
  if (
    expr !== null &&
    typeof expr === "object" &&
    !Array.isArray(expr) &&
    typeof (expr as Record<string, unknown>).$state === "string"
  ) {
    const pointerPath = (expr as { $state: string }).$state;
    const resolved = getByPath(getState?.() , pointerPath);
    if (typeof resolved === "string") return resolved;
    if (resolved !== undefined) {
      console.warn(
        `thin-render: $state expression at "${pointerPath}" resolved to non-string value, expected a path string`,
      );
    }
    return "";
  }

  // String passthrough
  if (typeof expr === "string") return expr;

  return undefined;
}
