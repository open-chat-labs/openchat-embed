import type { InboundXFrameMessage, OutboundXFrameMessage } from "./messages";
import type { Theme } from "./theme";

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

export function initialise(): Promise<boolean> {
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

function messageFromOpenChat(resolve: (ready: boolean) => void) {
    return (ev: MessageEvent) => {
        debug("message received from host", ev);
        if (ev.data) {
            try {
                const payload = ev.data as InboundXFrameMessage;
                switch (payload.kind) {
                    case "initialise_external_content":
                        debug("initialising theme", payload.theme);
                        writeCssVars("--", payload.theme);
                        resolve(true);
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
