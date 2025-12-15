import { useState, useEffect, useRef } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

const SELECTED_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC";

// Configure PDF.js (For PDF parsing)
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

      // Handle Images (OCR with Tesseract.js)
      if (file.type.startsWith("image/")) {
        console.log("Processing image...");
        const worker = await Tesseract.createWorker("eng");
        const ret = await worker.recognize(file);
        extractedText = ret.data.text;
        await worker.terminate();
      } 
      // Handle PDFs (Text Extraction with PDF.js)
      else if (file.type === "application/pdf") {
        console.log("Processing PDF...");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        // Loop through all pages to get text
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          extractedText += `\n--- Page ${i} ---\n${pageText}`;
        }
      } 
      // Handle Text Files
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

    // Clear UI
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
    <div className="flex justify-center items-center min-h-screen bg-white font-sans text-gray-800">
      
      {/* CARD CONTAINER */}
      <div className="w-full max-w-[600px] h-[80vh] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="text-center w-full">
            <h1 className="text-lg font-bold text-gray-800">🔒 Private AI Chat</h1>
            <p className="text-xs text-gray-500 mt-1">{loadingProgress}</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-gray-600 absolute right-6">
            ⚙️
          </button>
        </div>

        {/* SETTINGS */}
        {showSettings && (
          <div className="bg-gray-50 p-3 text-sm border-b border-gray-200">
             <label className="block mb-1 text-gray-600 font-bold">Web Search API Key:</label>
             <input 
               type="password" 
               className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500"
               placeholder="Enter Tavily API Key..."
               value={tavilyKey}
               onChange={(e) => setTavilyKey(e.target.value)}
             />
          </div>
        )}

        {/* STATUS BAR */}
        {(fileName || useWebSearch || isProcessingFile) && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-center">
            {isProcessingFile ? (
               <span className="text-xs text-gray-500 animate-pulse">⏳ Processing file (OCR/Parsing)...</span>
            ) : fileName ? (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded border border-green-200 flex items-center gap-2">
                📄 {fileName}
                <button onClick={() => {setFileName(""); setFileContent("")}} className="font-bold hover:text-green-900">x</button>
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200">
                🌐 Web Search ON
              </span>
            )}
          </div>
        )}

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none"
              }`}>
                <strong>{msg.role === "user" ? "You" : "AI"}:</strong>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-2">
          
          {/* File Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload} 
            accept=".pdf,.jpg,.jpeg,.png,.txt,.md,.json"
          />
          <button 
            onClick={() => fileInputRef.current.click()} 
            className={`p-2 rounded-lg transition ${fileName ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            title="Upload PDF or Image"
            disabled={isProcessingFile}
          >
            📎
          </button>

          {!fileName && (
            <button 
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`p-2 rounded-lg transition ${useWebSearch ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
            disabled={!engine || isLoading || isProcessingFile}
          />

          <button 
            onClick={handleSend} 
            disabled={!engine || isLoading || isProcessingFile}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;