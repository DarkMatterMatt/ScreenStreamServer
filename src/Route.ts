import { WebSocket } from "uWebSockets.js";

export interface RouteExecuteOpts {
    webSockets: Map<WebSocket, null | string>;
    channels: Map<string, [WebSocket, WebSocket?]>;
}

export default abstract class Route {
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }
}
