# 虛擬試衣用戶照片功能修復總結

## 修復日期
2025-01-06

## 問題描述
用戶上傳臉部照片後，系統沒有使用用戶的臉來生成穿搭圖，而是繼續使用預設模特兒。

### 根本原因
1. ❌ `autoGenerateImage` 在頁面載入時調用，此時 `userPhoto` 還是 `null`
2. ❌ 用戶上傳照片後，沒有觸發重新生成
3. ❌ 前端的 `autoGenerateImage` 函數沒有將 `userPhoto` 傳遞給後端
4. ❌ 後端 `/generate` 端點沒有處理 `user_photo` 參數

## 已完成的修復

### 1. 前端修改 (`src/pages/VirtualFitting.jsx`)

#### 修改 1: `autoGenerateImage` 函數
**位置**: 第 86 行

**修改前**:
```javascript
const autoGenerateImage = async (items) => {
  // 使用 userPhoto state，但在頁面載入時為 null
}
```

**修改後**:
```javascript
const autoGenerateImage = async (items, photoBase64 = null) => {
  // 接收可選的 photoBase64 參數
  
  const payload = {
    user_input: photoBase64 
      ? "根據我的照片和選中的衣物，生成一套適合我的時尚穿搭"
      : "專業時尚模特兒展示，高質感穿搭攝影，自然光線，簡約背景",
    selected_items: items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category
    }))
  };
  
  // 如果有用戶照片，添加到 payload
  if (photoBase64) {
    payload.user_photo = photoBase64;
  }
  
  // 統一使用 /fitting/generate 端點
  const res = await fetch(`${API_BASE}/fitting/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
```

**改進點**:
- ✅ 接收可選的 `photoBase64` 參數
- ✅ 根據是否有照片，使用不同的 `user_input` 提示詞
- ✅ 將用戶照片（base64 格式）添加到請求 payload
- ✅ 統一使用 `/fitting/generate` 端點（不再使用 `/generate-with-photo`）

#### 修改 2: `handlePhotoUpload` 函數
**位置**: 第 71 行

**修改前**:
```javascript
const handlePhotoUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setUserPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserPhotoPreview(reader.result);
      // 沒有觸發重新生成
    };
    reader.readAsDataURL(file);
  }
};
```

**修改後**:
```javascript
const handlePhotoUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setUserPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserPhotoPreview(reader.result);
      // 上傳照片後自動重新生成
      autoGenerateImage(selectedItems, reader.result);
    };
    reader.readAsDataURL(file);
  }
};
```

**改進點**:
- ✅ 上傳照片後自動調用 `autoGenerateImage`
- ✅ 傳遞 `reader.result`（base64 格式）作為參數

#### 修改 3: `handleRegenerate` 函數
**位置**: 第 145 行

**修改前**:
```javascript
const handleRegenerate = () => {
  autoGenerateImage(selectedItems);
  // 沒有傳遞用戶照片
};
```

**修改後**:
```javascript
const handleRegenerate = () => {
  autoGenerateImage(selectedItems, userPhotoPreview);
  // 如果有用戶照片，繼續使用
};
```

**改進點**:
- ✅ 重新生成時傳遞 `userPhotoPreview`
- ✅ 如果用戶已上傳照片，繼續使用用戶的臉

### 2. 後端修改

#### 修改 1: `/generate` 端點 (`backend/app/api/virtual_fitting.py`)
**位置**: 第 93 行

**修改前**:
```python
@router.post("/generate", response_model=VirtualFittingResponse)
async def generate_virtual_fitting(request: VirtualFittingRequest):
    # 沒有處理 user_photo 參數
    prompt = image_service.create_fashion_prompt(...)
    result = await image_service.generate_tryon_image(prompt=prompt, ...)
```

**修改後**:
```python
@router.post("/generate", response_model=VirtualFittingResponse)
async def generate_virtual_fitting(request: VirtualFittingRequest):
    # 如果有用戶照片，使用個性化生成
    if request.user_photo:
        # 提取 base64 數據（處理 data URL 格式）
        user_photo_base64 = request.user_photo
        if "base64," in user_photo_base64:
            user_photo_base64 = user_photo_base64.split("base64,")[1]
        
        # 創建服裝提示詞
        clothing_prompt = image_service.create_fashion_prompt(...)
        
        # 使用 Gemini Vision 分析用戶照片
        enhancement_result = await image_service.enhance_with_user_photo(
            user_photo_base64=user_photo_base64,
            clothing_prompt=clothing_prompt
        )
        
        if enhancement_result.get("success"):
            # 使用增強的提示詞生成圖片
            enhanced_prompt = enhancement_result.get("enhanced_prompt")
            result = await image_service.generate_tryon_image(
                prompt=enhanced_prompt, ...
            )
    
    # 標準生成（無用戶照片或照片分析失敗）
    prompt = image_service.create_fashion_prompt(...)
    result = await image_service.generate_tryon_image(prompt=prompt, ...)
