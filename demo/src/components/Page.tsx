// Page.tsx — places named children (record-form slots) at layout positions.
import { Box, Group, Paper, Text } from "@mantine/core";
import type { ComponentProps } from "thin-render";

export function Page({ slots }: ComponentProps) {
  return (
    <Paper shadow="sm" p="md" withBorder mb="lg">
      <header>{slots?.header}</header>
      <Group align="flex-start" mt="sm">
        <Box w={180} style={{ flexShrink: 0 }}>
          <Text fw={600} size="sm" mb={4}>Sidebar</Text>
          {slots?.sidebar}
        </Box>
        <Box style={{ flex: 1 }}>
          <Text fw={600} size="sm" mb={4}>Content</Text>
          {slots?.content}
        </Box>
      </Group>
      <footer style={{ marginTop: "var(--mantine-spacing-md)" }}>
        {slots?.footer}
      </footer>
    </Paper>
  );
}
