// GridRow.tsx — responsive grid wrapper (Mantine SimpleGrid) for spec layouts.
import { SimpleGrid } from "@mantine/core";
import type { ComponentProps } from "thin-render";

export function GridRow({ element, children }: ComponentProps) {
  const cols =
    (element.props?.cols as number | { base: number; sm?: number; lg?: number } | undefined) ?? 2;
  const spacing = (element.props?.spacing as string | number | undefined) ?? "lg";
  return (
    <SimpleGrid cols={cols} spacing={spacing}>
      {children}
    </SimpleGrid>
  );
}