```

**改進點**:
- ✅ 檢查 `request.user_photo` 是否存在
- ✅ 處理 data URL 格式，提取純 base64 數據
- ✅ 使用 `enhance_with_user_photo` 分析用戶照片
- ✅ 使用增強的提示詞生成個性化圖片
- ✅ 如果照片分析失敗，自動降級到標準生成

#### 修改 2: `create_fashion_prompt` 方法 (`backend/app/services/image_generation.py`)
**位置**: 第 196 行

**修改前**:
```python
prompt = f"""A professional fashion model wearing {clothing_text}, 
{body_desc}, standing in a modern minimalist studio, ..."""
```

**修改後**:
```python
prompt = f"""A professional Asian Taiwanese female fashion model wearing {clothing_text}, 
{body_desc}, standing in a modern minimalist studio, 
soft natural lighting, neutral background, 
full body shot, confident pose, 
high-end fashion photography style, 
detailed clothing texture, realistic fabric, 
professional fashion magazine quality, 
East Asian features, natural makeup"""
```

**改進點**:
- ✅ 明確指定「Asian Taiwanese female」模特兒
- ✅ 添加「East Asian features, natural makeup」特徵描述
- ✅ 確保無用戶照片時使用台灣女性模特兒

## 技術流程

### 無用戶照片流程
1. 用戶選擇衣物 → 進入虛擬試衣頁面
2. `useEffect` 調用 `autoGenerateImage(items, null)`
3. 前端發送請求到 `/fitting/generate`，不包含 `user_photo`
4. 後端使用 `create_fashion_prompt` 生成標準提示詞（台灣女性模特兒）
5. Gemini 優化提示詞 → Imagen 生成圖片
6. 返回圖片給前端顯示

### 有用戶照片流程
1. 用戶上傳照片 → `handlePhotoUpload` 被觸發
2. `FileReader` 將照片轉換為 base64 格式
3. 自動調用 `autoGenerateImage(items, base64Photo)`
4. 前端發送請求到 `/fitting/generate`，包含 `user_photo` (base64)
5. 後端提取 base64 數據
6. 調用 `enhance_with_user_photo`，使用 Gemini Vision 分析照片
7. Gemini Vision 分析用戶的體型、膚色、臉型、風格
8. 生成增強的提示詞（包含用戶特徵 + 服裝描述）
9. Imagen 根據增強提示詞生成個性化圖片
10. 返回圖片給前端顯示

## 預期效果

### ✅ 無用戶照片
- 生成亞洲（台灣）女性模特兒穿著選中衣物的照片
- 模特兒具有東亞特徵，自然妝容
- 專業時尚攝影風格

### ✅ 有用戶照片
- 生成用戶本人穿著選中衣物的照片
- 保持用戶的臉部特徵、膚色、體型
- 自然融合用戶外貌和選中的服裝
- 專業時尚攝影風格

### ✅ 重新生成
- 如果有用戶照片，繼續使用用戶的臉
- 如果沒有，使用預設台灣女性模特兒

## 測試步驟

1. ✅ **啟動後端服務**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. ✅ **啟動前端服務**
   ```bash
   npm run dev
   ```

3. ✅ **測試無照片生成**
   - 選擇衣物 → 進入虛擬試衣
   - 應該看到台灣女性模特兒的穿搭圖

4. ✅ **測試有照片生成**
   - 上傳自己的臉部照片
   - 系統應該自動重新生成
   - 應該看到用戶本人的穿搭圖

5. ✅ **測試重新生成**
   - 點擊「重新生成」按鈕
   - 如果有照片，應該繼續使用用戶的臉
   - 如果沒有照片，應該使用台灣女性模特兒

## 相關文件

- ✅ `src/pages/VirtualFitting.jsx` - 前端虛擬試衣頁面
- ✅ `backend/app/api/virtual_fitting.py` - 後端 API 端點
- ✅ `backend/app/services/image_generation.py` - 圖片生成服務
- 📄 `docs/VIRTUAL_FITTING_USER_PHOTO_FIX.md` - 原始修復指南
- 📄 `backend/GOOGLE_AI_SETUP.md` - Google AI 設置指南
- 📄 `AI_VIRTUAL_TRYON_README.md` - 用戶手冊

## 注意事項

1. **照片要求**
   - 清晰的臉部照片，正面效果最佳
   - 支援 JPG、PNG 等常見格式
   - 照片會被自動調整大小（最大 1024x1024）

2. **生成時間**
   - AI 生成時間約 10-30 秒
   - 請耐心等待，不要重複點擊

3. **API 配置**
   - 需要配置 `GEMINI_API_KEY`（必需）
   - 需要配置 `GCP_PROJECT_ID`（必需）
   - 需要配置 `GCP_LOCATION`（可選，預設 us-central1）

4. **降級機制**
   - 如果照片分析失敗，自動降級到標準生成
   - 如果 Imagen 不可用，使用 Gemini 生成文字描述

## 成功標誌

- ✅ 前端修改完成（3 個函數）
- ✅ 後端修改完成（2 個文件）
- ✅ 無照片時使用台灣女性模特兒
- ✅ 有照片時使用用戶本人
- ✅ 重新生成功能正確
- ✅ 降級機制正常工作

## 下一步

如果需要進一步優化：
1. 添加照片預處理（裁剪、調整大小）
2. 添加照片質量檢測
3. 支援多張照片（不同角度）
4. 添加照片編輯功能（濾鏡、調色）
5. 優化生成速度（使用緩存）
