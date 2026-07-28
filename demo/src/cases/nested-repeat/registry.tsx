// nested-repeat/registry.ts — components for the nested repeat demo.
import { Paper, Title, Group, Box, Text } from "@mantine/core";
import { type ComponentProps, useRepeatPath, useValue } from "thin-render";
import { BoundField } from "../../components/BoundField";
import { CaseContainer } from "../../components/CaseContainer";
import type { Registry } from "thin-render";

/** Wraps child items in a Paper with the category name shown via a child element. */
function CategoryGroup({ children }: ComponentProps) {
  return (
    <Paper shadow="xs" p="sm" withBorder mb="md">
      {children}
    </Paper>
  );
}

/** Reads the category name from the current repeat scope. Must be a child of the outer repeat. */
function CategoryTitle({}: ComponentProps) {
  const base = useRepeatPath();
  const name = useValue<string>(`${base}/name`);
  return (
    <Title order={5} mb="xs">
      {name ?? "Unknown"}
    </Title>
  );
}

/** Wraps child BoundFields in a row. Must be a child of the inner repeat. */
function ItemRow({ children }: ComponentProps) {
  return (
    <Group gap="md" mb="xs">
      {children}
    </Group>
  );
}

export const registry: Registry = {
  CaseContainer,
  CategoryGroup,
  CategoryTitle,
  ItemRow,
  BoundField,
};
