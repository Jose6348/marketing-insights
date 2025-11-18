from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    label: str
    score: float


@app.get("/health")
def health():
    return {"status": "ok", "service": "sentiment-api"}


@app.post("/sentiment", response_model=SentimentResponse)
def sentiment(req: SentimentRequest):
    text = req.text.lower()

    positive_words = [
        "bom",
        "boa",
        "ótimo",
        "otimo",
        "excelente",
        "maravilhoso",
        "maravilhosa",
        "gostei",
        "adoro",
        "perfeito",
        "recomendo",
        "incrível",
        "incrivel",
        "funciona bem",
    ]

    negative_words = [
        "ruim",
        "péssimo",
        "pessimo",
        "horrível",
        "horrivel",
        "odiei",
        "odio",
        "odioso",
        "terrível",
        "terrivel",
        "não gostei",
        "nao gostei",
        "defeito",
        "quebrado",
        "fraco",
    ]

    score = 0.5

    for w in positive_words:
        if w in text:
            score += 0.1

    for w in negative_words:
        if w in text:
            score -= 0.1

    score = max(0.0, min(1.0, score))

    if score > 0.6:
        label = "positive"
    elif score < 0.4:
        label = "negative"
    else:
        label = "neutral"

    return SentimentResponse(label=label, score=score)

