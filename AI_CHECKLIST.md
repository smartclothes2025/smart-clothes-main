# AI 辨識功能 - 快速檢查清單

## ✅ 已完成的修正

### 後端文件
- [x] `backend/app/services/image_processing.py` - 完整的 AI 分析模組
- [x] `backend/app/services/__init__.py` - 模組導出
- [x] `backend/app/api/v1/__init__.py` - v1 API 初始化
- [x] `backend/app/api/__init__.py` - API 模組初始化
- [x] `backend/app/api/v1/upload.py` - 改進的上傳邏輯
- [x] `backend/requirements.txt` - Python 依賴清單

### 關鍵改進
- [x] 修復缺失的 `analyze_clothing_type` 函數
- [x] 改進 Gemini API 調用
- [x] 完善的 JSON 解析和錯誤處理
- [x] 支持 bytes 和檔案路徑輸入
- [x] 顏色列表正確處理
- [x] 異步調用正確配置
- [x] 預設值回傳機制

---

## 📋 安裝步驟

### 1️⃣ 安裝 Python 依賴
```bash
cd backend
pip install -r requirements.txt
```

### 2️⃣ 配置環境變數

編輯 `.env` 文件（如果不存在則新建）：

```bash
# 必需的配置
GEMINI_API_KEY=your_api_key_here
GCS_BUCKET_NAME=smartclothes_wardrobe

# 其他配置（如需要）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
DATABASE_URL=postgresql://user:password@localhost/smartclothes
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

### 3️⃣ 驗證 Gemini API 密鑰

1. 訪問 https://aistudio.google.com
2. 登入 Google 帳戶
3. 點擊「建立 API 密鑰」
4. 複製密鑰到 `.env` 中

---

## 🧪 測試

### 測試選項 1: 命令行測試
```bash
python -c "
from app.services.image_processing import analyze_clothing_type
import asyncio

# 如果有測試圖片
result = analyze_clothing_type('path/to/test_image.jpg', 'test_image.jpg')
print(result)
"
```

### 測試選項 2: 前端測試

在 Upload.jsx 中勾選「AI 辨識」複選框，上傳衣物圖片。

### 測試選項 3: curl 測試
```bash
curl -X POST http://localhost:8000/api/v1/upload/clothes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "ai_detect=1" \
  -F "name=測試" \
  -F "category=上衣" \
  -F "color=" \
  -F "tags=[]" \
  -F "attributes={}" \
  -F "style=休閒" \
  -F "size_label=M"
```

---

## 🐛 故障排除

| 問題 | 原因 | 解決方案 |
|------|------|--------|
| `ModuleNotFoundError: google.generativeai` | 依賴未安裝 | `pip install google-generativeai` |
| `GEMINI_API_KEY 未設定` | 環境變數未配置 | 編輯 `.env` 添加 GEMINI_API_KEY |
| JSON 解析失敗 | Gemini 回應格式異常 | 檢查日誌中的「Gemini 原始回應」 |
| 顏色為空 | Gemini 未識別顏色 | 使用更清晰的衣物圖片 |
| 超時 (>10秒) | 網路或 API 服務延遲 | 檢查網路連接，重試 |

---

## 📊 前端集成檢查

### Upload.jsx (已確認包含)
```javascript
✓ aiDetect 狀態管理
✓ removeB  g 狀態管理
✓ AI 辨識複選框
✓ fd.append("ai_detect", aiDetect ? "1" : "0")
✓ Navigate 時傳遞 aiDetect 狀態
```

### UploadEdit.jsx (已確認包含)
```javascript
✓ aiDetect 狀態初始化 (預設 false)
✓ aiDetect 複選框 UI
✓ 傳遞到下一頁的 state
```

---

## 📁 檔案結構驗證

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py                    ✓ 已創建
│   │   └── v1/
│   │       ├── __init__.py                ✓ 已創建
│   │       ├── upload.py                  ✓ 已修正
│   │       ├── auth.py                    (應已存在)
│   │       └── ...
│   ├── services/
│   │   ├── __init__.py                    ✓ 已創建
│   │   ├── image_processing.py            ✓ 已創建
│   │   ├── storage.py                     (應已存在)
│   │   └── ...
│   ├── models/
│   │   └── wardrobe.py                    (應已存在)
│   ├── core/
│   │   ├── db.py                          (應已存在)
│   │   └── ...
│   └── ...
├── requirements.txt                       ✓ 已創建
└── .env                                   ⚠ 需手動配置
```

---

## 🚀 啟動後端

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

查看日誌中的 AI 辨識信息：
```
INFO: 執行 AI 辨識...
INFO: Gemini 原始回應: {...}
INFO: AI 分析結果: {...}
```

---

## 💡 效能優化建議

1. **添加緩存** - 相同圖片不重複分析
2. **批量處理** - 多張圖片可異步並行
3. **響應時間** - 通常 2-5 秒/張圖片
4. **考慮隊列** - 大量上傳時使用後臺任務隊列

---

## 📞 常見問題

**Q: AI 辨識為什麼這麼慢？**
A: Gemini API 通常需要 2-5 秒分析一張圖片，這是正常的。

**Q: 如何禁用 AI 辨識？**
A: 在上傳時不勾選「AI 辨識」複選框即可。

**Q: AI 辨識結果不准確怎麼辦？**
A: 提供更清晰、完整的衣物圖片，背景簡潔效果更好。

**Q: 可以自訂 AI 提示詞嗎？**
A: 可以，編輯 `image_processing.py` 中的 `prompt` 變數。

---

## ✨ 後續改進方向

- [ ] 添加圖片預處理（crop, rotate, denoise）
- [ ] 實現結果緩存機制
- [ ] 添加多模型支持（Claude, GPT-4V）
- [ ] 集成本地模型以降低成本
- [ ] 添加用戶反饋機制以改進辨識準確度
