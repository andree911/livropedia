import sqlite3
import os

DB_PATH = os.path.join("instance", "livros.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    cursor.execute(
        "ALTER TABLE livro RENAME COLUMN apa_usuario_id TO capa_usuario_id;"
    )
    print("Coluna renomeada!")
except Exception as e:
    print(e)

conn.commit()
conn.close()