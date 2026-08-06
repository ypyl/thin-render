// HomePage.tsx — landing page with feature cards for each demo case.
import { Link } from "wouter";
import { Card, Container, SimpleGrid, Text, Title, Anchor } from "@mantine/core";

const CASES = [
  {
    route: "/basic",
    emoji: "📄",
    title: "Basic",
    description: "Renders a static greeting from a JSON spec — demonstrates the Renderer component and type-driven element resolution.",
  },
  {
    route: "/form",
    emoji: "📝",
    title: "Form",
    description: "Editable fields with edit/save/cancel toggle — demonstrates useBound two-way bindings and on action handlers.",
  },
  {
    route: "/actions",
    emoji: "⚡",
    title: "Actions",
    description: "Button click dispatches an action that writes to the store — demonstrates the emit action system and on.click handlers.",
  },
  {
    route: "/large",
    emoji: "📊",
    title: "Large",
    description: "1,000-row repeat with inline-editable cells — demonstrates the repeat directive and granular per-path subscriptions at scale.",
  },
  {
    route: "/table",
    emoji: "📋",
    title: "Table",
    description: "1,000-row HTML table with <thead>/<tbody> — demonstrates composing semantic HTML via repeat on <tr> elements.",
  },
  {
    route: "/switch",
    emoji: "🔀",
    title: "Switch",
    description: "Toggle between loading, loaded, and error states — demonstrates the Switch component and conditional rendering with useValue.",
  },
  {
    route: "/detail-modal",
    emoji: "🔍",
    title: "Detail Modal",
    description: "Click a row to load details from a simulated backend — demonstrates interdependent state, async handlers, and the Modal component.",
  },
  {
    route: "/two-store",
    emoji: "🪞",
    title: "Two Store",
    description: "Two independent stores side by side — change settings on the left, click Apply to update the live preview on the right.",
  },
  {
    route: "/feature-flags",
    emoji: "🚩",
    title: "Feature Flags",
    description: "Dashboard with toggle switches, rollout sliders, badges, and alerts — showcases five Mantine components in a single page.",
  },
  {
    route: "/translations",
    emoji: "🌐",
    title: "Translations",
    description: "Editable translation strings using repeat on a plain object — demonstrates object key iteration and in-place value editing.",
  },
  {
    route: "/dnd-table",
    emoji: "↕️",
    title: "Drag & Drop",
    description: "Sortable table with drag-and-drop row reordering, add, and remove — powered by @dnd-kit with the store as source of truth.",
  },
  {
    route: "/mantine-table",
    emoji: "📑",
    title: "Mantine Table",
    description: "Mantine-styled table with pagination — 300 rows, 10 per page. Pagination state lives in the store.",
  },
  {
    route: "/dynamic-columns",
    emoji: "🧬",
    title: "Dynamic Columns",
    description: "Static spec, runtime-unknown columns — rows and cells repeat independently, and each cell resolves its value across the two repeat scopes via usePath(1). Switching datasets changes the column set with no spec regeneration.",
  },
  {
    route: "/nested-repeat",
    emoji: "🪆",
    title: "Nested Repeat",
    description: "Two-level nested repeat — categories contain items, inner repeat uses { $item: 'items' } to resolve against the outer scope.",
  },
  {
    route: "/named-slots",
    emoji: "🧩",
    title: "Named Slots",
    description: "Record-form children map slot names to elements — a Page component renders header/sidebar/content/footer at different positions, and repeat builds per-item slot instances.",
  },
  {
    route: "/docx-export",
    emoji: "📄",
    title: "DOCX Export",
    description: "Edit data in an interactive table, then export to a downloadable .docx file — demonstrates renderGeneric with separate React and DOCX specs, registry-side expression resolution via ctx, and the docx npm package.",
  },
  {
    route: "/xlsx-export",
    emoji: "📊",
    title: "XLSX Export",
    description: "Edit data in a table, then export to a downloadable .xlsx spreadsheet — demonstrates renderGeneric with the xlsx (SheetJS) package.",
  },
  {
    route: "/nested-package",
    emoji: "🧺",
    title: "Nested Package",
    description: "A self-contained child package (own spec, registry, components) embedded at multiple places of a bigger spec sharing one store — store views, write-back, and parent.* bridge actions.",
  },
];

export function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Title order={2} ta="center" mb="xs">
        thin-render demo
      </Title>
      <Text c="dimmed" ta="center" mb="xl" maw={600} mx="auto">
        A minimal spec-driven React UI renderer with granular per-path subscriptions.
        Each demo below is a self-contained example built from the same public API.
      </Text>
      <Anchor
        href="https://github.com/ypyl/thin-render"
        target="_blank"
        size="sm"
        ta="center"
        display="block"
        mb="xl"
      >
        View source on GitHub →
      </Anchor>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {CASES.map((c) => (
          <Card
            key={c.route}
            component={Link}
            href={c.route}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            <Text fz={36} mb="xs">
              {c.emoji}
            </Text>
            <Text fw={500} fz="lg" mb="xs">
              {c.title}
            </Text>
            <Text size="sm" c="dimmed">
              {c.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
