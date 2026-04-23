// leadSocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { baseUrl } from "../index";

let client = null;
const callbacks = { onLeadUpdate: null, onNewLead: null, onLeadComment: null };

export const connectLeadSocket = (onLeadUpdate, onNewLead, onLeadComment) => {
  // ✅ Har safar callbacklarni yangilab qo'yamiz
  callbacks.onLeadUpdate = onLeadUpdate;
  callbacks.onNewLead = onNewLead;
  callbacks.onLeadComment = onLeadComment;

  if (client && client.active) return () => client?.deactivate(); // ✅ har doim fn qaytaradi

  client = new Client({
    webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: () => {
      console.log("✅ WebSocket connected");

      client.subscribe("/topic/lead-update", (msg) => {
        callbacks.onLeadUpdate?.(JSON.parse(msg.body)); // ✅ har doim fresh callback
      });

      client.subscribe("/topic/new-lead", (msg) => {
        callbacks.onNewLead?.(JSON.parse(msg.body));
      });

      client.subscribe("/topic/lead-comment", (msg) => {
        callbacks.onLeadComment?.(JSON.parse(msg.body));
      });
    },

    onStompError: (frame) => console.error("STOMP error:", frame),
    onWebSocketError: (err) => console.error("WS error:", err),
  });

  client.activate();
  return () => client?.deactivate();
};
