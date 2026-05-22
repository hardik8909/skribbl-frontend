import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectWebSocket = (
  roomId,
  onMessageReceived,
  onDrawReceived,
  onGameState
) => {

  // CONNECT TO BACKEND
  const socket = new SockJS(
    "https://skribbl-clone-final-final-2.onrender.com/ws"
  );

  stompClient = new Client({

    webSocketFactory: () => socket,

    reconnectDelay: 5000,

    debug: (str) => {
      console.log("STOMP:", str);
    },

    onConnect: () => {

      console.log(
        `Connected to room: ${roomId}`
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

          console.log(
            "CHAT RECEIVED:",
            body
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

          console.log(
            "DRAW RECEIVED:",
            body
          );

          onDrawReceived(body);
        }
      );

      // =========================
      // GAME STATE SUBSCRIPTION
      // =========================
      stompClient.subscribe(

        `/topic/game/${roomId}`,

        (gameState) => {

          const body = JSON.parse(
            gameState.body
          );

          console.log(
            "GAME STATE RECEIVED:",
            body
          );

          onGameState(body);
        }
      );

      // =========================
      // TEST GAME SYNC
      // =========================
      sendGameState(roomId, {

        type: "SYNC_TEST",

        message:
          "Game synchronization working",

        timestamp:
          Date.now()
      });

      console.log(
        `Subscribed successfully to room: ${roomId}`
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
    },

    onDisconnect: () => {

      console.log(
        "Disconnected from WebSocket"
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

    console.log(
      "SENDING CHAT:",
      message
    );

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

    console.log(
      "SENDING DRAW:",
      drawData
    );

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

    console.log(
      "SENDING GAME STATE:",
      gameState
    );

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