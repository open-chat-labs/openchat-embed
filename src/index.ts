import type { OpenChatEmbedClient } from "./client";
import type { InboundXFrameMessage, OutboundXFrameMessage } from "./messages";
import type { Theme } from "./theme";

const openChatOrigins = [
    "http://localhost:5001",
    "https://test.oc.app",
    "https://webtest.oc.app",
    "https://oc.app",
];

function debug(msg: string, ...params: unknown[]): void {
    console.debug(`OPENCHAT_EXTERNAL_TARGET: ${msg}`, params);
}

export function writeCssVars(prefix: string, section: Theme): void {
    for (const [comp, props] of Object.entries(section)) {
        if (typeof props === "string") {
            const varStr = `${prefix}${comp}`;
            document.documentElement.style.setProperty(varStr, props);
        } else if (typeof props === "object" && props) {
            writeCssVars(`${prefix}${comp}-`, props);
        }
    }
}

export function initialise(): Promise<OpenChatEmbedClient> {
    return new Promise((resolve) => {
        if (window.self !== window.top) {
            debug("setting listeners", window.top);
            window.addEventListener("message", messageFromOpenChat(resolve));
            broadcastMessage({ kind: "external_content_ready" });
        }
    });
}

function broadcastMessage(msg: OutboundXFrameMessage) {
    if (window.top && window.self !== window.top) {
        debug("sending message to host: ", msg);
        window.top.postMessage(msg, "*");
    }
}

function messageFromOpenChat(resolve: (client: OpenChatEmbedClient) => void) {
    return (ev: MessageEvent) => {
        debug("message received from host", ev.origin);
        if (openChatOrigins.includes(ev.origin) && ev.data) {
            try {
                const payload = ev.data as InboundXFrameMessage;
                switch (payload.kind) {
                    case "initialise_external_content":
                        debug("initialising theme", payload.theme);
                        writeCssVars("--", payload.theme);
                        resolve({
                            username: payload.username,
                        });
                        break;
                    case "set_theme":
                        debug("set_theme", payload.theme);
                        writeCssVars("--", payload.theme);
                        break;
                }
            } catch (err) {
                debug("Error handling an external message from another window", err);
            }
        }
    };
}
