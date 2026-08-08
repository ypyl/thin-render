// DebugPanel.tsx — live write log for the wrapped store, hosted inside the
// floating DebugWindow.
//
// Plain React (not spec-driven): the panel is debugging chrome that floats
// over the app. useSyncExternalStore subscribes to the entry list; a
// separate root subscription on the wrapped store keeps the state snapshot
// live even while the log is paused. The panel fills the window: the log
// takes all flexible space, the snapshot sits collapsed behind a spoiler,
// and the console hints stay pinned at the bottom.
import { useEffect, useReducer, useSyncExternalStore, useState } from "react";
import {
  Badge,
  Button,
  Divider,
  Group,
  ScrollArea,
  Spoiler,
  Stack,
  Text,
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
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", width: "100%" }}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          Write log
        </Text>
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

      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
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
      <Spoiler
        maxHeight={0}
        showLabel="Show state snapshot"
        hideLabel="Hide state snapshot"
        mb="sm"
      >
        <Text size="xs" c="dimmed" mb={4}>
          From <Text span component="code">window.__store.getState()</Text>
        </Text>
        <ScrollArea style={{ maxHeight: 140 }}>
          <Text component="pre" size="xs" style={{ margin: 0 }}>
            {JSON.stringify(state, null, 2)}
          </Text>
        </ScrollArea>
      </Spoiler>

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
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div
      style={{
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: 4,
        padding: 4,
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
    </div>
  );
}

/** useSyncExternalStore with the log's entry list as the snapshot. */
function useSyncExternalStoreLog(log: LogStore): LogEntry[] {
  return useSyncExternalStore(log.subscribe, log.getEntries, log.getEntries);
}
