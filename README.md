# ReLiquify

ReLiquify 是一个高效的 Chrome 扩展，能够将当前网页的主要内容智能提取并转换为干净的 Markdown 格式。它基于 Mozilla 的 Readability 库和 Turndown 引擎，为您提供流畅的阅读和笔记体验。

## ✨ 主要特性

- **智能提取**：自动去除广告、导航栏等无关元素，只保留文章正文。
- **Markdown 转换**：将 HTML 内容转换为标准 Markdown，保留标题、链接、代码块等格式。
- **三种操作模式**：
  - **提取并复制**：直接将 Markdown 内容复制到剪贴板。
  - **提取并下载**：将内容保存为 `.md` 文件到本地。
  - **发送到云端**：(可选) 将内容直接发送到 LimHub/Remixer 或自定义 API 进行后续处理。
- **完全本地化**：核心提取逻辑在浏览器本地运行，保护您的隐私。

## 📥 安装指南

### 方法 1: 加载已解压的扩展程序 (开发者模式)

1. 克隆或下载本仓库代码到本地。
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`。
3. 打开右上角的 **"开发者模式"** 开关。
4. 点击左上角的 **"加载已解压的扩展程序"**。
5. 选择本项目中的 `ReLiquify` 文件夹。

## 🚀 使用指南

1. 打开任意文章页面。
2. 在页面空白处或选中的文本上点击 **鼠标右键**。
3. 在菜单中选择 **ReLiquify**，然后选择所需操作：
   - **提取并复制 (Copy Markdown)**
   - **提取并下载 (Download Markdown)**
   - **发送到云端 (Send to Cloud)** (需先配置)

## ⚙️ 配置说明

如果您希望使用 "发送到云端" 功能，需要进行简单的配置：

1. 点击浏览器工具栏中的 ReLiquify 图标，选择 **"打开配置"** (或右键扩展图标 -> 选项)。
2. 填写以下信息：
   - **API URL**: 接收 Markdown 的服务器地址 (默认为 `https://limhub.xiaoluxue.com`)。
   - **API Key**: 您的认证密钥。
3. 保存配置。

## 🛠️ 开发指南

如果您想参与开发或自行修改代码：

### 环境要求
- Node.js & pnpm (前端依赖管理)
- Python 3.12+ (辅助脚本)

### 项目结构
- `manifest.json`: 扩展配置文件 (Manifest V3)。
- `background.js`: 后台服务 Worker，处理菜单事件和网络请求。
- `content.js`: 注入页面的脚本，负责 UI 显示和消息传递。
- `lib/`: 包含 `Readability.js` 和 `turndown.js` 核心库。
- `update_icons.py`: 用于生成扩展图标的 Python 脚本。

### 常用命令

```bash
# 生成图标 (需要安装相应 Python 库，如 Pillow)
python update_icons.py
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。

## 🔒 隐私政策

请查看 [隐私政策](PRIVACY.md) 了解更多信息。
