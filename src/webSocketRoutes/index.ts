import WebSocketRoute from "~/WebSocketRoute";

import getChannel from "./getChannel";
import joinChannel from "./joinChannel";
import leaveChannel from "./leaveChannel";
import message from "./message";
import ping from "./ping";

const routes = new Map([
    getChannel,
    joinChannel,
    leaveChannel,
    message,
    ping,
].map(r => [r.name, r]));

const default_ = new WebSocketRoute("default")
    .setExecutor(route => route.finish("error", {
        message: `Invalid route. Must be one of ${[...routes.keys()].join(", ")}.`,
    }));

routes.set("default", default_);
export default routes;
