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

## Paleta

| Token | Cor | Uso |
|---|---|---|
| Gradiente | `#002460 → #003580` | Topo, destaques, botão de "próxima saída" |
| Azul Fronteira | `#002460` | Cor principal, botões, códigos de linha |
| Azul médio | `#003580` | Links, traçado das rotas |
| Texto | `#1E293B` | Texto principal |
| Texto 2 | `#64748B` | Legendas e metadados |
| Fundo | `#F1F5F9` | Fundo das páginas |
| Verde | `#15803D` / `#DCFCE7` | Selo "Ativa", "agora", ônibus ao vivo |
| Âmbar | `#B45309` / `#FEF3C7` | Selo "Seletivo", avisos |

**Fonte:** Segoe UI (a mesma do site da empresa). No Figma foi usada Inter, que é visualmente próxima.
