// Responsável: Artur Lobato
/*
 * ÁRVORE k-D (k-dimensional) — implementação didática para k = 2.
 *
 * É uma árvore binária de busca em que cada NÍVEL compara uma coordenada
 * diferente, em rodízio: nível 0 compara x, nível 1 compara y, nível 2
 * compara x de novo, e assim por diante. Cada nó é um ponto e corta o plano:
 *   - nó que compara x -> reta VERTICAL   (esquerda: x menor; direita: x maior ou igual)
 *   - nó que compara y -> reta HORIZONTAL (esquerda: y menor; direita: y maior ou igual)
 *
 * Balanceamento: a k-D não usa rotações (girar quebraria o rodízio dos eixos).
 * O equilíbrio vem da CONSTRUÇÃO: escolhendo a MEDIANA do eixo em cada nível,
 * cada metade fica com metade dos pontos, e a altura fica perto de log2(n).
 * Muitas inserções depois podem desbalancear; a solução usual é reconstruir.
 *
 * Usos: ponto mais próximo, busca por região, mapas, jogos, k-NN.
 * Na aplicação da feira: banca mais próxima do cliente.
 *
 * Política de repetidos: coordenada igual vai para a DIREITA (regra
 * "maior ou igual"), então pontos repetidos viram nós distintos.
 */

class NoKD {
  constructor(ponto, rotulo, eixo, pai = null) {
    this.ponto = ponto;     // [x, y]
    this.rotulo = rotulo;
    this.eixo = eixo;       // 0 = x, 1 = y
    this.esq = null;
    this.dir = null;
    this.pai = pai;
  }
}

class ArvoreKD {
  constructor(k = 2) {
    this.k = k;
    this.raiz = null;
    this.tamanho = 0;
    this.passos = [];
    this.eventos = [];
  }

  static nomeEixo(e) {
    return e === 0 ? "x" : "y";
  }

  static fmt(p) {
    return `(${p[0]}, ${p[1]})`;
  }

  // -------------------------------------------------------------- construção
  /** pontos: lista de {ponto, rotulo}. Monta a árvore balanceada pela mediana. */
  construir(pontos) {
    this.passos = [];
    this.tamanho = pontos.length;
    const rec = (lista, profundidade, pai) => {
      if (!lista.length) return null;
      const eixo = profundidade % this.k;
      const ordenada = [...lista].sort((a, b) => a.ponto[eixo] - b.ponto[eixo]);
      const meio = Math.floor(ordenada.length / 2);
      const { ponto, rotulo } = ordenada[meio];
      const no = new NoKD(ponto, rotulo, eixo, pai);
      this.passos.push(`Nível ${profundidade} (corta por ${ArvoreKD.nomeEixo(eixo)}): ` +
                       `mediana = ${rotulo} ${ArvoreKD.fmt(ponto)}`);
      no.esq = rec(ordenada.slice(0, meio), profundidade + 1, no);
      no.dir = rec(ordenada.slice(meio + 1), profundidade + 1, no);
      return no;
    };
    this.raiz = rec(pontos, 0, null);
  }

  /** Insere como numa BST, alternando o eixo. Retorna o nó criado. */
  inserir(ponto, rotulo) {
    this.passos = [];
    if (this.raiz === null) {
      this.raiz = new NoKD(ponto, rotulo, 0);
      this.tamanho++;
      this.passos.push(`${rotulo} ${ArvoreKD.fmt(ponto)} vira a raiz`);
      return this.raiz;
    }
    let no = this.raiz;
    for (;;) {
      const e = no.eixo;
      const lado = ponto[e] < no.ponto[e] ? "esq" : "dir";
      this.passos.push(`Compara ${ArvoreKD.nomeEixo(e)}: ${ponto[e]} ${lado === "esq" ? "<" : "≥"} ` +
                       `${no.ponto[e]} (${no.rotulo}) → ${lado === "esq" ? "esquerda" : "direita"}`);
      if (no[lado] === null) {
        const novo = new NoKD(ponto, rotulo, (e + 1) % this.k, no);
        no[lado] = novo;
        this.tamanho++;
        return novo;
      }
      no = no[lado];
    }
  }

  // --------------------------------------------------------------- consultas
  static dist2(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  }

  /**
   * Ponto mais próximo do alvo. Retorna {no, dist}.
   * this.eventos registra a busca para a animação:
   *   ["visita", no, distancia, melhorou]  e  ["poda", no, subarvoreIgnorada, distanciaAteACorte]
   */
  vizinhoMaisProximo(alvo) {
    this.passos = [];
    this.eventos = [];
    let melhor = null;
    let melhorD2 = Infinity;
    const rec = (no) => {
      if (no === null) return;
      const d2 = ArvoreKD.dist2(alvo, no.ponto);
      const melhorou = d2 < melhorD2;
      if (melhorou) {
        melhor = no;
        melhorD2 = d2;
      }
      this.passos.push(`Visita ${no.rotulo}: distância ${Math.sqrt(d2).toFixed(2)}` +
                       (melhorou ? " (novo melhor)" : ""));
      this.eventos.push(["visita", no, Math.sqrt(d2), melhorou]);
      const e = no.eixo;
      const diff = alvo[e] - no.ponto[e];
      const [perto, longe] = diff < 0 ? [no.esq, no.dir] : [no.dir, no.esq];
      rec(perto);
      if (diff * diff < melhorD2) {
        rec(longe);       // o círculo do melhor atual cruza a reta: o outro lado pode ter alguém mais perto
      } else if (longe !== null) {
        this.passos.push(`PODA em ${no.rotulo}: o outro lado da reta está a ${Math.abs(diff).toFixed(2)}`);
        this.eventos.push(["poda", no, longe, Math.abs(diff)]);
      }
    };
    rec(this.raiz);
    return { no: melhor, dist: melhor ? Math.sqrt(melhorD2) : null };
  }

  /** Todos os nós com minimo[i] <= ponto[i] <= maximo[i] em cada eixo. */
  buscaRetangulo(minimo, maximo) {
    const saida = [];
    const rec = (no) => {
      if (no === null) return;
      if (no.ponto.every((v, i) => minimo[i] <= v && v <= maximo[i])) saida.push(no);
      const e = no.eixo;
      if (minimo[e] <= no.ponto[e]) rec(no.esq);
      if (maximo[e] >= no.ponto[e]) rec(no.dir);
    };
    rec(this.raiz);
    return saida;
  }

  altura(no = this.raiz) {
    if (no === null) return 0;
    return 1 + Math.max(this.altura(no.esq), this.altura(no.dir));
  }

  /** Nós em pré-ordem (a mesma ordem em que a construção escolhe as medianas). */
  nos() {
    const saida = [];
    const rec = (no) => {
      if (no === null) return;
      saida.push(no);
      rec(no.esq);
      rec(no.dir);
    };
    rec(this.raiz);
    return saida;
  }
}

if (typeof module !== "undefined") module.exports = { ArvoreKD };
