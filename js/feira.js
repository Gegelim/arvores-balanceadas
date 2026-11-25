/*
 * APLICAÇÃO PRÁTICA: estoque de uma feira livre.
 *
 * Problema: uma feira com várias bancas precisa
 *   (1) achar rápido um produto pelo CÓDIGO (cadastro, venda, remoção);
 *   (2) listar produtos por FAIXA DE PREÇO ("o que tem entre R$ 8 e R$ 12?");
 *   (3) indicar ao cliente a BANCA MAIS PRÓXIMA de onde ele está.
 *
 * Cada necessidade usa a estrutura mais adequada:
 *   - Rubro-Negra -> índice principal, chave = código do produto.
 *       Repetido: cadastrar um código que já existe SOMA a quantidade em estoque.
 *   - 2-3-4       -> índice secundário, chave = preço em centavos.
 *       Repetido: produtos com o mesmo preço ficam no BALDE da chave.
 *   - k-D (2-D)   -> posição (x, y) das bancas em metros: banca mais próxima.
 */

/* global ArvoreRubroNegra, Arvore234, ArvoreKD */
if (typeof module !== "undefined") {
  /* eslint-disable no-global-assign */
  globalThis.ArvoreRubroNegra = require("./rubro-negra.js").ArvoreRubroNegra;
  globalThis.Arvore234 = require("./arvore-234.js").Arvore234;
  globalThis.ArvoreKD = require("./arvore-kd.js").ArvoreKD;
}

// 25 chaves usadas nas demonstrações (o enunciado pede no mínimo 21 nós)
const CHAVES_PADRAO = [41, 38, 31, 12, 19, 8, 50, 60, 72, 65, 3, 27, 45,
  90, 55, 33, 14, 7, 81, 22, 68, 99, 5, 47, 36];

const BANCAS = [
  ["B01", [8, 12]], ["B02", [25, 70]], ["B03", [40, 30]], ["B04", [55, 85]],
  ["B05", [62, 15]], ["B06", [75, 55]], ["B07", [90, 80]], ["B08", [15, 45]],
  ["B09", [48, 58]], ["B10", [85, 30]], ["B11", [30, 90]], ["B12", [68, 40]],
];

const PRODUTOS = [
  [412, "Açaí (litro)", 18.00, 40, "B01"],
  [105, "Farinha de mandioca (kg)", 9.50, 60, "B03"],
  [733, "Mandioca (kg)", 12.00, 25, "B01"],
  [218, "Couve (maço)", 4.00, 80, "B08"],
  [650, "Castanha-do-pará (kg)", 55.00, 15, "B04"],
  [321, "Cupuaçu (unid.)", 8.00, 30, "B02"],
  [877, "Manga (kg)", 22.00, 12, "B02"],
  [149, "Goiaba (kg)", 9.50, 20, "B05"],
  [566, "Milho verde (5 espigas)", 15.00, 18, "B06"],
  [290, "Pimenta-de-cheiro (100 g)", 3.50, 90, "B08"],
  [934, "Tapioca (kg)", 12.00, 35, "B03"],
  [377, "Mel de abelha (pote)", 30.00, 14, "B09"],
  [482, "Tilápia (kg)", 48.00, 22, "B10"],
  [701, "Camarão seco (kg)", 65.00, 10, "B10"],
  [158, "Banana prata (dúzia)", 7.00, 50, "B05"],
  [845, "Cheiro-verde (maço)", 2.50, 70, "B12"],
  [263, "Abóbora (kg)", 9.50, 16, "B06"],
  [519, "Maracujá (kg)", 14.00, 9, "B07"],
  [608, "Azeite de dendê (frasco)", 25.00, 11, "B11"],
  [399, "Rapadura (unid.)", 20.00, 8, "B11"],
  [123, "Goma de tapioca (kg)", 8.00, 45, "B03"],
  [957, "Dourada (kg)", 42.00, 17, "B10"],
  [340, "Farinha de tapioca (kg)", 12.00, 28, "B09"],
  [781, "Cesto de palha", 35.00, 6, "B07"],
  [204, "Queijo coalho (kg)", 60.00, 13, "B04"],
];

class Produto {
  constructor(codigo, nome, preco, quantidade, banca) {
    Object.assign(this, { codigo, nome, preco, quantidade, banca });
  }

  get centavos() {
    return Math.round(this.preco * 100);
  }
}

class Feira {
  constructor({ aoPassoRN = null, aoPasso234 = null } = {}) {
    this.porCodigo = new ArvoreRubroNegra({
      mesclar: (antigo, novo) => { antigo.quantidade += novo.quantidade; return antigo; },
      aoPasso: aoPassoRN,
    });
    this.porPreco = new Arvore234({ aoPasso: aoPasso234 });
    this.bancas = new ArvoreKD();
    this.bancas.construir(BANCAS.map(([nome, ponto]) => ({ ponto, rotulo: nome })));
  }

  carregarExemplo() {
    PRODUTOS.forEach((p) => this.cadastrar(...p));
  }

  cadastrar(codigo, nome, preco, quantidade, banca) {
    const novo = new Produto(codigo, nome, preco, quantidade, banca);
    const jaExistia = this.porCodigo.contem(codigo);
    this.porCodigo.inserir(codigo, novo);          // repetido -> soma o estoque
    if (!jaExistia) {
      this.porPreco.inserir(novo.centavos, codigo);
      return `Produto #${codigo} cadastrado.`;
    }
    const atual = this.porCodigo.localizar(codigo).valor;
    return `O código #${codigo} já existia: o estoque foi somado e agora é ${atual.quantidade} ` +
           `(preço mantido em R$ ${atual.preco.toFixed(2)}).`;
  }

  buscar(codigo) {
    const no = this.porCodigo.buscar(codigo);
    return no ? no.valor : null;
  }

  remover(codigo) {
    const no = this.porCodigo.localizar(codigo);
    if (!no) return `Produto #${codigo} não encontrado.`;
    const produto = no.valor;
    this.porCodigo.remover(codigo, true);
    this.porPreco.remover(produto.centavos, codigo);
    return `Produto #${codigo} (${produto.nome}) removido dos dois índices.`;
  }

  vender(codigo, quantidade) {
    const no = this.porCodigo.localizar(codigo);
    if (!no) return `Produto #${codigo} não encontrado.`;
    const produto = no.valor;
    if (quantidade > produto.quantidade) return `Estoque insuficiente: só há ${produto.quantidade}.`;
    produto.quantidade -= quantidade;
    if (produto.quantidade === 0) return "Vendido. O estoque zerou, então " + this.remover(codigo).toLowerCase();
    return `Vendido. Restam ${produto.quantidade}.`;
  }

  faixaDePreco(minimo, maximo) {
    const saida = [];
    this.porPreco.intervalo(Math.round(minimo * 100), Math.round(maximo * 100))
      .forEach(({ itens }) => itens.forEach((c) => saida.push(this.porCodigo.localizar(c).valor)));
    return saida;
  }

  bancaMaisProxima(x, y) {
    const { no, dist } = this.bancas.vizinhoMaisProximo([x, y]);
    const produtos = this.listar().filter((p) => p.banca === no.rotulo);
    return { no, dist, produtos };
  }

  listar() {
    return this.porCodigo.emOrdem().map((e) => e.valor);
  }
}

if (typeof module !== "undefined") module.exports = { Feira, Produto, BANCAS, PRODUTOS, CHAVES_PADRAO };
