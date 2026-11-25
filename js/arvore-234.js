/*
 * ÁRVORE 2-3-4 (árvore B de ordem 4) — implementada do zero, com nós encadeados.
 *
 * Cada nó tem de 1 a 3 chaves ordenadas e, se for interno, (chaves + 1) filhos:
 *   2-nó: [a]       -> 2 filhos
 *   3-nó: [a|b]     -> 3 filhos
 *   4-nó: [a|b|c]   -> 4 filhos
 * Cada nó guarda a lista de filhos e um ponteiro para o PAI.
 *
 * Balanceamento: TODAS as folhas ficam sempre no mesmo nível. A árvore não
 * faz rotações como a rubro-negra; ela cresce e encolhe PELA RAIZ.
 *   - Inserção (de cima para baixo): durante a descida, todo 4-nó encontrado
 *     é DIVIDIDO (a chave do meio sobe para o pai). Assim o pai nunca está
 *     cheio e a chave nova sempre cabe numa folha. Se a raiz é dividida, a
 *     altura aumenta em 1.
 *   - Remoção (de cima para baixo): antes de descer para um filho com só 1
 *     chave, ele é reforçado por EMPRÉSTIMO de um irmão com 2+ chaves (a chave
 *     passa pelo pai) ou por FUSÃO com um irmão (uma chave do pai desce).
 *     Se a raiz fica vazia, ela some e a altura diminui em 1.
 *   - Chave em nó interno é trocada pelo PREDECESSOR (ou sucessor) da folha.
 *
 * POLÍTICA DE ELEMENTOS REPETIDOS (definida pela equipe):
 *   - Cada chave aparece uma única vez; junto dela fica um BALDE (lista) com
 *     todos os itens que têm aquela chave.
 *   - Inserir chave repetida só acrescenta o item ao balde (sem divisões).
 *   - remover(chave, item) tira o item do balde; a chave só sai da árvore
 *     (com rebalanceamento) quando o balde esvazia. remover(chave) tira tudo.
 *   Na feira, a chave é o PREÇO e o balde guarda os códigos dos produtos que
 *   custam exatamente aquele preço.
 */

class No234 {
  constructor(chaves = [], valores = [], filhos = [], pai = null) {
    this.chaves = chaves;
    this.valores = valores;   // um balde (lista de itens) por chave
    this.filhos = filhos;
    this.pai = pai;
  }

  get folha() {
    return this.filhos.length === 0;
  }

  toString() {
    return "[" + this.chaves.join("|") + "]";
  }
}

class Arvore234 {
  constructor({ aoPasso = null } = {}) {
    this.MAX_CHAVES = 3;
    this.raiz = null;
    this.tamanho = 0;          // chaves distintas
    this.aoPasso = aoPasso;
    this.passos = [];
    this.divisoes = 0;
    this.fusoes = 0;
    this.emprestimos = 0;
  }

  // ------------------------------------------------------------- utilitários
  registrar(texto, destaque = []) {
    this.passos.push(texto);
    if (this.aoPasso) this.aoPasso(this, texto, destaque);
  }

  contem(chave) {
    return this.localizar(chave) !== null;
  }

  /** Índice da primeira chave >= chave (é também o índice do filho a seguir). */
  static posicao(no, chave) {
    let i = 0;
    while (i < no.chaves.length && no.chaves[i] < chave) i++;
    return i;
  }

  localizar(chave, comLog = false) {
    let no = this.raiz;
    while (no !== null) {
      const i = Arvore234.posicao(no, chave);
      if (i < no.chaves.length && no.chaves[i] === chave) {
        if (comLog) this.passos.push(`Nó ${no}: ${chave} ENCONTRADO na posição ${i}`);
        return { no, i };
      }
      if (no.folha) {
        if (comLog) this.passos.push(`Nó ${no} é folha e não tem ${chave}: NÃO encontrado`);
        return null;
      }
      if (comLog) this.passos.push(`Nó ${no}: ${chave} não está aqui, desce pelo filho ${i}`);
      no = no.filhos[i];
    }
    if (comLog) this.passos.push("Árvore vazia: NÃO encontrado");
    return null;
  }

