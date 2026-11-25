/*
 * ÁRVORE RUBRO-NEGRA (Red-Black Tree) — implementada do zero, com nós encadeados.
 *
 * Cada nó aponta para o PAI, o filho ESQUERDO e o filho DIREITO (encadeamento
 * nos dois sentidos, como numa lista duplamente encadeada). Todas as folhas
 * vazias apontam para um único nó sentinela NIL, que é sempre PRETO.
 *
 * Propriedades mantidas depois de TODA inserção e remoção:
 *   1. Todo nó é VERMELHO ou PRETO.
 *   2. A raiz é PRETA.
 *   3. Toda folha (NIL) é PRETA.
 *   4. Um nó VERMELHO nunca tem filho VERMELHO.
 *   5. Todo caminho de um nó até as folhas abaixo dele tem o mesmo número de
 *      nós PRETOS (a "altura negra").
 * Consequência: altura <= 2·log2(n+1), então busca, inserção e remoção são O(log n).
 *
 * POLÍTICA DE ELEMENTOS REPETIDOS (definida pela equipe):
 *   - Não existem dois nós com a mesma chave.
 *   - Inserir uma chave que já existe NÃO cria nó e NÃO rebalanceia: o campo
 *     `contador` do nó aumenta e, se a árvore recebeu uma função `mesclar`,
 *     o valor antigo é combinado com o novo (na feira: soma o estoque).
 *   - remover(chave) diminui o contador; o nó só sai da árvore (com
 *     rebalanceamento) quando o contador chega a zero.
 *     remover(chave, true) remove o nó de uma vez.
 *
 * Remoção de nó com dois filhos: usa o SUCESSOR em ordem (menor da subárvore direita).
 */

const VERMELHO = "VERMELHO";
const PRETO = "PRETO";

class NoRN {
  constructor(chave, valor, cor, nil) {
    this.chave = chave;
    this.valor = valor;
    this.cor = cor;
    this.esq = nil;
    this.dir = nil;
    this.pai = nil;
    this.contador = 1;
  }
}

class ArvoreRubroNegra {
  constructor({ mesclar = null, aoPasso = null } = {}) {
    this.NIL = new NoRN(null, null, PRETO, null);
    this.NIL.esq = this.NIL.dir = this.NIL.pai = this.NIL;
    this.raiz = this.NIL;
    this.tamanho = 0;          // número de nós (chaves distintas)
    this.mesclar = mesclar;    // função(valorAntigo, valorNovo) -> valor
    this.aoPasso = aoPasso;    // função(arvore, texto, destaque) usada pela animação
    this.passos = [];          // descrição de cada passo da última operação
    this.rotacoes = 0;
    this.recoloracoes = 0;
  }

  // ------------------------------------------------------------- utilitários
  registrar(texto, destaque = []) {
    this.passos.push(texto);
    if (this.aoPasso) this.aoPasso(this, texto, destaque);
  }

  contem(chave) {
    return this.localizar(chave) !== null;
  }

  localizar(chave, comLog = false) {
    let atual = this.raiz;
    while (atual !== this.NIL) {
      if (chave === atual.chave) {
        if (comLog) this.passos.push(`${chave} = ${atual.chave}: ENCONTRADO`);
        return atual;
      }
      if (chave < atual.chave) {
        if (comLog) this.passos.push(`${chave} < ${atual.chave}: desce para a esquerda`);
        atual = atual.esq;
      } else {
        if (comLog) this.passos.push(`${chave} > ${atual.chave}: desce para a direita`);
        atual = atual.dir;
      }
    }
    if (comLog) this.passos.push("Chegou numa folha vazia (NIL): chave NÃO encontrada");
    return null;
  }

  minimo(no) {
    while (no.esq !== this.NIL) no = no.esq;
    return no;
  }

  // ------------------------------------------------------------------ busca
  /** Retorna o nó com a chave, ou null. O caminho percorrido fica em this.passos. */
  buscar(chave) {
    this.passos = [];
    return this.localizar(chave, true);
  }

  // --------------------------------------------------------------- rotações
  //        x                 y
  //       / \               / \
  //      a   y     ->      x   c
  //         / \           / \
  //        b   c         a   b
  rotacionarEsquerda(x, motivo) {
    const y = x.dir;
    x.dir = y.esq;
    if (y.esq !== this.NIL) y.esq.pai = x;
    y.pai = x.pai;
    if (x.pai === this.NIL) this.raiz = y;
    else if (x === x.pai.esq) x.pai.esq = y;
    else x.pai.dir = y;
    y.esq = x;
    x.pai = y;
    this.rotacoes++;
    this.registrar(`${motivo} → rotação à ESQUERDA em ${x.chave}`, [x.chave, y.chave]);
  }

