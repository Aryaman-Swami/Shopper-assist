from fastapi import APIRouter
from pydantic import BaseModel

from app.services.matching import match_item

router = APIRouter()


class MatchRequest(BaseModel):
    items: list[str]


@router.post("/match")
def match(req: MatchRequest):
    return {"results": [match_item(item) for item in req.items]}
