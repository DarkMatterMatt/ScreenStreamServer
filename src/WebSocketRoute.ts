import { WebSocket } from "uWebSockets.js";
import Route, { RouteExecuteOpts } from "./Route";

interface WebSocketRouteExecuteOpts extends RouteExecuteOpts {
    ws: WebSocket;
    json: Record<string, any>;
}

interface FinishData {
    [key: string]: any;
}

interface ErrorData extends FinishData {
    message: string;
}

interface SuccessData extends FinishData {}

export default class WebSocketRoute extends Route {
    private executor: null | ((route: this, data: WebSocketRouteExecuteOpts) => void) = null;

    private ws: null | WebSocket = null;

    public setExecutor(fn: (route: this, data: WebSocketRouteExecuteOpts) => void): this {
        this.executor = fn;
        return this;
    }

    public error(data: ErrorData | string): void {
        if (typeof data === "string") {
            data = { message: data };
        }
        this.finish("error", data);
    }

    public execute(data: WebSocketRouteExecuteOpts): void {
        if (this.executor == null) return;

        this.ws = data.ws;
        this.executor(this, data);
    }

    public finish(status: string, data: FinishData): void {
        if (this.ws == null) return;

        const json = JSON.stringify({
            ...data,
            status,
            route: this.name,
        });
        this.ws.send(json);
        this.ws = null;
    }

    public getWebSocket(): WebSocket {
        if (this.ws == null) {
            throw new Error("Expected WebSocket, received null.");
        }
        return this.ws;
    }

    public success(data: SuccessData): void {
        this.finish("success", data);
    }
}
