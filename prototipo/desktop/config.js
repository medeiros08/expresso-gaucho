// Conexão com o servidor (Supabase).
// Deixe em branco para usar o modo local (dados salvos só no navegador).
// Preencha com os dados do projeto em: Supabase → Project Settings → API.
// A chave "anon" é pública por definição: o acesso é controlado pelas regras do banco
// (supabase/schema.sql). NUNCA coloque aqui a chave "service_role".
window.SUPABASE = {
  url: '',      // ex.: 'https://abcdefghijkl.supabase.co'
  anonKey: ''   // ex.: 'eyJhbGciOi...'
};
