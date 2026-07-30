"""usuario.senha aceita null (login com Google)

Revision ID: 1946b7b65291
Revises: 13fb4208a7a8
Create Date: 2026-07-29 22:16:19.794355

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1946b7b65291'
down_revision = '13fb4208a7a8'
branch_labels = None
depends_on = None


def upgrade():
    # Nota: o autogenerate também detectou uma diferença cosmética em
    # 'uq_livro_external_id' (index vs constraint) que é só um artefato de
    # como o SQLite local foi reconciliado manualmente numa fase anterior;
    # não existe no Postgres de produção, então foi removida daqui.
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.alter_column('senha',
               existing_type=sa.VARCHAR(length=200),
               nullable=True)


def downgrade():
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.alter_column('senha',
               existing_type=sa.VARCHAR(length=200),
               nullable=False)
