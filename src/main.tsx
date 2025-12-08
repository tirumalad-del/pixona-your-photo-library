import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { db } from "@/lib/db";
import { soundManager } from "@/lib/sounds";

// Initialize database and sound manager on app start
db.init().then(() => {
  soundManager.init();
  console.log('PIXONA: Database and sound manager initialized');
}).catch(error => {
  console.error('PIXONA: Failed to initialize database:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
