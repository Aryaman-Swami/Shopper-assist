from fastapi import Request
from fastapi.responses import JSONResponse


class GeminiNotConfigured(RuntimeError):
    pass


async def gemini_not_configured_handler(request: Request, exc: GeminiNotConfigured):
    return JSONResponse(status_code=503, content={"detail": str(exc)})
