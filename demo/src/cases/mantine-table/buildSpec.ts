// mantine-table/buildSpec.ts — builds the Mantine Table spec.
import type { Spec } from "thin-render";

export function buildSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          title: "Mantine Table with Pagination",
          description: "A paginated table with 300 rows, 10 per page. Click the page numbers to browse.",
          technicalDescription: "The table holds 300 rows but renders only 10 at a time. The page controls below let you browse through the data, and the current page is remembered in the page's state. Turning the page does not reload the table.",
        },
        children: ["table"],
      },
      table: {
        type: "PaginatedTable",
        props: {
          path: "/items",
          columns: [
            { key: "id", label: "#" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
          ],
        },
      },
    },
  };
}
