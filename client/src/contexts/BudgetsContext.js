// ... (imports remain the same) ...

export const BudgetsProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  // ... (other state hooks remain the same) ...

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let ws;
    let reconnectTimeout;

    function connect() {
      const WS_URL = process.env.REACT_APP_WS_URL || "wss://budget.technickservices.com/ws";
      console.log(`CLIENT LOG: Attempting to connect to WebSocket at ${WS_URL}`);
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        // This log proves the browser successfully established a connection.
        console.log('✅ CLIENT LOG: WebSocket connection opened successfully.');
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // This log proves the client is receiving messages from the server.
          console.log('✅ CLIENT LOG: Received message from server:', message);
          
          // Original message handling logic...
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("CLIENT LOG: WebSocket disconnected. Reconnecting...");
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        // This log shows any browser-level connection error.
        console.error("❌ CLIENT LOG: WebSocket error event fired.", error);
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [isAuthenticated, token]);

  // ... (The rest of your BudgetsContext.js file remains the same) ...
};
