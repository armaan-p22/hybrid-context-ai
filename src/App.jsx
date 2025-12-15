import { useState, useEffect, useRef } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { styles } from "./styles"; 

const SELECTED_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function App() {
  const [engine, setEngine] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  
  // LOGIC STATES
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [tavilyKey, setTavilyKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // INITIALIZE AI
  useEffect(() => {
    const initAI = async () => {
      setLoadingProgress("Initializing WebGPU...");
      try {
        const engine = await CreateMLCEngine(SELECTED_MODEL, {
          initProgressCallback: (report) => setLoadingProgress(report.text),
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

  // FILE HANDLING
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileName(file.name);
    setUseWebSearch(false);

    try {
      let extractedText = "";
      // Handle Images
      if (file.type.startsWith("image/")) {
        console.log("Processing image...");
        const worker = await Tesseract.createWorker("eng");
        const ret = await worker.recognize(file);
        extractedText = ret.data.text;
        await worker.terminate();
      } 
      // Handle PDFs
      else if (file.type === "application/pdf") {
        console.log("Processing PDF...");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += `\n--- Page ${i} ---\n${textContent.items.map((item) => item.str).join(" ")}`;
        }
      } 
      // Handle Text
      else {
        extractedText = await file.text();
      }
      setFileContent(extractedText);
    } catch (error) {
      console.error("File processing error:", error);
      alert("Error reading file. Please try a simpler file.");
      setFileName("");
    } finally {
      setIsProcessingFile(false);
    }
  };

  // WEB SEARCH
  const performWebSearch = async (query) => {
    if (!tavilyKey) return "Error: No API Key provided.";
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: query, max_results: 3 }),
      });
      const data = await response.json();
      const results = data.results.map(r => `• ${r.title}: ${r.content}`).join("\n");
      return `WEB SEARCH RESULTS:\n${results}`;
    } catch (err) {
      console.error(err);
      return "Error: Failed to fetch web results.";
    }
  };

  // SEND LOGIC
  const handleSend = async () => {
    if (!userInput.trim() || !engine) return;

    const currentInput = userInput;
    const currentFile = fileContent;
    const currentFileName = fileName;

    setUserInput("");
    setFileContent("");
    setFileName("");
    setIsLoading(true);

    const uiContent = currentFileName 
      ? `[Attached: ${currentFileName}]\n${currentInput}`
      : currentInput;

    const newMessages = [...messages, { role: "user", content: uiContent }];
    setMessages(newMessages);

    try {
      let systemInstruction = "You are a helpful, private AI assistant.";
      let contextData = "";

      if (currentFile) {
        systemInstruction = "You are a helpful AI. Answer questions using ONLY the user uploaded file context below.";
        contextData = `\n\n=== USER UPLOADED FILE (${currentFileName}) ===\n${currentFile}`;
      } else if (useWebSearch) {
        systemInstruction = "You are a web-enabled AI. Answer using the search results below.";
        const searchResults = await performWebSearch(currentInput);
        contextData = `\n\n=== LIVE WEB SEARCH RESULTS ===\n${searchResults}`;
      } else {
        systemInstruction = "You are a private local AI. You have no internet access. Be concise.";
      }

      const systemMessage = { role: "system", content: `${systemInstruction}\n${contextData}` };
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
    <div className={styles.pageWrapper}>
      <div className={styles.cardContainer}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className="text-center w-full">
            <h1 className={styles.headerTitle}>🔒 Private AI Chat</h1>
            <p className={styles.headerStatus}>{loadingProgress}</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className={styles.settingsButton}>
            ⚙️
          </button>
        </div>

        {/* SETTINGS */}
        {showSettings && (
          <div className={styles.settingsPanel}>
             <label className={styles.settingsLabel}>Web Search API Key:</label>
             <input 
               type="password" 
               className={styles.settingsInput}
               placeholder="Enter Tavily API Key..."
               value={tavilyKey}
               onChange={(e) => setTavilyKey(e.target.value)}
             />
          </div>
        )}

        {/* STATUS BAR */}
        {(fileName || useWebSearch || isProcessingFile) && (
          <div className={styles.statusBar}>
            {isProcessingFile ? (
               <span className={styles.statusProcessing}>⏳ Processing file (OCR/Parsing)...</span>
            ) : fileName ? (
              <span className={styles.statusFile}>
                📄 {fileName}
                <button onClick={() => {setFileName(""); setFileContent("")}} className={styles.closeButton}>x</button>
              </span>
            ) : (
              <span className={styles.statusWeb}>
                🌐 Web Search ON
              </span>
            )}
          </div>
        )}

        {/* CHAT AREA */}
        <div className={styles.chatContainer}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === "user" ? styles.rowUser : styles.rowAI}>
              <div className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}>
                <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className={styles.inputContainer}>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
            accept=".pdf,.jpg,.jpeg,.png,.txt,.md,.json"
          />
          <button 
            onClick={() => fileInputRef.current.click()} 
            className={fileName ? styles.btnActiveFile : styles.btnInactive}
            title="Upload PDF or Image"
            disabled={isProcessingFile}
          >
            📎
          </button>

          {!fileName && (
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={useWebSearch ? styles.btnActiveWeb : styles.btnInactive}
              title="Toggle Web Search"
            >
              🌐
            </button>
          )}

          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className={styles.inputField}
            disabled={!engine || isLoading || isProcessingFile}
          />

          <button 
            onClick={handleSend} 
            disabled={!engine || isLoading || isProcessingFile}
            className={styles.sendButton}
          >
            Send
          </button>
        </div>

        {/* DISCLAIMER FOOTER */}
        <div className={styles.disclaimer}>
          <p>
            ⚠️ Local AI (Llama 3.2) knowledge cutoff is 2024. 
            For real-time info, toggle <strong>Web Search</strong> (🌐).
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;