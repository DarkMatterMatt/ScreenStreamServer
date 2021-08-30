import WebSocketRoute from "~/WebSocketRoute";

export default new WebSocketRoute("joinChannel")
    .setExecutor((route, data) => {
        const ws = route.getWebSocket();

        // parse args
        const { channelId } = data.json;
        if (typeof channelId !== "string") {
            route.error("Invalid or missing channelId.");
            return;
        }

        // fetch channel
        let channel = data.channels.get(channelId);
        if (channel != null && channel.includes(ws)) {
            route.success({
                message: "Already connected.",
                numberOfMembers: channel.length,
            });
        }

        // check that user isn't already in a channel
        const existingChannelId = data.webSockets.get(ws);
        if (existingChannelId != null) {
            route.error("Must leave existing channel first.");
            return;
        }

        // check that channel has space
        if (channel != null && channel.length >= 2) {
            route.error("Failed to join, channel is full.");
            return;
        }

        // join channel - creates new channel if necessary
        if (channel == null) {
            channel = [ws];
            data.channels.set(channelId, channel);
        }
        else {
            channel.push(ws);
        }
        data.webSockets.set(ws, channelId);

        route.success({
            message: "Joined channel.",
            channelId,
            numberOfMembers: channel.length,
        });
    });
