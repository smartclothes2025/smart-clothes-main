"""
Image Generation Service
Uses Google Gemini and Imagen for virtual try-on
"""
import os
import base64
import requests
from typing import Optional, Dict, Any
from io import BytesIO
from PIL import Image
import google.generativeai as genai
from google.cloud import aiplatform
from google.oauth2 import service_account


class ImageGenerationService:
    """
    Service for generating realistic try-on images using Google Gemini and Imagen
    """
    
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.gcp_project_id = os.getenv("GCP_PROJECT_ID")
        self.gcp_location = os.getenv("GCP_LOCATION", "us-central1")
        
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
        
        # Initialize Vertex AI for Imagen
        if self.gcp_project_id:
            try:
                aiplatform.init(project=self.gcp_project_id, location=self.gcp_location)
            except Exception as e:
                print(f"Vertex AI initialization warning: {e}")
    
    async def generate_tryon_image(
        self, 
        prompt: str, 
        style: str = "realistic",
        width: int = 768,
        height: int = 1024
    ) -> Dict[str, Any]:
        """
        Generate try-on image using Google Gemini and Imagen
        """
        
        # First, use Gemini to enhance the prompt
        if self.gemini_api_key:
            try:
                enhanced_prompt = await self._enhance_prompt_with_gemini(prompt)
            except Exception as e:
                print(f"Gemini prompt enhancement failed: {e}")
                enhanced_prompt = prompt
        else:
            enhanced_prompt = prompt
        
        # Try Imagen for image generation
        if self.gcp_project_id:
            try:
                result = await self._generate_with_imagen(enhanced_prompt, width, height)
                if result:
                    return result
            except Exception as e:
                print(f"Imagen failed: {e}")
        
        # Fallback: Use Gemini to generate a detailed description
        if self.gemini_api_key:
            try:
                result = await self._generate_description_with_gemini(enhanced_prompt)
                return result
            except Exception as e:
                print(f"Gemini description failed: {e}")
        
        # If no API keys available
        return {
            "success": False,
            "error": "請配置 GEMINI_API_KEY 和 GCP_PROJECT_ID 來使用 Google AI 服務",
            "prompt": prompt
        }
    
    async def _enhance_prompt_with_gemini(self, prompt: str) -> str:
        """
        Use Gemini to enhance and optimize the prompt for image generation
        """
        model = genai.GenerativeModel('gemini-pro')
        
        enhancement_request = f"""將以下中文時尚穿搭描述轉換為詳細的英文圖片生成提示詞，
        適用於專業時尚攝影風格的 AI 圖片生成：

{prompt}

要求：
1. 使用專業時尚攝影術語
2. 描述模特兒姿態和表情
3. 說明光線和背景
4. 強調服裝質感和細節
5. 只輸出英文提示詞，不要其他說明

輸出格式：Professional fashion photography, [詳細描述]"""
        
        response = model.generate_content(enhancement_request)
        enhanced = response.text.strip()
        
        # Add quality enhancers
        enhanced += ", high resolution, detailed fabric texture, natural lighting, studio quality, 8k, sharp focus"
        
        return enhanced
    
    async def _generate_with_imagen(
        self, 
        prompt: str, 
        width: int = 768, 
        height: int = 1024
    ) -> Dict[str, Any]:
        """
        Generate image using Google Imagen via Vertex AI
        """
        from vertexai.preview.vision_models import ImageGenerationModel
        
        try:
            # Initialize Imagen model
            model = ImageGenerationModel.from_pretrained("imagegeneration@006")
            
            # Generate image
            images = model.generate_images(
                prompt=prompt,
                number_of_images=1,
                aspect_ratio="9:16" if height > width else "3:4",
                safety_filter_level="block_some",
                person_generation="allow_adult",
            )
            
            if images and len(images) > 0:
                # Convert image to base64
                image = images[0]
                img_byte_arr = BytesIO()
                image._pil_image.save(img_byte_arr, format='PNG')
                img_byte_arr = img_byte_arr.getvalue()
                image_base64 = base64.b64encode(img_byte_arr).decode('utf-8')
                
                return {
                    "success": True,
                    "image_base64": image_base64,
                    "format": "base64",
                    "prompt": prompt,
                    "service": "google-imagen"
                }
            else:
                raise Exception("Imagen did not return any images")
                
        except Exception as e:
            raise Exception(f"Imagen generation error: {str(e)}")
    
    async def _generate_description_with_gemini(self, prompt: str) -> Dict[str, Any]:
        """
        Fallback: Use Gemini to generate a detailed text description
        when image generation is not available
        """
        model = genai.GenerativeModel('gemini-pro')
        
        description_request = f"""基於以下時尚穿搭提示，生成一段詳細的視覺化描述，
        幫助用戶想像穿搭效果：

{prompt}

請描述：
1. 整體穿搭風格和氛圍
2. 每件服裝的搭配效果
3. 適合的場合和季節
4. 視覺上的亮點
5. 穿搭建議

用生動、專業的語言描述，讓用戶能清楚想像穿搭效果。"""
        
        response = model.generate_content(description_request)
        description = response.text.strip()
        
        return {
            "success": False,
            "error": f"""⚠️ Imagen 圖片生成服務未配置

當前使用 Gemini 生成文字描述作為替代：

{description}

**如何啟用圖片生成：**
1. 設定 GCP_PROJECT_ID 環境變數
2. 啟用 Vertex AI API
3. 配置服務帳號認證

詳細步驟請參考 AI_SETUP_GUIDE.md""",
            "description": description,
            "prompt": prompt
        }
    
    def create_fashion_prompt(
        self,
        clothing_items: list,
        user_input: str,
        body_metrics: Optional[dict] = None,
        style: str = "casual"
    ) -> str:
        """
        Create optimized prompt for fashion image generation
        """
        # Build clothing description
        clothing_descriptions = []
        for item in clothing_items:
            category = item.get('category', '')
            name = item.get('name', '')
            
            # Map Chinese categories to English
            category_map = {
                '上衣': 'top',
                '外套': 'jacket',
                '褲子': 'pants',
                '裙子': 'skirt',
                '洋裝': 'dress',
                '鞋子': 'shoes',
                '帽子': 'hat',
                '配件': 'accessory'
            }
            
            eng_category = category_map.get(category, category)
            clothing_descriptions.append(f"{eng_category}: {name}")
        
        clothing_text = ", ".join(clothing_descriptions)
        
        # Build body description
        body_desc = "average build"
        if body_metrics:
            height = body_metrics.get('height_cm')
            weight = body_metrics.get('weight_kg')
            if height and weight:
                bmi = weight / ((height / 100) ** 2)
                if bmi < 18.5:
                    body_desc = "slim build"
                elif bmi > 25:
                    body_desc = "athletic build"
        
        # Create comprehensive prompt with Asian (Taiwanese) model specification
        prompt = f"""A professional Asian Taiwanese female fashion model wearing {clothing_text}, 
        {body_desc}, standing in a modern minimalist studio, 
        soft natural lighting, neutral background, 
        full body shot, confident pose, 
        high-end fashion photography style, 
        detailed clothing texture, realistic fabric, 
        professional fashion magazine quality, 
        East Asian features, natural makeup"""
        
        return prompt
    
    async def enhance_with_user_photo(
        self,
        user_photo_base64: str,
        clothing_prompt: str
    ) -> Dict[str, Any]:
        """
        Analyze user photo and generate personalized try-on
        Uses Gemini Vision for analysis
        """
        if not self.gemini_api_key:
            return {
                "success": False,
                "error": "GEMINI_API_KEY not configured"
            }
        
        try:
            # Decode base64 image
            image_data = base64.b64decode(user_photo_base64)
            image = Image.open(BytesIO(image_data))
            
            # Use Gemini Vision to analyze
            model = genai.GenerativeModel('gemini-pro-vision')
            
            analysis_prompt = f"""Analyze this person's photo and describe:
            1. Body type and build
            2. Skin tone
            3. Face shape
            4. Overall style
            
            Then suggest how to best showcase these clothing items on this person:
            {clothing_prompt}
            
            Provide a detailed English prompt for AI image generation."""
            
            # Convert image for Gemini
            img_byte_arr = BytesIO()
            image.save(img_byte_arr, format='JPEG')
            img_bytes = img_byte_arr.getvalue()
            
            response = model.generate_content([
                analysis_prompt,
                {"mime_type": "image/jpeg", "data": img_bytes}
            ])
            
            enhanced_prompt = response.text
            
            return {
                "success": True,
                "enhanced_prompt": enhanced_prompt,
                "analysis": response.text
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Photo analysis failed: {str(e)}"
            }


# Singleton instance
image_service = ImageGenerationService()
