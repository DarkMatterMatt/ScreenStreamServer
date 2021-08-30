import WebSocketRoute from "~/WebSocketRoute";

export default new WebSocketRoute("ping")
    .setExecutor(route => route.finish("success", {
        message: "pong",
    }));
