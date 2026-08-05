// Switch.tsx — renders the slot whose name matches the value at props.path.
// Uses named children (record-form children): each slot name is a store value
// (e.g. "loading", "loaded", "error") and the matching slot renders.
import { useValue } from "thin-render";
import type { ComponentProps } from "thin-render";

export function Switch({ element, slots }: ComponentProps) {
  const value = useValue<string>(String(element.props?.path ?? ""));
  if (value == null) return null;
  return slots?.[value] ?? null;
}
