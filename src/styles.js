const buttonBase = "p-2 rounded-lg transition";
const bubbleBase = "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap";
const markdownBase = "prose prose-sm max-w-none prose-p:my-0 prose-ul:my-0 prose-li:my-0 leading-relaxed";

export const styles = {
  // Layout
  pageWrapper: "flex h-screen w-screen bg-white font-sans text-gray-800 overflow-hidden",
  
  // Sidebar
  sidebar: "w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0",
  newChatContainer: "p-4 border-b border-gray-200",
  newChatButton: "w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm",
  sessionList: "flex-1 overflow-y-auto p-2 space-y-1",
  sessionItemActive: "group flex justify-between items-center p-3 rounded-lg cursor-pointer text-sm bg-white border border-gray-200 shadow-sm",
  sessionItemInactive: "group flex justify-between items-center p-3 rounded-lg cursor-pointer text-sm hover:bg-gray-200",
  sessionTitle: "truncate flex-1 font-medium text-gray-700",
  deleteButton: "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2 transition-opacity",
  sidebarFooter: "p-4 border-t border-gray-200 text-xs text-gray-500",
  
  // Main Chat Container
  mainContainer: "flex-1 flex flex-col h-full relative",
  
  // Header
  header: "h-16 border-b border-gray-100 flex justify-between items-center px-6 bg-white flex-shrink-0",
  headerTitle: "font-bold text-gray-700 text-lg truncate",
  settingsButton: "text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100",

  // Messages Area
  messagesArea: "flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth",
  emptyState: "h-full flex flex-col items-center justify-center text-gray-300",
  
  rowUser: "flex justify-end",
  rowAI: "flex justify-start",
  bubbleUser: `${bubbleBase} bg-blue-600 text-white rounded-br-none`,
  bubbleAI: `${bubbleBase} bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none`,

  // Footer
  footerContainer: "bg-white border-t border-gray-100 flex-shrink-0 z-20",
  
  // Tool Status Bar
  toolBar: "px-4 py-2 flex gap-2",
  statusProcessing: "text-xs text-gray-500 animate-pulse",
  statusFile: "bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center gap-1",
  statusWeb: "bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded",
  closeButton: "hover:text-green-900 ml-1 font-bold",

  // Input Row
  inputRow: "p-4 flex items-center gap-2",
  inputField: "flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800",
  sendButton: "px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
  
  btnActiveFile: `${buttonBase} bg-green-100 text-green-600`,
  btnActiveWeb: `${buttonBase} bg-blue-100 text-blue-600`,
  btnInactive: `${buttonBase} bg-gray-100 text-gray-500 hover:bg-gray-200`,

  markdownAI: `${markdownBase} text-gray-800`,
  markdownUser: `${markdownBase} prose-invert text-white`,
  loadingDots: "animate-pulse text-gray-400 text-2xl font-bold leading-none ml-1",

  disclaimer: "bg-gray-50 p-2 text-center text-[10px] text-gray-400 border-t border-gray-100"
};