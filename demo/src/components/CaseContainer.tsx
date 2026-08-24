// CaseContainer.tsx — demo case wrapper with title, description, and optional
// source link back to the case's own folder on GitHub.
import { Anchor, Divider, Paper, Spoiler, Text, Title } from "@mantine/core";
import type { ComponentProps } from "thin-render";

const GITHUB_ROOT =
  "https://github.com/ypyl/thin-render/tree/master/demo/src/cases";

export function CaseContainer({ element, children }: ComponentProps) {
  const sourceFolder = element.props?.sourceFolder;
  return (
    <Paper shadow="sm" p="md" withBorder>
      {(element.props?.title || sourceFolder) ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--mantine-spacing-sm)",
            marginBottom: "var(--mantine-spacing-xs)",
          }}
        >
          {element.props?.title ? (
            <Title order={4}>{String(element.props.title)}</Title>
          ) : null}
          {sourceFolder ? (
            <Anchor
              href={`${GITHUB_ROOT}/${String(sourceFolder)}`}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              View source on GitHub
            </Anchor>
          ) : null}
        </div>
      ) : null}
      {element.props?.description ? (
        <Text c="dimmed" size="sm" mb="md">{String(element.props.description)}</Text>
      ) : null}
      {element.props?.technicalDescription ? (
        <div style={{ marginBottom: "var(--mantine-spacing-md)" }}>
          <Spoiler maxHeight={0} showLabel="How it works" hideLabel="Hide details">
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {String(element.props.technicalDescription)}
            </Text>
          </Spoiler>
        </div>
      ) : null}
      <Divider mb="md" />
      {children}
    </Paper>
  );
}
