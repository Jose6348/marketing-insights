import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

app = FastAPI()

# Carrega .env da raiz do projeto ou de sentiment-api
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"✅ Arquivo .env carregado de: {env_path}")
else:
    root_env = Path(__file__).parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
        print(f"✅ Arquivo .env carregado de: {root_env}")
    else:
        print("ℹ️  Nenhum arquivo .env encontrado. Usando variáveis de ambiente do sistema.")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️  AVISO: GEMINI_API_KEY não configurada. Configure a variável de ambiente.")


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
    text = req.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Texto não pode estar vazio")
    
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY não configurada. Configure a variável de ambiente."
        )
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""Você é um especialista em análise de sentimento de reviews de produtos em português.

Analise o sentimento do seguinte texto de review:

"{text}"

IMPORTANTE - Considere cuidadosamente:
1. **Ironia e Sarcasmo**: Se o texto usa palavras positivas mas o contexto indica crítica negativa (ex: "Ótimo produto... se você gosta de coisas que quebram" = NEGATIVO)
2. **Tom Real**: O sentimento real pode ser diferente das palavras usadas
3. **Contexto Completo**: Leia a frase inteira, não apenas palavras isoladas
4. **Intensidade**: Avalie quão forte é o sentimento (positivo ou negativo)

Exemplos de ironia que devem ser classificados como NEGATIVO:
- "Ótimo produto... se você gosta de coisas que quebram" → negative
- "Perfeito! Funcionou por 2 dias" → negative
- "Recomendo muito... não" → negative

Responda APENAS com um JSON válido (sem markdown, sem explicações, apenas JSON):
{{
    "label": "positive" ou "negative" ou "neutral",
    "score": um número entre -1.0 e 1.0, onde:
        - 1.0 = extremamente positivo
        - 0.5 = moderadamente positivo
        - 0.0 = neutro
        - -0.5 = moderadamente negativo
        - -1.0 = extremamente negativo
}}

Apenas o JSON, nada mais."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        print(f"[DEBUG] Resposta bruta do Gemini: {response_text[:200]}")
        
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        try:
            result = json.loads(response_text)
            label = result.get("label", "neutral").lower()
            score = float(result.get("score", 0.0))
            
            print(f"[DEBUG] Label do Gemini: {label}, Score original: {score}")
            
            if label not in ["positive", "negative", "neutral"]:
                label = "neutral"
            
            # Normaliza score de -1.0 a 1.0 para 0.0 a 1.0
            normalized_score = (score + 1.0) / 2.0
            normalized_score = max(0.0, min(1.0, normalized_score))
            
            return SentimentResponse(label=label, score=normalized_score)
            
        except json.JSONDecodeError as e:
            print(f"Erro ao fazer parse do JSON do Gemini: {e}")
            print(f"Resposta recebida: {response_text}")
            return _fallback_sentiment_analysis(text)
            
    except Exception as e:
        print(f"Erro ao chamar Gemini API: {e}")
        return _fallback_sentiment_analysis(text)


def _fallback_sentiment_analysis(text: str) -> SentimentResponse:
    """Análise básica por palavras-chave quando o Gemini falha."""
    text_lower = text.lower()
    
    positive_indicators = ["bom", "ótimo", "excelente", "gostei", "recomendo", "perfeito", "adoro"]
    negative_indicators = ["ruim", "péssimo", "horrível", "odiei", "não gostei", "defeito", "quebrado"]
    
    positive_count = sum(1 for word in positive_indicators if word in text_lower)
    negative_count = sum(1 for word in negative_indicators if word in text_lower)
    
    if positive_count > negative_count:
        score = 0.7
        label = "positive"
    elif negative_count > positive_count:
        score = 0.3
        label = "negative"
    else:
        score = 0.5
        label = "neutral"
    
    return SentimentResponse(label=label, score=score)

