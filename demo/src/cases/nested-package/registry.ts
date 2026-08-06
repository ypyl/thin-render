// nested-package/registry.ts — parent registry: universal components plus the
// child package's boundary components (EmbeddedChild, StandaloneChild) and
// the parent-owned DetailPanel.
import { CaseContainer } from "../../components/CaseContainer";
import { GridRow } from "../../components/GridRow";
import { EmbeddedChild } from "./child/EmbeddedChild";
import { StandaloneChild } from "./child/StandaloneChild";
import { DetailPanel } from "./DetailPanel";
import type { Registry } from "thin-render";

export const registry: Registry = {
  CaseContainer,
  GridRow,
  EmbeddedChild,
  StandaloneChild,
  DetailPanel,
};
