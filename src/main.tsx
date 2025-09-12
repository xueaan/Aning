import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

console.log('📦 main.tsx 开始执行');
console.log('🏃 React 渲染开始时间:', performance.now().toFixed(2), 'ms');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ 找不到root元素');
  throw new Error('Root element not found');
}

console.log('✅ Root元素已找到');

const root = ReactDOM.createRoot(rootElement as HTMLElement);

console.log('🌳 React Root已创建');
console.log('🚀 开始渲染App组件...');

root.render(<App />);

console.log('✅ App组件已挂载到DOM');



