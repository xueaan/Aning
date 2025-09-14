import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";


const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(<App />);




