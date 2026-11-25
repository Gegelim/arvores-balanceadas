# Árvores Balanceadas: Rubro-Negra, 2-3-4 e k-D

Site didático que implementa, **do zero e sem bibliotecas de árvores**, as
árvores **Rubro-Negra** e **2-3-4** (inserção com balanceamento, remoção com
balanceamento e busca), demonstra a **árvore k-D** e usa as três numa aplicação
prática: o **estoque de uma feira livre**.

> Equipe: Arthur Angelim, Felipe Alho e Artur Lobato · Turma CC4MA
>
> Site publicado: `https://gegelim.github.io/arvores-balanceadas/` (veja abaixo como publicar)

---

## Como executar

O projeto é só HTML, CSS e JavaScript puro. **Não precisa instalar nada.**

**Opção 1: abrir direto no navegador**
1. Baixe o repositório (botão verde **Code → Download ZIP**) e extraia.
2. Dê dois cliques em `index.html`. Ele abre no Chrome, Edge ou Firefox.

**Opção 2: pelo terminal**
```bash
git clone https://github.com/gegelim/arvores-balanceadas.git
cd arvores-balanceadas
# abra o index.html no navegador, ou sirva a pasta:
python -m http.server 8000      # depois acesse http://localhost:8000
```

**Opção 3: GitHub Pages (link público para a apresentação)**
1. No repositório, vá em **Settings → Pages**.
2. Em *Source*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e salve.
3. Em 1 ou 2 minutos o site fica em `https://gegelim.github.io/arvores-balanceadas/`.

**Testes automáticos** (opcional, precisa do [Node.js](https://nodejs.org)):
```bash
node testes/testes.js
```
Faz 4000 operações aleatórias em cada árvore e, depois de **cada** operação,
confere todas as propriedades (cores, altura negra, folhas no mesmo nível,
ordem, ponteiros de pai) e compara o conteúdo com um gabarito. Na k-D, compara
o ponto mais próximo e a busca por região com a força bruta.

---

## O que tem no site

| Aba | O que mostra |
|---|---|
| **Início** | Visão geral, tabela comparando os balanceamentos e a regra de repetidos. |
| **Rubro-Negra** | Inserir, remover e buscar. Cada recoloração e rotação vira um passo animado: os nós deslizam até a nova posição e o caso aplicado (Caso 1, 2, 3...) acende no painel de conceitos. Controles ⏮ ◀ ▶ ⏭, velocidade e lista de passos clicável. |
| **2-3-4** | O mesmo, mostrando cada divisão, empréstimo e fusão. |
| **RN × 2-3-4** | As mesmas chaves nas duas árvores, uma sobre a outra. |
| **k-D** | Construção pela mediana passo a passo. Clique no plano para buscar o ponto mais próximo (com as podas em cinza) ou para inserir pontos. |
| **Feira (aplicação)** | Cadastro, venda e remoção por código, filtro por faixa de preço, mapa clicável com a banca mais próxima e os dois índices desenhados. |

---

## Estrutura do projeto

```
index.html          Página (todas as abas)
css/estilo.css      Visual, tema claro e escuro, layout para celular
js/rubro-negra.js   Árvore Rubro-Negra (nós com pai/esq/dir + sentinela NIL)
js/arvore-234.js    Árvore 2-3-4 (nós com lista de chaves, lista de filhos e pai)
js/arvore-kd.js     Árvore k-D 2-D (construção pela mediana, ponto mais próximo)
js/feira.js         Aplicação prática: estoque da feira
js/desenho.js       Desenho das árvores em SVG e interpolação da animação
js/interface.js     Botões, abas, reprodutor de passos
testes/testes.js    Testes automáticos (Node.js)
```

**Representação dos nós (regra do trabalho):** todas as árvores usam nós
ligados por referências, com ponteiro para o **pai** e para os **filhos**
(encadeamento nos dois sentidos, como numa lista duplamente encadeada).
Nenhuma estrutura de árvore pronta é usada. Estruturas auxiliares do
JavaScript: `Array` (chaves e filhos dentro do nó 2-3-4, "baldes" de
repetidos, pilha do percurso em ordem) e `Map`/`Set` (apenas na interface e
nos testes).

**Visualização:** o desenho é feito em SVG pelo próprio código (`desenho.js`).
Cada vez que a árvore executa um passo do balanceamento, ela chama
`aoPasso(...)`; a interface guarda uma "foto" da árvore naquele instante, e o
reprodutor mostra as fotos em sequência, interpolando as posições.

---

## Política para elementos repetidos

| Árvore | Método | Inserir repetido | Remover repetido |
|---|---|---|---|
| **Rubro-Negra** | **Contador no nó** (chaves únicas). Na feira, a quantidade em estoque é somada. | Não cria nó, não rebalanceia: `contador + 1` | `contador − 1`; o nó só sai (com rebalanceamento) quando chega a 0. `remover(chave, true)` remove direto. |
| **2-3-4** | **Balde (lista) por chave**. Na feira, a chave é o preço e o balde guarda os códigos com aquele preço. | O item entra no balde, sem divisões | Tira o item do balde; a chave só sai quando o balde esvazia. |
| **k-D** | **Maior ou igual vai para a direita** | Vira outro nó na subárvore direita | — |

---

## Resumo dos balanceamentos

| | Rubro-Negra | 2-3-4 | k-D |
|---|---|---|---|
| Tipo | Binária | Não-binária (1 a 3 chaves por nó) | Binária, multidimensional |
| Garantia | Altura ≤ 2·log₂(n+1) | Todas as folhas no mesmo nível | Balanceada na construção |
| Ferramentas | **Recolorir** e **rotacionar** | **Dividir**, **emprestar**, **fundir** | **Mediana** (sem rotação) |
| Cresce e encolhe | Pelas folhas | Pela **raiz** | Pelas folhas |
| Busca / inserção / remoção | O(log n) | O(log n) | O(log n) em média |

**Relação entre elas:** uma Rubro-Negra é uma 2-3-4 desenhada como árvore
binária. Cada nó PRETO junto com seus filhos VERMELHOS forma um nó da 2-3-4
(veja a aba **RN × 2-3-4**).

---

## Aplicação prática: estoque da feira

| Pergunta | Estrutura | Operação |
|---|---|---|
| "Cadastrar, vender ou remover o produto #412" | Rubro-Negra por **código** | inserção, remoção, busca |
| "O que tem entre R$ 8 e R$ 12?" | 2-3-4 por **preço** | busca por intervalo (pula subárvores fora da faixa) |
| "Qual banca está mais perto de mim?" | k-D com a **posição (x, y)** das bancas | ponto mais próximo, com podas |
