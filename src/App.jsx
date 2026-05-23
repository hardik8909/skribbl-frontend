import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  connectWebSocket,
  sendMessage,
  sendDrawData,
  sendGameState,
  disconnectWebSocket
} from "./Services/WebSocket";

import {
  FaPaintBrush,
  FaUsers
} from "react-icons/fa";

function App() {

  // =========================
  // STATES
  // =========================

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [players] = useState([
    "Hardik",
    "Alex",
    "John"
  ]);

  const [selectedColor,
    setSelectedColor] =
    useState("#000000");

  const [brushSize,
    setBrushSize] =
    useState(3);

  const [roomId, setRoomId] =
    useState("room1");

  const [joined, setJoined] =
    useState(false);

  const [timeLeft] =
    useState(60);

  const [gameState,
    setGameState] =
    useState(null);

  const [isDrawer,
    setIsDrawer] =
    useState(false);

  // =========================
  // REFS
  // =========================

  const canvasRef =
    useRef(null);

  const contextRef =
    useRef(null);

  const drawing =
    useRef(false);

  // =========================
  // WEBSOCKET CONNECTION
  // =========================

  useEffect(() => {

    if (!joined) return;

    const canvas =
      canvasRef.current;

    canvas.width = 900;

    canvas.height = 500;

    const context =
      canvas.getContext("2d");

    context.lineCap =
      "round";

    context.strokeStyle =
      selectedColor;

    context.lineWidth =
      brushSize;

    contextRef.current =
      context;

    connectWebSocket(

      roomId,

      // =========================
      // CHAT
      // =========================
      (msg) => {

        setMessages((prev) => [
          ...prev,
          msg
        ]);
      },

      // =========================
      // DRAW
      // =========================
      (drawData) => {

        drawFromSocket(drawData);
      },

      // =========================
      // GAME STATE
      // =========================
      (incomingGameState) => {

        console.log(
          "SYNCED GAME STATE:",
          incomingGameState
        );

        setGameState(
          incomingGameState
        );

        // WHO CAN DRAW
        setIsDrawer(

          incomingGameState
            ?.currentDrawer === "Hardik"
        );
      }
    );

    return () => {

      disconnectWebSocket();
    };

  }, [joined]);

  // =========================
  // UPDATE BRUSH
  // =========================

  useEffect(() => {

    if (contextRef.current) {

      contextRef.current.strokeStyle =
        selectedColor;

      contextRef.current.lineWidth =
        brushSize;
    }

  }, [selectedColor, brushSize]);

  // =========================
  // START GAME
  // =========================

  const startGame = () => {

    const newGameState = {

      currentDrawer: "Hardik",

      maskedWord: "_ _ _ _ _",

      currentRound: 1,

      roundEndTime:
        Date.now() + 60000,

      scores: {

        Hardik: 0,
        Alex: 0,
        John: 0
      }
    };

    // LOCAL UPDATE
    setGameState(
      newGameState
    );

    // SEND TO OTHER PLAYERS
    sendGameState(
      roomId,
      newGameState
    );

    setIsDrawer(true);

    console.log(
      "GAME STARTED:",
      newGameState
    );
  };

  // =========================
  // DRAWING FUNCTIONS
  // =========================

  const startDrawing = (e) => {

    if (!isDrawer) return;

    drawing.current = true;

    draw(e);
  };

  const finishDrawing = () => {

    drawing.current = false;

    contextRef.current.beginPath();
  };

  const draw = (e) => {

    if (!drawing.current)
      return;

    const rect =
      canvasRef.current
        .getBoundingClientRect();

    const x =
      e.clientX - rect.left;

    const y =
      e.clientY - rect.top;

    contextRef.current.lineTo(
      x,
      y
    );

    contextRef.current.stroke();

    contextRef.current.beginPath();

    contextRef.current.moveTo(
      x,
      y
    );

    // SEND DRAW DATA

    sendDrawData(roomId, {

      x,
      y,

      color:
        selectedColor,

      brushSize,

      type: "draw"
    });
  };

  // =========================
  // RECEIVE DRAWING
  // =========================

  const drawFromSocket = (
    data
  ) => {

    if (!contextRef.current)
      return;

    contextRef.current.strokeStyle =
      data.color || "#000";

    contextRef.current.lineWidth =
      data.brushSize || 3;

    contextRef.current.lineTo(
      data.x,
      data.y
    );

    contextRef.current.stroke();

    contextRef.current.beginPath();

    contextRef.current.moveTo(
      data.x,
      data.y
    );
  };

  // =========================
  // CHAT SEND
  // =========================

  const handleSend = () => {

    if (!message.trim())
      return;

    // GUESS CHECK

    if (
      message.toLowerCase()
      === "apple"
    ) {

      alert(
        "Correct Guess!"
      );
    }

    sendMessage(roomId, {

      playerName:
        "Hardik",

      message
    });

    setMessage("");
  };

  // =========================
  // ROOM JOIN SCREEN
  // =========================

  if (!joined) {

    return (

      <div className="min-h-screen bg-gray-900 flex items-center justify-center">

        <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl w-96">

          <h1 className="text-4xl text-white font-bold mb-6 text-center">

            Skribbl Clone

          </h1>

          <input
            type="text"
            value={roomId}
            onChange={(e) =>
              setRoomId(
                e.target.value
              )
            }
            placeholder="Enter Room Code"
            className="w-full p-4 rounded bg-gray-700 text-white outline-none mb-4"
          />

          <button
            onClick={() =>
              setJoined(true)
            }
            className="w-full bg-blue-600 text-white py-4 rounded-xl text-xl font-bold hover:bg-blue-700"
          >

            Join Room

          </button>

        </div>

      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (

    <div className="min-h-screen bg-gray-900 text-white">

      {/* TOP BAR */}

      <div className="flex items-center justify-between px-8 py-4 bg-gray-800 shadow-lg">

        <h1 className="text-3xl font-bold flex items-center gap-2">

          <FaPaintBrush />

          Skribbl Clone

        </h1>

        {/* TIMER */}

        <div className="text-2xl font-bold">

          ⏳ {

            gameState

              ? Math.max(

                  0,

                  Math.floor(

                    (
                      gameState.roundEndTime
                      - Date.now()
                    ) / 1000
                  )
                )

              : timeLeft

          }s

        </div>

        {/* WORD */}

        <div className="text-xl">

          Word:

          <span className="ml-2 tracking-widest text-yellow-400 font-bold">

            {
              gameState
                ?.maskedWord
                || "_ _ _ _ _"
            }

          </span>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="flex">

        {/* LEFT SIDE */}

        <div className="flex-1 p-6">

          {/* START GAME */}

          <button
            onClick={startGame}
            className="bg-green-600 px-6 py-3 rounded-xl mb-4 hover:bg-green-700"
          >

            Start Game

          </button>

          {/* TOOLS */}

          <div className="flex items-center gap-4 mb-4 bg-gray-800 p-4 rounded-xl">

            {/* COLOR */}

            <input
              type="color"
              value={selectedColor}
              onChange={(e) =>
                setSelectedColor(
                  e.target.value
                )
              }
            />

            {/* BRUSH */}

            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) =>
                setBrushSize(
                  e.target.value
                )
              }
            />

            <span>

              Brush:
              {" "}
              {brushSize}

            </span>

            {/* DRAWER */}

            <span className="ml-auto text-yellow-400 font-bold">

              Drawer:
              {" "}
              {
                gameState
                  ?.currentDrawer
              }

            </span>

          </div>

          {/* CANVAS */}

          <canvas
            ref={canvasRef}
            className="bg-white rounded-2xl shadow-2xl cursor-crosshair"
            onMouseDown={
              startDrawing
            }
            onMouseUp={
              finishDrawing
            }
            onMouseMove={
              draw
            }
          />

          {/* CHAT */}

          <div className="mt-6 bg-gray-800 rounded-xl p-4">

            <h2 className="text-2xl font-bold mb-4">

              Chat

            </h2>

            <div className="h-48 overflow-y-auto mb-4 space-y-2">

              {messages.map(
                (msg, index) => (

                  <div
                    key={index}
                    className="bg-gray-700 p-2 rounded"
                  >

                    <strong>

                      {msg.playerName}:

                    </strong>

                    {" "}

                    {msg.message}

                  </div>
                )
              )}

            </div>

            {/* CHAT INPUT */}

            <div className="flex gap-2">

              <input
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                className="flex-1 p-3 rounded bg-gray-700 outline-none"
                placeholder="Type guess..."
              />

              <button
                onClick={
                  handleSend
                }
                className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
              >

                Send

              </button>

            </div>

          </div>

        </div>

        {/* PLAYER SIDEBAR */}

        <div className="w-72 bg-gray-800 p-6 shadow-xl">

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">

            <FaUsers />

            Players

          </h2>

          <div className="space-y-4">

            {players.map(
              (player, index) => (

                <div
                  key={index}
                  className="bg-gray-700 p-4 rounded-xl flex justify-between items-center"
                >

                  <span>

                    {player}

                  </span>

                  <span className="font-bold text-yellow-400">

                    {
                      gameState?.scores?.[
                        player
                      ] || 0
                    }

                  </span>

                </div>
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
export default App;