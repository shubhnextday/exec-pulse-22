import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (window.self === window.top) {
  document.body.innerHTML = `
    <div style="
      display:flex;
      height:100vh;
      align-items:center;
      justify-content:center;
      font-family:sans-serif;
      text-align:center;
    ">
      <h2>❌ This application can only be accessed by authorized persone.</h2>
    </div>
  `;
  throw new Error("Direct browser access blocked");
}

createRoot(document.getElementById("root")!).render(<App />);
