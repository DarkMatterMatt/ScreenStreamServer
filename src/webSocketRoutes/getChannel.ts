import WebSocketRoute from "~/WebSocketRoute";

export default new WebSocketRoute("getChannel")
    .setExecutor((route, data) => {
        const ws = route.getWebSocket();

        // get channel identifier
        const channelId = data.webSockets.get(ws);
        if (channelId == null) {
            route.error("Not in a channel.");
            return;
        }

        // load channel
        const channel = data.channels.get(channelId);
        if (channel == null) {
            route.error("Failed fetching channel.");
            return;
        }

        // return channel info
        route.success({
            message: "Loaded successfully.",
            channelId,
            numberOfMembers: channel.length,
        });
    });
