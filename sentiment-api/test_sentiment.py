"""
Script de teste para a API de análise de sentimento.
Execute este script para testar a integração com o Gemini.
"""

import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_health():
    """Testa o endpoint de health check"""
    print("🔍 Testando endpoint /health...")
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            print(f"✅ Health check OK: {response.json()}")
            return True
        else:
            print(f"❌ Health check falhou: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Erro: Não foi possível conectar a {API_URL}")
        print("   Certifique-se de que o servidor está rodando com: python -m uvicorn main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_sentiment(text, expected_label=None):
    """Testa o endpoint de análise de sentimento"""
    print(f"\n📝 Testando análise de sentimento...")
    print(f"   Texto: \"{text[:50]}{'...' if len(text) > 50 else ''}\"")
    
    try:
        response = requests.post(
            f"{API_URL}/sentiment",
            json={"text": text},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            label = result.get("label")
            score = result.get("score")
            
            print(f"   ✅ Análise concluída:")
            print(f"      Label: {label}")
            print(f"      Score: {score:.3f}")
            
            if expected_label and label != expected_label:
                print(f"   ⚠️  Label esperado era '{expected_label}', mas recebeu '{label}'")
            
            return True
        else:
            error_data = response.json() if response.content else {}
            print(f"   ❌ Erro {response.status_code}: {error_data.get('detail', 'Erro desconhecido')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Erro: Não foi possível conectar a {API_URL}")
        return False
    except Exception as e:
        print(f"   ❌ Erro inesperado: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 TESTE DA API DE ANÁLISE DE SENTIMENTO")
    print("=" * 60)
    
    # Teste 1: Health check
    if not test_health():
        sys.exit(1)
    
    # Teste 2: Review positiva
    test_sentiment(
        "Produto excelente! Superou minhas expectativas. Recomendo muito!",
        expected_label="positive"
    )
    
    # Teste 3: Review negativa
    test_sentiment(
        "Produto péssimo, veio quebrado e não funciona. Não recomendo.",
        expected_label="negative"
    )
    
    # Teste 4: Review neutra
    test_sentiment(
        "O produto chegou no prazo. Ainda não testei todas as funcionalidades.",
        expected_label="neutral"
    )
    
    # Teste 5: Review com ironia (desafio para o Gemini)
    test_sentiment(
        "Ótimo produto... se você gosta de coisas que quebram na primeira semana.",
        expected_label="negative"
    )
    
    # Teste 6: Review mista
    test_sentiment(
        "Gostei do produto, mas a entrega atrasou bastante. O atendimento foi bom.",
        expected_label="positive"
    )
    
    print("\n" + "=" * 60)
    print("✅ Testes concluídos!")
    print("=" * 60)

if __name__ == "__main__":
    main()

