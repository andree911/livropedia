import os
import anthropic

# So entra quando a busca no Google Books nao retornou nada - tenta
# interpretar um termo mal formatado/incompleto/em outro idioma e devolver
# uma query melhor pra tentar de novo. Nunca gera dado de livro (resumo,
# nota, capa) - isso continua vindo so de fontes reais (Google Books /
# Open Library).
_MODELO = "claude-opus-5"


def normalizar_busca_com_ia(termo_bruto):
    chave = os.getenv("ANTHROPIC_API_KEY")
    if not chave:
        return None

    try:
        client = anthropic.Anthropic(api_key=chave)
        resposta = client.messages.create(
            model=_MODELO,
            max_tokens=60,
            thinking={"type": "disabled"},
            output_config={"effort": "low"},
            messages=[{
                "role": "user",
                "content": (
                    "Alguem digitou isto numa busca de livros, e pode estar com "
                    "erro de grafia, incompleto ou em outro idioma:\n"
                    f"\"{termo_bruto}\"\n\n"
                    "Responda APENAS com uma query de busca melhor pra encontrar "
                    "esse livro numa API de livros (titulo e autor, se souber, em "
                    "ingles). Se nao tiver nenhuma ideia confiavel de que livro e, "
                    "responda exatamente com o termo original, sem alteracoes. "
                    "Nao inclua explicacoes, aspas ou tags XML/internas na resposta."
                ),
            }],
        )
    except Exception:
        # Best-effort: qualquer falha (rede, chave invalida, rate limit)
        # so significa "sem normalizacao" - a busca crua ja foi tentada e
        # nao deu em nada, entao aqui so ha upside, nunca deve derrubar a
        # busca inteira.
        return None

    if resposta.stop_reason == "refusal":
        return None

    texto = "".join(
        bloco.text for bloco in resposta.content if bloco.type == "text"
    ).strip()

    return texto or None
