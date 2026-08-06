// App.tsx — demo router with wouter.
import { Router, Route, Switch, Link } from "wouter";
import { Container, Title } from "@mantine/core";
import { HomePage } from "./HomePage";
import { BasicCase } from "./cases/basic/BasicCase";
import { FormCase } from "./cases/form/FormCase";
import { ActionsCase } from "./cases/actions/ActionsCase";
import { LargeCase } from "./cases/large/LargeCase";
import { TableCase } from "./cases/table/TableCase";
import { SwitchCase } from "./cases/switch/SwitchCase";
import { DetailModalCase } from "./cases/detail-modal/DetailModalCase";
import { TwoStoreCase } from "./cases/two-store/TwoStoreCase";
import { FeatureFlagsCase } from "./cases/feature-flags/FeatureFlagsCase";
import { TranslationsCase } from "./cases/translations/TranslationsCase";
import { DndTableCase } from "./cases/dnd-table/DndTableCase";
import { MantineTableCase } from "./cases/mantine-table/MantineTableCase";
import { DynamicColumnsCase } from "./cases/dynamic-columns/DynamicColumnsCase";
import { NestedRepeatCase } from "./cases/nested-repeat/NestedRepeatCase";
import { NamedSlotsCase } from "./cases/named-slots/NamedSlotsCase";
import { DocxExportCase } from "./cases/docx-export/DocxExportCase";
import { XlsxExportCase } from "./cases/xlsx-export/XlsxExportCase";
import { NestedPackageCase } from "./cases/nested-package/NestedPackageCase";

export function App() {
  return (
    <Router base="/thin-render">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/basic" component={BasicCase} />
        <Route path="/form" component={FormCase} />
        <Route path="/actions" component={ActionsCase} />
        <Route path="/large" component={LargeCase} />
        <Route path="/table" component={TableCase} />
        <Route path="/switch" component={SwitchCase} />
        <Route path="/detail-modal" component={DetailModalCase} />
        <Route path="/two-store" component={TwoStoreCase} />
        <Route path="/feature-flags" component={FeatureFlagsCase} />
        <Route path="/translations" component={TranslationsCase} />
        <Route path="/dnd-table" component={DndTableCase} />
        <Route path="/mantine-table" component={MantineTableCase} />
        <Route path="/dynamic-columns" component={DynamicColumnsCase} />
        <Route path="/nested-repeat" component={NestedRepeatCase} />
        <Route path="/named-slots" component={NamedSlotsCase} />
        <Route path="/docx-export" component={DocxExportCase} />
        <Route path="/xlsx-export" component={XlsxExportCase} />
        <Route path="/nested-package" component={NestedPackageCase} />
        <Route>
          <Container py="xl">
            <Title order={3} mb="md">404 — Page not found</Title>
            <Link href="/">← Back to home</Link>
          </Container>
        </Route>
      </Switch>
    </Router>
  );
}
