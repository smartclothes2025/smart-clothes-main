"""
Virtual Fitting API - AI-powered realistic try-on generation
Uses AI image generation services to create realistic clothing try-on images
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import base64
from io import BytesIO
from PIL import Image
import json

# Import our image generation service
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.image_generation import image_service

router = APIRouter(prefix="/api/v1/fitting", tags=["virtual-fitting"])


class ClothingItem(BaseModel):
    id: str  # Support UUID strings
    name: str
    category: str
    img: Optional[str] = None


class VirtualFittingRequest(BaseModel):
    user_input: str
    selected_items: List[ClothingItem]
    user_photo: Optional[str] = None  # Base64 encoded user photo
    body_metrics: Optional[dict] = None


class VirtualFittingResponse(BaseModel):
    type: str  # 'image' or 'text'
    url: Optional[str] = None
    text: Optional[str] = None
    prompt_used: Optional[str] = None


def create_realistic_tryon_prompt(items: List[ClothingItem], user_input: str, body_metrics: dict = None) -> str:
    """
    Create a detailed prompt for AI to generate realistic try-on images
    """
    # Build clothing description
    clothing_desc = []
    for item in items:
        clothing_desc.append(f"{item.category}: {item.name}")
    
    clothing_text = ", ".join(clothing_desc)
    
    # Build body metrics description if available
    body_desc = ""
    if body_metrics:
        body_parts = []
        if body_metrics.get('height_cm'):
            body_parts.append(f"身高 {body_metrics['height_cm']}cm")
        if body_metrics.get('weight_kg'):
            body_parts.append(f"體重 {body_metrics['weight_kg']}kg")
        if body_parts:
            body_desc = f"，體型特徵：{', '.join(body_parts)}"
    
    prompt = f"""請生成一張專業的時尚穿搭展示圖片，要求如下：

1. **人物設定**：
   - 展示一位時尚模特兒穿著指定服裝
   - 模特兒姿態自然、專業{body_desc}
   - 背景簡潔時尚（純色背景或簡約室內/戶外場景）
   - 光線柔和自然，突顯服裝質感

2. **服裝搭配**：
   {clothing_text}

3. **風格要求**：
   - {user_input}
   - 整體搭配協調、時尚
   - 展現服裝的剪裁和質感
   - 專業時尚攝影風格

4. **圖片質量**：
   - 高清晰度
   - 色彩真實自然
   - 構圖專業（全身或半身照）
   - 適合作為穿搭參考

請生成一張符合以上要求的逼真時尚穿搭圖片。"""
    
    return prompt


@router.post("/generate", response_model=VirtualFittingResponse)
async def generate_virtual_fitting(request: VirtualFittingRequest):
    """
    Generate realistic AI-powered virtual try-on image
    
    This endpoint uses AI image generation services (Google Gemini + Imagen)
    to create realistic try-on visualizations based on selected clothing items.
    Supports optional user photo for personalized try-on.
    """
    try:
        if not request.selected_items:
            raise HTTPException(status_code=400, detail="No clothing items selected")
        
        # Convert ClothingItem objects to dicts for the service
        items_dict = [item.dict() for item in request.selected_items]
        
        # If user photo is provided, use personalized generation
        if request.user_photo:
            # Extract base64 data from data URL format (e.g., "data:image/png;base64,xxx")
            user_photo_base64 = request.user_photo
            if "base64," in user_photo_base64:
                user_photo_base64 = user_photo_base64.split("base64,")[1]
            
            # Create clothing prompt
            clothing_prompt = image_service.create_fashion_prompt(
                clothing_items=items_dict,
                user_input=request.user_input,
                body_metrics=request.body_metrics,
                style="casual"
            )
            
            # Enhance prompt with user photo analysis
            enhancement_result = await image_service.enhance_with_user_photo(
                user_photo_base64=user_photo_base64,
                clothing_prompt=clothing_prompt
            )
            
            if enhancement_result.get("success"):
                # Use enhanced prompt to generate image
                enhanced_prompt = enhancement_result.get("enhanced_prompt")
                
                result = await image_service.generate_tryon_image(
                    prompt=enhanced_prompt,
                    style="realistic",
                    width=768,
                    height=1024
                )
                
                if result.get("success"):
                    image_base64 = result.get("image_base64")
                    data_url = f"data:image/png;base64,{image_base64}"
                    
                    return VirtualFittingResponse(
                        type="image",
                        url=data_url,
                        prompt_used=enhanced_prompt
                    )
                else:
                    return VirtualFittingResponse(
                        type="text",
                        text=f"圖片生成失敗：{result.get('error')}",
                        prompt_used=enhanced_prompt
                    )
            else:
                # Photo analysis failed, fall back to standard generation
                error_msg = enhancement_result.get('error', 'Photo analysis failed')
                print(f"Photo analysis failed: {error_msg}, falling back to standard generation")
        
        # Standard generation (no user photo or photo analysis failed)
        prompt = image_service.create_fashion_prompt(
            clothing_items=items_dict,
            user_input=request.user_input,
            body_metrics=request.body_metrics,
            style="casual"
        )
        
        # Generate image using available AI service
        result = await image_service.generate_tryon_image(
            prompt=prompt,
            style="realistic",
            width=768,
            height=1024
        )
        
        if result.get("success"):
            # Convert base64 to data URL for frontend
            image_base64 = result.get("image_base64")
            data_url = f"data:image/png;base64,{image_base64}"
            
            return VirtualFittingResponse(
                type="image",
                url=data_url,
                prompt_used=result.get("prompt")
            )
        else:
            # If no API configured, return helpful message
            error_msg = result.get("error", "Image generation failed")
            return VirtualFittingResponse(
                type="text",
                text=f"""⚠️ 圖片生成服務未配置

