from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.extraction import extract_from_image, extract_from_text
from app.services.inventory import filter_available
from app.services.matching import match_item
from app.services.routing import build_route

router = APIRouter()


@router.post("/plan")
async def plan(text: str | None = Form(None), image: UploadFile | None = File(None)):
    if image is not None:
        content = await image.read()
        extracted = extract_from_image(content, image.content_type or "image/jpeg")
    elif text:
        extracted = extract_from_text(text)
    else:
        raise HTTPException(400, "Provide either 'text' or 'image'")

    matches = [match_item(item["name"]) for item in extracted]

    matched_skus = [m["match"]["sku"] for m in matches if m["match"] and m["matched"]]
    unmatched = [m["query"] for m in matches if not m["match"] or not m["matched"]]

    filtered = filter_available(matched_skus)
    item_nodes = [item["shelf_id"] for item in filtered["available"]]
    route_data = build_route(item_nodes)

    node_to_items = {}
    for item in filtered["available"]:
        node_to_items.setdefault(item["shelf_id"], []).append({"sku": item["sku"], "name": item["name"]})

    return {
        "extracted_items": extracted,
        "matches": matches,
        "unmatched": unmatched,
        "out_of_stock": filtered["out_of_stock"],
        "route": {**route_data, "items_by_stop": node_to_items},
    }
