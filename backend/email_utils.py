import smtplib
import ssl
from email.mime.text import MIMEText
from flask import current_app


def enviar_email(destinatario, assunto, corpo):
    remetente = current_app.config["SMTP_USER"]
    senha = current_app.config["SMTP_PASSWORD"]

    if not remetente or not senha:
        print(f"[email] SMTP não configurado, pulei o envio pra {destinatario}: {assunto}")
        return False

    mensagem = MIMEText(corpo)
    mensagem["Subject"] = assunto
    mensagem["From"] = remetente
    mensagem["To"] = destinatario

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context()) as servidor:
            servidor.login(remetente, senha)
            servidor.sendmail(remetente, destinatario, mensagem.as_string())
        return True
    except smtplib.SMTPException as e:
        print(f"[email] Falha ao enviar pra {destinatario}: {e}")
        return False
