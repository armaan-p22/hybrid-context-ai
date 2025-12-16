import { useState, useEffect, useRef } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { styles } from "./styles";
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const SELECTED_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function App() {
  // Engine State
  const [engine, setEngine] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");
  const [isEngineReady, setIsEngineReady] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // UI State
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Tools State
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize Engine
  useEffect(() => {
    const initAI = async () => {
      try {
        const engine = await CreateMLCEngine(SELECTED_MODEL, {
          initProgressCallback: (report) => setLoadingProgress(report.text),
        });
        setEngine(engine);
        setIsEngineReady(true);
        setLoadingProgress("Ready");
      } catch (error) {
        console.error(error);
        setLoadingProgress("Error: WebGPU not supported.");
      }
    };
    initAI();
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      else createNewSession();
    } else {
      createNewSession();
    }
  }, []);

  // Save Sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, isLoading]);

  // Session Handlers
  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setFileContent("");
    setFileName("");
    setUserInput("");
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      if (updated.length > 0) setCurrentSessionId(updated[0].id);
      else createNewSession();
    }
    if (updated.length === 0) localStorage.removeItem("chat_sessions");
  };

  const getCurrentMessages = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    return session ? session.messages : [];
  };

  const updateCurrentSessionMessages = (newMessages) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Auto-Title Logic
        let title = session.title;
        if (session.messages.length === 0 && newMessages.length > 0) {
          const firstMsg = newMessages[0].content;
          const cleanMsg = firstMsg.replace(/\[Attached:.*?\]\n/, "");
          title = cleanMsg.length > 25 ? cleanMsg.substring(0, 25) + "..." : cleanMsg;
        }
        return { ...session, messages: newMessages, title };
      }
      return session;
    }));
  };

  // File Handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessingFile(true);
    setFileName(file.name);
    setUseWebSearch(false);

    try {
      let extractedText = "";
      if (file.type.startsWith("image/")) {
        const worker = await Tesseract.createWorker("eng");
        const ret = await worker.recognize(file);
        extractedText = ret.data.text;
        await worker.terminate();
      } 
      else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join("\n");
          extractedText += `\n--- Page ${i} ---\n${pageText}\n`;
        }
      } 
      else {
        extractedText = await file.text();
      }
      setFileContent(extractedText);
    } catch (error) {
      console.error(error);
      alert("Error reading file.");
      setFileName("");
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Web Search
  const performWebSearch = async (query) => {
    if (!TAVILY_API_KEY || TAVILY_API_KEY.includes("xxx")) {
        return "Error: Please add your Tavily API Key in the code (App.js).";
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: TAVILY_API_KEY, query: query, max_results: 3 }),
      });
      const data = await response.json();
      return data.results.map(r => `• ${r.title}: ${r.content}`).join("\n");
    } catch (err) {
      console.error(err);
      return "Error fetching web results.";
    }
  };

  // Send Handler
  const handleSend = async () => {
    if (!userInput.trim() || !engine) return;

    const currentInput = userInput;
    const currentFile = fileContent;
    const currentFileName = fileName;

    setUserInput("");
    // setFileContent("");
    // setFileName("");
    setIsLoading(true);

    // Safeguard: If file is massive, create a truncated version for the UI history
    let uiContent = currentInput;
    if (currentFileName) {
      uiContent = `[Attached: ${currentFileName}]\n${currentInput}`;
    }

    const currentMsgs = getCurrentMessages();
    const newMessages = [...currentMsgs, { role: "user", content: uiContent }];
    
    updateCurrentSessionMessages(newMessages);

    try {
      let systemInstruction = "You are a helpful, private AI assistant.";
      let contextData = "";

      if (currentFile) {
        systemInstruction = "You are a helpful AI. Answer questions using ONLY the user uploaded file context below.";
        // Safeguard: Limit context to ~20,000 chars
        const safeFileContent = currentFile.slice(0, 20000); 
        contextData = `\n\n=== USER UPLOADED FILE (${currentFileName}) ===\n${safeFileContent}`;
      } else if (useWebSearch) {
        systemInstruction = "You are a web-enabled AI. Answer using the search results below.";
        const searchResults = await performWebSearch(currentInput);
        contextData = `\n\n=== LIVE WEB SEARCH RESULTS ===\n${searchResults}`;
      }

      const systemMessage = { role: "system", content: `${systemInstruction}\n${contextData}` };
      const requestMessages = [systemMessage, ...newMessages];

      const chunks = await engine.chat.completions.create({
        messages: requestMessages,
        stream: true,
      });

      let aiReply = "";
      const messagesWithAssistant = [...newMessages, { role: "assistant", content: "" }];
      updateCurrentSessionMessages(messagesWithAssistant);

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta.content || "";
        aiReply += delta;
        
        // Update the last message in the session
        setSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            const updatedMsgs = [...session.messages];
            updatedMsgs[updatedMsgs.length - 1].content = aiReply;
            return { ...session, messages: updatedMsgs };
          }
          return session;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      
      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.newChatContainer}>
          <button onClick={createNewSession} className={styles.newChatButton}>
            + New Chat
          </button>
        </div>
        
        <div className={styles.sessionList}>
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={currentSessionId === session.id ? styles.sessionItemActive : styles.sessionItemInactive}
            >
              <span className={styles.sessionTitle}>{session.title}</span>
              <button 
                onClick={(e) => deleteSession(e, session.id)}
                className={styles.deleteButton}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className={styles.sidebarFooter}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isEngineReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span>{isEngineReady ? "Model Loaded" : "Loading Model..."}</span>
          </div>
          <p className="opacity-70">{loadingProgress}</p>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className={styles.mainContainer}>
        
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>
             {sessions.find(s => s.id === currentSessionId)?.title || "Private AI Chat"}
          </h1>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {getCurrentMessages().length === 0 ? (
            <div className={styles.emptyState}>
              <span className="text-4xl mb-2">💬</span>
              <p>Start a new private conversation</p>
            </div>
          ) : (
            getCurrentMessages().map((msg, index) => (
              <div key={index} className={msg.role === "user" ? styles.rowUser : styles.rowAI}>
                <div className={msg.role === "user" ? styles.bubbleUser : styles.bubbleAI}>
                  <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                  <div>{msg.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer / Input */}
        <div className={styles.footerContainer}>
          
          {/* Tool Status */}
          {(fileName || useWebSearch || isProcessingFile) && (
            <div className={styles.toolBar}>
              {isProcessingFile && <span className={styles.statusProcessing}>⏳ Processing...</span>}
              {fileName && (
                 <span className={styles.statusFile}>
                   📄 {fileName}
                   <button onClick={() => {setFileName(""); setFileContent("")}} className={styles.closeButton}>x</button>
                 </span>
              )}
              {useWebSearch && !fileName && (
                <span className={styles.statusWeb}>🌐 Web Search Active</span>
              )}
            </div>
          )}

          {/* Input Bar */}
          <div className={styles.inputRow}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept=".pdf,.jpg,.jpeg,.png,.txt"
            />
            <button 
              onClick={() => fileInputRef.current.click()} 
              className={fileName ? styles.btnActiveFile : styles.btnInactive}
              title="Attach File"
              disabled={isProcessingFile}
            >
              📎
            </button>
            
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={useWebSearch ? styles.btnActiveWeb : styles.btnInactive}
              disabled={fileName} 
              title="Toggle Web Search"
            >
              🌐
            </button>

            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={isEngineReady ? "Type a message..." : "Waiting for model..."}
              className={styles.inputField}
              disabled={!isEngineReady || isLoading || isProcessingFile}
            />

            <button 
              onClick={handleSend} 
              disabled={!isEngineReady || isLoading || isProcessingFile}
              className={styles.sendButton}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>

          <div className={styles.disclaimer}>
            <p>
              ⚠️ Local AI (Llama 3.2) knowledge cutoff is 2024. 
              For real-time info, toggle <strong>Web Search</strong> (🌐).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}