  // ------------------------------------------------------------------ busca
  /** Retorna o balde (lista de itens) da chave, ou null. */
  buscar(chave) {
    this.passos = [];
    const achado = this.localizar(chave, true);
    return achado ? achado.no.valores[achado.i] : null;
  }

  // --------------------------------------------------------------- inserção
  /** Divide o 4-nó pai.filhos[i]: a chave do meio sobe para o pai. */
  dividir(pai, i) {
    const cheio = pai.filhos[i];
    const descricao = cheio.toString();
    const [a, b, c] = cheio.chaves;
    const [va, vb, vc] = cheio.valores;
    const esq = new No234([a], [va], [], pai);
    const dir = new No234([c], [vc], [], pai);
    if (!cheio.folha) {
      esq.filhos = cheio.filhos.slice(0, 2);
      dir.filhos = cheio.filhos.slice(2);
      esq.filhos.forEach((f) => { f.pai = esq; });
      dir.filhos.forEach((f) => { f.pai = dir; });
    }
    pai.chaves.splice(i, 0, b);
    pai.valores.splice(i, 0, vb);
    pai.filhos[i] = esq;
    pai.filhos.splice(i + 1, 0, dir);
    this.divisoes++;
    this.registrar(`DIVISÃO do 4-nó ${descricao}: ${b} sobe para o pai, sobram [${a}] e [${c}]`, [b]);
  }

  inserir(chave, item = null) {
    this.passos = [];
    const achado = this.localizar(chave);
    if (achado) {                                   // elemento repetido
      const balde = achado.no.valores[achado.i];
      balde.push(item);
      this.registrar(`Chave ${chave} REPETIDA: item vai para o balde ` +
                     `(agora ${balde.length} itens, sem divisões)`, [chave]);
      return;
    }
    if (this.raiz === null) {
      this.raiz = new No234([chave], [[item]]);
      this.tamanho++;
      this.registrar(`Inseriu ${chave} como raiz`, [chave]);
      return;
    }
    if (this.raiz.chaves.length === this.MAX_CHAVES) {   // raiz cheia: a árvore cresce
      const nova = new No234([], [], [this.raiz]);
      this.raiz.pai = nova;
      this.raiz = nova;
      this.registrar("A raiz é um 4-nó: será dividida e a altura aumenta em 1");
      this.dividir(nova, 0);
    }
    let no = this.raiz;
    while (!no.folha) {
      let i = Arvore234.posicao(no, chave);
      if (no.filhos[i].chaves.length === this.MAX_CHAVES) {
        this.dividir(no, i);                             // divide antes de descer
        if (chave > no.chaves[i]) i++;
      }
      no = no.filhos[i];
    }
    const i = Arvore234.posicao(no, chave);
    no.chaves.splice(i, 0, chave);
    no.valores.splice(i, 0, [item]);
    this.tamanho++;
    this.registrar(`Inseriu ${chave} na folha, que ficou ${no}`, [chave]);
  }

  // ---------------------------------------------------------------- remoção
  /** remover(chave) tira a chave inteira; remover(chave, item) tira só aquele item do balde. */
  remover(chave, item) {
    this.passos = [];
    const achado = this.localizar(chave);
    if (!achado) {
      this.registrar(`Chave ${chave} não existe: nada a remover`);
      return false;
    }
    const balde = achado.no.valores[achado.i];
    if (item !== undefined) {
      const pos = balde.indexOf(item);
      if (pos < 0) {
        this.registrar(`O item ${item} não está no balde da chave ${chave}`);
        return false;
      }
      if (balde.length > 1) {
        balde.splice(pos, 1);
        this.registrar(`Item ${item} saiu do balde de ${chave} (restam ${balde.length}; ` +
                       `sem rebalanceamento)`, [chave]);
        return true;
      }
    }
    this.removerDe(this.raiz, chave);
    this.tamanho--;
    if (this.raiz !== null && this.raiz.chaves.length === 0) this.raiz = null;
    this.registrar(`Chave ${chave} removida`);
    return true;
  }

