// nested-package/child/registry.ts — the child package's component registry.
// A package is self-contained: it can reuse universal demo components and add
// its own; the registry travels with the package.
import { CaseContainer } from "../../../components/CaseContainer";
import { StackRow } from "../../../components/StackRow";
import { ActionButton } from "../../../components/ActionButton";
import { InfoField, NotesField } from "./components";
import type { Registry } from "thin-render";

export const childRegistry: Registry = {
  CaseContainer,
  StackRow,
  ActionButton,
  InfoField,
  NotesField,
};
