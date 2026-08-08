// DebugWindow.tsx — floating debug chrome for the store-debug case.
//
// An Affix button (bottom-right, bug icon, live entry-count badge) opens a
// draggable, resizable FloatingWindow hosting the debug panel. The window is
// non-modal: the app underneath stays fully interactive while it's open.
// The badge uses the same useSyncExternalStore subscription as the panel, so
// it shows the recorded entry count even while the window is closed.
import { useSyncExternalStore } from "react";
import {
  Affix,
  Badge,
  Button,
  CloseButton,
  FloatingWindow,
  Group,
  Text,
} from "@mantine/core";
import { IconArrowsDiagonal, IconBug } from "@tabler/icons-react";
import { DebugPanel } from "./DebugPanel";
import type { LogStore } from "./logStore";

export function DebugWindow({
  log,
  open,
  onOpenChange,
}: {
  log: LogStore;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const entries = useSyncExternalStore(log.subscribe, log.getEntries, log.getEntries);
  const count = entries.length;

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button
          size="md"
          variant="filled"
          leftSection={<IconBug size={18} />}
          onClick={() => onOpenChange(true)}
          rightSection={
            <Badge
              size="sm"
              color={count > 0 ? "teal" : "gray"}
              variant="filled"
              style={{ padding: "0 6px", minWidth: 22 }}
            >
              {count}
            </Badge>
          }
        >
          Store debug
        </Button>
      </Affix>

      {open && (
        <FloatingWindow
          withBorder
          shadow="lg"
          initialPosition={{ bottom: 20, right: 20 }}
          constrainToViewport
          constrainOffset={12}
          zIndex={400}
          dragHandleSelector=".drag-handle"
          excludeDragHandleSelector="button"
          dimensions={{
            initialWidth: 480,
            initialHeight: 420,
            minWidth: 320,
            minHeight: 240,
            maxWidth: 640,
            maxHeight: 560,
          }}
          style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {/* Header is the only drag handle: scrolling inside the log must
              not drag the window, and buttons must not start a drag. */}
          <Group
            justify="space-between"
            px="md"
            py="sm"
            className="drag-handle"
            style={{ cursor: "move", flexShrink: 0 }}
          >
            <Group gap="xs">
              <IconBug size={16} />
              <Text fw={500} size="sm">
                Store debug
              </Text>
            </Group>
            <CloseButton onClick={() => onOpenChange(false)} />
          </Group>

          <div style={{ flex: 1, minHeight: 0, display: "flex", padding: "0 var(--mantine-spacing-md)" }}>
            <DebugPanel log={log} />
          </div>

          <FloatingWindow.ResizeHandle
            aria-label="Resize store debug window"
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "nwse-resize",
            }}
          >
            <IconArrowsDiagonal size={14} style={{ opacity: 0.5 }} />
          </FloatingWindow.ResizeHandle>
        </FloatingWindow>
      )}
    </>
  );
}
