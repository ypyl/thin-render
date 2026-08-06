// HomePage.tsx — landing page with feature cards for each demo case.
import { Link } from "wouter";
import { Card, Container, SimpleGrid, Text, Title, Anchor } from "@mantine/core";

const CASES = [
  {
    route: "/basic",
    emoji: "📄",
    title: "Basic",
    description: "A single greeting card. The whole page is described as data, not code, and there is nothing to interact with.",
  },
  {
    route: "/form",
    emoji: "📝",
    title: "Form",
    description: "A small form with editable fields. Click Edit to type, Save to keep your changes, or Cancel to undo them.",
  },
  {
    route: "/actions",
    emoji: "⚡",
    title: "Actions",
    description: "A button that records the current time when clicked. The saved timestamp appears next to it.",
  },
  {
    route: "/large",
    emoji: "📊",
    title: "Large",
    description: "A list of 1,000 rows with inline editing and per-row delete. Type in any cell and only that cell updates, keeping the page fast at scale.",
  },
  {
    route: "/table",
    emoji: "📋",
    title: "Table",
    description: "The same 1,000 rows as a real HTML table with a header row, editable cells, and per-row delete.",
  },
  {
    route: "/switch",
    emoji: "🔀",
    title: "Switch",
    description: "A status panel that shows one of three views. Set the status to Loading, Loaded, or Error and the page swaps to the matching view.",
  },
  {
    route: "/detail-modal",
    emoji: "🔍",
    title: "Detail Modal",
    description: "Click Details on a row to load that item's full record from a simulated server. A brief loading indicator appears, then the record opens in a popup.",
  },
  {
    route: "/two-store",
    emoji: "🪞",
    title: "Two Store",
    description: "Settings on the left, preview on the right. Change the title, color, or size, then click Apply to push the changes into the preview.",
  },
  {
    route: "/feature-flags",
    emoji: "🚩",
    title: "Feature Flags",
    description: "A feature-flag dashboard. Toggle features on and off, set rollout percentages with sliders, and switch environments.",
  },
  {
    route: "/translations",
    emoji: "🌐",
    title: "Translations",
    description: "A translation table. Each row is one translation key with an editable value, so you can change the text the page displays.",
  },
  {
    route: "/dnd-table",
    emoji: "↕️",
    title: "Drag & Drop",
    description: "A sortable table. Drag rows into a new order, add new rows, remove rows, and edit cells in place.",
  },
  {
    route: "/mantine-table",
    emoji: "📑",
    title: "Mantine Table",
    description: "A paginated table with 300 rows, 10 per page. Click the page numbers to browse.",
  },
  {
    route: "/dynamic-columns",
    emoji: "🧬",
    title: "Dynamic Columns",
    description: "A table whose columns are decided at runtime. Switch datasets and the rows and columns change together, without a reload.",
  },
  {
    route: "/nested-repeat",
    emoji: "🪆",
    title: "Nested Repeat",
    description: "A two-level list: categories on the outside, and editable items inside each category.",
  },
  {
    route: "/named-slots",
    emoji: "🧩",
    title: "Named Slots",
    description: "A page layout with named areas: header, sidebar, content, and footer. Cards below are generated from a list of items.",
  },
  {
    route: "/docx-export",
    emoji: "📄",
    title: "DOCX Export",
    description: "Edit a small table of data, then click Download DOCX to export it as a Word document.",
  },
  {
    route: "/xlsx-export",
    emoji: "📊",
    title: "XLSX Export",
    description: "Edit a small table of data, then click Download XLSX to export it as a spreadsheet file.",
  },
  {
    route: "/nested-package",
    emoji: "🧺",
    title: "Nested Package",
    description: "The same small feature appears twice inside one page and once as a standalone card. Each instance keeps its own data.",
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
