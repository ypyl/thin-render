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
          description: "A translation table. Each row is one translation key with an editable value, so you can change the text the page displays.",
          technicalDescription: "The page lists translation keys, one per row, each with an editable value. Type into a value to change the translation. The rows are generated from a plain set of key-value pairs, so the list adapts to however many translations exist.",
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
