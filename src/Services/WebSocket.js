import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (
  roomId,
  onMessageReceived,
  onDrawReceived,
  onGameState
) => {

const socket = new SockJS(
  "https://skribbl-clone-final-final-2.onrender.com/ws"
);
  stompClient = new Client({

    webSocketFactory: () => socket,

    reconnectDelay: 5000,

    onConnect: () => {

      console.log(
        "Connected to WebSocket"
      );

      // =========================
      // CHAT SUBSCRIPTION
      // =========================
      stompClient.subscribe(

        `/topic/messages/${roomId}`,

        (message) => {

          const body = JSON.parse(
            message.body
          );

          onMessageReceived(body);
        }
      );

      // =========================
      // DRAW SUBSCRIPTION
      // =========================
      stompClient.subscribe(

        `/topic/draw/${roomId}`,

        (drawData) => {

          const body = JSON.parse(
            drawData.body
          );

          onDrawReceived(body);
        }
      );

      // =========================
      // GAME STATE SUBSCRIPTION
      // ROOM SPECIFIC
      // =========================
      stompClient.subscribe(

        `/topic/game/${roomId}`,

        (gameState) => {

          const body = JSON.parse(
            gameState.body
          );

          onGameState(body);
        }
      );

      console.log(
        `Subscribed to room: ${roomId}`
      );
    },

    onStompError: (frame) => {

      console.error(
        "Broker reported error:",
        frame.headers["message"]
      );

      console.error(
        "Additional details:",
        frame.body
      );
    },

    onWebSocketError: (error) => {

      console.error(
        "WebSocket Error:",
        error
      );
    }
  });

  stompClient.activate();
};

// =========================
// SEND CHAT MESSAGE
// =========================
export const sendMessage = (
  roomId,
  message
) => {

  if (stompClient?.connected) {

    stompClient.publish({

      destination:
        `/app/chat/${roomId}`,

      body: JSON.stringify(message)
    });
  }
};

// =========================
// SEND DRAW DATA
// =========================
export const sendDrawData = (
  roomId,
  drawData
) => {

  if (stompClient?.connected) {

    stompClient.publish({

      destination:
        `/app/draw/${roomId}`,

      body: JSON.stringify(drawData)
    });
  }
};

// =========================
// SEND GAME STATE
// =========================
export const sendGameState = (
  roomId,
  gameState
) => {

  if (stompClient?.connected) {

    stompClient.publish({

      destination:
        `/app/game/${roomId}/start`,

      body: JSON.stringify(gameState)
    });
  }
};

// =========================
// DISCONNECT SOCKET
// =========================
export const disconnectWebSocket = () => {

  if (stompClient) {

    stompClient.deactivate();

    console.log(
      "Disconnected WebSocket"
    );
  }
};