  rotacionarDireita(x, motivo) {
    const y = x.esq;
    x.esq = y.dir;
    if (y.dir !== this.NIL) y.dir.pai = x;
    y.pai = x.pai;
    if (x.pai === this.NIL) this.raiz = y;
    else if (x === x.pai.dir) x.pai.dir = y;
    else x.pai.esq = y;
    y.dir = x;
    x.pai = y;
    this.rotacoes++;
    this.registrar(`${motivo} → rotação à DIREITA em ${x.chave}`, [x.chave, y.chave]);
  }

  // --------------------------------------------------------------- inserção
  inserir(chave, valor = null) {
    this.passos = [];
    let pai = this.NIL;
    let atual = this.raiz;
    while (atual !== this.NIL) {            // descida igual à de uma BST comum
      pai = atual;
      if (chave === atual.chave) {          // elemento repetido
        atual.contador++;
        if (this.mesclar) atual.valor = this.mesclar(atual.valor, valor);
        this.registrar(`Chave ${chave} REPETIDA: nenhum nó novo, contador = ${atual.contador} ` +
                       `(sem rebalanceamento)`, [chave]);
        return atual;
      }
      atual = chave < atual.chave ? atual.esq : atual.dir;
    }

    const novo = new NoRN(chave, valor, VERMELHO, this.NIL);   // todo nó novo nasce VERMELHO
    novo.pai = pai;
    if (pai === this.NIL) this.raiz = novo;
    else if (chave < pai.chave) pai.esq = novo;
    else pai.dir = novo;
    this.tamanho++;
    const onde = pai !== this.NIL ? `como filho de ${pai.chave}` : "como raiz";
    this.registrar(`Inseriu ${chave} (VERMELHO) ${onde}`, [chave]);
    this.corrigirInsercao(novo);
    return novo;
  }

  corrigirInsercao(z) {
    // Só existe violação se o pai de z também for vermelho (propriedade 4).
    while (z.pai.cor === VERMELHO) {
      const avo = z.pai.pai;
      if (z.pai === avo.esq) {
        const tio = avo.dir;
        if (tio.cor === VERMELHO) {
          // CASO 1: tio vermelho -> só recolore e sobe o problema para o avô.
          z.pai.cor = PRETO;
          tio.cor = PRETO;
          avo.cor = VERMELHO;
          this.recoloracoes += 3;
          this.registrar(`Caso 1 (tio ${tio.chave} VERMELHO): pai ${z.pai.chave} e tio ficam PRETOS, ` +
                         `avô ${avo.chave} fica VERMELHO`, [z.pai.chave, tio.chave, avo.chave]);
          z = avo;
        } else {
          if (z === z.pai.dir) {
            // CASO 2: "triângulo" -> rotaciona o pai para virar "linha".
            z = z.pai;
            this.rotacionarEsquerda(z, "Caso 2 (tio PRETO, triângulo)");
          }
          // CASO 3: "linha" -> recolore e rotaciona o avô.
          z.pai.cor = PRETO;
          avo.cor = VERMELHO;
          this.recoloracoes += 2;
          this.rotacionarDireita(avo, `Caso 3 (tio PRETO, linha): ${z.pai.chave} fica PRETO, ` +
                                      `${avo.chave} fica VERMELHO`);
        }
      } else {                                 // espelho: o pai é filho direito do avô
        const tio = avo.esq;
        if (tio.cor === VERMELHO) {
          z.pai.cor = PRETO;
          tio.cor = PRETO;
          avo.cor = VERMELHO;
          this.recoloracoes += 3;
          this.registrar(`Caso 1 (tio ${tio.chave} VERMELHO): pai ${z.pai.chave} e tio ficam PRETOS, ` +
                         `avô ${avo.chave} fica VERMELHO`, [z.pai.chave, tio.chave, avo.chave]);
          z = avo;
        } else {
          if (z === z.pai.esq) {
            z = z.pai;
            this.rotacionarDireita(z, "Caso 2 (tio PRETO, triângulo)");
          }
          z.pai.cor = PRETO;
          avo.cor = VERMELHO;
          this.recoloracoes += 2;
          this.rotacionarEsquerda(avo, `Caso 3 (tio PRETO, linha): ${z.pai.chave} fica PRETO, ` +
                                       `${avo.chave} fica VERMELHO`);
        }
      }
    }
    if (this.raiz.cor === VERMELHO) {
      this.raiz.cor = PRETO;
      this.recoloracoes++;
      this.registrar(`Raiz ${this.raiz.chave} recolorida para PRETO (propriedade 2)`, [this.raiz.chave]);
    }
  }

