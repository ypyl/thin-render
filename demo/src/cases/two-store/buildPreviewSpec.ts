// two-store/buildPreviewSpec.ts — preview panel spec.
import type { Spec } from "thin-render";

export function buildPreviewSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          sourceFolder: "two-store",
          title: "Live Preview",
          description: "This side shows the settings after you click Apply. Until then it keeps showing the previous values.",
          technicalDescription: "The preview shows the title, color, and size chosen in the settings panel, but only after Apply is clicked there. Before that it keeps the previous values: the two sides are independent and only the Apply button connects them.",
        },
        children: ["preview"],
      },
      preview: {
        type: "PreviewBox",
        props: {},
        children: [],
      },
    },
  };
}
