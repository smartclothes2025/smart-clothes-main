# AI 虛擬試衣設置指南

## 概述

本系統使用 AI 圖片生成技術來創建逼真的虛擬試衣效果，取代了原有的簡單 SVG 圖形。

## 支援的 AI 服務

### 1. Stability AI (推薦) ⭐

**最適合時尚攝影和逼真服裝展示**

#### 註冊步驟：
1. 訪問 https://platform.stability.ai/
2. 註冊帳號
3. 前往 API Keys 頁面
4. 創建新的 API Key
5. 複製 API Key

#### 配置：
```bash
# 在 .env 文件中添加
STABILITY_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

#### 價格：
- 免費試用額度
- 按圖片計費，約 $0.002-0.01 per image
- 詳情：https://platform.stability.ai/pricing

---

### 2. OpenAI DALL-E 3 (備選)

**高質量圖片生成，適合時尚場景**

#### 註冊步驟：
1. 訪問 https://platform.openai.com/
2. 註冊帳號
3. 前往 API Keys 頁面
4. 創建新的 API Key
5. 複製 API Key

#### 配置：
```bash
# 在 .env 文件中添加
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
```

#### 價格：
- DALL-E 3 HD: $0.08 per image (1024x1792)
- 詳情：https://openai.com/pricing

---

### 3. Google Gemini (用於照片分析)

**用於分析用戶上傳的照片，提供個性化建議**

#### 註冊步驟：
1. 訪問 https://makersuite.google.com/app/apikey
2. 創建 API Key
3. 複製 API Key

#### 配置：
```bash
# 在 .env 文件中添加
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxx
```

#### 價格：
- 免費額度：每分鐘 60 次請求
- 詳情：https://ai.google.dev/pricing

---

## 完整配置示例

在 `backend/.env` 文件中：

```bash
# 必需配置
GEMINI_API_KEY=your_gemini_key_here

# 圖片生成服務（至少配置一個）
STABILITY_API_KEY=your_stability_key_here
# 或
OPENAI_API_KEY=your_openai_key_here
```

---

## 功能說明

### 1. 標準虛擬試衣
- 使用 AI 生成專業時尚模特兒穿著選中服裝的圖片
- 根據用戶身體數據調整模特兒體型
- 高質量時尚攝影風格

### 2. 個性化試穿（需上傳照片）
- 用戶上傳自己的照片
- AI 分析用戶外貌特徵
- 生成更貼近用戶本人的試穿效果

---

## 測試步驟

1. **安裝依賴**
```bash
cd backend
pip install -r requirements.txt
```

2. **配置環境變數**
```bash
# 複製 .env.example 到 .env
cp .env.example .env

# 編輯 .env 文件，添加 API Keys
```

3. **啟動後端**
```bash
uvicorn app.main:app --reload
```

4. **測試 API**
```bash
# 測試標準生成
curl -X POST "http://localhost:8000/api/v1/fitting/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_input": "專業時尚模特兒展示",
    "selected_items": [
      {"id": 1, "name": "白色襯衫", "category": "上衣"},
      {"id": 2, "name": "黑色長褲", "category": "褲子"}
    ]
  }'
```

---

## 故障排除

### 問題 1: "No image generation API configured"
**原因**: 未配置 STABILITY_API_KEY 或 OPENAI_API_KEY

**解決**: 
1. 確認 .env 文件中已添加至少一個 API Key
2. 重啟後端服務

### 問題 2: "GEMINI_API_KEY not configured"
**原因**: 未配置 Gemini API Key（用於照片分析）

**解決**: 
1. 在 .env 文件中添加 GEMINI_API_KEY
2. 重啟後端服務

### 問題 3: 生成速度慢
**原因**: AI 圖片生成需要時間（通常 10-30 秒）

**解決**: 
- 這是正常現象
- 可以考慮添加快取機制
- 或使用更快的 API 服務

### 問題 4: API 額度用完
**原因**: 超出免費額度或餘額不足

**解決**: 
1. 檢查 API 服務商的使用情況
2. 充值或升級方案
3. 切換到另一個 API 服務

---

## 優化建議

### 1. 添加圖片快取
```python
# 快取已生成的圖片，避免重複生成相同內容
# 可使用 Redis 或本地檔案系統
```

### 2. 批次處理
```python
# 如果需要生成多張圖片，可以使用批次 API
# 降低成本和提高效率
```

### 3. 圖片壓縮
```python
# 生成後壓縮圖片，減少儲存空間和傳輸時間
from PIL import Image
image.save("output.jpg", quality=85, optimize=True)
```

---

## 技術架構

```
Frontend (React)
    ↓
    ├─ 選擇服裝
    ├─ 上傳照片（可選）
    └─ 發送請求
    
Backend (FastAPI)
    ↓
    ├─ /api/v1/fitting/generate
    │   ├─ 創建時尚提示詞
    │   ├─ 調用 Stability AI / DALL-E
    │   └─ 返回 Base64 圖片
    │
    └─ /api/v1/fitting/generate-with-photo
        ├─ 分析用戶照片 (Gemini Vision)
        ├─ 生成個性化提示詞
        ├─ 調用圖片生成 API
        └─ 返回 Base64 圖片
```

---

## 安全注意事項

1. **不要將 API Keys 提交到版本控制**
   - 使用 .env 文件
   - 添加 .env 到 .gitignore

2. **限制 API 使用率**
   - 實施速率限制
   - 防止濫用

3. **用戶照片隱私**
   - 不要永久儲存用戶照片
   - 處理完立即刪除
   - 遵守隱私法規

---

## 聯絡支援

如有問題，請參考：
- Stability AI 文檔: https://platform.stability.ai/docs
- OpenAI 文檔: https://platform.openai.com/docs
- Google AI 文檔: https://ai.google.dev/docs
