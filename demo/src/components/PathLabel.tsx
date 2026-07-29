// PathLabel.tsx — renders the last segment of the current repeat path (the key name).
import { usePath } from "thin-render";
import type { ComponentProps } from "thin-render";

export function PathLabel({}: ComponentProps) {
  const base = usePath();
  const key = base.split("/").pop() ?? "";
  return <>{key}</>;
}
