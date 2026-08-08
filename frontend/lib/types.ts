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

export type MinhaAvaliacao = Avaliacao & {
  livro: Livro | null;
};

export type Usuario = {
  email: string;
  nome: string | null;
  idioma: string | null;
};

export const IDIOMAS_SUPORTADOS: Record<string, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
};

export type Traducao = {
  titulo: string | null;
  resumo: string | null;
  idioma: string;
};

export type ResultadoBuscaExterna = {
  external_id: string;
  titulo: string | null;
  autor: string | null;
  capa_url: string | null;
  ano_publicacao: number | null;
  isbn: string | null;
  resumo: string | null;
  livro_id: number | null;
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

export const NOMES_LISTA = ["Quero ler", "Lendo", "Lido"] as const;
export type NomeLista = (typeof NOMES_LISTA)[number];

export type MinhasListas = Record<NomeLista, Livro[]>;

export type Estatisticas = {
  total_lidos: number;
  total_avaliacoes: number;
  nota_media_dada: number;
  lidos_por_ano: Record<string, number>;
  distribuicao_notas: Record<string, number>;
  autores_mais_lidos: { autor: string; total: number }[];
};
