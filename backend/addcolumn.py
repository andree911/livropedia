import sqlite3
import os

DB_PATH = os.path.join("instance", "livros.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE livro ADD COLUMN apa_usuario_id INTEGER;')
    print("Coluna adicionada com sucesso!")
except sqlite3.OperationalError as e:
    print("Não foi possível adicionar a coluna:", e)

conn.commit()
conn.close()