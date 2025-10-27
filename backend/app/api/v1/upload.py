# app/api/v1/upload.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional, List, Any, Dict
from datetime import datetime, timezone
import shutil
import re
import logging
import json
from urllib.parse import quote
import os
from dotenv import load_dotenv
import uuid as _uuid
import asyncio

# --- 圖片處理套件 ---
from rembg import remove
from PIL import Image
from io import BytesIO

# --- GCS 服務 ---
from app.services.storage import (
    upload_file_to_gcs_from_bytes,
    generate_signed_url_from_gcs_uri,
)

# --- 核心依賴 ---
from app.core.db import get_db
from app.models.wardrobe import WardrobeItem
from app.models.auth import User
from app.api.v1.auth import get_current_user

# --- AI 服務 ---
from app.services.image_processing import analyze_clothing_type

# --- 環境變數與日誌設定 ---
load_dotenv()
logger = logging.getLogger("uvicorn.error")
logging.basicConfig(level=logging.INFO)

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "smartclothes_wardrobe")

# --- 類別/前綴設定 ---
GCS_PREFIXES = {
    "上衣": "上衣",
    "洋裝": "洋裝",
    "褲子": "下身",
    "裙子": "下身",
    "外套": "外套",
    "鞋子": "鞋子",
    "包包": "包包",
    "帽子": "帽子",
    "襪子": "襪子",
    "配件": "配件",
    "特殊": "特殊",
}

# --- Router ---
router = APIRouter()
security_strict = HTTPBearer(auto_error=False)


# --- 輔助函式 ---

def _get_dest_prefix(category_val: str) -> str:
    """根據類別值決定 GCS 儲存桶內的前綴路徑"""
    if category_val in GCS_PREFIXES:
        return GCS_PREFIXES.get(category_val)
    if category_val in ["褲子", "裙子"]:
        return GCS_PREFIXES.get("褲子")
    return "特殊"

def _sanitize_name(raw: str) -> str:
    """清理檔名，移除不安全字元"""
    raw = (raw or "").strip()
    if not raw:
        return "file"
    return re.sub(r"[^\w\u4e00-\u9fff\-\s]", "_", raw)[:120].strip() or "file"

def resolve_image_url(uri: str) -> str:
    """將 GCS URI 解析為有時效性的 HTTPS 簽名網址"""
    if not uri:
        return ""
    if uri.startswith("gs://"):
        return generate_signed_url_from_gcs_uri(uri, expiration_minutes=60)
    return uri

def current_user_from_header(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_strict),
    db: Session = Depends(get_db),
) -> User:
    """從 Authorization Bearer 取得 token，並驗證使用者"""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="未提供 Authorization Bearer")
    token = credentials.credentials
    try:
        return get_current_user(token=token, db=db)
    except Exception:
        raise HTTPException(status_code=401, detail="登入已過期或無效")


# --- API 端點 ---

