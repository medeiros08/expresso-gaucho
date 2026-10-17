# 🚌 Expresso Gaúcho

> *Sua felicidade é o nosso movimento.*

**▶️ Site do passageiro: <https://medeiros08.github.io/expresso-gaucho/>**

**🔒 Área da empresa: <https://medeiros08.github.io/expresso-gaucho/prototipo/admin/>**

Software de **linhas, horários e acompanhamento de ônibus em tempo real** para o transporte público de Alegrete/RS, desenvolvido como projeto da disciplina **Inovação e Criatividade** (Unipampa) em proposta de parceria com a **Fronteira Transportes**.

## O problema

Quem chega em Alegrete (estudantes da Unipampa e do IFFar, novos moradores) não sabe quais linhas passam perto, em que parada esperar nem a que horas o ônibus vem. Os horários existem, mas ficam espalhados em tabelas difíceis de ler no celular, e não há como saber onde o ônibus está agora.

## A solução

Uma única tela que reúne:

- **Linhas e horários oficiais**, organizados por parada, sentido e dia da semana
- **Próximo ônibus** com contagem regressiva na parada do passageiro
- **Como chegar**: linhas diretas entre duas paradas, com saída, chegada e duração
- **Mapa ao vivo** com a posição dos ônibus no trajeto
- **Favoritos e alertas** ("me avise 5 min antes do ônibus passar na Unipampa")

E uma **área da empresa** para a Fronteira manter tudo atualizado sem depender de programador.

## Protótipos