  // ---------------------------------------------------------------- remoção
  remover(chave, todas = false) {
    this.passos = [];
    const z = this.localizar(chave);
    if (z === null) {
      this.registrar(`Chave ${chave} não existe: nada a remover`);
      return false;
    }
    if (z.contador > 1 && !todas) {
      z.contador--;
      this.registrar(`Chave ${chave} tinha repetições: contador = ${z.contador} ` +
                     `(o nó continua, sem rebalanceamento)`, [chave]);
      return true;
    }
    this.removerNo(z);
    this.tamanho--;
    return true;
  }

  /** Coloca a subárvore v no lugar da subárvore u. */
  transplantar(u, v) {
    if (u.pai === this.NIL) this.raiz = v;
    else if (u === u.pai.esq) u.pai.esq = v;
    else u.pai.dir = v;
    v.pai = u.pai;
  }

  removerNo(z) {
    let y = z;
    let corRemovida = y.cor;
    let x;
    let texto;
    if (z.esq === this.NIL) {
      x = z.dir;
      this.transplantar(z, z.dir);
      texto = `Removeu ${z.chave} (tinha no máximo o filho direito)`;
    } else if (z.dir === this.NIL) {
      x = z.esq;
      this.transplantar(z, z.esq);
      texto = `Removeu ${z.chave} (tinha só o filho esquerdo)`;
    } else {
      y = this.minimo(z.dir);                 // sucessor em ordem
      corRemovida = y.cor;
      x = y.dir;
      if (y.pai === z) {
        x.pai = y;
      } else {
        this.transplantar(y, y.dir);
        y.dir = z.dir;
        y.dir.pai = y;
      }
      this.transplantar(z, y);
      y.esq = z.esq;
      y.esq.pai = y;
      y.cor = z.cor;
      texto = `Removeu ${z.chave} (dois filhos): o sucessor ${y.chave} ocupa o lugar e herda a cor ${y.cor}`;
    }
    const quem = y !== z ? "cor original do sucessor" : "cor do nó removido";
    texto += corRemovida === PRETO
      ? ` | ${quem}: PRETO → a altura negra quebrou, corrigindo`
      : ` | ${quem}: VERMELHO → nenhuma propriedade violada`;
    this.registrar(texto, y !== z ? [y.chave] : []);
    if (corRemovida === PRETO) this.corrigirRemocao(x);
  }