{error_msg}

**如何啟用 AI 虛擬試衣：**

1. **使用 Google Gemini + Imagen (推薦)**
   - 獲取 Gemini API Key: https://makersuite.google.com/app/apikey
   - 創建 Google Cloud 項目並啟用 Vertex AI API
   - 設定環境變數：
     * GEMINI_API_KEY=your_key
     * GCP_PROJECT_ID=your_project_id
     * GCP_LOCATION=us-central1
   - 詳細步驟請參考 backend/GOOGLE_AI_SETUP.md

生成的提示詞：
{result.get('prompt', prompt)}""",
                prompt_used=prompt
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")




@router.post("/generate-with-photo")
async def generate_with_user_photo(
    user_photo: UploadFile = File(...),
    clothing_items: str = Form(...),
    user_input: str = Form(default="時尚日常穿搭")
):
    """
    Generate virtual try-on using user's uploaded photo
    This provides more personalized results by analyzing the user's appearance
    """
    try:
        # Read and process user photo
        image_data = await user_photo.read()
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert image to base64
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        # Parse clothing items
        try:
            items = json.loads(clothing_items)
        except:
            items = []
        
        # Create clothing prompt
        clothing_prompt = image_service.create_fashion_prompt(
            clothing_items=items,
            user_input=user_input,
            style="casual"
        )
        
        # Enhance prompt with user photo analysis
        enhancement_result = await image_service.enhance_with_user_photo(
            user_photo_base64=img_base64,
            clothing_prompt=clothing_prompt
        )
        
        if enhancement_result.get("success"):
            # Use enhanced prompt to generate image
            enhanced_prompt = enhancement_result.get("enhanced_prompt")
            
            result = await image_service.generate_tryon_image(
                prompt=enhanced_prompt,
                style="realistic",
                width=768,
                height=1024
            )
            
            if result.get("success"):
                image_base64 = result.get("image_base64")
                data_url = f"data:image/png;base64,{image_base64}"
                
                return {
                    "type": "image",
                    "url": data_url,
                    "analysis": enhancement_result.get("analysis"),
                    "prompt_used": enhanced_prompt
                }
            else:
                return {
                    "type": "text",
                    "text": f"圖片生成失敗：{result.get('error')}",
                    "analysis": enhancement_result.get("analysis")
                }
        else:
            return {
                "type": "text",
                "text": f"照片分析失敗：{enhancement_result.get('error')}",
                "message": "請確保已設定 GEMINI_API_KEY"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo processing failed: {str(e)}")
