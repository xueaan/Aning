import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSize?: number; // MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 4,
  maxSize = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const [pasteSuccessMessage, setPasteSuccessMessage] = useState<string | null>(null);

  // 文件转base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '只支持图片文件';
    }

    // 检查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxSize} MB`;
    }

    // 检查数量限制
    if (images.length >= maxImages) {
      return `最多只能上传 ${maxImages} 张图片`;
    }

    return null;
  };

  // 处理文件选择
  const handleFiles = async (fileList: FileList | File[]) => {
    setUploadError(null);

    const validFiles: File[] = [];
    let errorMessage: string | null = null;

    // 转换为数组格式
    const files = Array.from(fileList);

    // 验证所有文件
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        errorMessage = error;
        break;
      }

      if (images.length + validFiles.length >= maxImages) {
        break;
      }

      validFiles.push(file);
    }

    if (errorMessage) {
      setUploadError(errorMessage);
      return;
    }

    // 转换为base64
    try {
      const base64Images = await Promise.all(
        validFiles.map(file => fileToBase64(file))
      );

      onImagesChange([...images, ...base64Images]);
    } catch (error) {
      setUploadError('图片处理失败，请重试');
    }
  };

  // 点击上传
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // 重置input value，允许重复选择同一文件
    e.target.value = '';
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // 粘贴处理
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length === 0) return;

    e.preventDefault();
    setIsProcessingPaste(true);
    setPasteSuccessMessage(null);
    setUploadError(null);

    try {
      const files = await Promise.all(
        imageItems.map(item => new Promise<File>((resolve, reject) => {
          const file = item.getAsFile();
          if (file) {
            resolve(file);
          } else {
            reject(new Error('无法获取粘贴的图片'));
          }
        }))
      );

      await handleFiles(files);
      setPasteSuccessMessage(`成功粘贴 ${files.length} 张图片`);
      
      // 3秒后清除成功消息
      setTimeout(() => {
        setPasteSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setUploadError('粘贴图片失败，请重试');
    } finally {
      setIsProcessingPaste(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${dragOver 
            ? 'border-accent theme-bg-accent/10 scale-[1.02]' 
            : 'border-white/20 hover:border-white/30'
          }
          ${uploadError ? 'border-red-400 theme-bg-red-50' : ''}
          feather-glass-content cursor-pointer
        `}
        onClick={handleUploadClick} onDragOver={handleDragOver}
        onDragLeave={handleDragLeave} onDrop={handleDrop}
        onPaste={handlePaste} tabIndex={0}
      >
        <input 
          ref={fileInputRef} 
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="text-center">
          {isProcessingPaste ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
              <p className="theme-text-secondary text-sm">正在处理粘贴的图片...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                {dragOver ? (
                  <Upload className="h-8 w-8 text-accent animate-bounce" />
                ) : (
                  <ImageIcon className="h-8 w-8 theme-text-secondary" />
                )}
              </div>
              <div className="space-y-1">
                <p className="theme-text-primary font-medium">
                  {dragOver ? '松开鼠标上传图片' : '点击上传图片'}
                </p>
                <p className="theme-text-secondary text-sm">
                  支持拖拽、粘贴上传，最大 {maxSize}MB，最多 {maxImages} 张
                </p>
                <p className="theme-text-tertiary text-xs">
                  支持 JPG、PNG、GIF、WebP 格式
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 rounded-lg theme-bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-700 text-sm">{uploadError}</span>
        </div>
      )}

      {/* 成功提示 */}
      {pasteSuccessMessage && (
        <div className="flex items-center space-x-2 p-3 rounded-lg theme-bg-green-50 border border-green-200">
          <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <span className="text-green-700 text-sm">{pasteSuccessMessage}</span>
        </div>
      )}

      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden feather-glass-content border border-white/20">
                <img 
                  src={image} 
                  alt={`上传的图片 ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="
                  absolute -top-2 -right-2 h-6 w-6 rounded-full 
                  bg-red-500 text-white shadow-lg border-2 border-white
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 flex items-center justify-center
                "
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