  corrigirRemocao(x) {
    // x carrega um "preto extra" (duplo preto) até o problema ser resolvido.
    while (x !== this.raiz && x.cor === PRETO) {
      if (x === x.pai.esq) {
        let w = x.pai.dir;                       // irmão
        if (w.cor === VERMELHO) {
          // CASO 1: irmão vermelho -> transforma em irmão preto.
          w.cor = PRETO;
          x.pai.cor = VERMELHO;
          this.recoloracoes += 2;
          this.rotacionarEsquerda(x.pai, `Caso 1 (irmão ${w.chave} VERMELHO): irmão fica PRETO, pai fica VERMELHO`);
          w = x.pai.dir;
        }
        if (w.esq.cor === PRETO && w.dir.cor === PRETO) {
          // CASO 2: irmão preto com filhos pretos -> recolore e sobe o problema.
          w.cor = VERMELHO;
          this.recoloracoes++;
          this.registrar(`Caso 2 (irmão ${w.chave} PRETO, sobrinhos PRETOS): irmão fica VERMELHO, ` +
                         `o duplo preto sobe para ${x.pai.chave}`, [w.chave, x.pai.chave]);
          x = x.pai;
        } else {
          if (w.dir.cor === PRETO) {
            // CASO 3: sobrinho "de dentro" vermelho -> vira o caso 4.
            w.esq.cor = PRETO;
            w.cor = VERMELHO;
            this.recoloracoes += 2;
            this.rotacionarDireita(w, `Caso 3 (sobrinho interno ${w.esq.chave} VERMELHO)`);
            w = x.pai.dir;
          }
          // CASO 4: sobrinho "de fora" vermelho -> uma rotação resolve.
          w.cor = x.pai.cor;
          x.pai.cor = PRETO;
          w.dir.cor = PRETO;
          this.recoloracoes += 3;
          this.rotacionarEsquerda(x.pai, `Caso 4 (sobrinho externo ${w.dir.chave} VERMELHO): recolore`);
          x = this.raiz;
        }
      } else {                                   // espelho
        let w = x.pai.esq;
        if (w.cor === VERMELHO) {
          w.cor = PRETO;
          x.pai.cor = VERMELHO;
          this.recoloracoes += 2;
          this.rotacionarDireita(x.pai, `Caso 1 (irmão ${w.chave} VERMELHO): irmão fica PRETO, pai fica VERMELHO`);
          w = x.pai.esq;
        }
        if (w.dir.cor === PRETO && w.esq.cor === PRETO) {
          w.cor = VERMELHO;
          this.recoloracoes++;
          this.registrar(`Caso 2 (irmão ${w.chave} PRETO, sobrinhos PRETOS): irmão fica VERMELHO, ` +
                         `o duplo preto sobe para ${x.pai.chave}`, [w.chave, x.pai.chave]);
          x = x.pai;
        } else {
          if (w.esq.cor === PRETO) {
            w.dir.cor = PRETO;
            w.cor = VERMELHO;
            this.recoloracoes += 2;
            this.rotacionarEsquerda(w, `Caso 3 (sobrinho interno ${w.dir.chave} VERMELHO)`);
            w = x.pai.esq;
          }
          w.cor = x.pai.cor;
          x.pai.cor = PRETO;
          w.esq.cor = PRETO;
          this.recoloracoes += 3;
          this.rotacionarDireita(x.pai, `Caso 4 (sobrinho externo ${w.esq.chave} VERMELHO): recolore`);
          x = this.raiz;
        }
      }
    }
    if (x.cor === VERMELHO && x !== this.NIL) {
      this.registrar(`${x.chave} absorve o preto extra e fica PRETO`, [x.chave]);
    }
    x.cor = PRETO;
  }

  // -------------------------------------------------------------- consultas
  /** Lista [{chave, valor, contador}] em ordem crescente (percurso iterativo com pilha). */
  emOrdem() {
    const saida = [];
    const pilha = [];
    let atual = this.raiz;
    while (pilha.length || atual !== this.NIL) {
      while (atual !== this.NIL) {
        pilha.push(atual);
        atual = atual.esq;
      }
      atual = pilha.pop();
      saida.push({ chave: atual.chave, valor: atual.valor, contador: atual.contador });
      atual = atual.dir;
    }
    return saida;
  }

  altura(no = this.raiz) {
    if (no === this.NIL) return 0;
    return 1 + Math.max(this.altura(no.esq), this.altura(no.dir));
  }

  alturaNegra() {
    let h = 0;
    for (let no = this.raiz; no !== this.NIL; no = no.esq) if (no.cor === PRETO) h++;
    return h;
  }

  /** Confere as 5 propriedades, a ordem e os ponteiros de pai. Lança erro se algo falhar. */
  validar() {
    const falha = (msg) => { throw new Error(msg); };
    if (this.NIL.cor !== PRETO) falha("NIL deve ser preto");
    if (this.raiz !== this.NIL && this.raiz.cor !== PRETO) falha("a raiz deve ser preta");
    let contagem = 0;
    const verificar = (no, minimo, maximo) => {
      if (no === this.NIL) return 1;
      contagem++;
      if (minimo !== null && !(no.chave > minimo)) falha(`ordem violada em ${no.chave}`);
      if (maximo !== null && !(no.chave < maximo)) falha(`ordem violada em ${no.chave}`);
      if (no.cor === VERMELHO && (no.esq.cor !== PRETO || no.dir.cor !== PRETO)) {
        falha(`vermelho ${no.chave} com filho vermelho`);
      }
      if (no.esq !== this.NIL && no.esq.pai !== no) falha(`ponteiro pai errado em ${no.esq.chave}`);
      if (no.dir !== this.NIL && no.dir.pai !== no) falha(`ponteiro pai errado em ${no.dir.chave}`);
      const he = verificar(no.esq, minimo, no.chave);
      const hd = verificar(no.dir, no.chave, maximo);
      if (he !== hd) falha(`altura negra diferente abaixo de ${no.chave}`);
      return he + (no.cor === PRETO ? 1 : 0);
    };
    verificar(this.raiz, null, null);
    if (contagem !== this.tamanho) falha("tamanho inconsistente");
    return true;
  }
}

if (typeof module !== "undefined") module.exports = { ArvoreRubroNegra, VERMELHO, PRETO };
