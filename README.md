# Hybrid Context AI Assistant 🛡️

A full-stack, privacy-focused AI assistant that merges **Local Context** (your files and history) with **Web Context** (live search results).

Built with React and **Web-LLM**, this application runs the **Llama 3.2 3B** model locally on your machine using WebGPU. It intelligently handles PDF parsing, Image OCR, and live web search without compromising your privacy.

## ✨ Features

* **🚫 100% Private Core:** The AI model (Llama 3.2) downloads once and runs offline in your browser.
* **🔄 Hybrid Intelligence:** seamless switching between private, local processing and live web search via the **Tavily API** for real-time events.
* **📄 Document Analysis:** Add **PDFs** or **Text files**. The AI extracts context (up to ~12k characters) to answer specific questions.
* **👁️ Optical Character Recognition (OCR):** Upload images (PNG/JPG). The app uses **Tesseract.js** to extract text from screenshots or scanned documents.
* **💾 Smart Session Management:**
    * **Auto-Titling:** Generates concise 3-5 word topic labels for every conversation.
    * **Persistent History:** Auto-saves all chats to LocalStorage.

## 🛠️ Tech Stack

* **Frontend:** React (Vite)
* **AI Engine:** [@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) (WebGPU acceleration)
* **Search API:** [Tavily AI](https://tavily.com/)
* **File Handling:**
    * `pdfjs-dist` (PDF Parsing)
    * `tesseract.js` (Image OCR)
* **Styling:** Tailwind CSS + `@tailwindcss/typography`

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* A modern browser with WebGPU support (Chrome, Edge, Brave).

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/hybrid-context-ai.git](https://github.com/your-username/hybrid-context-ai.git)
cd hybrid-context-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a .env file in the root directory to store your Web Search key.
```bash
touch .env
```

### Add the following line to your .env file:
```bash
VITE_TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxx
```
(You can get a free key from https://tavily.com/)

### 4. Run the App
```bash
npm run dev
```
Open your browser and navigate to http://localhost:5173.

## 📖 How to Use
* **First Load**: The app will download the Llama 3.2 model (~2GB) on the first run.

* **Chatting**: Type normally for instant, private responses.

* **Attachments 📎**: Click the paperclip to upload a PDF or Image. The AI will prioritize this "Local Context" for its next answer.

* **Web Search 🌐**: Click the globe icon to inject "Web Context" into the conversation (news, stocks, sports).

* **Sessions**: Manage multiple context streams via the sidebar.