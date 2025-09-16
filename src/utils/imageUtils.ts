// 图片处理工具函数

/**
 * 将文件转换为 Base64 格式
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 压缩选项接口
 */
export interface CompressOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * 压缩图片
 */
export const compressImage = (file: File, options: CompressOptions): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;

      if (width > options.maxWidth || height > options.maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = options.maxWidth;
          height = options.maxWidth / aspectRatio;
        } else {
          height = options.maxHeight;
          width = options.maxHeight * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 使用双线性插值提升质量
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 直接转换为base64
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => {
              // 压缩失败，返回原文件的base64
              fileToBase64(file).then(resolve);
            };
            reader.readAsDataURL(blob);
          } else {
            // 压缩失败，返回原文件的base64
            fileToBase64(file).then(resolve);
          }
        },
        file.type,
        options.quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 验证图片文件
 */
export const validateImageFile = (
  file: File,
  maxSize: number = 5, // MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): string | null => {
  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    return `不支持的图片格式，仅支持: ${allowedTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ')}`;
  }

  // 检查文件大小
  if (file.size > maxSize * 1024 * 1024) {
    return `图片大小不能超过 ${maxSize} MB`;
  }

  return null;
};

/**
 * 处理图片上传 - 智能压缩并转换为 Base64
 */
export const processImageUpload = async (
  file: File,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    maxSize?: number;
  } = {}
): Promise<string> => {
  const {
    quality = 0.85,
    maxWidth = 1200, // 降低默认最大宽度
    maxHeight = 800, // 降低默认最大高度
    maxSize = 5,
  } = options;

  // 验证文件
  const validationError = validateImageFile(file, maxSize);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    // 智能压缩策略 - 根据文件大小确定压缩参数
    const fileSizeMB = file.size / (1024 * 1024);
    let compressionOptions: CompressOptions;

    if (fileSizeMB < 0.5) {
      // 小图片(<500KB): 保持高质量，适度调整尺寸
      compressionOptions = {
        quality: 0.95,
        maxWidth: Math.min(maxWidth, 1200),
        maxHeight: Math.min(maxHeight, 800),
      };
    } else if (fileSizeMB < 2) {
      // 中等图片 (500KB-2MB): 中等质量压缩
      compressionOptions = {
        quality,
        maxWidth,
        maxHeight,
      };
    } else {
      // 大图片(>2MB): 积极压缩
      compressionOptions = {
        quality: 0.75,
        maxWidth: Math.min(maxWidth, 1000),
        maxHeight: Math.min(maxHeight, 667),
      };
    }

    // 压缩图片并直接返回base64
    const base64 = await compressImage(file, compressionOptions);

    return base64;
  } catch (error) {
    console.error('图片处理失败:', error);
    throw new Error('图片处理失败，请重试');
  }
};

/**
 * 从Bbase64 获取图片信息
 */
export const getImageFromBase64 = (base64: string) => {
  const [header] = base64.split(',');
  const matches = header.match(/data:([^;]+)/);
  const mimeType = matches ? matches[1] : 'unknown';

  // 估算文件大小 (Base64 比原文件大约33%)
  const sizeInBytes = Math.round((base64.length * 3) / 4);
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

  return {
    mimeType,
    sizeInBytes,
    sizeInMB: parseFloat(sizeInMB),
    format: mimeType.split('/')[1]?.toUpperCase() || 'UNKNOWN',
  };
};
