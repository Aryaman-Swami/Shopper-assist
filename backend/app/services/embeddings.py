import numpy as np

from app.services.gemini_client import get_client

EMBEDDING_MODEL = "text-embedding-004"


def embed_text(text: str) -> list[float]:
    client = get_client()
    result = client.models.embed_content(model=EMBEDDING_MODEL, contents=text)
    return list(result.embeddings[0].values)


def embed_texts(texts: list[str]) -> list[list[float]]:
    client = get_client()
    result = client.models.embed_content(model=EMBEDDING_MODEL, contents=texts)
    return [list(e.values) for e in result.embeddings]


def cosine_similarity_matrix(query: list[float], candidates: list[list[float]]) -> np.ndarray:
    q = np.array(query)
    c = np.array(candidates)
    q_norm = q / (np.linalg.norm(q) + 1e-9)
    c_norm = c / (np.linalg.norm(c, axis=1, keepdims=True) + 1e-9)
    return c_norm @ q_norm
