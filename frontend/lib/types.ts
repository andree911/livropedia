export type Livro = {
  id: number;
  titulo: string;
  autor: string;
  resumo: string | null;
  capa_url: string | null;
  capa_usuario_id: number | null;
  fonte_externa: string | null;
  external_id: string | null;
  isbn: string | null;
  ano_publicacao: number | null;
  nota_media: number;
  total_avaliacoes: number;
};

export type Avaliacao = {
  id: number;
  livro_id: number;
  usuario_id: number;
  nota: number;
  resenha: string | null;
  criado_em: string;
};

export type Usuario = {
  email: string;
  nome: string | null;
};

export type ResultadoBuscaExterna = {
  external_id: string;
  titulo: string | null;
  autor: string | null;
  capa_url: string | null;
  ano_publicacao: number | null;
  isbn: string | null;
};

export type LivrosPaginados = {
  livros: Livro[];
  total: number;
  page: number;
  per_page: number;
};

export type AvaliacoesPaginadas = {
  avaliacoes: Avaliacao[];
  total: number;
  page: number;
  per_page: number;
};
