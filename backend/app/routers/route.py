from fastapi import APIRouter
from pydantic import BaseModel

from app.services.inventory import filter_available
from app.services.routing import build_route

router = APIRouter()


class RouteRequest(BaseModel):
    skus: list[str]


@router.post("/route")
def route(req: RouteRequest):
    filtered = filter_available(req.skus)
    item_nodes = [item["shelf_id"] for item in filtered["available"]]
    route_data = build_route(item_nodes)

    node_to_items = {}
    for item in filtered["available"]:
        node_to_items.setdefault(item["shelf_id"], []).append({"sku": item["sku"], "name": item["name"]})

    return {
        **route_data,
        "items_by_stop": node_to_items,
        "out_of_stock": filtered["out_of_stock"],
    }
