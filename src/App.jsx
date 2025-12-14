import { useState, useEffect, useRef } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const SELECTED_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

function App() {
  const [engine, setEngine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initAI = async () => {
      setLoadingProgress("Initializing WebGPU...");
      try {
        const initProgressCallback = (report) => {
          setLoadingProgress(report.text);
        };
        const engine = await CreateMLCEngine(SELECTED_MODEL, {
          initProgressCallback: initProgressCallback,
        });
        setEngine(engine);
        setLoadingProgress("Ready");
      } catch (error) {
        console.error(error);
        setLoadingProgress("Error: WebGPU not supported.");
      }
    };
    initAI();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!userInput.trim() || !engine) return;

    const systemMessage = { 
      role: "system", 
      content: "You are a helpful, private AI assistant. Be concise." 
    };

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const requestMessages = [systemMessage, ...newMessages];
      const chunks = await engine.chat.completions.create({
        messages: requestMessages,
        stream: true,
      });

      let aiReply = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta.content || "";
        aiReply += delta;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiReply;
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.chatContainer}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🔒 Private AI Chat</h1>
          <p style={styles.status}>{loadingProgress}</p>
        </div>

        {/* Chat History */}
        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div key={index} style={msg.role === "user" ? styles.userRow : styles.aiRow}>
              <div style={msg.role === "user" ? styles.userBubble : styles.aiBubble}>
                <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!engine || isLoading}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            style={styles.input}
          />
          <button 
            onClick={handleSend} 
            disabled={!engine || isLoading}
            style={styles.button}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// STYLES
const styles = {
  pageWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#ffffff", 
    fontFamily: "Arial, sans-serif",
  },
  chatContainer: {
    width: "600px",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #ccc", 
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)", 
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  header: {
    padding: "15px",
    borderBottom: "1px solid #eee",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
  },
  title: { margin: "0 0 5px 0", fontSize: "1.2rem", color: "#333" },
  status: { margin: 0, fontSize: "0.8rem", color: "#666" },
  
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userRow: { display: "flex", justifyContent: "flex-end" },
  aiRow:   { display: "flex", justifyContent: "flex-start" },
  
  userBubble: {
    backgroundColor: "#007bff", // Blue
    color: "white",
    padding: "10px 15px",
    borderRadius: "15px 15px 0 15px",
    maxWidth: "70%",
    lineHeight: "1.4",
  },
  aiBubble: {
    backgroundColor: "#f1f1f1", 
    color: "#333", 
    padding: "10px 15px",
    borderRadius: "15px 15px 15px 0",
    maxWidth: "70%",
    lineHeight: "1.4",
  },
  
  inputArea: {
    display: "flex",
    padding: "15px",
    borderTop: "1px solid #eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginRight: "10px",
    fontSize: "1rem",
    outline: "none",
    color: "#000", 
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  }
};

export default App;