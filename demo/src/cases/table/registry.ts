// table/registry.ts — components used by the HTML Table demo.
import { Table, THead, TBody, Tr, Th, Td } from "../../components/table";
import { BoundField } from "../../components/BoundField";
import { ActionButton } from "../../components/ActionButton";
import { EditToggle } from "../../components/EditToggle";
import { CaseContainer } from "../../components/CaseContainer";
import type { Registry } from "thin-render";

export const registry: Registry = {
  CaseContainer, Table, THead, TBody, Tr, Th, Td, BoundField, ActionButton, EditToggle,
};
