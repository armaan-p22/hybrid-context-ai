// Common base styles to avoid repetition
const buttonBase = "p-2 rounded-lg transition";
const bubbleBase = "max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm";

export const styles = {
  // Layout Containers
  pageWrapper: "flex justify-center items-center min-h-screen bg-white font-sans text-gray-800",
  cardContainer: "w-full max-w-[600px] h-[80vh] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col",
  
  // Header
  header: "p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50",
  headerTitle: "text-lg font-bold text-gray-800",
  headerStatus: "text-xs text-gray-500 mt-1",
  settingsButton: "text-gray-400 hover:text-gray-600 absolute right-6",

  // Settings Panel
  settingsPanel: "bg-gray-50 p-3 text-sm border-b border-gray-200",
  settingsLabel: "block mb-1 text-gray-600 font-bold",
  settingsInput: "w-full p-2 rounded border border-gray-300 focus:outline-none focus:border-blue-500",

  // Status Bar (File/Web Indicators)
  statusBar: "px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-center",
  statusProcessing: "text-xs text-gray-500 animate-pulse",
  statusFile: "bg-green-100 text-green-700 text-xs px-2 py-1 rounded border border-green-200 flex items-center gap-2",
  statusWeb: "bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded border border-blue-200",
  closeButton: "font-bold hover:text-green-900",

  // Chat Area
  chatContainer: "flex-1 overflow-y-auto p-4 space-y-3 bg-white",
  rowUser: "flex justify-end",
  rowAI: "flex justify-start",
  
  // Message Bubbles 
  bubbleUser: `${bubbleBase} bg-blue-600 text-white rounded-br-none`,
  bubbleAI: `${bubbleBase} bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none`,

  // Footer / Input Area
  inputContainer: "p-4 border-t border-gray-100 bg-white flex items-center gap-2",
  inputField: "flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800",
  sendButton: "px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50",
  
  // Button States (Used for Toggle Buttons)
  btnActiveFile: `${buttonBase} bg-green-100 text-green-600`,
  btnActiveWeb: `${buttonBase} bg-blue-100 text-blue-600`,
  btnInactive: `${buttonBase} bg-gray-100 text-gray-500 hover:bg-gray-200`,

  // Disclaimer
  disclaimer: "bg-gray-50 p-2 text-center text-xs text-gray-400 border-t border-gray-100"
};