  removerDe(no, chave) {
    let i = Arvore234.posicao(no, chave);
    if (i < no.chaves.length && no.chaves[i] === chave) {
      if (no.folha) {
        // Caso A: a chave está numa folha (que tem 2+ chaves, ou é a raiz).
        no.chaves.splice(i, 1);
        no.valores.splice(i, 1);
        this.registrar(`Chave ${chave} retirada da folha, que ficou ${no}`);
        return;
      }
      const esq = no.filhos[i];
      const dir = no.filhos[i + 1];
      if (esq.chaves.length >= 2) {
        // Caso B1: troca pelo predecessor e remove o predecessor lá embaixo.
        let p = esq;
        while (!p.folha) p = p.filhos[p.filhos.length - 1];
        const pk = p.chaves[p.chaves.length - 1];
        no.chaves[i] = pk;
        no.valores[i] = p.valores[p.valores.length - 1];
        this.registrar(`${chave} está num nó interno: trocada pelo PREDECESSOR ${pk}`, [pk]);
        this.removerDe(esq, pk);
      } else if (dir.chaves.length >= 2) {
        // Caso B2: troca pelo sucessor.
        let s = dir;
        while (!s.folha) s = s.filhos[0];
        const sk = s.chaves[0];
        no.chaves[i] = sk;
        no.valores[i] = s.valores[0];
        this.registrar(`${chave} está num nó interno: trocada pelo SUCESSOR ${sk}`, [sk]);
        this.removerDe(dir, sk);
      } else {
        // Caso B3: os dois filhos têm 1 chave -> funde e continua no nó fundido.
        this.fundir(no, i);
        this.removerDe(esq, chave);
      }
    } else {
      if (no.folha) return;   // não acontece: a existência é conferida antes
      if (no.filhos[i].chaves.length === 1) i = this.reforcar(no, i);
      // mesmo que uma fusão tenha esvaziado a raiz, no.filhos[i] é o nó fundido
      this.removerDe(no.filhos[i], chave);
    }
  }

  /** Garante que no.filhos[i] tenha 2+ chaves antes de descer. Retorna o novo índice. */
  reforcar(no, i) {
    const filho = no.filhos[i];
    if (i > 0 && no.filhos[i - 1].chaves.length >= 2) {
      const irmao = no.filhos[i - 1];
      filho.chaves.unshift(no.chaves[i - 1]);
      filho.valores.unshift(no.valores[i - 1]);
      no.chaves[i - 1] = irmao.chaves.pop();
      no.valores[i - 1] = irmao.valores.pop();
      if (!irmao.folha) {
        const neto = irmao.filhos.pop();
        filho.filhos.unshift(neto);
        neto.pai = filho;
      }
      this.emprestimos++;
      this.registrar(`EMPRÉSTIMO do irmão esquerdo: ${no.chaves[i - 1]} sobe para o pai e ` +
                     `${filho.chaves[0]} desce para ${filho}`, [no.chaves[i - 1], filho.chaves[0]]);
      return i;
    }
    if (i < no.filhos.length - 1 && no.filhos[i + 1].chaves.length >= 2) {
      const irmao = no.filhos[i + 1];
      filho.chaves.push(no.chaves[i]);
      filho.valores.push(no.valores[i]);
      no.chaves[i] = irmao.chaves.shift();
      no.valores[i] = irmao.valores.shift();
      if (!irmao.folha) {
        const neto = irmao.filhos.shift();
        filho.filhos.push(neto);
        neto.pai = filho;
      }
      this.emprestimos++;
      const desceu = filho.chaves[filho.chaves.length - 1];
      this.registrar(`EMPRÉSTIMO do irmão direito: ${no.chaves[i]} sobe para o pai e ` +
                     `${desceu} desce para ${filho}`, [no.chaves[i], desceu]);
      return i;
    }
    if (i > 0) {
      this.fundir(no, i - 1);
      return i - 1;
    }
    this.fundir(no, i);
    return i;
  }

