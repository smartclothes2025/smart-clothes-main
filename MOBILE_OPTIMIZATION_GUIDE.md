# 手機端響應式優化指南

## 已完成的全局優化

### 1. Viewport 設定優化
**檔案**: `index.html`

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**效果**:
- ✅ 禁止用戶縮放，保持固定比例
- ✅ 支援 iOS Safari 全螢幕模式
- ✅ 適配瀏海屏和安全區域

### 2. 全局 CSS 響應式規則
**檔案**: `src/index.css`

**新增規則**:
- `html, body`: 防止橫向滾動，設定 100% 寬高
- `.page-wrapper`: 統一的頁面容器，自動處理安全區域
- 手機端 (@media max-width: 768px): 統一內容最大寬度，防止超出螢幕

### 3. 圖片裁切頁面優化
**檔案**: `src/pages/UploadEdit.jsx`

**修改內容**:
- ✅ 使用 `Math.min(width, height)` 計算 viewport 尺寸
- ✅ 使用 `aspectRatio: '1/1'` 和 `maxHeight: 'min(100vw, 70vh)'` 確保正方形比例
- ✅ 自動適應不同螢幕尺寸

## 開發最佳實踐

### 📱 手機端開發規範

#### 1. 容器使用
```jsx
// ✅ 推薦：使用統一的 page-wrapper
<div className="page-wrapper">
  <div className="max-w-5xl mx-auto">
    {/* 內容 */}
  </div>
</div>

// ❌ 避免：固定寬度或超出螢幕的容器
<div className="w-[500px]"> {/* 可能超出手機螢幕 */}
```

#### 2. 圖片處理
```jsx
// ✅ 推薦：使用響應式比例
<div className="w-full" style={{ aspectRatio: '16/9' }}>
  <img src={url} className="w-full h-full object-cover" />
</div>

// ❌ 避免：固定像素尺寸
<img src={url} width="400" height="300" />
```

#### 3. 正方形容器
```jsx
// ✅ 推薦：使用 aspectRatio 和智慧高度限制
<div 
  className="w-full bg-gray-50"
  style={{ aspectRatio: '1/1', maxHeight: 'min(100vw, 70vh)' }}
>
  {/* 內容 */}
</div>

// ❌ 避免：只用 aspect-square (會被 max-h 截斷)
<div className="w-full aspect-square max-h-[70vh]">
```

#### 4. 間距和 Padding
```jsx
// ✅ 推薦：使用響應式間距
<div className="p-4 md:p-6 lg:p-8">

// ✅ 推薦：考慮安全區域
<div className="pb-[calc(1rem+env(safe-area-inset-bottom))]">

// ❌ 避免：固定大間距
<div className="p-12"> {/* 手機上太大 */}
```

#### 5. 文字大小
```jsx
// ✅ 推薦：使用響應式文字
<h1 className="text-xl md:text-2xl lg:text-3xl">

// ❌ 避免：過大的固定文字
<h1 className="text-5xl"> {/* 手機上太大 */}
```

## 測試清單

在不同裝置上測試時，請確認：

### ✅ 視覺一致性
- [ ] iPhone SE (375px) - 小螢幕手機
- [ ] iPhone 12/13/14 (390px) - 標準手機
- [ ] iPhone 14 Pro Max (430px) - 大螢幕手機
- [ ] iPad Mini (768px) - 小平板
- [ ] iPad Pro (1024px) - 大平板
- [ ] Desktop (1280px+) - 桌面

### ✅ 功能測試
- [ ] 無橫向滾動
- [ ] 圖片不變形
- [ ] 按鈕可點擊（不會太小）
- [ ] 輸入框可用
- [ ] 底部導航不遮擋內容
- [ ] 裁切功能準確

### ✅ 效能測試
- [ ] 頁面載入速度 < 3秒
- [ ] 圖片載入流暢
- [ ] 動畫不卡頓

## 常見問題解決

### Q1: 圖片在某些手機上被截斷
**解決方案**: 使用 `aspectRatio` + `maxHeight: 'min(100vw, 70vh)'`

### Q2: 內容超出螢幕寬度
**解決方案**: 檢查是否有固定寬度元素，改用 `max-w-full`

### Q3: 底部導航遮擋內容
**解決方案**: 為 `.page-wrapper` 添加足夠的 `padding-bottom`

### Q4: 不同手機比例不一致
**解決方案**: 
1. 檢查 viewport meta 設定
2. 使用 `max-width: 100vw` 和 `overflow-x: hidden`
3. 避免固定像素尺寸

## 需要特別注意的頁面

### 已優化 ✅
- `UploadEdit.jsx` - 圖片裁切頁面

### 待檢查
- `Home.jsx` - 首頁
- `Wardrobe.jsx` - 衣櫃頁面
- `Upload.jsx` - 上傳頁面
- `Assistant.jsx` - 助手頁面
- `Profile.jsx` - 個人資料頁面

## 建議的下一步

1. **測試所有頁面** - 在真實手機上測試每個頁面
2. **統一組件** - 為常用佈局創建可重用組件
3. **效能優化** - 使用圖片懶加載和壓縮
4. **PWA 支援** - 添加 manifest.json 和 service worker

## 相關資源

- [MDN: Viewport meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
- [CSS Tricks: Aspect Ratio](https://css-tricks.com/aspect-ratio-boxes/)
- [Web.dev: Mobile optimization](https://web.dev/mobile/)
