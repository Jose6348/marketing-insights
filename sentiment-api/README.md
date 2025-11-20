# Sentiment API

API de análise de sentimento usando Google Gemini.

## Como configurar

Primeiro, você precisa de uma chave da API do Gemini. Acesse o [Google AI Studio](https://aistudio.google.com/), faça login e gere uma chave de API.

Depois, crie um arquivo `.env` dentro da pasta `sentiment-api` com o seguinte conteúdo:

GEMINI_API_KEY=sua-chave-aqui

Substitua `sua-chave-aqui` pela chave que você gerou.

## Instalar e rodar

Instale as dependências:

pip install -r requirements.txt

Para rodar a API:


python -m uvicorn main:app --reload --port 8000


A API vai rodar em `http://localhost:8000`.

## Endpoints

GET /health - Verifica se a API está funcionando

POST /sentiment - Analisa o sentimento de um texto

Exemplo de request:
```json
{
  "text": "Produto excelente, recomendo muito!"
}


Exemplo de response:
```json
{
  "label": "positive",
  "score": 0.85
}


O score vai de 0.0 (negativo) até 1.0 (positivo). Se der algum erro com o Gemini, o sistema usa uma análise básica por palavras-chave como fallback.
