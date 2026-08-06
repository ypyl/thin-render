// nested-package/DetailPanel.tsx — parent-side panel that subscribes to the
// /detail path the parent's loadDetail handler writes after its "fetch".
import { Stack, Text } from "@mantine/core";
import { useValue, type ComponentProps } from "thin-render";

export interface Detail {
  id: string;
  name: string;
  email: string;
  notes?: string;
  loadedAt?: string;
}

export function DetailPanel(_props: ComponentProps) {
  const detail = useValue<Detail | null>("/detail");
  if (!detail) {
    return (
      <Text c="dimmed" size="sm">
        No detail loaded yet. Click "Load details" in a customer panel.
      </Text>
    );
  }
  return (
    <Stack gap="xs">
      <Text size="sm">
        <b>{detail.name}</b> ({detail.email})
      </Text>
      <Text size="xs" c="dimmed">
        id: {detail.id} — fetched at {detail.loadedAt ?? "?"}
      </Text>
    </Stack>
  );
}
