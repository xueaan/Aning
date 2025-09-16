# Repository Guidelines

## 项目结构与模块组织
- `src/`：React + TypeScript 前端。核心目录：`components/`、`pages/`、`services/`（API/DB）、`stores/`（Zustand）、`hooks/`、`lib/`、`constants/`、`config/`。
- `src-tauri/`：Tauri（Rust）后端。入口 `src-tauri/src/main.rs`；业务/指令在 `src-tauri/src/*.rs`；配置 `src-tauri/tauri.conf.json`。
- `public/` 静态资源；`dist/` 构建产物；`memory/` 工程记录。根部：`vite.config.ts`（别名如 `@` → `src/`）、`index.html`。

## 构建、测试与开发命令
- 前置：Node 18+、`pnpm`、Rust stable、Tauri 依赖（Windows 需 WebView2）。
- 安装依赖：`pnpm install`
- Web 开发：`pnpm dev`（Vite 端口 5000；设置 `TAURI_DEV_HOST` 时 HMR 走 1430）。
- 桌面开发：`pnpm run tauri dev`
- Web 构建：`pnpm build` → `dist/`
- 桌面构建：`pnpm run tauri build`（或 `cd src-tauri && cargo build -r`）
- 预览：`pnpm preview`

## 代码风格与命名
- TS/React：2 空格缩进；分号开启；组件 PascalCase（如 `CardGrid.tsx`）；Hook 用 `useX`；Store 以 `Store.ts` 结尾。
- 导入：优先别名（如 `@/hooks/useTheme`）。
- 样式：优先 Tailwind；用 `clsx`/`tailwind-merge` 组合；必要时在功能内局部 CSS。
- Rust：`cargo fmt`；类型 `CamelCase`，函数/变量 `snake_case`；新代码返回 `Result`，避免 `unwrap()`。

## 测试指南
- 目前未集成测试。若新增，建议 Vitest，放置 `src/**/*.test.ts(x)`，并在 `package.json` 添加 `test` 脚本。暂以 PR 中的手动验证步骤为准。

## 提交与 PR 规范
- 采用 Conventional Commits：`feat`、`fix`、`docs`、`refactor`、`chore`。
  - 例：`feat(password): add generator strength meter`
- PR 必须：简明描述、关联 Issue、验证步骤、UI 变更截图/GIF；注明 DB/配置影响；保持最小改动并通过 `pnpm build`。

## 安全与配置提示
- 环境注入：仅 `VITE_*` 与 `TAURI_ENV_*` 会暴露到前端（见 `vite.config.ts`）；不要硬编码密钥。
- SQLite 路径：运行 `node get-db-path.js` 查看可能位置；不要提交数据库文件。
- 开发端口在 `vite.config.ts` 定义，变更需协同。