  /** Funde filhos[i] + chave[i] do pai + filhos[i+1] num só nó com 3 chaves. */
  fundir(no, i) {
    const esq = no.filhos[i];
    const dir = no.filhos.splice(i + 1, 1)[0];
    const k = no.chaves.splice(i, 1)[0];
    const v = no.valores.splice(i, 1)[0];
    esq.chaves = [...esq.chaves, k, ...dir.chaves];
    esq.valores = [...esq.valores, v, ...dir.valores];
    dir.filhos.forEach((f) => { f.pai = esq; });
    esq.filhos = [...esq.filhos, ...dir.filhos];
    this.fusoes++;
    let texto = `FUSÃO: ${k} desce do pai e junta os irmãos, formando ${esq}`;
    if (no === this.raiz && no.chaves.length === 0) {
      this.raiz = esq;                 // a raiz esvaziou: a árvore encolhe
      esq.pai = null;
      texto += " | a raiz ficou vazia e foi descartada (altura diminui em 1)";
    }
    this.registrar(texto, [k]);
  }

  // -------------------------------------------------------------- consultas
  emOrdem() {
    const saida = [];
    const rec = (no) => {
      if (no === null) return;
      no.chaves.forEach((k, j) => {
        if (!no.folha) rec(no.filhos[j]);
        saida.push({ chave: k, itens: no.valores[j] });
      });
      if (!no.folha) rec(no.filhos[no.filhos.length - 1]);
    };
    rec(this.raiz);
    return saida;
  }

  /** Todas as chaves com minimo <= chave <= maximo, pulando subárvores fora da faixa. */
  intervalo(minimo, maximo) {
    const saida = [];
    const rec = (no) => {
      if (no === null) return;
      no.chaves.forEach((k, j) => {
        if (!no.folha && minimo < k) rec(no.filhos[j]);
        if (minimo <= k && k <= maximo) saida.push({ chave: k, itens: no.valores[j] });
      });
      if (!no.folha && no.chaves[no.chaves.length - 1] < maximo) rec(no.filhos[no.filhos.length - 1]);
    };
    rec(this.raiz);
    return saida;
  }

  altura() {
    let h = 0;
    for (let no = this.raiz; no !== null; no = no.folha ? null : no.filhos[0]) h++;
    return h;
  }

  contarNos() {
    const rec = (no) => (no === null ? 0 : 1 + no.filhos.reduce((s, f) => s + rec(f), 0));
    return rec(this.raiz);
  }

  validar() {
    const falha = (msg) => { throw new Error(msg); };
    if (this.raiz === null) {
      if (this.tamanho !== 0) falha("tamanho inconsistente");
      return true;
    }
    if (this.raiz.pai !== null) falha("a raiz não pode ter pai");
    const profundidades = new Set();
    let total = 0;
    const rec = (no, prof, lo, hi) => {
      if (no.chaves.length < 1 || no.chaves.length > 3) falha(`nó ${no} com quantidade inválida de chaves`);
      if (no.valores.length !== no.chaves.length) falha(`nó ${no} sem balde`);
      no.chaves.forEach((k, j) => {
        if (!no.valores[j].length) falha(`balde vazio em ${k}`);
        if (j && !(no.chaves[j - 1] < k)) falha(`nó ${no} fora de ordem`);
      });
      if (lo !== null && !(no.chaves[0] > lo)) falha(`nó ${no} fora do intervalo`);
      if (hi !== null && !(no.chaves[no.chaves.length - 1] < hi)) falha(`nó ${no} fora do intervalo`);
      total += no.chaves.length;
      if (no.folha) {
        profundidades.add(prof);
        return;
      }
      if (no.filhos.length !== no.chaves.length + 1) falha(`nó ${no} com número de filhos errado`);
      const limites = [lo, ...no.chaves, hi];
      no.filhos.forEach((f, j) => {
        if (f.pai !== no) falha(`ponteiro pai errado em ${f}`);
        rec(f, prof + 1, limites[j], limites[j + 1]);
      });
    };
    rec(this.raiz, 0, null, null);
    if (profundidades.size !== 1) falha("folhas em níveis diferentes");
    if (total !== this.tamanho) falha("tamanho inconsistente");
    return true;
  }
}

if (typeof module !== "undefined") module.exports = { Arvore234 };
