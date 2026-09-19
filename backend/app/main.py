from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.errors import GeminiNotConfigured, gemini_not_configured_handler
from app.routers import extract, match, plan, route

app = FastAPI(title="Shopper Assist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(GeminiNotConfigured, gemini_not_configured_handler)

app.include_router(extract.router)
app.include_router(match.router)
app.include_router(route.router)
app.include_router(plan.router)


@app.get("/health")
def health():
    return {"status": "ok"}
