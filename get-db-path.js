// 获取数据库路径的脚本
// 运行: node get-db-path.js

import os from 'os';
import path from 'path';

// Windows 上 Tauri 应用数据目录通常在:
// %APPDATA%\com.tauri.dev\
// 或 %APPDATA%\[你的应用名]\

const appDataPath = process.env.APPDATA || process.env.HOME;
const possiblePaths = [
  path.join(appDataPath, 'com.tauri.dev', 'database.db'),
  path.join(appDataPath, 'note-app', 'database.db'),
  path.join(appDataPath, 'com.tauri.note-app', 'database.db'),
];

console.log('=================================');
console.log('SQLite 数据库可能的位置:');
console.log('=================================');
console.log('');

possiblePaths.forEach((dbPath, index) => {
  console.log(`${index + 1}. ${dbPath}`);
});

console.log('');
console.log('=================================');
console.log('Navicat 连接步骤:');
console.log('=================================');
console.log('1. 打开 Navicat');
console.log('2. 新建连接 -> SQLite');
console.log('3. 连接名称: 随便填 (如: NoteApp)');
console.log('4. 数据库文件: 点击 "..." 浏览');
console.log('5. 导航到上面的路径，选择 database.db');
console.log('6. 点击 "测试连接"');
console.log('7. 点击 "确定" 保存');
console.log('');
console.log('注意: 如果文件不存在，需要先运行应用让它创建数据库文件');
console.log('=================================');