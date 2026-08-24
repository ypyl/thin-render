// two-store/buildSettingsSpec.ts — settings panel spec.
import type { Spec } from "thin-render";

export function buildSettingsSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          sourceFolder: "two-store",
          title: "Settings",
          description: "Change the title, color, or size below, then click Apply to update the preview.",
          technicalDescription: "The page has two independent sections: a settings panel and a preview. Editing the fields changes only the settings panel. The preview updates only when you click Apply, which copies the current settings across.",
        },
        children: ["fields"],
      },
      fields: {
        type: "StackRow",
        props: { gap: "md" },
        children: ["titleField", "colorField", "sizeField", "applyBtn"],
      },
      titleField: {
        type: "BoundField",
        props: { bind: "settings/title", label: "Title" },
      },
      colorField: {
        type: "SelectField",
        props: {
          bind: "settings/color",
          options: [
            { value: "blue", label: "Blue" },
            { value: "red", label: "Red" },
            { value: "green", label: "Green" },
            { value: "orange", label: "Orange" },
            { value: "violet", label: "Violet" },
          ],
        },
      },
      sizeField: {
        type: "SelectField",
        props: {
          bind: "settings/size",
          options: [
            { value: "16px", label: "Small" },
            { value: "24px", label: "Medium" },
            { value: "32px", label: "Large" },
            { value: "48px", label: "X-Large" },
          ],
        },
      },
      applyBtn: {
        type: "ActionButton",
        props: { label: "Apply Changes" },
        on: { click: { action: "applySettings" } },
      },
    },
  };
}
