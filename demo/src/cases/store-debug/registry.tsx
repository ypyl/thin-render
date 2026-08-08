// store-debug/registry.tsx — components for the store debugging demo:
// shared demo components plus a small StoreValue that renders a store path.
import { Text } from "@mantine/core";
import { useValue, type ComponentProps, type Registry } from "thin-render";
import { ActionButton } from "../../components/ActionButton";
import { BoundField } from "../../components/BoundField";
import { CaseContainer } from "../../components/CaseContainer";
import { PathLabel } from "../../components/PathLabel";
import { StackRow } from "../../components/StackRow";

/** Renders a store path's live value with a label (read-only). */
function StoreValue({ element }: ComponentProps) {
  const value = useValue<string>(String(element.props?.bind ?? ""));
  const label = String(element.props?.label ?? "");
  return (
    <Text size="sm">
      <Text span c="dimmed">
        {label}:{" "}
      </Text>
      <Text span>{value ?? "—"}</Text>
    </Text>
  );
}

export const registry: Registry = {
  CaseContainer,
  StackRow,
  BoundField,
  PathLabel,
  ActionButton,
  StoreValue,
};
