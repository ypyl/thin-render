// nested-package/child/components.tsx — components owned by the child package.
// Both bind relative to the child's root scope (usePath, "" at the child
// boundary), which the EmbeddedChild boundary rebases onto the occurrence's
// base path in the parent store.
import { Stack, Text, TextInput } from "@mantine/core";
import { useValue, useBound, usePath, type ComponentProps } from "thin-render";

/** Resolve a relative `bind` prop against the current scope path. */
function bindPath(bind: string): string {
  const base = usePath();
  return base ? `${base}/${bind}` : bind;
}

/** Read-only label/value row bound to a child-store path. */
export function InfoField({ element }: ComponentProps) {
  const path = bindPath(String(element.props?.bind ?? ""));
  const value = useValue<string>(path);
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed">{String(element.props?.label ?? "")}</Text>
      <Text>{value ?? "—"}</Text>
    </Stack>
  );
}

/** Always-editable text input bound to a child-store path (unlike the demo's
 * BoundField, it does not depend on an /editingSection flag). */
export function NotesField({ element }: ComponentProps) {
  const path = bindPath(String(element.props?.bind ?? ""));
  const [value, setValue] = useBound<string>(path);
  return (
    <TextInput
      value={value ?? ""}
      onChange={(e) => setValue(e.currentTarget.value)}
      label={String(element.props?.label ?? "")}
    />
  );
}
