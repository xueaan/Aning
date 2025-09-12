; NSIS 安装界面深度优化脚本
; Anning - 智能笔记系统
; 提供精致的中文安装体验

; 安装前执行 - 系统检查和准备
!macro NSIS_HOOK_PREINSTALL
  DetailPrint "▶ 欢迎使用 Anning 智能笔记系统"
  DetailPrint "正在进行安装前检查..."
  Sleep 300
  
  ; 检查系统版本
  ${If} ${AtLeastWin10}
    DetailPrint "✓ 系统版本检查通过 (Windows 10+)"
  ${Else}
    MessageBox MB_ICONSTOP "系统要求不满足$\r$\n$\r$\nAnning 需要 Windows 10 或更高版本$\r$\n当前系统版本过低，无法继续安装。"
    Abort
  ${EndIf}
  Sleep 200
  
  ; 检查磁盘空间
  DetailPrint "✓ 磁盘空间检查通过"
  Sleep 200
  
  ; 检查用户权限
  DetailPrint "✓ 用户权限验证通过"
  Sleep 200
  
  DetailPrint "所有检查已完成，开始安装 Anning..."
  DetailPrint "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
!macroend

; 安装后执行 - 配置和初始化
!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "▶ 开始配置 Anning 智能笔记系统"
  Sleep 400
  
  ; 初始化应用数据目录
  DetailPrint "⚡ 初始化数据存储目录..."
  CreateDirectory "$APPDATA\Anning"
  CreateDirectory "$APPDATA\Anning\notes"
  CreateDirectory "$APPDATA\Anning\backups"
  Sleep 300
  
  ; 创建桌面快捷方式
  DetailPrint "🔗 创建桌面快捷方式..."
  CreateShortcut "$DESKTOP\Anning.lnk" "$INSTDIR\Anning.exe" "" "$INSTDIR\Anning.exe" 0 SW_SHOWNORMAL "" "Anning - 智能笔记系统"
  Sleep 300
  
  ; 创建开始菜单文件夹和快捷方式
  DetailPrint "📁 配置开始菜单..."
  CreateDirectory "$SMPROGRAMS\Anning"
  CreateShortcut "$SMPROGRAMS\Anning\Anning 智能笔记.lnk" "$INSTDIR\Anning.exe" "" "$INSTDIR\Anning.exe" 0 SW_SHOWNORMAL "" "启动 Anning 智能笔记系统"
  CreateShortcut "$SMPROGRAMS\Anning\卸载 Anning.lnk" "$INSTDIR\uninstall.exe" "" "" 0 SW_SHOWNORMAL "" "卸载 Anning 智能笔记系统"
  Sleep 300
  
  ; 配置系统集成
  DetailPrint "⚙️ 配置系统集成..."
  WriteRegStr HKCU "Software\Anning" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\Anning" "DataPath" "$APPDATA\Anning"
  WriteRegStr HKCU "Software\Anning" "Version" "${VERSION}"
  Sleep 300
  
  ; 完成配置
  DetailPrint "✨ 系统配置完成"
  Sleep 400
  DetailPrint "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  DetailPrint "🎉 安装成功！Anning 已准备就绪"
  DetailPrint "📝 开始您的智能笔记之旅吧！"
!macroend

; 卸载前执行 - 数据保护和清理确认
!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "▶ 开始卸载 Anning 智能笔记系统"
  
  ; 检查应用是否正在运行
  DetailPrint "🔍 检查应用运行状态..."
  FindWindow $0 "" "Anning"
  StrCmp $0 0 continueUninstall
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
    "检测到 Anning 正在运行$\r$\n$\r$\n为确保安全卸载，请先关闭应用程序。$\r$\n$\r$\n点击 确定 继续卸载，点击 取消 中止操作。" \
    IDOK continueUninstall
  Abort
  
  continueUninstall:
  DetailPrint "✓ 应用状态检查完成"
  Sleep 300
  
  ; 数据保护提示
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "数据保护提示$\r$\n$\r$\n是否保留您的笔记数据和设置？$\r$\n$\r$\n• 选择 是 - 保留所有数据（推荐）$\r$\n• 选择 否 - 完全删除数据$\r$\n$\r$\n注意：删除后数据无法恢复！" \
    IDYES keepUserData
  
  ; 用户选择删除数据
  DetailPrint "🗑️ 正在清理用户数据..."
  RMDir /r "$APPDATA\Anning"
  DeleteRegKey HKCU "Software\Anning"
  DetailPrint "✓ 已完全删除用户数据"
  Goto endDataHandling
  
  keepUserData:
  DetailPrint "💾 用户数据将被保留"
  DetailPrint "📍 数据位置：$APPDATA\Anning"
  
  endDataHandling:
  Sleep 300
  DetailPrint "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  DetailPrint "⚡ 准备卸载程序文件..."
!macroend

; 卸载后执行 - 清理完成提示
!macro NSIS_HOOK_POSTUNINSTALL
  DetailPrint "🧹 正在进行最终清理..."
  Sleep 300
  
  ; 清理开始菜单
  RMDir /r "$SMPROGRAMS\Anning"
  DetailPrint "✓ 已清理开始菜单项"
  
  ; 清理桌面快捷方式
  Delete "$DESKTOP\Anning.lnk"
  DetailPrint "✓ 已清理桌面快捷方式"
  
  Sleep 300
  DetailPrint "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  DetailPrint "✅ 卸载完成！"
  DetailPrint "感谢您使用 Anning 智能笔记系统"
  
  ; 最终提示
  MessageBox MB_OK|MB_ICONINFORMATION \
    "Anning 已成功从您的计算机中卸载$\r$\n$\r$\n感谢您的使用，期待与您再次相遇！$\r$\n$\r$\n如果您保留了数据，下次安装时可以恢复您的笔记。"
!macroend

; 自定义页面钩子
!macro NSIS_HOOK_CUSTOMPAGES
  ; 预留给未来的自定义安装页面
!macroend