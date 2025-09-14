import React from "react";
import ReactDOM from "react-dom/client";
import {
  Pilcrow,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Braces,
  SquareSplitVertical,
  Info,
  ImagePlus,
  Table,
} from "lucide-react";

// IconPark 图标映射
const getIconComponent = (title: string, themeColors: any) => {
  const iconMap: Record<string, JSX.Element> = {
    文本: <Pilcrow size={16} color={themeColors.text} />,
    "标题 1": <Heading1 size={18} color={themeColors.text} />,
    "标题 2": <Heading2 size={16} color={themeColors.text} />,
    "标题 3": <Heading3 size={14} color={themeColors.text} />,
    无序列表: <List size={16} color={themeColors.text} />,
    有序列表: <ListOrdered size={16} color={themeColors.text} />,
    任务列表: <ListTodo size={16} color={themeColors.text} />,
    引用: <Quote size={16} color={themeColors.text} />,
    代码块: <Braces size={16} color={themeColors.text} />,
    分割线: <SquareSplitVertical size={16} color={themeColors.text} />,
    表格: <Table size={16} color={themeColors.text} />,
    信息提示: <Info size={16} color={themeColors.text} />,
    图片: <ImagePlus size={16} color={themeColors.text} />,
  };

  return iconMap[title] || <span>{title}</span>;
};

// React 组件用于渲染命令面板
const CommandPanel: React.FC<{
  items: any[];
  onCommand: (item: any) => void;
  themeColors: any;
}> = ({ items, onCommand, themeColors }) => {
  const itemsPerRow = 6;
  const rows = [];
  for (let i = 0; i < items.length; i += itemsPerRow) {
    rows.push(items.slice(i, i + itemsPerRow));
  }

  return (
    <div
      style={{
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            gap: "2px",
          }}
        >
          {row.map((item: any, itemIndex: number) => (
            <div
              key={itemIndex}
              onClick={() => onCommand(item)}
              style={{
                width: "40px",
                height: "40px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: "transparent",
                border: "none",
                borderRadius: "8px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = themeColors.backgroundHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              title={item.title}
            >
              {getIconComponent(item.title, themeColors)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const createCustomRender = () => {
  return () => {
    let popup: HTMLDivElement | null = null;
    let root: any = null;

    return {
      onStart: (props: any) => {
        const items = props.items || [];

        // 检测主题
        const isDarkMode = document.documentElement.classList.contains("dark");

        // 时光记毛玻璃主题配色
        const themeColors = {
          background: isDarkMode
            ? "rgba(20, 20, 20, 0.05)"
            : "rgba(255, 255, 255, 0.02)",
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(255, 255, 255, 0.15)",
          text: isDarkMode ? "rgb(226, 232, 240)" : "rgb(51, 65, 85)",
          textHover: isDarkMode ? "rgb(248, 250, 252)" : "rgb(9, 9, 11)",
          backgroundHover: isDarkMode
            ? "rgba(25, 25, 25, 0.08)"
            : "rgba(255, 255, 255, 0.08)",
          shadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)"
            : "0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        };

        // 创建弹窗元素
        popup = document.createElement("div");
        popup.classList.add("novel-slash-menu", "suggestion-list");
        popup.style.position = "fixed";
        popup.style.zIndex = "99999";
        popup.style.setProperty(
          "background",
          themeColors.background,
          "important",
        );
        popup.style.setProperty(
          "backdrop-filter",
          "blur(20px) saturate(180%)",
          "important",
        );
        popup.style.setProperty(
          "-webkit-backdrop-filter",
          "blur(20px) saturate(180%)",
          "important",
        );
        popup.style.setProperty("border", themeColors.border, "important");
        popup.style.setProperty("border-radius", "16px", "important");
        popup.style.setProperty("box-shadow", themeColors.shadow, "important");
        popup.style.padding = "8px 0";
        popup.style.width = "260px";
        popup.style.maxHeight = "200px";
        popup.style.overflow = "hidden";
        popup.style.fontFamily =
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

        // 定位弹窗
        const rect = props.clientRect();
        popup.style.top = `${rect.bottom + 8}px`;
        popup.style.left = `${rect.left}px`;

        // 添加到页面
        document.body.appendChild(popup);

        // 使用 React 18 的 createRoot API 渲染组件
        root = ReactDOM.createRoot(popup);
        root.render(
          <CommandPanel
            items={items}
            onCommand={(item) => {
              if (props.command) {
                props.command(item);
              }
            }}
            themeColors={themeColors}
          />,
        );

        return false;
      },

      onUpdate: (props: any) => {
        if (popup) {
          const rect = props.clientRect();
          popup.style.top = `${rect.bottom + 8}px`;
          popup.style.left = `${rect.left}px`;
        }
      },

      onKeyDown: (props: any) => {
        if (props.event.key === "Escape") {
          return true;
        }
        return false;
      },

      onExit: () => {
        if (root) {
          root.unmount();
          root = null;
        }

        if (popup && popup.parentNode) {
          popup.parentNode.removeChild(popup);
          popup = null;
        }
      },
    };
  };
};
