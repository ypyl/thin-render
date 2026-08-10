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
 * - `{ $item: "field", $scope: N }` → resolved against the scope stack at depth N
 * - `{ $item: "" }`        → `basePath` (the repeat scope path itself)
 * - Plain objects recurse; all other values pass through.
 */
export function resolveExpressions(
  params: Record<string, unknown>,
  getState: () => unknown,
  scopes?: string[],
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
        const base = scopes ? scopes[scopeDepth(obj.$scope)] : undefined;
        out[key] = base
          ? obj.$item === ""
            ? base
            : `${base}/${obj.$item}`
          : undefined;
      } else if ("$index" in obj) {
        out[key] = (obj.$index as boolean) ? index : undefined;
      } else {
        out[key] = resolveExpressions(obj, getState, scopes, index);
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

/**
 * Validate a `$scope` value into a stack depth. Absent → 0 (innermost scope,
 * current behavior). Non-negative integers pass through. Any other value
 * (negative, non-integer, string) → -1, which resolves to `undefined` when
 * used as an array index — mirroring `usePath(offset)` out-of-range behavior.
 */
export function scopeDepth(scope: unknown): number {
  if (scope === undefined) return 0;
  if (typeof scope === "number" && Number.isInteger(scope) && scope >= 0) return scope;
  return -1;
}

/** Extract the validated `$scope` depth from an expression object (0 for non-objects). */
export function scopeDepthOf(expr: unknown): number {
  if (expr !== null && typeof expr === "object" && !Array.isArray(expr)) {
    return scopeDepth((expr as Record<string, unknown>).$scope);
  }
  return 0;
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
