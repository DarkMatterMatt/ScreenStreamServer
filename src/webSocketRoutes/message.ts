import { WebSocket } from "uWebSockets.js";
import WebSocketRoute from "~/WebSocketRoute";

export default new WebSocketRoute("message")
    .setExecutor((route, data) => {
        const ws = route.getWebSocket();

        // parse args
        const message = data.json.data;
        if (message == null) {
            route.error("Invalid or missing data.");
            return;
        }

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

        // find users to send message to
        const toSendTo = channel.filter(ws2 => ws2 != null && ws2 !== ws) as WebSocket[];
        if (toSendTo.length === 0) {
            route.error({
                message: "No users to send message to.",
                channelId,
            });
            return;
        }

        // send messages
        toSendTo.forEach(ws2 => ws2.send(JSON.stringify({
            route: "peer",
            message: "Data from peer.",
            data: message,
        })));

        route.success({
            message: "Sent message.",
            channelId,
            numberOfMembers: channel.length,
        });
    });
