"""
Google AI 服務測試腳本
用於驗證 Gemini 和 Imagen 配置是否正確
"""
import os
import sys
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

def test_gemini():
    """測試 Gemini API"""
    print("\n🧪 測試 Gemini API...")
    
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ 錯誤: GEMINI_API_KEY 未設置")
            return False
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        response = model.generate_content("Say 'Hello from Gemini!'")
        print(f"✅ Gemini 響應: {response.text[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Gemini 測試失敗: {str(e)}")
        return False


def test_imagen():
    """測試 Imagen (Vertex AI)"""
    print("\n🧪 測試 Imagen (Vertex AI)...")
    
    try:
        from google.cloud import aiplatform
        from vertexai.preview.vision_models import ImageGenerationModel
        
        project_id = os.getenv("GCP_PROJECT_ID")
        location = os.getenv("GCP_LOCATION", "us-central1")
        
        if not project_id:
            print("❌ 錯誤: GCP_PROJECT_ID 未設置")
            return False
        
        print(f"📍 項目: {project_id}")
        print(f"📍 地區: {location}")
        
        # 初始化 Vertex AI
        aiplatform.init(project=project_id, location=location)
        print("✅ Vertex AI 初始化成功")
        
        # 測試 Imagen
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        print("✅ Imagen 模型載入成功")
        
        print("\n⚠️  注意: 實際生成圖片需要幾秒鐘且會產生費用")
        print("如要測試圖片生成，請取消下面的註釋：")
        print("""
# images = model.generate_images(
#     prompt="A professional fashion model",
#     number_of_images=1,
# )
# print(f"✅ 生成了 {len(images)} 張圖片")
# images[0]._pil_image.save("test_output.png")
# print("✅ 圖片已保存為 test_output.png")
        """)
        
        return True
        
    except Exception as e:
        print(f"❌ Imagen 測試失敗: {str(e)}")
        print("\n💡 可能的原因:")
        print("1. Vertex AI API 未啟用")
        print("2. 認證未設置 (運行: gcloud auth application-default login)")
        print("3. 項目 ID 不正確")
        print("4. 地區不支援 Imagen")
        return False


def test_environment():
    """測試環境配置"""
    print("\n🔍 檢查環境配置...")
    
    required_vars = {
        "GEMINI_API_KEY": "Gemini API Key",
        "GCP_PROJECT_ID": "Google Cloud 項目 ID",
    }
    
    optional_vars = {
        "GCP_LOCATION": "Google Cloud 地區 (默認: us-central1)",
    }
    
    all_ok = True
    
    print("\n必需配置:")
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:10] + "..." if len(value) > 10 else value
            print(f"  ✅ {desc}: {masked}")
        else:
            print(f"  ❌ {desc}: 未設置")
            all_ok = False
    
    print("\n可選配置:")
    for var, desc in optional_vars.items():
        value = os.getenv(var)
        if value:
            print(f"  ✅ {desc}: {value}")
        else:
            print(f"  ⚠️  {desc}: 未設置 (將使用默認值)")
    
    return all_ok


def main():
    """主測試函數"""
    print("=" * 60)
    print("🎨 Google AI 虛擬試衣服務測試")
    print("=" * 60)
    
    # 測試環境配置
    env_ok = test_environment()
    
    if not env_ok:
        print("\n❌ 環境配置不完整，請先配置 .env 文件")
        print("參考: backend/.env.example")
        sys.exit(1)
    
    # 測試 Gemini
    gemini_ok = test_gemini()
    
    # 測試 Imagen
    imagen_ok = test_imagen()
    
    # 總結
    print("\n" + "=" * 60)
    print("📊 測試總結")
    print("=" * 60)
    print(f"Gemini API: {'✅ 正常' if gemini_ok else '❌ 失敗'}")
    print(f"Imagen (Vertex AI): {'✅ 正常' if imagen_ok else '❌ 失敗'}")
    
    if gemini_ok and imagen_ok:
        print("\n🎉 所有測試通過！您可以開始使用 AI 虛擬試衣功能了！")
        print("\n下一步:")
        print("1. 啟動後端: uvicorn app.main:app --reload")
        print("2. 啟動前端: npm run dev")
        print("3. 訪問應用並測試虛擬試衣功能")
    elif gemini_ok:
        print("\n⚠️  Gemini 可用，但 Imagen 不可用")
        print("系統將使用 Gemini 生成文字描述作為替代")
        print("要啟用圖片生成，請參考: backend/GOOGLE_AI_SETUP.md")
    else:
        print("\n❌ 測試失敗，請檢查配置")
        print("詳細設置指南: backend/GOOGLE_AI_SETUP.md")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
