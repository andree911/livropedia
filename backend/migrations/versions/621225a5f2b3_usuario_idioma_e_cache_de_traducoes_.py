"""usuario.idioma e cache de traducoes (livro_traducao)

Revision ID: 621225a5f2b3
Revises: 1946b7b65291
Create Date: 2026-08-07 21:38:45.815005

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '621225a5f2b3'
down_revision = '1946b7b65291'
branch_labels = None
depends_on = None


def upgrade():
    # Nota: o autogenerate detectou de novo a diferenca cosmetica em
    # 'uq_livro_external_id' (index vs constraint) — mesmo artefato do
    # SQLite local descrito na migration anterior; nao existe no Postgres
    # de producao, entao foi removida daqui (ver 1946b7b65291).
    op.create_table('livro_traducao',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('livro_id', sa.Integer(), nullable=False),
    sa.Column('idioma', sa.String(length=5), nullable=False),
    sa.Column('titulo', sa.String(length=200), nullable=True),
    sa.Column('resumo', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['livro_id'], ['livro.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('livro_id', 'idioma', name='uq_livro_traducao')
    )

    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.add_column(sa.Column('idioma', sa.String(length=5), nullable=True))


def downgrade():
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.drop_column('idioma')

    op.drop_table('livro_traducao')
