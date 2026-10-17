# 🚌 Expresso Gaúcho

> *Sua felicidade é o nosso movimento.*

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

## Protótipos

| Protótipo | O que é | Como abrir |
|---|---|---|
| **Desktop (executável)** | Sistema web completo e funcional, com os horários reais de 9 linhas | Abra [`prototipo/desktop/index.html`](prototipo/desktop/index.html) no navegador |
| **Mobile (Figma)** | 5 telas do app + guia visual | [Arquivo no Figma](https://www.figma.com/design/Q36nVNsu5dfWKfHz8hVXAo) · HTML em [`prototipo/mobile/telas.html`](prototipo/mobile/telas.html) |

### Rodando o protótipo desktop

Não precisa instalar nada. Basta abrir `prototipo/desktop/index.html` com dois cliques. O arquivo `dados.js` precisa estar na mesma pasta.

Se preferir um servidor local:

```bash
python -m http.server 8765 --directory prototipo/desktop
```

Depois acesse <http://localhost:8765>.

### Modo demonstração

Clique no **relógio** no canto superior direito para escolher dia e hora, acelerar o tempo (10× ou 60×) ou pausar. Assim a apresentação funciona em qualquer horário, inclusive com ônibus "andando" no mapa.

### O que é real e o que é simulado

| Item | Situação |
|---|---|
| Horários e paradas | ✅ **Reais**, da tabela oficial publicada pela Fronteira (9 linhas, dias úteis e sábado) |
| Lista das 19 linhas | ✅ **Real** |
| Linhas sem tabela publicada (Seletivo Passo Novo, C1/C2, linhas de domingo, Especial) | ⚠️ Aparecem como "horários sob consulta" |
| Posição do ônibus no mapa | 🔶 **Simulada** a partir da tabela (sem GPS) |
| Mapa | 🔶 Esquemático (desenho do trajeto, não o mapa real da cidade) |
| Siglas das linhas (IP, VS…) | 🔶 Criadas pela equipe |

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
- [ ] Painel administrativo para a empresa cadastrar linhas e editar horários
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
    │   ├── index.html               # Sistema web executável
    │   └── dados.js                 # Linhas e horários oficiais
    └── mobile/
        └── telas.html               # Telas do app (origem do Figma)
```

## Equipe

| Integrante | Parte no projeto |
|---|---|
| Arthur de Freitas Medeiros | Protótipos (Figma, sistema desktop) |
| _Nome do colega_ | Análise 360° |
| _Nome do colega_ | Marketing |

## Fonte dos dados

Horários e linhas extraídos do site oficial da Fronteira Transportes ([expressofronteiradoeste.com.br](https://expressofronteiradoeste.com.br/#/linhas)). A identidade visual usada no protótipo pertence à Fronteira Transportes e aparece aqui apenas como proposta de parceria acadêmica.