@router.post("/clothes", status_code=status.HTTP_201_CREATED, summary="上傳衣物並建立資料")
async def upload_clothes(
    file: UploadFile = File(...),
    name: str = Form(""),
    category: str = Form("上衣"),
    color: str = Form(""),
    tags: str = Form("[]"),
    attributes: str = Form("{}"),
    remove_bg: str = Form("0"),
    style: str = Form(""),
    size_label: str = Form(""),
    price_ntd: Optional[int] = Form(None),
    ai_detect: str = Form("0"),
    db: Session = Depends(get_db),
    current_user: User = Depends(current_user_from_header),
):
    """
    處理衣物圖片上傳、智慧去背、存儲到 GCS，並將衣物資訊寫入資料庫。
    """
    try:
        # 1. 參數解析與正規化
        try:
            tags_list = json.loads(tags) if tags else []
        except Exception:
            tags_list = []
        try:
            attributes_dict = json.loads(attributes) if attributes else {}
        except Exception:
            attributes_dict = {}

        # 2. 檔案處理：讀取內容
        await file.seek(0)
        contents = await file.read()
        
        orig_ext = Path(file.filename).suffix or ".jpg"
        final_contents = contents
        final_ext = orig_ext
        is_bg_removed = False

        # 3. 智慧去背 (Rembg) 邏輯
        do_remove = str(remove_bg).lower() in ("1", "true", "yes")
        if do_remove:
            logger.info("執行去背並強制轉為 PNG...")
            try:
                input_image = Image.open(BytesIO(contents))
                output_image = remove(input_image, alpha_matting=True)
                output_buffer = BytesIO()
                output_image.save(output_buffer, format="PNG")
                
                final_contents = output_buffer.getvalue()
                final_ext = ".png"
                is_bg_removed = True
            except Exception as e:
                logger.error(f"去背失敗，儲存原始檔案: {e}")
                final_contents = contents
                final_ext = orig_ext
                is_bg_removed = False
        
        # 4. 檔案命名
        safe_cat = (category or "上衣").strip().replace("/", "_")
        safe_stem = _sanitize_name(name) if name.strip() else _sanitize_name(Path(file.filename).stem)
        
        gcs_prefix = _get_dest_prefix(safe_cat)
        gcs_object_name = f"{gcs_prefix}/{safe_stem}{final_ext}".lstrip('/')
        mime_type = f"image/{final_ext.lstrip('.')}"
        
        # 5. 上傳到 Google Cloud Storage (GCS)
        gcs_uri = upload_file_to_gcs_from_bytes(
            file_bytes=final_contents,
            destination_blob_name=gcs_object_name,
            mime_type=mime_type,
            bucket_name=GCS_BUCKET_NAME
        )
        
        # 6. 準備資料庫資料
        attributes_dict["bg_removed"] = is_bg_removed
        user_id_val = getattr(current_user, "id", None)
        
        # 建立基礎資料
        final_data = {
            "name": (name or safe_stem),
            "category": category or "上衣",
            "color": color or "",
            "style": style or "休閒",
            "brand": attributes_dict.pop("brand", attributes_dict.pop("Brand", attributes_dict.pop("品牌", ""))),
            "attributes": attributes_dict,
            "tags": tags_list
        }
        
        # 7. AI 辨識邏輯
        do_ai_detect = str(ai_detect).lower() in ("1", "true", "yes")
        if do_ai_detect:
            try:
                logger.info("執行 AI 辨識...")
                # 使用原始檔案內容調用 AI 分析
                ai_results = await asyncio.to_thread(analyze_clothing_type, contents, file.filename)
                logger.info(f"AI 辨識結果: {ai_results}")
                
                # 使用 AI 結果覆蓋 final_data
                final_data["name"] = ai_results.get("name", final_data["name"])
                final_data["category"] = ai_results.get("category", final_data["category"])
                
                # 處理顏色列表
                colors = ai_results.get("colors", [])
                final_data["color"] = colors[0] if colors else final_data["color"]
                
                final_data["style"] = ai_results.get("style", final_data["style"])
                final_data["brand"] = ai_results.get("brand", final_data["brand"])
                
                # 合併 attributes
                ai_attrs = ai_results.get("attributes", {})
                final_data["attributes"] = {**final_data["attributes"], **ai_attrs}

            except Exception as e:
                logger.error(f"AI 辨識失敗: {e}", exc_info=True)
                # 失敗時繼續使用表單資料
        
        # 8. 重新組合 tags
        final_tags = list(final_data["tags"]) if final_data["tags"] else []
        if final_data["style"] and final_data["style"] not in final_tags:
            final_tags.append(final_data["style"])
        if final_data["brand"] and final_data["brand"] not in final_tags:
            final_tags.append(final_data["brand"])
        
        # 9. 建立資料庫項目
        item_kwargs: Dict[str, Any] = {
            "user_id": user_id_val,
            "name": final_data["name"],
            "category": final_data["category"],
            "color": final_data["color"],
            "cover_image_url": gcs_uri,
            "tags": final_tags,
            "attributes": final_data["attributes"],
            "brand": final_data["brand"],
            "style": final_data["style"],
            "size_label": size_label or "",
            "price_ntd": price_ntd,
        }

        item = WardrobeItem(**item_kwargs)
        db.add(item)
        db.commit()
        db.refresh(item)
        
        # 10. 回傳前端可顯示的 HTTPS 網址
        frontend_url = resolve_image_url(gcs_uri)

        resp = {
            "id": str(getattr(item, "id", "")),
            "name": getattr(item, "name", "") or "",
            "category": (getattr(item, "category").value if hasattr(getattr(item, "category"), "value") else (getattr(item, "category", "") or "")),
            "color": getattr(item, "color", "") or "",
            "img": frontend_url,
            "daysInactive": None,
            "owner_display_name": getattr(item.user, "display_name", "") or "",
        }
        return {"message": "上傳成功", "item": resp}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("upload_clothes failed")
        raise HTTPException(status_code=500, detail=f"上傳失敗: {e}")


@router.post("/general", status_code=status.HTTP_201_CREATED, summary="通用檔案上傳")
async def upload_general_image(
    file: UploadFile = File(...),
    db_category: str = Form("general"),
    current_user: User = Depends(current_user_from_header),
):
    """
    僅將檔案上傳到 GCS，不寫入 WardrobeItem 資料庫。
    適用於上傳頭像、草稿或非衣物圖片。
    """
    try:
        await file.seek(0)
        contents = await file.read()
        
        orig_ext = Path(file.filename).suffix or ".jpg"
        
        user_prefix = str(getattr(current_user, 'id', 'anonymous'))
        unique_name = f"{user_prefix}/{_uuid.uuid4().hex}{orig_ext}"
        destination_blob_name = f"{db_category}/{unique_name}"
        
        mime_type = file.content_type if file.content_type else f"image/{orig_ext.lstrip('.')}"
        
        gcs_uri = upload_file_to_gcs_from_bytes(
            file_bytes=contents,
            destination_blob_name=destination_blob_name,
            mime_type=mime_type,
            bucket_name=GCS_BUCKET_NAME
        )
        
        frontend_url = resolve_image_url(gcs_uri)

        return {
            "message": "檔案上傳 GCS 成功",
            "gcs_uri": gcs_uri,
            "image_url": frontend_url,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("upload_general_image failed")
        raise HTTPException(status_code=500, detail=f"檔案上傳失敗: {e}")
