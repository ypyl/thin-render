// DebugPanel.tsx — live write log for the wrapped store.
//
// Plain React (not spec-driven): the panel is debugging chrome that lives
// next to the Renderer. useSyncExternalStore subscribes to the entry list;
// a separate root subscription on the wrapped store keeps the state
// snapshot live even while the log is paused.
import { useEffect, useReducer, useSyncExternalStore, useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { LogEntry, LogStore } from "./logStore";

/** Compact, safe string rendering of an unknown value. */
function fmt(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === undefined) return "undefined";
  try {
    const s = JSON.stringify(value);
    return s === undefined ? String(value) : s;
  } catch {
    return String(value);
  }
}

function truncate(s: string, max = 60): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function DebugPanel({ log }: { log: LogStore }) {
  const entries = useSyncExternalStoreLog(log);
  const [paused, setPaused] = useState(false);
  const [snapshotTick, bump] = useReducer((x: number) => x + 1, 0);

  // Keep the state snapshot live: root subscription fires on every write,
  // even while entry recording is paused.
  useEffect(() => log.store.subscribe("", bump), [log]);
  void snapshotTick;

  const state = log.store.getState();

  return (
    <Paper shadow="sm" p="md" withBorder style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
      <Group justify="space-between" mb="xs">
        <Title order={4}>Write log</Title>
        <Group gap="xs">
          {paused ? <Badge color="orange">paused</Badge> : null}
          <Badge color={entries.length > 0 ? "teal" : "gray"}>{entries.length} entries</Badge>
        </Group>
      </Group>
      <Group gap="xs" mb="sm">
        <Button size="xs" variant="light" onClick={() => log.clear()} disabled={entries.length === 0}>
          Clear
        </Button>
        <Button
          size="xs"
          variant={paused ? "filled" : "light"}
          color={paused ? "orange" : "gray"}
          onClick={() => {
            const next = !paused;
            setPaused(next);
            log.setPaused(next);
          }}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
      </Group>

      <ScrollArea style={{ flex: 1, minHeight: 200 }}>
        {entries.length === 0 ? (
          <Text c="dimmed" size="sm">
            No writes yet. Type in a field or click a button.
          </Text>
        ) : (
          <Stack gap={4}>
            {entries.map((e) => (
              <LogRow key={e.id} entry={e} />
            ))}
          </Stack>
        )}
      </ScrollArea>

      <Divider my="sm" />
      <Text size="xs" c="dimmed" mb={4}>
        State snapshot (from <Text span component="code">window.__store.getState()</Text>)
      </Text>
      <ScrollArea style={{ maxHeight: 180 }}>
        <Text component="pre" size="xs" style={{ margin: 0 }}>
          {JSON.stringify(state, null, 2)}
        </Text>
      </ScrollArea>

      <Divider my="sm" />
      <Text size="xs" fw={700} mb={4}>
        Console
      </Text>
      <Text size="xs" c="dimmed" mb={4}>
        The raw store is exposed as <Text span component="code">window.__store</Text>. Try these in
        the DevTools console — a console write goes through the same set() as a
        binding or handler, so it lands in the log above.
      </Text>
      <Text component="pre" size="xs" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {`window.__store.getState()
window.__store.get("/tags/0/label")
window.__store.set("/customer/name", "Katherine Johnson")`}
      </Text>
    </Paper>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <Paper
      withBorder
      p={4}
      style={{
        background: entry.noop
          ? "var(--mantine-color-gray-0)"
          : "var(--mantine-color-teal-0)",
      }}
    >
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <Text span size="xs" c="dimmed" style={{ width: 52, flexShrink: 0 }}>
          {new Date(entry.at).toLocaleTimeString()}
        </Text>
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text span size="xs" fw={700} style={{ wordBreak: "break-all" }}>
            {entry.path === "" ? "/ (root)" : `/${entry.path}`}
          </Text>
          <Text span size="xs" style={{ wordBreak: "break-all" }}>
            {truncate(fmt(entry.prev))} → {truncate(fmt(entry.next))}
          </Text>
        </Stack>
        {entry.noop ? (
          <Badge size="xs" color="gray" variant="outline" style={{ flexShrink: 0 }}>
            no-op
          </Badge>
        ) : null}
      </Group>
    </Paper>
  );
}

/** useSyncExternalStore with the log's entry list as the snapshot. */
function useSyncExternalStoreLog(log: LogStore): LogEntry[] {
  return useSyncExternalStore(log.subscribe, log.getEntries, log.getEntries);
}
