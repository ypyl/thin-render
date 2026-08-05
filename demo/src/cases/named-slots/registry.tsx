// named-slots/registry.tsx — components used by the Named Slots demo.
import { Text } from "@mantine/core";
import { usePath, useValue, type ComponentProps, type Registry } from "thin-render";
import { CaseContainer } from "../../components/CaseContainer";
import { Page } from "../../components/Page";
import { SlotCard } from "../../components/SlotCard";
import { StaticText } from "../../components/StaticText";

/** Reads a field relative to the current repeat scope (usePath). */
function SlotText({ element }: ComponentProps) {
  const base = usePath();
  const text = useValue<string>(`${base}/${String(element.props?.field)}`);
  // component="div" avoids <p> inside <p> when nested in other Text components
  return <Text component="div" size="sm">{text}</Text>;
}

export const registry: Registry = {
  CaseContainer,
  Page,
  SlotCard,
  StaticText,
  SlotText,
};
