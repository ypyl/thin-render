// stacked-tables/registry.tsx — components used by the Stacked Tables demo.
import { CaseContainer } from "../../components/CaseContainer";
import { StackRow } from "../../components/StackRow";
import { ActionButton } from "../../components/ActionButton";
import { DataCell } from "../../components/DataCell";
import { ColumnHeader } from "../../components/ColumnHeader";
import { Table, THead, TBody, Tr } from "../../components/table";
import type { Registry } from "thin-render";

export const registry: Registry = {
  CaseContainer,
  StackRow,
  ActionButton,
  Table,
  THead,
  TBody,
  Tr,
  ColumnHeader,
  DataCell,
};
