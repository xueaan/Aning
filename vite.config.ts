import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/modules": path.resolve(__dirname, "./src/modules"),
    },
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
  
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    host: host || "0.0.0.0",
    port: 5000,
    strictPort: false,
    // 改进 HMR 配置，避免网络连接问题
    hmr: host
      ? {
          protocol: "ws",
          host: host,
          port: 1430,
          timeout: 5000,
          overlay: false,
        }
      : {
          // 本地开发时的HMR配置
          timeout: 5000,
          overlay: false,
          // 禁用错误覆盖层，避免干扰
        },
    // 🔥 预热常用模块，减少首次加载时间
    warmup: {
      clientFiles: [
        './src/main.tsx', 
        './src/App.tsx', 
        './src/stores/index.ts',
        './src/stores/appStore.ts',
        './src/hooks/useTheme.ts',
        './src/hooks/useResponsive.ts',
        './src/components/core/Sidebar.tsx',
        './src/components/core/MainContent.tsx'
      ]
    },
    // 排除特定目录和文件
    watch: {
      ignored: ['**/blocksuite/**']
    }
  },

  // Environment variables with the `VITE_` prefix will be exposed to your frontend code
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  
  // 🚀 优化的依赖预构建配置
  optimizeDeps: {
    // 排除不需要预构建的包
    exclude: ['@tauri-apps/api'],
    // 强制预构建关键依赖，减少首次加载时间
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'zustand',
      'zustand/middleware',
      'react-dnd',
      'react-dnd-html5-backend',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'framer-motion'
    ]
  },

  // 构建配置
  esbuild: {
    // 确保jsx正确处理
    jsxDev: false
  },

  define: {
    // 支持 BlockSuite 的环境变量
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      external: [/^.*\/blocksuite\//],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@tiptap') || id.includes('prosemirror') || id.includes('novel')) return 'vendor-editor';
            if (id.includes('reactflow')) return 'vendor-reactflow';
            if (id.includes('framer-motion')) return 'vendor-motion';
          }
        },
      },
    },
  },
});

