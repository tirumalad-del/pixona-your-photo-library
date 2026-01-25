import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { db } from "@/lib/db";
import { soundManager } from "@/lib/sounds";

// Initialize database and sound manager on app start
// Render app immediately
createRoot(document.getElementById("root")!).render(<App />);

// Initialize database and sound manager in background
db.init().then(() => {
  soundManager.init();
  console.log('✅ Database and sound manager initialized successfully');
}).catch(error => {
  console.error('❌ Failed to initialize database:', error);
  // App still works, just without database features initially
});
