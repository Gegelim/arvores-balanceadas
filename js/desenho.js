/*
 * DESENHO DAS ÁRVORES EM SVG
 *
 * Duas etapas:
 *   1. "foto": transforma o estado da árvore numa lista de nós e arestas com
 *      posições lógicas (x = ordem no percurso em ordem, y = profundidade).
 *      Cada passo do balanceamento vira uma foto guardada, que pode ser
 *      reexibida depois (é isso que permite voltar e avançar passos).
 *   2. desenharFoto: converte as posições lógicas em pixels e escreve o SVG.
 *      Se receber a foto anterior e um t entre 0 e 1, interpola as posições:
 *      os nós deslizam até o lugar novo, e a rotação fica visível.
 * As cores vêm do CSS (classes), então o desenho acompanha o tema claro/escuro.
 */

/* global VERMELHO */

function escaparHTML(texto) {
  return String(texto).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function fotoRN(arv, destaque = [], caminho = []) {
  const D = new Set(destaque);
  const C = new Set(caminho);
  const nil = arv.NIL;
  const nos = [];
  const arestas = [];
  let cont = 0;
  const rec = (no, prof) => {
    if (no === nil) return;
    rec(no.esq, prof + 1);
    const estado = D.has(no.chave) ? " destaque" : C.has(no.chave) ? " caminho" : "";
    nos.push({
      id: "rn" + no.chave, x: cont++, y: prof, tipo: "circulo",
      rotulo: String(no.chave),
      classe: (no.cor === VERMELHO ? "vermelho" : "preto") + estado,
      extra: no.contador > 1 ? "×" + no.contador : null,
    });
    [no.esq, no.dir].forEach((f) => { if (f !== nil) arestas.push(["rn" + no.chave, "rn" + f.chave, null]); });
    rec(no.dir, prof + 1);
  };
  rec(arv.raiz, 0);
  return {
    nos, arestas,
    info: [["nós", arv.tamanho], ["altura", arv.altura()], ["altura negra", arv.alturaNegra()],
      ["rotações", arv.rotacoes], ["recolorações", arv.recoloracoes]],
  };
}

function foto234(arv, destaque = [], caminho = [], fmt = String) {
  const D = new Set(destaque);
  const C = new Set(caminho);
  const nos = [];
  const arestas = [];
  const folga = 0.7;
  let cursor = 0;
  const rec = (no, prof) => {
    const n = no.chaves.length;
    let centro;
    if (no.folha) {
      centro = cursor + n / 2;
      cursor += n + folga;
    } else {
      const centros = no.filhos.map((f) => rec(f, prof + 1));
      centro = (centros[0] + centros[centros.length - 1]) / 2;
    }
    const id = "b4-" + no.chaves.join("-");
    const marcado = no.chaves.some((k) => D.has(k));
    const noCaminho = no.chaves.some((k) => C.has(k));
    nos.push({
      id, x: centro, y: prof, tipo: "caixa",
      rotulos: no.chaves.map(fmt),
      fortes: no.chaves.map((k) => D.has(k)),
      classe: marcado ? "destaque" : noCaminho ? "caminho" : "",
      extras: no.valores.map((v) => (v.length > 1 ? "×" + v.length : null)),
    });
    no.filhos.forEach((f, j) => arestas.push([id, "b4-" + f.chaves.join("-"), j]));
    return centro;
  };
  if (arv.raiz) rec(arv.raiz, 0);
  return {
    nos, arestas,
    info: [["chaves", arv.tamanho], ["nós", arv.contarNos()], ["altura", arv.altura()],
      ["divisões", arv.divisoes], ["fusões", arv.fusoes], ["empréstimos", arv.emprestimos]],
  };
}

const larguraNo = (n) => (n.tipo === "caixa" ? n.rotulos.length : 1);

/**
 * Desenha a foto no <svg>. anterior + t (0..1) fazem a interpolação da animação.
 * Retorna um mapa id -> [x, y] em pixels.
 */
function desenharFoto(svg, foto, anterior = null, t = 1, { maxUnidade = 64, margem = 26 } = {}) {
  const W = svg.clientWidth;
  const H = svg.clientHeight;
  if (!W || !H) return {};
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const nos = foto.nos;
  if (!nos.length) {
    svg.innerHTML = `<text class="vazio" x="${W / 2}" y="${H / 2}">${escaparHTML(foto.vazio || "árvore vazia")}</text>`;
    return {};
  }
  const xmin = Math.min(...nos.map((n) => n.x - larguraNo(n) / 2));
  const xmax = Math.max(...nos.map((n) => n.x + larguraNo(n) / 2));
  const ymax = Math.max(...nos.map((n) => n.y));
  const u = Math.min((W - 2 * margem) / Math.max(xmax - xmin, 1), maxUnidade);   // px por unidade
  const raio = Math.max(9, Math.min(u * 0.43, 22));
  const altCaixa = Math.max(22, Math.min(u * 0.92, 34));
  const temCaixa = nos.some((n) => n.tipo === "caixa");
  const meio = temCaixa ? altCaixa / 2 : raio;
  const sy = Math.min((H - 2 * margem - 2 * meio - 14) / Math.max(ymax, 1), 100);
  const ox = (W - (xmax - xmin) * u) / 2 - xmin * u;
  const oy = margem + meio;

  const antes = new Map();
  if (anterior && t < 1) anterior.nos.forEach((n) => antes.set(n.id, [n.x, n.y]));
  const pos = new Map();
  nos.forEach((n) => {
    let { x, y } = n;
    if (antes.has(n.id)) {
      const [x0, y0] = antes.get(n.id);
      x = x0 + (x - x0) * t;
      y = y0 + (y - y0) * t;
    }
    pos.set(n.id, [ox + x * u, oy + y * sy]);
  });
  const porId = new Map(nos.map((n) => [n.id, n]));
  const partes = [];

  foto.arestas.forEach(([a, b, j]) => {
    if (!pos.has(a) || !pos.has(b)) return;
    let [x1, y1] = pos.get(a);
    let [x2, y2] = pos.get(b);
    const pai = porId.get(a);
    if (pai.tipo === "caixa" && j !== null) {
      x1 = x1 - (pai.rotulos.length * u) / 2 + j * u;
      y1 += altCaixa / 2;
      y2 -= altCaixa / 2;
    }
    partes.push(`<line class="aresta" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
  });

  nos.forEach((n) => {
    const [cx, cy] = pos.get(n.id);
    if (n.tipo === "circulo") {
      const fator = { 1: 0.7, 2: 0.64, 3: 0.5 }[n.rotulo.length] || 0.42;
      const tam = Math.max(8, raio * fator);
      partes.push(`<g class="no ${n.classe}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${raio.toFixed(1)}"/>` +
        `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${tam.toFixed(1)}">${escaparHTML(n.rotulo)}</text>`);
      if (n.extra) {
        partes.push(`<text class="extra" x="${(cx + raio + 3).toFixed(1)}" y="${(cy - raio + 2).toFixed(1)}">${escaparHTML(n.extra)}</text>`);
      }
      partes.push("</g>");
    } else {
      const k = n.rotulos.length;
      const esq = cx - (k * u) / 2;
      const topo = cy - altCaixa / 2;
      const tam = Math.max(9, Math.min(14, u * 0.3));
      partes.push(`<g class="caixa ${n.classe}"><rect x="${esq.toFixed(1)}" y="${topo.toFixed(1)}" width="${(k * u).toFixed(1)}" height="${altCaixa.toFixed(1)}" rx="4"/>`);
      n.rotulos.forEach((rot, j) => {
        const xc = esq + (j + 0.5) * u;
        if (j) partes.push(`<line class="divisor" x1="${(esq + j * u).toFixed(1)}" y1="${topo.toFixed(1)}" x2="${(esq + j * u).toFixed(1)}" y2="${(topo + altCaixa).toFixed(1)}"/>`);
        partes.push(`<text class="${n.fortes[j] ? "forte" : ""}" x="${xc.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${tam.toFixed(1)}">${escaparHTML(rot)}</text>`);
        if (n.extras[j]) partes.push(`<text class="extra centro" x="${xc.toFixed(1)}" y="${(topo + altCaixa + 11).toFixed(1)}">${escaparHTML(n.extras[j])}</text>`);
      });
      partes.push("</g>");
    }
  });
  svg.innerHTML = partes.join("");
  return pos;
}

if (typeof module !== "undefined") module.exports = { fotoRN, foto234, desenharFoto, escaparHTML };
