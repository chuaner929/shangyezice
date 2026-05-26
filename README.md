# 商業計劃自測表 · AI 簡答版

12 維度商業計劃自測工具，基於商業畫布。逐題簡答，AI 自動分析評分，產出十二邊形雷達圖與個人化建議。

## 線上體驗

👉 **[開啟自測表](https://你的帳號.github.io/bizcheck)** （部署 GitHub Pages 後）

## 功能

- 12 道開放式簡答題，涵蓋客戶定位、價值主張、流量、轉化、交付、維繫、收入、成本、資源、行動、合作、數據
- AI 分析（支援 DeepSeek API），自動生成 12 維度評分與雷達圖
- 降級模式：無 API Key 時使用關鍵詞評分
- 深色翠綠磨砂玻璃 UI

## 使用方式

### 1. 直接使用（離線模式）
打開 `index.html`，無需任何設定即可答題，結果以關鍵詞分析生成。

### 2. 啟用 AI 分析
需要 DeepSeek API Key（[申請](https://platform.deepseek.com/)）＋ API 代理（二選一）：

**A. 本地代理（自己的電腦上）**
```bash
node api-proxy.js
# 然後在頁面設定中填入 API Key 即可
```

**B. Cloudflare Worker（分享給別人用）**
1. 將 `worker.js` 部署到 Cloudflare Workers
2. 在頁面設定中填入 Worker URL（如 `https://bizcheck.你的帳號.workers.dev`）

## 部署到 GitHub Pages

1. Fork 或推送此 repo 到 GitHub
2. Settings → Pages → Source: `main` branch, `/ (root)` folder
3. 等待幾分鐘，你的連結就生效了

## 技術棧

- 單文件 HTML + CSS + JS，零框架
- Canvas 十二邊形雷達圖
- DeepSeek API（OpenAI 兼容格式）
- Cloudflare Worker 代理（解決 CORS）
