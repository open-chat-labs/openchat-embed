import type { Theme } from "./theme";

export type InboundXFrameMessage = Initialise | SetTheme;
export type OutboundXFrameMessage = ExternalContentReady;

export type ExternalContentReady = { kind: "external_content_ready" };

export type Initialise = {
  kind: "initialise_external_content";
  theme: Theme;
  username: string;
};
export type SetTheme = { kind: "set_theme"; theme: Theme };
