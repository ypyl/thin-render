// detail-modal/registry.ts — components used by the Detail Modal demo.
import { CaseContainer } from "../../components/CaseContainer";
import { Table, THead, TBody, Tr, Th, Td } from "../../components/table";
import { BoundField } from "../../components/BoundField";
import { ActionButton } from "../../components/ActionButton";
import { Modal } from "../../components/Modal";
import { LoadingBox } from "../../components/LoadingBox";
import { StackRow } from "../../components/StackRow";
import type { Registry } from "thin-render";

export const registry: Registry = {
  CaseContainer, Table, THead, TBody, Tr, Th, Td, BoundField, ActionButton, Modal, LoadingBox, StackRow,
};
