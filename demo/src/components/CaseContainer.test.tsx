// CaseContainer.test.tsx — verifies the optional GitHub source link rendering.
import { describe, it, expect, vi } from "vitest";

// Substitute Mantine chrome with minimal passthroughs so the test runs against
// a single React instance in jsdom; Anchor keeps its href/target/rel props.
vi.mock("@mantine/core", () => {
  const passthrough = (Tag: string) =>
    ({ children, ...props }: Record<string, unknown>) =>
      // @ts-expect-error dynamic tag
      <Tag {...props}>{children}</Tag>;
  const Anchor = ({ href, target, rel, children }: Record<string, unknown>) => (
    // @ts-expect-error dynamic props
    <a href={href} target={target} rel={rel}>{children}</a>
  );
  return {
    Paper: passthrough("div"),
    Title: passthrough("h4"),
    Text: passthrough("p"),
    Divider: passthrough("hr"),
    Spoiler: passthrough("div"),
    Anchor,
  };
});

import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "thin-render";
import { CaseContainer } from "./CaseContainer";

const baseElement = {
  id: "root",
  type: "CaseContainer",
  props: { title: "Basic" },
  children: [],
} as unknown as ComponentProps["element"];

function renderCase(element: ComponentProps["element"]) {
  return render(
    <CaseContainer element={element} emit={() => {}}>
      <span>content</span>
    </CaseContainer>
  );
}

describe("CaseContainer source link", () => {
  it("renders a GitHub link when sourceFolder is present", () => {
    renderCase({ ...baseElement, props: { title: "Basic", sourceFolder: "basic" } });
    const link = screen.getByRole("link", { name: "View source on GitHub" });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/ypyl/thin-render/tree/master/demo/src/cases/basic"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders no link when sourceFolder is absent", () => {
    renderCase(baseElement);
    expect(screen.queryByRole("link", { name: "View source on GitHub" })).toBeNull();
  });

  it("renders no link when sourceFolder is empty", () => {
    renderCase({ ...baseElement, props: { title: "Basic", sourceFolder: "" } });
    expect(screen.queryByRole("link", { name: "View source on GitHub" })).toBeNull();
  });
});
