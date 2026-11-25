# Roteiro da apresentação (3 pessoas)

Tempo total: **12 min** (tolerância até 15), cerca de **4 min por pessoa**.
Todos falam, e cada um é "dono" de uma parte do código para responder perguntas.

**Antes de começar:** abra o site (link do GitHub Pages ou `index.html`) em tela
cheia (F11). Deixe "Animar" ligado; durante a explicação dá para pausar,
voltar passos e clicar na lista de passos.

---

## Pessoa 1 (Arthur Angelim): abertura + Rubro-Negra (~4 min)
**Arquivo que precisa dominar:** `js/rubro-negra.js`

1. **Abertura (30 s), aba Início.** Uma BST comum pode virar uma lista
   (inserir 1, 2, 3, 4… em ordem) e a busca cai para O(n). Árvores balanceadas
   garantem O(log n). Apresentar o problema da feira.
2. **As 5 propriedades** (painel Conceitos) e por que elas limitam a altura a 2·log₂(n+1).
3. **Inserção.** O nó novo nasce vermelho. Se o pai também é vermelho, olha o **tio**
   (casos 1, 2 e 3).
4. **Remoção.** Se sai um nó preto, sobra um "duplo preto"; olha o **irmão** (casos 1 a 4).
5. **Repetidos.** Contador no nó, sem nó novo e sem rebalancear.
6. **Demo (aba Rubro-Negra):**
   - Limpar → inserir `10 20 30 15 13`: o 30 dispara o Caso 3, o 15 o Caso 1 e o 13 o
     Caso 2 seguido do Caso 3 (os três casos da inserção).
   - Remover `30`: Caso 4 da remoção.
   - "Carregar 25 valores": 25 nós com altura 5; o 31 aparece ×2 (repetido).
   - Buscar `65`: o caminho aparece em azul.

## Pessoa 2 (Felipe Alho): 2-3-4 + comparação (~4 min)
**Arquivo que precisa dominar:** `js/arvore-234.js`

1. **Conceito.** Árvore não-binária: 2-nó, 3-nó e 4-nó; todas as folhas no mesmo nível.
2. **Inserção de cima para baixo.** Ao descer, todo 4-nó é **dividido** e a chave do meio
   sobe. A árvore cresce **pela raiz**.
3. **Remoção de cima para baixo.** Antes de descer para um filho com 1 chave, ele é
   reforçado por **empréstimo** ou **fusão**. Chave em nó interno é trocada pelo
   predecessor. Se a raiz esvazia, a altura diminui.
4. **Repetidos.** Balde (lista) de itens por chave.
5. **Demo (aba 2-3-4):**
   - Limpar → inserir `10 20 30 40`: a raiz se divide.
   - "Carregar 25 valores" → remover `38`: duas fusões e a raiz desce um nível.
   - Remover `3`: empréstimo.
6. **Ponto alto (aba RN × 2-3-4):** mostrar que nó preto + filhos vermelhos = um nó da
   2-3-4. Rotação e recoloração de um lado equivalem a divisão e fusão do outro.

## Pessoa 3 (Artur Lobato): k-D + aplicação + conclusão (~4 min)
**Arquivos que precisa dominar:** `js/arvore-kd.js`, `js/feira.js`

1. **k-D.** BST que alterna o eixo comparado a cada nível (x, y, x…). Cada nó corta o
   plano com uma reta: vertical se compara x, horizontal se compara y.
2. **Demo (aba k-D):** já abre com o exemplo de 7 pontos. Aperte ⏮ e ▶ para mostrar a
   construção pela mediana:
   - ordena por x: 2, 4, 5, 6, 7, 8, 9 → raiz **G (6, 8)**;
   - lado esquerdo por y → **B (5, 4)**; lado direito por y → **A (7, 2)**;
   - folhas: D, E, F, C.
3. **Balanceamento da k-D.** Não usa rotação (quebraria o rodízio de eixos). É balanceada
   pela **mediana** na construção; depois de muitas inserções, reconstrói.
4. **Ponto mais próximo:** "Bancas da feira" → clicar no meio do plano. A animação mostra
   as visitas, o círculo do melhor ponto e as **podas** em cinza.
5. **Aplicação (aba Feira):**
   - clicar no produto 412 e Cadastrar de novo: o estoque é somado (repetido);
   - filtrar R$ 8 a 12 (2-3-4);
   - clicar no mapa: banca mais próxima (k-D);
   - mostrar os dois índices desenhados embaixo.
6. **Conclusão (30 s).** Tabela da aba Início: recoloração e rotação × divisão e fusão ×
   mediana, e onde cada árvore é usada no mundo real.

---

## Checklist de entrega
- [ ] Criar o repositório no GitHub e subir os arquivos
- [ ] Cada integrante faz pelo menos um commit da sua parte
- [ ] Ativar o GitHub Pages e colocar o link no README
- [ ] Testar o site no computador da sala antes de apresentar
- [ ] Ensaiar cronometrando (meta: 11 a 12 min)
