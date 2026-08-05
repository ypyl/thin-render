// SlotCard.tsx — one card per repeat item; title/body come from named slots.
// In repeat + record-form children, the renderer creates one component
// instance per item, each with its own slots scoped to the item's path.
import { Paper, Text } from "@mantine/core";
import type { ComponentProps } from "thin-render";

export function SlotCard({ slots }: ComponentProps) {
  return (
    <Paper shadow="xs" p="sm" withBorder>
      <Text fw={600}>{slots?.title}</Text>
      <Text size="sm" c="dimmed">{slots?.body}</Text>
    </Paper>
  );
}