| Protótipo | O que é | Como abrir |
|---|---|---|
| **Desktop (executável)** | Sistema web completo e funcional, com os horários reais de 9 linhas | [Online](https://medeiros08.github.io/expresso-gaucho/) ou abra [`prototipo/desktop/index.html`](prototipo/desktop/index.html) no navegador |
| **Área da empresa** | Painel para cadastrar linhas, editar horários, publicar avisos e fazer backup | [Online](https://medeiros08.github.io/expresso-gaucho/prototipo/admin/) ou abra [`prototipo/admin/index.html`](prototipo/admin/index.html) |
| **Mobile (Figma)** | 5 telas do app + guia visual | [Arquivo no Figma](https://www.figma.com/design/Q36nVNsu5dfWKfHz8hVXAo) · HTML em [`prototipo/mobile/telas.html`](prototipo/mobile/telas.html) |

### Rodando localmente

Não precisa instalar nada. Basta abrir `prototipo/desktop/index.html` (site do passageiro) ou `prototipo/admin/index.html` (área da empresa) com dois cliques. Mantenha a pasta `prototipo/` inteira, porque as duas partes usam `desktop/dados.js` e `desktop/db.js`.

Se preferir um servidor local:

```bash
python -m http.server 8766 --directory prototipo
```

Depois acesse <http://localhost:8766/desktop/> e <http://localhost:8766/admin/>.

### Modo demonstração

Clique no **relógio** no canto superior direito para escolher dia e hora, acelerar o tempo (10× ou 60×) ou pausar. Assim a apresentação funciona em qualquer horário, inclusive com ônibus "andando" no mapa.

## Área da empresa

Painel onde a Fronteira mantém o sistema atualizado. **Acesso de demonstração:** qualquer e-mail e senha entram.

| Tela | O que faz |
|---|---|
| **Painel** | Linhas ativas, viagens por dia, gráfico de saídas por hora, pendências (linhas sem horário e horários com erro) e atividade recente |
| **Linhas** | Cadastrar, editar, excluir e suspender/reativar linhas, com pré-visualização de como aparece no site |
| **Horários** | Editor em planilha: tabelas por dias da semana, sentidos, paradas e viagens. Aceita `7:15`, `715` ou `7.15`, navegação por setas, **colar direto do Excel**, **deslocar horários** (+/- minutos) e **criar o sentido de volta** com as paradas invertidas |
| **Avisos** | Avisos para os passageiros (alerta ou informativo), gerais ou ligados a linhas específicas |
| **Publicação** | Publicar ou descartar alterações, histórico de quem publicou o quê, backup/importação em JSON, exportação em planilha (.csv) e geração de um novo `dados.js` |

**Como funciona:** as edições ficam em rascunho até a empresa clicar em **Publicar no site**. Antes de publicar, o painel confere todos os horários e bloqueia a publicação se algum estiver inválido ou fora de ordem (por exemplo, chegar numa parada antes de passar pela anterior). Ao publicar, o site do passageiro é atualizado na hora, inclusive em outra aba aberta.

> ⚠️ Neste protótipo os dados publicados ficam salvos **no navegador** de quem usou o painel. Na versão final, o login e os dados ficarão em um servidor e valerão para todos os passageiros.

### O que é real e o que é simulado

| Item | Situação |
|---|---|
| Horários e paradas | ✅ **Reais**, da tabela oficial publicada pela Fronteira (9 linhas, dias úteis e sábado) |
| Lista das 19 linhas | ✅ **Real** |
| Linhas sem tabela publicada (Seletivo Passo Novo, C1/C2, linhas de domingo, Especial) | ⚠️ Aparecem como "horários sob consulta" |
| Posição do ônibus no mapa | 🔶 **Simulada** a partir da tabela (sem GPS) |
| Mapa | 🔶 Esquemático (desenho do trajeto, não o mapa real da cidade) |
| Siglas das linhas (IP, VS…) | 🔶 Criadas pela equipe |
| Login e publicação da área da empresa | 🔶 Demonstração: sem servidor, dados salvos no navegador |

## Modelo de negócio

Resumo da [Análise 360°](docs/analise-360.md):

- **B2B / B2G:** licenciamento e manutenção do software para a empresa concessionária ou para a prefeitura
- **B2C:** anúncios de comércios locais próximos às paradas
- **Expansão:** começa em Alegrete, com arquitetura replicável para outras cidades de médio porte

## Marketing

Resumo do [plano de marketing](docs/marketing.md):

- Plaquinhas e adesivos com horários nas paradas e dentro dos ônibus
- Comunidade no WhatsApp, Facebook e Instagram mostrando o protótipo
- Slogan: *"Expresso Gaúcho: sua felicidade é o nosso movimento"*

## Próximos passos

- [ ] Integrar GPS real dos ônibus (rastreadores da frota ou app do motorista)
- [ ] Usar o mapa real da cidade com as coordenadas das paradas
- [x] Painel administrativo para a empresa cadastrar linhas e editar horários
- [ ] Servidor com banco de dados e login real para a área da empresa
- [ ] Horários das linhas que ainda não têm tabela publicada
- [ ] QR Code nas placas das paradas abrindo a tela daquela parada
- [ ] Alertas pelo WhatsApp
- [ ] Espaço para anúncios de comércios locais (monetização B2C)
- [ ] App nativo Android/iOS

## Estrutura do repositório

```
expresso-gaucho/
├── README.md
├── docs/
│   ├── analise-360.md               # Análise 360° (parte da equipe)
│   ├── marketing.md                 # Plano de marketing (parte da equipe)
│   ├── design.md                    # Identidade visual, paleta e link do Figma
│   └── analise-360-e-marketing.pdf  # Documento original
└── prototipo/
    ├── desktop/
    │   ├── index.html               # Site do passageiro
    │   ├── dados.js                 # Linhas e horários oficiais
    │   └── db.js                    # Dados compartilhados (oficiais + publicados pela empresa)
    ├── admin/
    │   └── index.html               # Área da empresa
    └── mobile/
        └── telas.html               # Telas do app (origem do Figma)
```

## Equipe

| Integrante | Parte no projeto |
|---|---|
| Arthur de Freitas Medeiros | Protótipos (Figma, site do passageiro, área da empresa) |
| _Nome do colega_ | Análise 360° |
| _Nome do colega_ | Marketing |

## Fonte dos dados

Horários e linhas extraídos do site oficial da Fronteira Transportes ([expressofronteiradoeste.com.br](https://expressofronteiradoeste.com.br/#/linhas)). A identidade visual usada no protótipo pertence à Fronteira Transportes e aparece aqui apenas como proposta de parceria acadêmica.
