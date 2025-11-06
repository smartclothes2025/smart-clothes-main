# 🚀 AI 虛擬試衣快速啟動指南（Google AI 版本）

## 📋 前置要求

1. Python 3.8+
2. Node.js 16+
3. Google 帳號
4. Google Cloud 項目

---

## ⚡ 5 分鐘快速設置

### 步驟 1: 獲取 Google AI 服務

#### 1.1 Gemini API Key (必需)
```
1. 訪問: https://makersuite.google.com/app/apikey
2. 登入 Google 帳號
3. 點擊「Create API Key」
4. 複製 Key (格式: AIzaSy...)
```

#### 1.2 Google Cloud 項目 (必需)
```
1. 訪問: https://console.cloud.google.com/
2. 創建新項目或選擇現有項目
3. 記下 Project ID
4. 啟用 Vertex AI API
5. 設置認證 (gcloud auth application-default login)
```

---

### 步驟 2: 配置後端

```bash
# 1. 進入後端目錄
cd backend

# 2. 創建 .env 文件
echo "GEMINI_API_KEY=your_gemini_key_here" > .env
echo "GCP_PROJECT_ID=your_project_id" >> .env
echo "GCP_LOCATION=us-central1" >> .env

# 3. 設置 Google Cloud 認證
gcloud auth application-default login

# 4. 安裝依賴
pip install -r requirements.txt

# 5. 啟動後端
uvicorn app.main:app --reload
```

**詳細設置**: 參考 `backend/GOOGLE_AI_SETUP.md`

---

### 步驟 3: 啟動前端

```bash
# 1. 進入項目根目錄（新終端）
cd ..

# 2. 安裝依賴
npm install

# 3. 啟動前端
npm run dev
```

---

### 步驟 4: 開始使用

1. 打開瀏覽器訪問: `http://localhost:5173`
2. 登入或註冊帳號
3. 進入「衣櫃」頁面
4. 選擇服裝單品
5. 點擊「虛擬試衣」
6. 等待 AI 生成逼真試穿圖！

---

## 🎯 功能測試清單

### 基礎功能
- [ ] 選擇 2-3 件服裝
- [ ] 進入虛擬試衣頁面
- [ ] 查看 AI 生成的試穿圖
- [ ] 點擊「重新生成」測試

### 進階功能
- [ ] 輸入身體數據
- [ ] 勾選「使用我的照片」
- [ ] 上傳個人照片
- [ ] 查看個性化試穿效果

### 保存功能
- [ ] 填寫標題和描述
- [ ] 勾選「同步到貼文」
- [ ] 保存穿搭

---

## 🔍 驗證安裝

### 檢查後端
```bash
# 訪問 API 文檔
curl http://localhost:8000/docs
# 應該看到 Swagger UI
```

### 檢查前端
```bash
# 前端應該在瀏覽器中正常顯示
# 檢查控制台沒有錯誤
```

### 檢查 AI 服務
```bash
# 測試 API 連接
curl -X POST "http://localhost:8000/api/v1/fitting/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_input": "測試",
    "selected_items": [{"id": 1, "name": "測試", "category": "上衣"}]
  }'
```

---

## ❗ 常見問題

### Q1: "No image generation API configured"
**A**: 確認 .env 文件中已添加 `GEMINI_API_KEY` 和 `GCP_PROJECT_ID`

### Q2: 生成速度很慢
**A**: 正常現象，AI 生成需要 10-30 秒

### Q3: 照片上傳失敗
**A**: 確認已配置 `GEMINI_API_KEY`

### Q4: 後端啟動失敗
**A**: 檢查 Python 版本 (需要 3.8+) 和依賴安裝

---

## 📚 詳細文檔

- **Google AI 設置**: `backend/GOOGLE_AI_SETUP.md` ⭐
- **用戶指南**: `AI_VIRTUAL_TRYON_README.md`
- **API 文檔**: http://localhost:8000/docs

---

## 💰 成本估算

### Google AI 服務
- **Gemini API**: 免費（每分鐘 60 次請求）
- **Imagen (Vertex AI)**: ~$0.020 per image
- **新用戶**: $300 免費額度

### 預估成本
- **100 次生成**: ~$2.00
- **1000 次生成**: ~$20.00

**優勢**: 比 DALL-E ($0.08/張) 便宜 4 倍！

---

## 🎉 完成！

現在您可以體驗 AI 虛擬試衣功能了！

**提示**: 第一次生成可能需要較長時間，請耐心等待。

有問題？查看 `AI_VIRTUAL_TRYON_README.md` 獲取更多幫助。
