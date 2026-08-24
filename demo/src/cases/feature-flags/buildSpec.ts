// feature-flags/buildSpec.ts — Feature Flags Dashboard spec.
import type { Spec } from "thin-render";

export function buildDashboardSpec(): Spec {
  return {
    root: "container",
    elements: {
      container: {
        type: "CaseContainer",
        props: {
          sourceFolder: "feature-flags",
          title: "Feature Flags Dashboard",
          description: "A feature-flag dashboard. Toggle features on and off, set rollout percentages with sliders, and switch environments.",
          technicalDescription: "The dashboard manages three kinds of settings: on/off toggles for features, percentage sliders for how widely a feature is rolled out, and a choice of environment. Every control updates the page's data immediately, and the banner and badges reflect your current choices.",
        },
        children: ["content"],
      },
      content: {
        type: "StackRow",
        props: { gap: "lg" },
        children: ["infoAlert", "envRow", "flagDarkMode", "flagBetaDashboard", "flagAiSuggestions"],
      },

      // ── Alert ──
      infoAlert: {
        type: "Alert",
        props: { title: "Information", color: "blue" },
        children: ["alertText"],
      },
      alertText: {
        type: "StaticText",
        props: { text: "Changes take effect immediately. No deploy required." },
      },

      // ── Environment selector ──
      envRow: {
        type: "StackRow",
        props: { gap: "xs" },
        children: ["envLabel", "envField"],
      },
      envLabel: { type: "StaticText", props: { text: "Environment" } },
      envField: {
        type: "SegmentedField",
        props: {
          bind: "/environment",
          options: [
            { value: "development", label: "Development" },
            { value: "staging", label: "Staging" },
            { value: "production", label: "Production" },
          ],
        },
      },

      // ── Flag: Dark Mode ──
      flagDarkMode: {
        type: "FieldsetRow",
        props: {},
        children: ["dmInfo", "dmToggle", "dmBadge"],
      },
      dmInfo: {
        type: "StackRow",
        props: { gap: 4 },
        children: ["dmLabel", "dmDesc"],
      },
      dmLabel: { type: "StaticText", props: { text: "Dark Mode" } },
      dmDesc: { type: "StaticText", props: { text: "Enable dark theme across the application" } },
      dmToggle: {
        type: "ToggleField",
        props: { bind: "/flags/darkMode" },
      },
      dmBadge: { type: "Badge", props: { text: "Active", color: "green" } },

      // ── Flag: Beta Dashboard ──
      flagBetaDashboard: {
        type: "FieldsetRow",
        props: {},
        children: ["bdInfo", "bdToggle", "bdBadge"],
      },
      bdInfo: {
        type: "StackRow",
        props: { gap: 4 },
        children: ["bdLabel", "bdDesc"],
      },
      bdLabel: { type: "StaticText", props: { text: "Beta Dashboard" } },
      bdDesc: { type: "StaticText", props: { text: "New analytics dashboard with real-time charts" } },
      bdToggle: {
        type: "ToggleField",
        props: { bind: "/flags/betaDashboard" },
      },
      bdBadge: { type: "Badge", props: { text: "Inactive", color: "gray" } },

      // ── Flag: AI Suggestions (with rollout slider) ──
      flagAiSuggestions: {
        type: "FieldsetRow",
        props: {},
        children: ["aiInfo", "aiControls"],
      },
      aiInfo: {
        type: "StackRow",
        props: { gap: 4 },
        children: ["aiLabel", "aiDesc"],
      },
      aiLabel: { type: "StaticText", props: { text: "AI Suggestions" } },
      aiDesc: { type: "StaticText", props: { text: "LLM-powered autocomplete and smart replies" } },
      aiControls: {
        type: "StackRow",
        props: { gap: "sm", align: "flex-end" },
        children: ["aiToggle", "aiSlider", "aiBadge"],
      },
      aiToggle: {
        type: "ToggleField",
        props: { bind: "/flags/aiSuggestions/enabled" },
      },
      aiSlider: {
        type: "SliderField",
        props: {
          bind: "/flags/aiSuggestions/rollout",
          min: 0,
          max: 100,
          label: "Rollout: {value}%",
        },
      },
      aiBadge: { type: "Badge", props: { text: "Rollout 50%", color: "yellow" } },
    },
  };
}
