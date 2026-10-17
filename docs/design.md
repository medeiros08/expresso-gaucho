# Design e identidade visual

O protótipo usa a identidade visual da **Fronteira Transportes** (empresa parceira), extraída do site oficial [expressofronteiradoeste.com.br](https://expressofronteiradoeste.com.br/#/linhas). A ideia é que o Expresso Gaúcho funcione como *white-label*: o software é nosso, a marca exibida é a da empresa de ônibus.

## Figma

Arquivo com as telas mobile e o guia visual:
<https://www.figma.com/design/Q36nVNsu5dfWKfHz8hVXAo>

| Frame | Conteúdo |
|---|---|
| 0 · Guia Visual | Cores, tipografia, componentes e fluxo do passageiro |
| 1 · Início | Cidade, busca, atalhos, avisos e próximos ônibus |
| 2 · Linhas | Filtros Todas / Urbanas / Seletivo e cards das linhas |
| 3 · Horários | Sentido, dia, próxima saída, grade de horários e itinerário |
| 4 · Mapa ao vivo | Ônibus no trajeto e previsão de chegada |
| 5 · Favoritos | Linhas salvas e alertas |

O HTML de origem dessas telas está em [`prototipo/mobile/telas.html`](../prototipo/mobile/telas.html).

## Sistema visual do site (outubro/2026)

O site foi redesenhado para parecer um **quadro de horários de transporte público** e não um template genérico. Princípios:

- **Uma cor de destaque só:** o azul da Fronteira (`#002460`), usado sólido, sem gradientes.
- **Fundo claro neutro** (`#F4F3EF`) em vez de cinza-azulado, com painéis brancos de borda fina e sem sombras.
- **Verde e âmbar apenas com função:** verde = "agora / em operação / ônibus ao vivo"; âmbar = aviso ou linha suspensa.
- **Horários em fonte monoespaçada,** alinhados como num painel de rodoviária (`06:15`).
- **Sem emojis, exclamações ou textos de enfeite** ("Bom dia! Para onde vamos hoje?").
- **A tela inicial é o quadro de saídas da sua parada:** a informação mais usada aparece primeiro.

| Token | Cor | Uso |
|---|---|---|
| Azul Fronteira | `#002460` | Topo, botões, códigos das linhas, horário em destaque |
| Fundo | `#F4F3EF` | Fundo das páginas |
| Painel | `#FFFFFF` / borda `#E3E1DA` | Blocos de conteúdo |
| Texto | `#1D1D1B` / `#5F5E58` | Texto principal e secundário |
| Verde | `#1D7A45` | Agora, em operação, ônibus no mapa |
| Âmbar | `#8F5300` / `#FAEFD7` | Avisos e linhas suspensas |

**Fontes:** [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next) (texto) e Atkinson Hyperlegible Mono (horários e códigos das linhas). A família foi criada pelo Braille Institute para máxima legibilidade, o que ajuda passageiros com baixa visão e idosos. Sem internet, o app usa as fontes guardadas pelo service worker.

No Figma, a página **"v2 · Redesign (atual)"** tem o guia visual e 6 telas do celular nesse sistema: Saídas, Linhas, Horários da linha, Como chegar, Mapa e Favoritos. O HTML de origem está em [`prototipo/mobile/telas-v2.html`](../prototipo/mobile/telas-v2.html). As telas antigas, com gradiente, ficaram preservadas na página **"v1 · Primeira versão (antiga)"**.
