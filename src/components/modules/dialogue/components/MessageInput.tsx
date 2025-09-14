import React, { useState, useEffect } from 'react';
import { SmartInput } from '@/components/dialogue/SmartInput';
import { ImageUpload } from '@/components/common/ImageUpload';
import { useDialogueContextStore } from '@/stores';

interface MessageInputProps {
  onSendMessage: (content: string, images?: string[]) => void;
  isStreaming?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming = false
}) => {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  const { activeContexts, clearAllContexts } = useDialogueContextStore();

  // 全局剪贴板监听 - 处理Ctrl+V图片粘贴
  useEffect(() => {
    const handleGlobalPaste = async (event: KeyboardEvent) => {
      // 检查是否是Ctrl+V或Cmd+V，并且焦点在输入框内
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        // 检查焦点是否在textarea内
        const activeElement = document.activeElement;
        const isInTextarea = activeElement?.tagName === 'TEXTAREA';

        if (!isInTextarea) return; // 只有在输入框内才处理

        try {
          // 读取剪贴板内容
          const clipboardItems = await navigator.clipboard.read();

          for (const clipboardItem of clipboardItems) {
            // 检查是否有图片类型
            for (const type of clipboardItem.types) {
              if (type.startsWith('image/')) {
                const blob = await clipboardItem.getType(type);
                
                // 转换为Base64
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64 = e.target?.result as string;
                  if (base64) {
                    setSelectedImages(prev => [...prev, base64]);
                    setShowImageUpload(true);
                  }
                };
                reader.readAsDataURL(blob);
                break;
              }
            }
          }
        } catch (err) {
        }
      }
    };

    // 添加事件监听
    document.addEventListener('keydown', handleGlobalPaste);
    return () => {
      document.removeEventListener('keydown', handleGlobalPaste);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim() && selectedImages.length === 0) return;
    
    // 收集活动上下文  
    // const contextData = activeContexts.size > 0 ? Array.from(activeContexts.values()) : undefined;
    
    onSendMessage(message, selectedImages.length > 0 ? selectedImages : undefined);
    
    // 清空输入
    setMessage('');
    setSelectedImages([]);
    setShowImageUpload(false);
    
    // 清除上下文
    if (activeContexts.size > 0) {
      clearAllContexts();
    }
  };

  // const handleImageUpload = (images: string[]) => {
  //   setSelectedImages(prev => [...prev, ...images]);
  //   setShowImageUpload(true);
  // };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    if (selectedImages.length === 1) {
      setShowImageUpload(false);
    }
  };

  return (
    <div className="feather-glass-bottom-border">
      <div className="max-w-3xl mx-auto p-6">
        {/* 上下文标签 */}
        {activeContexts.size > 0 && (
          <div className="mb-4 p-3 feather-glass-deco rounded-lg">
            <div className="text-sm theme-text-secondary mb-2">
              引用上下文 ({activeContexts.size}个)
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(activeContexts.values()).slice(0, 3).map((context: any) => (
                <span
                  key={context.id}
                  className="px-2 py-1 theme-bg-primary/20 rounded text-xs theme-text-primary backdrop-blur-sm"
                >
                  {context.type}: {context.content.slice(0, 30)}...
                </span>
              ))}
              {activeContexts.size > 3 && (
                <span className="px-2 py-1 theme-bg-primary/20 rounded text-xs theme-text-secondary backdrop-blur-sm">
                  还有 {activeContexts.size - 3} 个...
                </span>
              )}
            </div>
          </div>
        )}

        {/* 图片预览 */}
        {showImageUpload && selectedImages.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`上传的图片 ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <SmartInput
              value={message}
              onChange={setMessage}
              onSend={handleSend}
              showImageUpload={showImageUpload}
              onImageUploadToggle={() => setShowImageUpload(!showImageUpload)}
              disabled={isStreaming}
              placeholder={isStreaming ? "AI正在思考中..." : "输入消息..."}
            />
          </div>
        </div>

        {/* 图片上传组件 */}
        <ImageUpload
          images={selectedImages}
          onImagesChange={setSelectedImages}
          maxImages={5}
        />
      </div>
    </div>
  );
};