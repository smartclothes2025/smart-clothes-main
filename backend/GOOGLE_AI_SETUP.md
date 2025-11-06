# 🎨 Google AI 虛擬試衣設置指南

使用 **Google Gemini** 和 **Imagen** 實現 AI 虛擬試衣功能

---

## 📋 所需服務

1. **Google Gemini** - 提示詞優化和照片分析
2. **Google Imagen** (Vertex AI) - 圖片生成

---

## 🚀 快速設置（5 步驟）

### 步驟 1: 獲取 Gemini API Key

1. 訪問 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登入 Google 帳號
3. 點擊「Create API Key」
4. 複製 API Key（格式：`AIzaSy...`）

**免費額度**: 
- 每分鐘 60 次請求
- 足夠測試和小規模使用

---

### 步驟 2: 創建 Google Cloud 項目

1. 訪問 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「Select a project」→「New Project」
3. 輸入項目名稱（例如：`smart-clothes-ai`）
4. 點擊「Create」
5. 記下您的 **Project ID**（例如：`smart-clothes-ai-123456`）

---

### 步驟 3: 啟用 Vertex AI API

1. 在 Google Cloud Console 中
2. 前往 [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
3. 確保選擇了正確的項目
4. 點擊「Enable」啟用 API
5. 等待幾分鐘讓 API 啟用

---

### 步驟 4: 設置認證

#### 選項 A: 使用 Application Default Credentials (推薦)

```bash
# 安裝 gcloud CLI
# Windows: https://cloud.google.com/sdk/docs/install
# Mac: brew install google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash

# 登入並設置認證
gcloud auth application-default login

# 設置項目
gcloud config set project YOUR_PROJECT_ID
```

#### 選項 B: 使用服務帳號

1. 前往 [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. 點擊「Create Service Account」
3. 輸入名稱（例如：`imagen-service`）
4. 點擊「Create and Continue」
5. 添加角色：
   - `Vertex AI User`
   - `Storage Object Viewer`
6. 點擊「Done」
7. 點擊服務帳號 → 「Keys」→「Add Key」→「Create new key」
8. 選擇「JSON」格式
9. 下載 JSON 文件
10. 將文件路徑設置到環境變數

---

### 步驟 5: 配置環境變數

創建 `backend/.env` 文件：

```bash
# Gemini API Key (必需)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# Google Cloud Project ID (必需)
GCP_PROJECT_ID=your-project-id

# Google Cloud Location (可選，默認 us-central1)
GCP_LOCATION=us-central1

# 服務帳號認證 (如果使用選項 B)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 🧪 測試設置

### 1. 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 2. 測試 Gemini

```python
# test_gemini.py
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content("Hello, Gemini!")
print(response.text)
```

```bash
python test_gemini.py
```

### 3. 測試 Imagen

```python
# test_imagen.py
from google.cloud import aiplatform
from vertexai.preview.vision_models import ImageGenerationModel
import os

aiplatform.init(
    project=os.getenv("GCP_PROJECT_ID"),
    location=os.getenv("GCP_LOCATION", "us-central1")
)

model = ImageGenerationModel.from_pretrained("imagegeneration@006")
images = model.generate_images(
    prompt="A professional fashion model wearing a white shirt",
    number_of_images=1,
)

print(f"Generated {len(images)} image(s)")
images[0]._pil_image.save("test_output.png")
print("Image saved as test_output.png")
```

```bash
python test_imagen.py
```

---

## 💰 費用說明

### Gemini API
- **免費額度**: 每分鐘 60 次請求
- **付費**: 超出免費額度後按使用量計費
- **估算**: 基本免費使用

### Imagen (Vertex AI)
- **價格**: 約 $0.020 per image
- **免費額度**: 新用戶有 $300 免費額度
- **估算**: 
  - 100 張圖片 ≈ $2
  - 1000 張圖片 ≈ $20

**總結**: 比 DALL-E ($0.08/張) 便宜 4 倍！

---

## 🔧 常見問題

### Q1: "Permission denied" 錯誤

**原因**: 沒有正確設置認證

**解決**:
```bash
# 重新登入
gcloud auth application-default login

# 或檢查服務帳號權限
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Q2: "Quota exceeded" 錯誤

**原因**: 超出 API 配額

**解決**:
1. 前往 [Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. 搜索 "Vertex AI"
3. 請求增加配額

### Q3: "Model not found" 錯誤

**原因**: Imagen 模型未在該地區可用

**解決**:
```bash
# 改用支援的地區
GCP_LOCATION=us-central1  # 或 europe-west4
```

### Q4: 圖片生成很慢

**原因**: Imagen 需要 10-30 秒生成

**解決**:
- 這是正常現象
- 可以添加快取機制
- 考慮批次生成

---

## 🎯 功能說明

### 系統工作流程

```
用戶選擇服裝
    ↓
前端發送請求
    ↓
Gemini 優化提示詞
    ↓
Imagen 生成圖片
    ↓
返回 Base64 圖片
    ↓
前端顯示
```

### Gemini 的作用

1. **提示詞優化**: 將中文描述轉換為專業英文提示詞
2. **照片分析**: 分析用戶上傳的照片特徵
3. **備用方案**: 當 Imagen 不可用時生成文字描述

### Imagen 的作用

1. **圖片生成**: 根據提示詞生成逼真時尚照片
2. **高質量**: 專業攝影級別
3. **可控性**: 支援多種參數調整

---

## 📊 性能優化

### 1. 快取策略

```python
# 快取常見組合
cache_key = f"{item1_id}_{item2_id}_{body_metrics}"
if cache_key in redis_cache:
    return cached_image
```

### 2. 批次生成

```python
# 一次生成多個角度
images = model.generate_images(
    prompt=prompt,
    number_of_images=4,  # 生成 4 張
)
```

### 3. 異步處理

```python
# 使用異步避免阻塞
async def generate_image():
    result = await imagen_service.generate()
    return result
```

---

## 🔒 安全最佳實踐

### 1. API Key 保護

```bash
# 不要提交到 Git
echo ".env" >> .gitignore

# 使用環境變數
export GEMINI_API_KEY=xxx
```

### 2. 服務帳號權限

```bash
# 最小權限原則
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user"
```

### 3. 速率限制

```python
# 實施速率限制
from fastapi_limiter import FastAPILimiter

@app.post("/api/v1/fitting/generate")
@limiter.limit("10/minute")
async def generate():
    ...
```

---

## 📚 相關資源

### 官方文檔
- [Gemini API 文檔](https://ai.google.dev/docs)
- [Vertex AI 文檔](https://cloud.google.com/vertex-ai/docs)
- [Imagen 指南](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)

### 教學資源
- [Vertex AI 快速入門](https://cloud.google.com/vertex-ai/docs/start/introduction-unified-platform)
- [Gemini API 教學](https://ai.google.dev/tutorials)
- [Python SDK 文檔](https://googleapis.dev/python/aiplatform/latest/)

---

## 🎉 完成！

現在您可以使用 Google AI 服務來實現逼真的虛擬試衣功能了！

**優勢**:
- ✅ 使用您已有的 Google 服務
- ✅ 價格實惠（比 DALL-E 便宜 4 倍）
- ✅ 質量優秀
- ✅ 整合簡單

有問題？查看 [故障排除](#常見問題) 或參考官方文檔。
