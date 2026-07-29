// translations/buildSpec.ts — Translations editor using object repeat.
import type { Spec } from "thin-render";

export function buildTranslationsSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          title: "Translations Editor",
          description: "Each row is a translation key with its editable value — powered by repeat on a plain object (not an array).",
          technicalDescription: "Spec\nCaseContainer → StackRow(repeat: /translations, object) → FieldsetRow → [PathLabel, BoundField(bind: \"\")]\nState\n{ translations: Record<string, string>, editingSection: true }\nFeatures\n• repeat — object iteration via Object.entries\n• usePath — PathLabel extracts last path segment\n• BoundField — two-way inline value editing\n• Spec-driven layout — no imperative JSX in the case component",
        },
        children: ["rows"],
      },
      rows: {
        type: "StackRow",
        props: { gap: "sm" },
        repeat: { path: "/translations" },
        children: ["row"],
      },
      row: {
        type: "FieldsetRow",
        props: {},
        children: ["keyLabel", "valueField"],
      },
      keyLabel: {
        type: "PathLabel",
        props: {},
      },
      valueField: {
        type: "BoundField",
        props: { bind: "", label: "" },
      },
    },
  };
}
