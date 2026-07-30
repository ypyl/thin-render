// docx-export/registry.ts — React components for the preview table.
import { CaseContainer } from "../../components/CaseContainer";
import { BoundField } from "../../components/BoundField";
import { Table, THead, TBody, Tr, Th, Td } from "../../components/table";
import type { Registry } from "thin-render";

export const registry: Registry = { CaseContainer, BoundField, Table, THead, TBody, Tr, Th, Td };
