// BoundField.tsx — editable field bound to a store path.
import { Box, TextInput as MantineTextInput } from "@mantine/core";
import { useBound, useValue, usePath, type ComponentProps } from "thin-render";

export function BoundField({ element }: ComponentProps) {
  const base = usePath();
  const fieldPath = String(element.props?.bind ?? "");
  const path = base ? `${base}/${fieldPath}` : fieldPath;
  const [value, setValue] = useBound<string>(path);
  const editing = useValue<boolean>("/editingSection");
  const readOnly = !editing;
  return (
    <Box>
      <MantineTextInput
        value={value ?? ""}
        readOnly={readOnly}
        variant="default"
        styles={
          readOnly
            ? { input: { borderColor: "transparent", backgroundColor: "transparent" } }
            : undefined
        }
        onChange={(e) => setValue(e.currentTarget.value)}
        label={String(element.props?.label ?? "")}
      />
    </Box>
  );
}
