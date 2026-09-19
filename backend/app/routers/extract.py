from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.extraction import extract_from_image, extract_from_text

router = APIRouter()


@router.post("/extract")
async def extract(text: str | None = Form(None), image: UploadFile | None = File(None)):
    if image is not None:
        content = await image.read()
        items = extract_from_image(content, image.content_type or "image/jpeg")
    elif text:
        items = extract_from_text(text)
    else:
        raise HTTPException(400, "Provide either 'text' or 'image'")

    return {"items": items}
