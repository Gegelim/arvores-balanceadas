/*
 * Testes automáticos (rodar com Node.js:  node testes/testes.js)
 *
 * Milhares de operações aleatórias; depois de CADA operação são conferidas
 * todas as propriedades das árvores (cores, altura negra, folhas no mesmo
 * nível, ordem, ponteiros de pai) e o conteúdo é comparado com um Map comum
 * usado apenas como gabarito.
 */
const { ArvoreRubroNegra } = require("../js/rubro-negra.js");
const { Arvore234 } = require("../js/arvore-234.js");
const { ArvoreKD } = require("../js/arvore-kd.js");
const { Feira } = require("../js/feira.js");

function aleatorio(semente) {          // gerador simples com semente, para repetir os testes
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}
const inteiro = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
function igual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}\n  obtido:   ${JSON.stringify(a)}\n  esperado: ${JSON.stringify(b)}`);
}

function testarRubroNegra(operacoes = 4000) {
  const rnd = aleatorio(1);
  const arv = new ArvoreRubroNegra();
  const gabarito = new Map();
  for (let n = 0; n < operacoes; n++) {
    const chave = inteiro(rnd, 0, 300);
    if (rnd() < 0.6) {
      arv.inserir(chave);
      gabarito.set(chave, (gabarito.get(chave) || 0) + 1);
    } else {
      igual(arv.remover(chave), gabarito.has(chave), "retorno de remover");
      if (gabarito.has(chave)) {
        gabarito.set(chave, gabarito.get(chave) - 1);
        if (gabarito.get(chave) === 0) gabarito.delete(chave);
      }
    }
    arv.validar();
    igual(arv.emOrdem().map((e) => [e.chave, e.contador]),
      [...gabarito.entries()].sort((a, b) => a[0] - b[0]), "conteúdo da rubro-negra");
  }
  for (const chave of [...gabarito.keys()]) {
    if (!arv.buscar(chave)) throw new Error(`busca falhou para ${chave}`);
    arv.remover(chave, true);
    arv.validar();
  }
  igual(arv.tamanho, 0, "árvore deveria estar vazia");
  console.log(`Rubro-Negra: ${operacoes} operações OK (${arv.rotacoes} rotações, ${arv.recoloracoes} recolorações)`);
}

function testar234(operacoes = 4000) {
  const rnd = aleatorio(2);
  const arv = new Arvore234();
  const gabarito = new Map();
  for (let n = 0; n < operacoes; n++) {
    const chave = inteiro(rnd, 0, 300);
    if (rnd() < 0.6) {
      arv.inserir(chave, n);
      if (!gabarito.has(chave)) gabarito.set(chave, []);
      gabarito.get(chave).push(n);
    } else if (gabarito.has(chave) && rnd() < 0.5) {
      const lista = gabarito.get(chave);
      const item = lista[inteiro(rnd, 0, lista.length - 1)];
      igual(arv.remover(chave, item), true, "remover item");
      lista.splice(lista.indexOf(item), 1);
      if (!lista.length) gabarito.delete(chave);
    } else {
      igual(arv.remover(chave), gabarito.has(chave), "retorno de remover");
      gabarito.delete(chave);
    }
    arv.validar();
    const ordenar = (l) => [...l].sort((a, b) => a - b);
    igual(arv.emOrdem().map((e) => [e.chave, ordenar(e.itens)]),
      [...gabarito.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => [k, ordenar(v)]), "conteúdo da 2-3-4");
    const a = inteiro(rnd, 0, 300);
    const b = inteiro(rnd, a, 300);
    igual(arv.intervalo(a, b).map((e) => e.chave),
      [...gabarito.keys()].filter((k) => k >= a && k <= b).sort((x, y) => x - y), "busca por intervalo");
  }
  for (const chave of [...gabarito.keys()]) {
    if (!arv.buscar(chave)) throw new Error(`busca falhou para ${chave}`);
    arv.remover(chave);
    arv.validar();
  }
  igual(arv.raiz, null, "árvore deveria estar vazia");
  console.log(`2-3-4: ${operacoes} operações OK (${arv.divisoes} divisões, ${arv.fusoes} fusões, ${arv.emprestimos} empréstimos)`);
}

function testarKD() {
  const rnd = aleatorio(3);
  const pontos = Array.from({ length: 300 }, (_, i) => ({ ponto: [rnd() * 100, rnd() * 100], rotulo: `P${i}` }));
  const arv = new ArvoreKD();
  arv.construir(pontos.slice(0, 200));
  pontos.slice(200).forEach((p) => arv.inserir(p.ponto, p.rotulo));
  for (let n = 0; n < 200; n++) {
    const alvo = [rnd() * 100, rnd() * 100];
    const { no } = arv.vizinhoMaisProximo(alvo);
    const forcaBruta = pontos.reduce((m, p) => (ArvoreKD.dist2(alvo, p.ponto) < ArvoreKD.dist2(alvo, m.ponto) ? p : m));
    igual(no.rotulo, forcaBruta.rotulo, "vizinho mais próximo");
    const lo = [rnd() * 50, rnd() * 50];
    const hi = [lo[0] + 30, lo[1] + 30];
    igual(arv.buscaRetangulo(lo, hi).map((x) => x.rotulo).sort(),
      pontos.filter((p) => p.ponto.every((v, i) => lo[i] <= v && v <= hi[i])).map((p) => p.rotulo).sort(), "retângulo");
  }
  console.log("k-D: ponto mais próximo e busca por região conferem com a força bruta");
}

function testarFeira() {
  const feira = new Feira();
  feira.carregarExemplo();
  igual(feira.listar().length, 25, "25 produtos");
  feira.cadastrar(412, "Açaí (litro)", 18, 10, "B01");
  igual(feira.buscar(412).quantidade, 50, "estoque somado");
  igual(feira.faixaDePreco(8, 12).length, 8, "faixa de preço");
  feira.vender(290, 90);
  igual(feira.buscar(290), null, "produto com estoque zerado sai");
  feira.porCodigo.validar();
  feira.porPreco.validar();
  igual(feira.bancaMaisProxima(58, 50).no.rotulo, "B09", "banca mais próxima");
  console.log("Feira: cadastro, repetidos, venda, faixa de preço e banca mais próxima OK");
}

testarRubroNegra();
testar234();
testarKD();
testarFeira();
console.log("\nTODOS OS TESTES PASSARAM");
