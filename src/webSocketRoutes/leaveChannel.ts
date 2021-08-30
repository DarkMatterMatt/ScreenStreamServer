import WebSocketRoute from "~/WebSocketRoute";

export default new WebSocketRoute("leaveChannel")
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

        // leave channel
        data.webSockets.set(ws, null);
        channel.splice(channel.indexOf(ws), 1);

        // return channel info
        route.success({
            message: "Left channel.",
            channelId,
            numberOfMembers: channel.length,
        });
    });
