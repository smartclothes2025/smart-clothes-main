# app/services/image_processing.py

import logging
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import base64
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
logger = logging.getLogger("uvicorn.error")

# 初始化 Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def analyze_clothing_type(image_input, filename: str = "image.jpg") -> Dict[str, Any]:
    """
    使用 Gemini Vision 分析衣物圖片，提取類別、顏色、風格等信息。
    
    Args:
        image_input: 圖片檔案路徑 (str) 或 圖片 bytes
        filename: 檔案名稱 (用於判斷格式)
    
    Returns:
        包含衣物信息的字典
    """
    try:
        # 檢查 API Key 是否設定
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY 未設定，回傳預設值")
            return get_default_clothing_result()
        
        # 處理輸入：可以是檔案路徑或 bytes
        if isinstance(image_input, bytes):
            image_data = base64.standard_b64encode(image_input).decode("utf-8")
            file_ext = Path(filename).suffix.lower()
        else:
            # 檔案路徑
            with open(image_input, "rb") as img_file:
                image_data = base64.standard_b64encode(img_file.read()).decode("utf-8")
            file_ext = Path(image_input).suffix.lower()
        
        # 確定 MIME type
        mime_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        mime_type = mime_type_map.get(file_ext, "image/jpeg")
        
        # 建構 Gemini 請求
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = """請分析這張衣物圖片，並以 JSON 格式回傳以下信息（必須回傳有效的 JSON）：
{
    "category": "衣物類別 (上衣/褲子/裙子/洋裝/外套/鞋子/帽子/包包/配件/襪子/特殊)",
    "colors": ["主要顏色", "次要顏色"],
    "style": "風格 (休閒/正式/運動/可愛/個性/簡約/復古/其他)",
    "material": "材質 (棉/麻/絲/羊毛/聚酯纖維/皮革/牛仔/其他)",
    "brand": "品牌 (如果看得出來)",
    "occasion": "適合場合 (日常/正式/運動/聚會/其他)",
    "size": "衣物尺寸估計 (S/M/L/XL/XXL 或 FREE)",
    "condition": "衣物狀況 (全新/良好/正常/磨損/其他)"
}

請務必只回傳 JSON 內容，不要加入任何其他文字。"""
        
        # 調用 Gemini API
        response = model.generate_content(
            [
                {
                    "mime_type": mime_type,
                    "data": image_data,
                },
                prompt
            ]
        )
        
        logger.info(f"Gemini 原始回應: {response.text}")
        
        # 解析 JSON 回應
        response_text = response.text.strip()
        
        # 嘗試提取 JSON (有時 Gemini 會加入額外文字)
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        
        if json_start >= 0 and json_end > json_start:
            try:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            except json.JSONDecodeError as je:
                logger.warning(f"JSON 解析失敗: {je}")
                logger.info(f"嘗試的 JSON 字符串: {response_text[json_start:json_end]}")
                return get_default_clothing_result()
        else:
            logger.warning("無法從 Gemini 回應中找到 JSON 結構")
            return get_default_clothing_result()
        
        # 驗證並正規化結果
        normalized_result = {
            "category": _normalize_category(result.get("category", "特殊")),
            "colors": result.get("colors", []) if isinstance(result.get("colors"), list) else [result.get("colors", "")],
            "style": _normalize_style(result.get("style", "休閒")),
            "material": str(result.get("material", "")).strip(),
            "brand": str(result.get("brand", "")).strip() or "",
            "occasion": str(result.get("occasion", "")).strip(),
            "size": str(result.get("size", "")).strip(),
            "condition": str(result.get("condition", "")).strip(),
            "name": f"AI辨識的{_normalize_category(result.get('category', '特殊'))}",
            "attributes": {
                "material": str(result.get("material", "")).strip(),
                "occasion": str(result.get("occasion", "")).strip(),
                "size": str(result.get("size", "")).strip(),
                "condition": str(result.get("condition", "")).strip(),
            }
        }
        
        logger.info(f"AI 分析結果: {normalized_result}")
        return normalized_result
        
    except Exception as e:
        logger.error(f"Gemini 分析失敗: {e}", exc_info=True)
        return get_default_clothing_result()


def _normalize_category(category: str) -> str:
    """將類別字符串正規化為允許的值"""
    allowed = {
        "上衣": ["上衣", "shirt", "t-shirt", "blouse"],
        "褲子": ["褲子", "pants", "trousers", "jeans"],
        "裙子": ["裙子", "skirt"],
        "洋裝": ["洋裝", "dress"],
        "外套": ["外套", "jacket", "coat"],
        "鞋子": ["鞋子", "shoes", "boots"],
        "帽子": ["帽子", "hat", "cap"],
        "包包": ["包包", "bag", "purse"],
        "配件": ["配件", "accessory", "accessories"],
        "襪子": ["襪子", "socks"],
    }
    
    cat_lower = (category or "").lower().strip()
    
    for normalized, variations in allowed.items():
        if cat_lower in variations:
            return normalized
    
    return "特殊"


def _normalize_style(style: str) -> str:
    """將風格字符串正規化為允許的值"""
    allowed = {
        "休閒": ["休閒", "casual"],
        "正式": ["正式", "formal", "business"],
        "運動": ["運動", "sports", "athletic"],
        "可愛": ["可愛", "cute", "sweet"],
        "個性": ["個性", "personality", "punk"],
        "簡約": ["簡約", "minimalist", "simple"],
        "復古": ["復古", "vintage", "retro"],
    }
    
    style_lower = (style or "").lower().strip()
    
    for normalized, variations in allowed.items():
        if style_lower in variations:
            return normalized
    
    return "其他"


def get_default_clothing_result() -> Dict[str, Any]:
    """回傳預設的衣物分析結果"""
    return {
        "category": "特殊",
        "colors": [""],
        "style": "休閒",
        "material": "",
        "brand": "",
        "occasion": "",
        "size": "",
        "condition": "",
        "name": "AI辨識的衣物",
        "attributes": {
            "material": "",
            "occasion": "",
            "size": "",
            "condition": "",
        },
    }
