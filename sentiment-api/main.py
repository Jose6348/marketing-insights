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
        # Básicas
        "bom", "boa", "ótimo", "otimo", "excelente", "maravilhoso", "maravilhosa",
        "gostei", "adoro", "perfeito", "recomendo", "incrível", "incrivel",
        "funciona bem", "funciona perfeitamente",
        
        # Qualidade e satisfação
        "qualidade", "superou expectativas", "superou", "expectativas",
        "satisfeito", "satisfeita", "satisfação", "satisfatorio", "satisfatória",
        "vale a pena", "valeu a pena", "compensa", "comprou",
        
        # Recomendações
        "recomendo", "recomendaria", "recomendação", "recomendado",
        "indico", "indicaria", "indicação",
        
        # Entregas e atendimento
        "entrega rápida", "entrega rapida", "chegou rápido", "chegou rapido",
        "chegou no prazo", "embalagem perfeita", "bem embalado", "bem embalada",
        "atendimento excelente", "atendimento bom", "atendimento ótimo",
        
        # Produto
        "produto excelente", "produto ótimo", "produto bom", "produto perfeito",
        "exatamente como descrito", "como na foto", "igual à foto",
        "dura muito", "durabilidade", "resistente", "robusto", "robusta",
        "bonito", "bonita", "lindo", "linda", "estiloso", "estilosa",
        "confortável", "confortavel", "conforto",
        
        # Funcionalidades
        "fácil de usar", "facil de usar", "intuitivo", "intuitiva",
        "prático", "pratica", "praticidade", "simples",
        "rápido", "rapido", "velocidade", "eficiente", "eficaz",
        
        # Emoções positivas
        "amor", "amei", "adoro", "adoraria", "encantado", "encantada",
        "impressionado", "impressionada", "surpreso", "surpresa",
        "feliz", "felicidade", "contente", "satisfeito", "satisfeita",
        
        # Comparações
        "melhor que", "melhor do que", "superou", "supera",
        "não me arrependi", "nao me arrependi", "não me arrependo",
        
        # Outras expressões
        "top", "show", "demais", "sensacional", "fantástico", "fantastico",
        "nota 10", "10/10", "cinco estrelas", "5 estrelas",
        "comprei outro", "vou comprar mais", "comprarei novamente",
    ]

    negative_words = [
        # Básicas
        "ruim", "péssimo", "pessimo", "horrível", "horrivel",
        "odiei", "odio", "odioso", "terrível", "terrivel",
        "não gostei", "nao gostei", "defeito", "quebrado", "fraco",
        
        # Qualidade ruim
        "qualidade ruim", "qualidade péssima", "qualidade pessima",
        "má qualidade", "ma qualidade", "baixa qualidade",
        "barato demais", "muito barato", "parece barato",
        "não vale a pena", "nao vale a pena", "não compensa",
        
        # Problemas com produto
        "veio quebrado", "chegou quebrado", "defeituoso", "defeituosa",
        "não funciona", "nao funciona", "não funcionou", "nao funcionou",
        "parou de funcionar", "deixou de funcionar", "estragou",
        "quebrou", "quebrou rápido", "quebrou rapido", "frágil", "fragil",
        "desbotou", "descolou", "rasgou", "rasgou fácil",
        
        # Problemas com entrega
        "atrasou", "atraso", "chegou atrasado", "chegou atrasada",
        "não chegou", "nao chegou", "perdido", "extraviado",
        "embalagem ruim", "embalagem péssima", "mal embalado", "mal embalada",
        "veio danificado", "chegou danificado", "amassado", "amassada",
        
        # Problemas com atendimento
        "atendimento ruim", "atendimento péssimo", "atendimento pessimo",
        "não responde", "nao responde", "não atende", "nao atende",
        "atendimento lento", "demora para responder",
        
        # Descrição vs realidade
        "diferente da foto", "não é como na foto", "nao e como na foto",
        "diferente do anúncio", "enganoso", "enganosa", "mentira",
        "não corresponde", "nao corresponde", "não é o que esperava",
        
        # Tamanho e medidas
        "menor que o esperado", "menor do que esperava", "pequeno demais",
        "maior que o esperado", "maior do que esperava", "grande demais",
        "não serve", "nao serve", "tamanho errado",
        
        # Funcionalidades
        "difícil de usar", "dificil de usar", "complicado", "complicada",
        "lento", "lenta", "demora", "travando", "travou", "trava",
        "aquecendo", "esquenta", "esquentando", "superaquecimento",
        "bateria ruim", "bateria péssima", "bateria pessima", "bateria fraca",
        "não carrega", "nao carrega", "não conecta", "nao conecta",
        
        # Emoções negativas
        "arrependido", "arrependida", "me arrependi", "arrependimento",
        "decepcionado", "decepcionada", "decepção", "decepcao",
        "frustrado", "frustrada", "frustração", "frustracao",
        "irritado", "irritada", "irritação", "irritacao",
        "chateado", "chateada", "chateação", "chateacao",
        
        # Comparações negativas
        "pior que", "pior do que", "não é bom como", "nao e bom como",
        "esperava mais", "esperava melhor",
        
        # Outras expressões
        "lixo", "porcaria", "perda de dinheiro", "dinheiro jogado fora",
        "não recomendo", "nao recomendo", "não indico", "nao indico",
        "fuja", "fujam", "cuidado", "atenção",
        "nota zero", "0/10", "zero estrelas", "0 estrelas",
        "devolvi", "vou devolver", "pedi reembolso", "quero reembolso",
    ]

    score = 0.5
    
    # Conta ocorrências de palavras/frases positivas
    positive_count = 0
    for w in positive_words:
        # Frases completas têm mais peso (0.15) que palavras simples (0.1)
        weight = 0.15 if len(w.split()) > 1 else 0.1
        count = text.count(w)
        if count > 0:
            positive_count += count
            score += weight * count
    
    # Conta ocorrências de palavras/frases negativas
    negative_count = 0
    for w in negative_words:
        # Frases completas têm mais peso (0.15) que palavras simples (0.1)
        weight = 0.15 if len(w.split()) > 1 else 0.1
        count = text.count(w)
        if count > 0:
            negative_count += count
            score -= weight * count
    
    # Normaliza o score entre 0.0 e 1.0
    score = max(0.0, min(1.0, score))

    if score > 0.6:
        label = "positive"
    elif score < 0.4:
        label = "negative"
    else:
        label = "neutral"

    return SentimentResponse(label=label, score=score)

