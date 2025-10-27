# AI 辨識功能故障排除指南

## 問題分析

你的 AI 辨識功能無法成功的主要原因包括：

### 1. **缺少 `image_processing.py` 模組** ✅ 已修復
- 後端代碼引入了 `analyze_clothing_type` 函數，但該模組不存在
- **解決方案**：已在 `app/services/image_processing.py` 創建完整的實現

### 2. **Gemini API 配置問題**
- Gemini Vision API 需要正確的 API Key 設定
- **解決方案**：確保 `.env` 檔案中有 `GEMINI_API_KEY`

### 3. **異步調用處理**
- 原代碼中 AI 分析沒有正確的異步處理
- **解決方案**：使用 `asyncio.to_thread()` 將同步調用轉為異步

### 4. **JSON 解析錯誤**
- Gemini 回應可能包含額外文字，JSON 解析失敗
- **解決方案**：改進的 JSON 提取和錯誤處理

## 所有修正清單

### ✅ 已創建的文件：

1. **`backend/app/services/image_processing.py`**
   - 實現 `analyze_clothing_type()` 函數
   - 支持 bytes 或檔案路徑輸入
   - 與 Gemini Vision API 集成
   - 完善的錯誤處理和預設值

2. **`backend/app/services/__init__.py`**
   - 正確導出模組

3. **`backend/app/api/v1/__init__.py`**
   - 初始化 v1 API

4. **`backend/app/api/__init__.py`**
   - 初始化 API 模組

5. **`backend/app/api/v1/upload.py`** (改進版本)
   - 修正 AI 辨識邏輯
   - 改進顏色處理
   - 更好的錯誤日誌

6. **`backend/requirements.txt`**
   - 所有必需的 Python 依賴

## 環境設定步驟

### 1. 安裝依賴
```bash
cd backend
pip install -r requirements.txt
```

### 2. 設定環境變數 (`.env`)
```bash
# Google Cloud Storage
GCS_BUCKET_NAME=smartclothes_wardrobe
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost/smartclothes

# JWT
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
```

### 3. 獲取 Gemini API Key
1. 訪問 [Google AI Studio](https://aistudio.google.com)
2. 登入 Google 帳戶
3. 創建新的 API Key
4. 複製到 `.env` 中的 `GEMINI_API_KEY`

## 常見問題解決

### 問題 1: `ModuleNotFoundError: No module named 'google.generativeai'`
**解決**：
```bash
pip install google-generativeai
```

### 問題 2: `GEMINI_API_KEY 未設定，回傳預設值`
**原因**：環境變數未設定
**解決**：
```bash
# .env 檔案
GEMINI_API_KEY=your_key_here

# 或者直接在 Python 中設定
import os
os.environ["GEMINI_API_KEY"] = "your_key_here"
```

### 問題 3: AI 辨識回應包含非 JSON 文本
**原因**：Gemini 有時在 JSON 前後加入說明文字
**解決**：已在代碼中改進 JSON 提取邏輯

### 問題 4: 顏色列表為空或格式錯誤
**原因**：Gemini 回應中 `colors` 可能不是列表
**解決**：已在代碼中添加類型檢查和轉換

## 測試 AI 辨識功能

### 測試腳本 (Python)
```python
import asyncio
from app.services.image_processing import analyze_clothing_type

# 測試檔案路徑
result = asyncio.run(
    asyncio.to_thread(
        analyze_clothing_type, 
        "path/to/image.jpg",
        "image.jpg"
    )
)
print(result)
```

### 使用 curl 測試 API
```bash
curl -X POST http://localhost:8000/api/v1/upload/clothes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_image.jpg" \
  -F "ai_detect=1" \
  -F "name=測試衣物" \
  -F "category=上衣"
```

## 前端調整

### Upload.jsx 中的 AI 辨識請求
確保以下參數被正確發送：

```javascript
fd.append("ai_detect", aiDetect ? "1" : "0");
```

### UploadEdit.jsx 中的複選框
確保 `aiDetect` 狀態被正確傳遞到下一頁：

```javascript
navigate("/upload", { 
  state: { 
    files: editedFiles, 
    primaryIndex, 
    removeBg, 
    aiDetect  // ← 確保這個被傳遞
  } 
});
```

## 日誌調試

查看後端日誌以識別問題：

```bash
# 在 FastAPI 應用中查看日誌
# 應該會看到類似的輸出：
# INFO: 執行 AI 辨識...
# INFO: Gemini 原始回應: {...JSON...}
# INFO: AI 分析結果: {...normalized result...}
```

## 效能考慮

- AI 辨識每次調用需要 2-5 秒
- 不建議同時處理超過 3-5 張圖片
- 考慮在後臺隊列中實現異步處理

## 檔案結構
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── upload.py  ← 已改進
│   ├── services/
│   │   ├── __init__.py
│   │   └── image_processing.py  ← 新增
│   ├── models/
│   ├── core/
│   └── ...
└── requirements.txt  ← 新增
```

## 下一步

1. ✅ 安裝依賴
2. ✅ 設定 `.env` 環境變數
3. ✅ 測試 AI 辨識功能
4. ✅ 監控日誌並調整 Prompt
5. ✅ 考慮添加緩存以提高效能
