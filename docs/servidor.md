# Servidor (Supabase)

Sem servidor, o que a empresa publica e os atrasos informados ficam só no navegador de quem usou. Com o Supabase, tudo fica num banco de dados na nuvem: vale para todos os passageiros e chega em tempo real.

O plano gratuito do Supabase é suficiente para o protótipo.

## O que fica no servidor

| Tabela | Conteúdo | Quem lê | Quem grava |
|---|---|---|---|
| `publicacoes` | Cada "Publicar no site" vira uma versão (linhas, horários, avisos, paradas, trajetos, tempos) | Todos | Só a equipe |
| `aovivo` | Atrasos e cancelamentos do dia | Todos | Só a equipe |
| `relatos` | "O ônibus passou agora" dos passageiros | Todos | Qualquer pessoa (com limites de valor) |
| `equipe` | E-mails autorizados a publicar | A própria equipe | Pelo painel do Supabase |

As regras de acesso (Row Level Security) estão em [`supabase/schema.sql`](../supabase/schema.sql). A chave usada no site é a **anon**, que é pública por definição: quem decide o que cada um pode fazer são essas regras.

## Configuração (uma vez, ~10 minutos)

1. **Criar o projeto.** Em [supabase.com](https://supabase.com), crie uma conta e um projeto novo. Na região, escolha **South America (São Paulo)**.
2. **Criar as tabelas.** No projeto, abra **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e clique em **Run**.
3. **Cadastrar a equipe.** Ainda no SQL Editor, rode (trocando pelo e-mail real):
   ```sql
   insert into public.equipe (email, nome) values ('seu.email@exemplo.com', 'Seu nome');
   ```
4. **Criar o login.** Em **Authentication → Users → Add user → Create new user**, crie o usuário com o mesmo e-mail e uma senha. Marque *Auto Confirm User*.
5. **Fechar cadastros públicos.** Em **Authentication → Sign In / Providers**, desligue *Allow new users to sign up*. Assim só a equipe tem conta.
6. **Ligar o site ao projeto.** Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**. Cole as duas em [`prototipo/desktop/config.js`](../prototipo/desktop/config.js):
   ```js
   window.SUPABASE = {
     url: 'https://xxxxxxxx.supabase.co',
     anonKey: 'eyJhbGciOi...'
   };
   ```
   > Nunca use a chave **service_role** no site. Ela ignora todas as regras de acesso.
7. **Publicar.** Faça commit e push. Depois, na **Área da empresa**, entre com o e-mail e a senha do passo 4 e clique em **Publicar no site** uma vez para gravar a primeira versão.

## Como saber se está funcionando

- No rodapé do site do passageiro aparece **"Conectado ao servidor"**. Se o servidor estiver fora do ar, aparece "Servidor indisponível, usando dados salvos", e o app continua funcionando com a última versão baixada.
- Em **Área da empresa → Publicação**, a situação mostra **"Conectado ao servidor (Supabase)"**.
- Teste o tempo real: abra o site no celular e a área da empresa no computador. Em **Tempo real**, dê +5 min numa viagem. O celular atualiza sozinho em segundos.

## Manutenção

- **Voltar a uma versão anterior:** toda publicação fica na tabela `publicacoes`. Para desfazer, copie o `conteudo` de uma versão antiga e insira como nova linha, ou use **Restaurar dados oficiais** no painel.
- **Limpeza:** relatos e informações ao vivo antigos podem ser apagados com `select public.limpar_antigos();` (ou agende com a extensão `pg_cron`).
- **Novos membros da equipe:** repita os passos 3 e 4.

## Limitações conhecidas

- **Relatos de passageiros não têm limite por pessoa.** Alguém pode enviar relatos falsos. Por isso eles aparecem como "relato de passageiro" (não como informação da empresa), e a equipe pode descartá-los na tela **Tempo real**. Numa versão de produção, vale exigir mais de um relato concordante ou limitar por aparelho.
- **Favoritos e avisos de chegada continuam no aparelho de cada passageiro.** É de propósito: não exige cadastro do passageiro.
