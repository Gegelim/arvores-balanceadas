/*
 * INTERFACE DO SITE
 *
 * Liga os botões às árvores e mostra cada operação como uma sequência de
 * QUADROS. Durante uma inserção ou remoção, a árvore chama aoPasso(...) a cada
 * recoloração, rotação, divisão ou fusão; aqui cada chamada vira um quadro com
 * uma "foto" da árvore naquele instante. O Reprodutor exibe os quadros com
 * ⏮ ◀ ▶ ⏭, e os nós deslizam de uma posição para a outra.
 */
"use strict";
/* global ArvoreRubroNegra, Arvore234, ArvoreKD, Feira, BANCAS, CHAVES_PADRAO,
          fotoRN, foto234, desenharFoto, escaparHTML */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function lerInteiros(texto) {
  const partes = texto.split(/[\s,;]+/).filter(Boolean);
  if (!partes.length) return { erro: "Digite um ou mais números inteiros separados por espaço, por exemplo: 10 20 30." };
  const valores = partes.map(Number);
  if (valores.some((v) => !Number.isInteger(v))) {
    return { erro: "Use só números inteiros separados por espaço, por exemplo: 10 20 30." };
  }
  return { valores };
}

function definirLegenda(el, op, texto, erro = false) {
  el.classList.toggle("erro", erro);
  $(".chip-op", el).textContent = op || "";
  $(".texto", el).textContent = texto;
}

function mostrarEstatisticas(dl, info) {
  dl.innerHTML = info.map(([k, v]) => `<div><dt>${escaparHTML(k)}</dt><dd>${escaparHTML(v)}</dd></div>`).join("");
}

function aoRedimensionar(elementos, funcao) {
  const obs = new ResizeObserver(() => funcao());
  elementos.forEach((el) => obs.observe(el));
}

// ======================================================================= Reprodutor
class Reprodutor {
  constructor(raiz, aoMostrar) {
    this.aoMostrar = aoMostrar;      // função(quadro, quadroAnterior, t)
    this.quadros = [];
    this.i = 0;
    this.tocando = false;
    this.timer = null;
    this.raf = null;
    this.lista = $("[data-passos]", raiz);
    this.contador = $("[data-contador]", raiz);
    this.botaoTocar = $('[data-player="tocar"]', raiz);
    this.velocidade = $("[data-velocidade]", raiz);
    $$("[data-player]", raiz).forEach((botao) => botao.addEventListener("click", () => {
      const acao = botao.dataset.player;
      if (acao === "tocar") return this.alternar();
      this.parar();
      if (acao === "inicio") this.ir(0, false);
      else if (acao === "voltar") this.ir(this.i - 1, false);
      else if (acao === "avancar") this.ir(this.i + 1, true);
      else this.ir(this.quadros.length - 1, false);
    }));
    this.lista.addEventListener("click", (e) => {
      const botao = e.target.closest("button[data-i]");
      if (botao) {
        this.parar();
        this.ir(Number(botao.dataset.i), false);
      }
    });
  }

  carregar(quadros, tocar) {
    this.parar();
    this.quadros = quadros;
    this.lista.innerHTML = quadros.map((q, n) =>
      `<li><button type="button" data-i="${n}"><span class="num">${n}</span><span>` +
      `${q.op ? `<b>${escaparHTML(q.op)}</b> · ` : ""}${escaparHTML(q.texto)}</span></button></li>`).join("");
    if (tocar && quadros.length > 1) {
      this.ir(0, false);
      this.tocar();
    } else {
      this.ir(quadros.length - 1, false);
    }
  }

  ir(i, animar = true) {
    if (!this.quadros.length) return;
    i = Math.max(0, Math.min(i, this.quadros.length - 1));
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    const anterior = animar && !reduzMovimento && i === this.i + 1 ? this.quadros[this.i] : null;
    this.i = i;
    this.contador.textContent = `passo ${i} de ${this.quadros.length - 1}`;
    $$("button[data-i]", this.lista).forEach((b) => b.classList.toggle("atual", Number(b.dataset.i) === i));
    this.rolarLista();
    if (anterior) this.transicao(anterior, this.quadros[i]);
    else this.aoMostrar(this.quadros[i], null, 1);
  }

  rolarLista() {
    const botao = $(`button[data-i="${this.i}"]`, this.lista);
    if (!botao) return;
    const topo = botao.offsetTop;
    const fim = topo + botao.offsetHeight;
    if (topo < this.lista.scrollTop) this.lista.scrollTop = topo;
    else if (fim > this.lista.scrollTop + this.lista.clientHeight) this.lista.scrollTop = fim - this.lista.clientHeight;
  }

  transicao(anterior, quadro) {
    const inicio = performance.now();
    const duracao = 480;
    const passo = (agora) => {
      const p = Math.min(1, (agora - inicio) / duracao);
      const t = p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2;   // suaviza início e fim
      this.aoMostrar(quadro, anterior, t);
      this.raf = p < 1 ? requestAnimationFrame(passo) : null;
    };
    this.raf = requestAnimationFrame(passo);
  }

  redesenhar() {
    if (this.quadros.length && !this.raf) this.aoMostrar(this.quadros[this.i], null, 1);
  }

  atraso() {
    return 2900 - Number(this.velocidade.value);
  }

  alternar() {
    if (this.tocando) this.parar();
    else this.tocar();
  }

  tocar() {
    if (this.i >= this.quadros.length - 1) this.ir(0, false);
    this.tocando = true;
    this.botaoTocar.textContent = "⏸ Pausar";
    this.timer = setTimeout(() => this.tick(), this.atraso());
  }

  tick() {
    if (!this.tocando) return;
    if (this.i >= this.quadros.length - 1) {
      this.parar();
      return;
    }
    this.ir(this.i + 1, true);
    this.timer = setTimeout(() => this.tick(), this.atraso());
  }

  parar() {
    this.tocando = false;
    clearTimeout(this.timer);
    this.timer = null;
    this.botaoTocar.textContent = "▶ Reproduzir";
  }
}

function htmlReprodutor(id) {
  return `
    <div class="reprodutor">
      <div class="grupo">
        <button class="btn" type="button" data-player="inicio" title="Primeiro passo" aria-label="Primeiro passo">⏮</button>
        <button class="btn" type="button" data-player="voltar">◀ Voltar</button>
        <button class="btn primario" type="button" data-player="tocar">▶ Reproduzir</button>
        <button class="btn" type="button" data-player="avancar">Avançar ▶</button>
        <button class="btn" type="button" data-player="fim" title="Último passo" aria-label="Último passo">⏭</button>
      </div>
      <span class="contador" data-contador></span>
      <label class="velocidade">lento <input type="range" id="${id}-velocidade" min="300" max="2600" value="1500" data-velocidade aria-label="Velocidade"> rápido</label>
    </div>`;
}

// ============================================================ Rubro-Negra e 2-3-4
const CONCEITOS_RN = `
<div class="conceitos">
  <div class="legenda-cores">
    <span><i class="bolinha vermelho"></i>vermelho</span><span><i class="bolinha preto"></i>preto</span>
    <span><i class="bolinha destaque"></i>envolvido no passo</span><span><i class="bolinha caminho"></i>caminho da busca</span>
  </div>
  <p class="titulo-bloco">Propriedades</p>
  <ol>
    <li><b>1.</b> Todo nó é vermelho ou preto.</li>
    <li data-caso="raiz"><b>2.</b> A raiz é preta.</li>
    <li><b>3.</b> As folhas vazias (NIL) são pretas.</li>
    <li><b>4.</b> Nó vermelho não tem filho vermelho.</li>
    <li><b>5.</b> Todo caminho até as folhas passa pelo mesmo número de nós pretos (altura negra).</li>
  </ol>
  <p class="titulo-bloco">Inserção: o nó novo nasce vermelho. Se o pai também é vermelho, olha o tio.</p>
  <ul>
    <li data-caso="ins-1"><b>Caso 1 · tio vermelho.</b> Recolore pai, tio e avô; o problema sobe para o avô.</li>
    <li data-caso="ins-2"><b>Caso 2 · tio preto, triângulo.</b> Rotação no pai transforma em linha.</li>
    <li data-caso="ins-3"><b>Caso 3 · tio preto, linha.</b> Recolore e faz rotação no avô.</li>
  </ul>
  <p class="titulo-bloco">Remoção: se sai um nó preto, sobra um preto extra (duplo preto). Olha o irmão.</p>
  <ul>
    <li data-caso="rem-1"><b>Caso 1 · irmão vermelho.</b> Rotação no pai; cai num dos outros casos.</li>
    <li data-caso="rem-2"><b>Caso 2 · irmão preto, sobrinhos pretos.</b> O irmão fica vermelho e o problema sobe.</li>
    <li data-caso="rem-3"><b>Caso 3 · sobrinho de dentro vermelho e sobrinho de fora preto.</b> Rotação no irmão; vira o caso 4.</li>
    <li data-caso="rem-4"><b>Caso 4 · sobrinho de fora vermelho.</b> O irmão herda a cor do pai, pai e sobrinho de fora ficam pretos, e a rotação no pai resolve.</li>
  </ul>
  <p class="titulo-bloco">Repetidos</p>
  <ul><li data-caso="repetido">A chave não é duplicada: o nó ganha um contador (×2, ×3) e não há rebalanceamento.</li></ul>
</div>`;

const CONCEITOS_234 = `
<div class="conceitos">
  <div class="legenda-cores">
    <span><i class="bolinha destaque"></i>chaves envolvidas no passo</span><span><i class="bolinha caminho"></i>caminho da busca</span>
  </div>
  <p class="titulo-bloco">Estrutura</p>
  <ul>
    <li><b>2-nó, 3-nó, 4-nó:</b> 1, 2 ou 3 chaves, com 2, 3 ou 4 filhos.</li>
    <li><b>Todas as folhas no mesmo nível.</b> A árvore está sempre perfeitamente balanceada. É uma árvore B de ordem 4.</li>
  </ul>
  <p class="titulo-bloco">Inserção, de cima para baixo</p>
  <ul>
    <li data-caso="divisao"><b>Divisão.</b> Na descida, todo 4-nó é dividido e a chave do meio sobe para o pai. Se a raiz se divide, a árvore ganha um nível pela raiz.</li>
    <li data-caso="folha"><b>Folha.</b> A chave nova sempre entra numa folha, que nunca está cheia.</li>
  </ul>
  <p class="titulo-bloco">Remoção, de cima para baixo</p>
  <ul>
    <li data-caso="emprestimo"><b>Empréstimo.</b> Antes de descer para um filho com 1 chave, um irmão com 2 ou mais cede uma chave, que passa pelo pai.</li>
    <li data-caso="fusao"><b>Fusão.</b> Sem irmão para emprestar, junta o filho, uma chave do pai e o irmão. Se a raiz esvazia, a árvore perde um nível.</li>
    <li data-caso="troca"><b>Chave em nó interno.</b> Troca pelo predecessor (ou sucessor) e remove na folha.</li>
  </ul>
  <p class="titulo-bloco">Repetidos</p>
  <ul><li data-caso="repetido">Cada chave tem um balde de itens (×2, ×3). Repetir não causa divisão.</li></ul>
</div>`;

function casoRN(op, texto) {
  const m = /^Caso (\d)/.exec(texto);
  if (m) return (op === "INSERIR" ? "ins-" : "rem-") + m[1];
  if (/REPETIDA|repetições/.test(texto)) return "repetido";
  if (/recolorida para PRETO/.test(texto)) return "raiz";
  return null;
}

function caso234(op, texto) {
  if (/DIVISÃO|4-nó/.test(texto)) return "divisao";
  if (/EMPRÉSTIMO/.test(texto)) return "emprestimo";
  if (/FUSÃO/.test(texto)) return "fusao";
  if (/PREDECESSOR|SUCESSOR/.test(texto)) return "troca";
  if (/REPETIDA|balde/.test(texto)) return "repetido";
  if (/folha/.test(texto)) return "folha";
  return null;
}

function caminhoRN(arv, v) {
  const grupos = [];
  for (let no = arv.raiz; no !== arv.NIL; no = v < no.chave ? no.esq : no.dir) {
    grupos.push([no.chave]);
    if (v === no.chave) break;
  }
  return grupos;
}

function caminho234(arv, v) {
  const grupos = [];
  let no = arv.raiz;
  while (no) {
    grupos.push([...no.chaves]);
    const i = Arvore234.posicao(no, v);
    if ((i < no.chaves.length && no.chaves[i] === v) || no.folha) break;
    no = no.filhos[i];
  }
  return grupos;
}

class VistaArvore {
  constructor(secao, cfg) {
    this.cfg = cfg;
    const id = secao.dataset.vista;
    secao.innerHTML = `
      <div class="cabecalho-vista"><div><h2>${cfg.titulo}</h2><p>${cfg.resumo}</p></div></div>
      <form class="ferramentas" data-form>
        <div class="grupo">
          <label class="rotulo-pequeno" for="${id}-valores">Valores</label>
          <input class="campo" id="${id}-valores" data-entrada inputmode="numeric" autocomplete="off" placeholder="ex.: 10 20 30" size="16">
          <button class="btn primario" type="submit">Inserir</button>
          <button class="btn" type="button" data-acao="remover">Remover</button>
          <button class="btn" type="button" data-acao="buscar">Buscar</button>
        </div>
        <div class="grupo">
          <button class="btn sutil" type="button" data-acao="padrao">Carregar 25 valores</button>
          <button class="btn sutil" type="button" data-acao="aleatorios">+5 aleatórios</button>
          <button class="btn sutil" type="button" data-acao="limpar">Limpar</button>
          <label class="alternar"><input type="checkbox" id="${id}-animar" data-animar checked>Animar</label>
        </div>
      </form>
      <div class="legenda" data-legenda aria-live="polite"><span class="chip-op"></span><span class="texto"></span></div>
      <div class="area">
        <div class="coluna">
          <svg class="palco" data-palco role="img" aria-label="${cfg.titulo}"></svg>
          ${htmlReprodutor(id)}
          <dl class="estatisticas" data-estatisticas></dl>
        </div>
        <aside class="painel">
          <section><h3>Passos da operação</h3><ol class="passos" data-passos></ol></section>
          <section><h3>Conceitos</h3>${cfg.conceitos}</section>
        </aside>
      </div>`;
    this.entrada = $("[data-entrada]", secao);
    this.animar = $("[data-animar]", secao);
    this.legenda = $("[data-legenda]", secao);
    this.palco = $("[data-palco]", secao);
    this.estatisticas = $("[data-estatisticas]", secao);
    this.casos = $$("[data-caso]", secao);
    this.rep = new Reprodutor(secao, (q, ant, t) => this.mostrar(q, ant, t));

    $("[data-form]", secao).addEventListener("submit", (e) => {
      e.preventDefault();
      this.comValores((vs) => this.executar("INSERIR", vs, (v) => this.arv.inserir(v)));
    });
    const acoes = {
      remover: () => this.comValores((vs) => this.executar("REMOVER", vs, (v) => this.arv.remover(v))),
      buscar: () => this.comValores((vs) => this.buscar(vs[0])),
      padrao: () => this.carregarPadrao(),
      aleatorios: () => this.aleatorios(),
      limpar: () => this.limpar(),
    };
    $$("[data-acao]", secao).forEach((b) => b.addEventListener("click", acoes[b.dataset.acao]));
    aoRedimensionar([this.palco], () => this.rep.redesenhar());

    this.carregarPadrao(cfg.mensagemInicial);
  }

  comValores(funcao) {
    const { valores, erro } = lerInteiros(this.entrada.value);
    if (erro) {
      definirLegenda(this.legenda, "", erro, true);
      this.entrada.focus();
      return;
    }
    this.entrada.value = "";
    funcao(valores);
  }

  mostrar(quadro, anterior, t) {
    definirLegenda(this.legenda, quadro.op, quadro.texto);
    desenharFoto(this.palco, quadro.foto, anterior ? anterior.foto : null, t);
    mostrarEstatisticas(this.estatisticas, quadro.foto.info);
    this.casos.forEach((li) => li.classList.toggle("ativo", !!quadro.caso && li.dataset.caso === quadro.caso));
  }

  executar(op, valores, metodo, tocar = this.animar.checked) {
    const quadros = [{ op: "ANTES", texto: `Árvore com ${this.arv.tamanho} chave(s) antes de ${op.toLowerCase()} ${valores.join(", ")}`, foto: this.cfg.foto(this.arv) }];
    valores.forEach((v) => {
      this.arv.aoPasso = (arv, texto, destaque) => quadros.push({
        op: `${op} ${v}`, texto, foto: this.cfg.foto(arv, destaque), caso: this.cfg.caso(op, texto),
      });
      metodo(v);
    });
    this.arv.aoPasso = null;
    let conferido;
    try {
      this.arv.validar();
      conferido = "todas as propriedades conferidas ✓";
    } catch (e) {
      conferido = "PROPRIEDADE VIOLADA: " + e.message;
    }
    quadros.push({ op: "FIM", texto: `${op === "INSERIR" ? "Inserção" : "Remoção"} de ${valores.join(", ")} concluída, ${conferido}`, foto: this.cfg.foto(this.arv) });
    this.rep.carregar(quadros, tocar);
  }

  buscar(v) {
    const achou = this.arv.buscar(v) !== null;
    const caminho = this.cfg.caminho(this.arv, v);
    const quadros = [{ op: `BUSCAR ${v}`, texto: "Começa pela raiz", foto: this.cfg.foto(this.arv) }];
    this.arv.passos.forEach((texto, i) => {
      const visitadas = caminho.slice(0, i + 1).flat();
      const ultimo = i === this.arv.passos.length - 1;
      quadros.push({ op: `BUSCAR ${v}`, texto, foto: this.cfg.foto(this.arv, achou && ultimo ? [v] : [], visitadas) });
    });
    quadros.push({
      op: "FIM",
      texto: `${v} ${achou ? "ENCONTRADO" : "NÃO encontrado"} depois de visitar ${caminho.length} nó(s); a altura da árvore é ${this.arv.altura()}`,
      foto: this.cfg.foto(this.arv, achou ? [v] : [], caminho.flat()),
    });
    this.rep.carregar(quadros, this.animar.checked);
  }

  carregarPadrao(mensagem = "25 valores inseridos e o 31 repetido. Use ⏮ e ▶ para rever cada passo, ou clique na lista de passos.") {
    this.arv = this.cfg.criar();
    this.executar("INSERIR", [...CHAVES_PADRAO, 31], (v) => this.arv.inserir(v), false);
    const ultimo = this.rep.quadros[this.rep.quadros.length - 1];
    Object.assign(ultimo, { op: "PRONTO", texto: mensagem });
    this.rep.redesenhar();
  }

  aleatorios() {
    const existentes = new Set(this.arv.emOrdem().map((e) => e.chave));
    const livres = [];
    for (let v = 1; v < 100; v++) if (!existentes.has(v)) livres.push(v);
    const escolhidos = [];
    while (escolhidos.length < 5 && livres.length) escolhidos.push(...livres.splice(Math.floor(Math.random() * livres.length), 1));
    if (!escolhidos.length) {
      definirLegenda(this.legenda, "", "Todos os números de 1 a 99 já estão na árvore.", true);
      return;
    }
    this.executar("INSERIR", escolhidos, (v) => this.arv.inserir(v));
  }

  limpar() {
    this.arv = this.cfg.criar();
    this.rep.carregar([{ op: "", texto: "Árvore vazia. Digite valores e clique em Inserir; por exemplo, 10 20 30.", foto: this.cfg.foto(this.arv) }], false);
    this.entrada.focus();
  }
}

// ======================================================================= Comparar
function iniciarComparar() {
  let rn = new ArvoreRubroNegra();
  let b4 = new Arvore234();
  const legenda = $("#cmp-legenda");
  const entrada = $("#cmp-valores");
  const desenhar = () => {
    const f1 = fotoRN(rn);
    const f2 = foto234(b4);
    desenharFoto($("#cmp-rn"), f1);
    desenharFoto($("#cmp-234"), f2);
    mostrarEstatisticas($("#cmp-info-rn"), f1.info.slice(0, 3));
    mostrarEstatisticas($("#cmp-info-234"), f2.info.slice(0, 3));
  };
  const operar = (op) => {
    const { valores, erro } = lerInteiros(entrada.value);
    if (erro) return definirLegenda(legenda, "", erro, true);
    entrada.value = "";
    valores.forEach((v) => {
      if (op === "INSERIR") {
        rn.inserir(v);
        b4.inserir(v);
      } else {
        rn.remover(v, true);
        b4.remover(v);
      }
    });
    definirLegenda(legenda, `${op} ${valores.join(" ")}`, "Compare: cada nó preto com seus filhos vermelhos corresponde a uma caixa da 2-3-4.");
    desenhar();
  };
  $("#cmp-form").addEventListener("submit", (e) => { e.preventDefault(); operar("INSERIR"); });
  $("#cmp-remover").addEventListener("click", () => operar("REMOVER"));
  $("#cmp-padrao").addEventListener("click", () => {
    rn = new ArvoreRubroNegra();
    b4 = new Arvore234();
    entrada.value = CHAVES_PADRAO.join(" ");
    operar("INSERIR");
  });
  $("#cmp-limpar").addEventListener("click", () => {
    rn = new ArvoreRubroNegra();
    b4 = new Arvore234();
    definirLegenda(legenda, "", "Árvores vazias. Insira valores para ver as duas crescerem juntas.");
    desenhar();
  });
  aoRedimensionar([$("#cmp-rn"), $("#cmp-234")], desenhar);
  CHAVES_PADRAO.forEach((v) => { rn.inserir(v); b4.inserir(v); });
  definirLegenda(legenda, "", "As duas árvores têm as mesmas 25 chaves. Cada nó preto com seus filhos vermelhos corresponde a uma caixa da 2-3-4.");
  desenhar();
}

// ============================================================================ k-D
function iniciarKD() {
  const secao = $("#v-kd");
  const plano = $("#kd-plano");
  const svgArvore = $("#kd-arvore");
  const legenda = $("#kd-legenda");
  const animar = $("#kd-animar");
  const casos = $$("[data-caso]", secao);
  const EXEMPLO = [[[7, 2], "A"], [[5, 4], "B"], [[9, 6], "C"], [[2, 3], "D"], [[4, 7], "E"], [[8, 1], "F"], [[6, 8], "G"]];
  let arv = new ArvoreKD();
  let lim = 10;
  let proximoRotulo = 0;

  const novoRotulo = () => {
    proximoRotulo++;
    return proximoRotulo <= 26 ? String.fromCharCode(64 + proximoRotulo) : `P${proximoRotulo}`;
  };
  const nivel = (no) => {
    let n = 0;
    for (let p = no.pai; p; p = p.pai) n++;
    return n;
  };
  const descendentes = (no) => {
    const saida = new Set();
    const pilha = [no];
    while (pilha.length) {
      const n = pilha.pop();
      if (n) {
        saida.add(n);
        pilha.push(n.esq, n.dir);
      }
    }
    return saida;
  };
  const regioes = () => {
    const mapa = new Map();
    const rec = (no, x0, x1, y0, y1) => {
      if (!no) return;
      mapa.set(no, [x0, x1, y0, y1]);
      if (no.eixo === 0) {
        rec(no.esq, x0, no.ponto[0], y0, y1);
        rec(no.dir, no.ponto[0], x1, y0, y1);
      } else {
        rec(no.esq, x0, x1, y0, no.ponto[1]);
        rec(no.dir, x0, x1, no.ponto[1], y1);
      }
    };
    rec(arv.raiz, 0, lim, 0, lim);
    return mapa;
  };
  const geometria = () => {
    const W = plano.clientWidth;
    const H = plano.clientHeight;
    const lado = Math.max(60, Math.min(W - 40, H - 40));
    return { W, H, lado, ox: (W - lado) / 2 + 6, oy: (H - lado) / 2 - 4 };
  };
  const tela = (x, y) => {
    const { lado, ox, oy } = geometria();
    return [ox + (x / lim) * lado, oy + (1 - y / lim) * lado];
  };
  const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  function desenharPlano(est) {
    const { W, H, lado, ox, oy } = geometria();
    if (!W || !H) return;
    plano.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const reg = regioes();
    const todos = [...reg.keys()];
    const visiveis = est.visiveis || new Set(todos);
    const p = [];
    (est.podas || []).forEach((raiz) => {
      const [x0, x1, y0, y1] = reg.get(raiz);
      const [ax, ay] = tela(x0, y1);
      const [bx, by] = tela(x1, y0);
      p.push(`<rect class="regiao-podada" x="${ax}" y="${ay}" width="${bx - ax}" height="${by - ay}"/>`);
    });
    p.push(`<rect class="moldura" x="${ox}" y="${oy}" width="${lado}" height="${lado}"/>`);
    [0, lim / 2, lim].forEach((v) => {
      const [tx, ty] = tela(v, 0);
      p.push(`<text class="marcador" x="${tx}" y="${ty + 13}">${v}</text>`);
      const [sx, sy] = tela(0, v);
      p.push(`<text class="marcador" x="${sx - 12}" y="${sy}">${v}</text>`);
    });
    todos.forEach((no) => {
      if (!visiveis.has(no)) return;
      const [x0, x1, y0, y1] = reg.get(no);
      const [a, b] = no.eixo === 0 ? [tela(no.ponto[0], y0), tela(no.ponto[0], y1)] : [tela(x0, no.ponto[1]), tela(x1, no.ponto[1])];
      const classe = (no.eixo === 0 ? "corte-x" : "corte-y") + (no === est.atual ? " atual" : "");
      p.push(`<line class="${classe}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`);
    });
    if (est.alvo && est.raio != null) {
      const [cx, cy] = tela(...est.alvo);
      const r = (est.raio / lim) * lado;
      const [mx, my] = tela(...est.melhor.ponto);
      p.push(`<circle class="circulo-busca" cx="${cx}" cy="${cy}" r="${r}"/>`);
      p.push(`<line class="linha-busca" x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}"/>`);
    }
    todos.forEach((no) => {
      let classe = "ponto";
      if (no === est.melhor) classe += " melhor";
      else if (est.podados && est.podados.has(no)) classe += " podado";
      else if ((est.visitados && est.visitados.has(no)) || (est.caminho && est.caminho.has(no))) classe += " visitado";
      else if (!visiveis.has(no)) {
        if (!est.soltos) return;           // ponto que ainda vai ser inserido
        classe += " solto";                // ponto que a construção ainda não posicionou
      }
      const [px, py] = tela(...no.ponto);
      if (no === est.atual) p.push(`<circle class="anel-atual" cx="${px}" cy="${py}" r="12"/>`);
      p.push(`<circle class="${classe}" cx="${px}" cy="${py}" r="6"/>`);
      p.push(`<text class="rotulo-ponto" x="${px + 9}" y="${py - 10}">${escaparHTML(no.rotulo)}</text>`);
    });
    if (est.alvo) {
      const [cx, cy] = tela(...est.alvo);
      const pontas = [];
      for (let k = 0; k < 10; k++) {
        const ang = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 === 0 ? 11 : 5;
        pontas.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
      }
      p.push(`<polygon class="alvo" points="${pontas.join(" ")}"/>`);
      p.push(`<text class="rotulo-alvo" x="${cx}" y="${cy + 20}">cliente</text>`);
    }
    plano.innerHTML = p.join("");
  }

  function desenharArvore(est) {
    const visiveis = est.visiveis || new Set(arv.nos());
    const nos = [];
    const arestas = [];
    let cont = 0;
    const ids = new Map();
    const rec = (no, prof) => {
      if (!no) return;
      rec(no.esq, prof + 1);
      const x = cont++;
      ids.set(no, "kd" + x);
      rec(no.dir, prof + 1);
      if (!visiveis.has(no)) return;
      let classe = est.podados && est.podados.has(no) ? "podado" : no.eixo === 0 ? "eixo-x" : "eixo-y";
      if (no === est.atual) classe += " destaque";
      else if (no === est.melhor) classe += " melhor";
      else if ((est.visitados && est.visitados.has(no)) || (est.caminho && est.caminho.has(no))) classe += " visitado";
      nos.push({ id: ids.get(no), x, y: prof, tipo: "circulo", rotulo: no.rotulo, classe, extra: no.eixo === 0 ? "x" : "y" });
      [no.esq, no.dir].forEach((f) => { if (f && visiveis.has(f)) arestas.push([ids.get(no), ids.get(f), null]); });
    };
    rec(arv.raiz, 0);
    desenharFoto(svgArvore, { nos, arestas, vazio: "nenhum ponto na árvore ainda" });
    const n = arv.tamanho;
    mostrarEstatisticas($("#kd-info"), [["pontos", n], ["altura", arv.altura()],
      ["altura mínima possível", n ? Math.ceil(Math.log2(n + 1)) : 0]]);
  }

  const rep = new Reprodutor(secao, (q) => {
    definirLegenda(legenda, q.op, q.texto);
    desenharPlano(q.est);
    desenharArvore(q.est);
    casos.forEach((li) => li.classList.toggle("ativo", !!q.caso && li.dataset.caso === q.caso));
  });
  aoRedimensionar([plano, svgArvore], () => rep.redesenhar());

  function construir(pontos, titulo, tocar = animar.checked) {
    arv = new ArvoreKD();
    arv.construir(pontos.map(([ponto, rotulo]) => ({ ponto, rotulo })));
    const ordem = arv.nos();
    const quadros = [{ op: "CONSTRUIR", texto: `${titulo}: ${pontos.length} pontos. Em cada nível, escolhe a mediana do eixo.`, est: { visiveis: new Set(), soltos: true }, caso: "mediana" }];
    ordem.forEach((no, k) => {
      const eixo = no.eixo === 0 ? "x (reta vertical)" : "y (reta horizontal)";
      quadros.push({
        op: `NÍVEL ${nivel(no)}`, texto: `Ordena por ${eixo} e escolhe a mediana: ${no.rotulo} ${ArvoreKD.fmt(no.ponto)}`,
        est: { visiveis: new Set(ordem.slice(0, k + 1)), atual: no, soltos: true }, caso: k === 0 ? "eixos" : "mediana",
      });
    });
    const minimo = pontos.length ? Math.ceil(Math.log2(pontos.length + 1)) : 0;
    quadros.push({ op: "FIM", texto: `Árvore construída com altura ${arv.altura()} (a menor possível é ${minimo}). Clique no plano para buscar o ponto mais próximo.`, est: {}, caso: "mediana" });
    rep.carregar(quadros, tocar);
  }

  function inserir(ponto) {
    const rotulo = novoRotulo();
    const novo = arv.inserir(ponto, rotulo);
    const caminho = [];
    for (let p = novo.pai; p; p = p.pai) caminho.unshift(p);
    const visiveis = new Set(arv.nos());
    visiveis.delete(novo);
    const quadros = [{ op: `INSERIR ${rotulo}`, texto: `Novo ponto ${ArvoreKD.fmt(ponto)}: começa pela raiz`, est: { visiveis }, caso: "inserir" }];
    arv.passos.forEach((texto, i) => {
      quadros.push({ op: `INSERIR ${rotulo}`, texto, est: { visiveis, atual: caminho[i] || novo, caminho: new Set(caminho.slice(0, i + 1)) }, caso: "inserir" });
    });
    quadros.push({
      op: "FIM",
      texto: `${rotulo} ${ArvoreKD.fmt(ponto)} entrou como folha no nível ${nivel(novo)} e vai cortar por ${novo.eixo === 0 ? "x" : "y"}. ` +
             `Altura atual: ${arv.altura()}. Inserir sem reconstruir pode desbalancear.`,
      est: { atual: novo, caminho: new Set(caminho) }, caso: "inserir",
    });
    rep.carregar(quadros, animar.checked);
  }

  function buscar(alvo) {
    if (!arv.raiz) {
      definirLegenda(legenda, "", "A árvore está vazia. Use “Exemplo” ou mude para “inserir ponto”.", true);
      return;
    }
    const final = arv.vizinhoMaisProximo(alvo);
    const visitados = new Set();
    let podados = new Set();
    const podas = [];
    let melhor = null;
    let raio = null;
    const quadros = [{ op: "BUSCAR", texto: `Cliente em ${ArvoreKD.fmt(alvo)}. A busca desce como numa BST, começando pela raiz.`, est: { alvo }, caso: "visita" }];
    arv.eventos.forEach((ev) => {
      let texto;
      let atual;
      let caso;
      if (ev[0] === "visita") {
        const [, no, d, melhorou] = ev;
        visitados.add(no);
        if (melhorou) {
          melhor = no;
          raio = d;
        }
        texto = `Visita ${no.rotulo} ${ArvoreKD.fmt(no.ponto)}: distância ${d.toFixed(2)}` +
                (melhorou ? ", NOVO MELHOR" : `; o melhor continua ${melhor.rotulo}`);
        atual = no;
        caso = "visita";
      } else {
        const [, no, longe, dCorte] = ev;
        podados = new Set([...podados, ...descendentes(longe)]);
        podas.push(longe);
        texto = `PODA em ${no.rotulo}: a reta está a ${dCorte.toFixed(2)}, mais longe que o melhor (${raio.toFixed(2)}). ` +
                `A subárvore de ${longe.rotulo} nem é visitada.`;
        atual = no;
        caso = "poda";
      }
      quadros.push({ op: "BUSCAR", texto, caso, est: { alvo, visitados: new Set(visitados), podados: new Set(podados), podas: [...podas], melhor, raio, atual } });
    });
    quadros.push({
      op: "FIM",
      texto: `Mais próximo: ${final.no.rotulo} ${ArvoreKD.fmt(final.no.ponto)}, a ${final.dist.toFixed(2)}. ` +
             `Visitou ${visitados.size} de ${arv.tamanho} pontos; a força bruta visitaria todos.`,
      est: { alvo, visitados, podados, podas, melhor: final.no, raio: final.dist }, caso: podas.length ? "poda" : "visita",
    });
    rep.carregar(quadros, animar.checked);
  }

  plano.addEventListener("click", (e) => {
    const r = plano.getBoundingClientRect();
    const { lado, ox, oy } = geometria();
    const x = ((e.clientX - r.left - ox) / lado) * lim;
    const y = (1 - (e.clientY - r.top - oy) / lado) * lim;
    if (x < 0 || y < 0 || x > lim || y > lim) return;
    const arred = (v) => (lim === 100 ? Math.round(v) : Math.round(v * 10) / 10);
    const ponto = [arred(x), arred(y)];
    if ($("#kd-modo-inserir").checked) inserir(ponto);
    else buscar(ponto);
  });

  const pontosAtuais = () => arv.nos().map((n) => [n.ponto, n.rotulo]);
  $("#kd-exemplo").addEventListener("click", () => { lim = 10; proximoRotulo = 7; construir(EXEMPLO, "Exemplo"); });
  $("#kd-bancas").addEventListener("click", () => { lim = 100; proximoRotulo = 0; construir(BANCAS.map(([n, p]) => [p, n]), "Bancas da feira"); });
  $("#kd-aleatorios").addEventListener("click", () => {
    const pontos = pontosAtuais();
    for (let k = 0; k < 5; k++) {
      const v = () => (lim === 100 ? Math.round(Math.random() * 100) : Math.round(Math.random() * 100) / 10);
      pontos.push([[v(), v()], novoRotulo()]);
    }
    construir(pontos, "5 pontos aleatórios adicionados e árvore reconstruída");
  });
  $("#kd-reconstruir").addEventListener("click", () => {
    if (!arv.raiz) return definirLegenda(legenda, "", "Não há pontos. Use “Exemplo” ou insira pontos clicando no plano.", true);
    construir(pontosAtuais(), `Reconstrução (altura antes: ${arv.altura()})`);
  });
  $("#kd-limpar").addEventListener("click", () => {
    arv = new ArvoreKD();
    proximoRotulo = 0;
    $("#kd-modo-inserir").checked = true;
    rep.carregar([{ op: "", texto: "Árvore vazia. O modo “inserir ponto” está ativo: clique no plano para adicionar pontos.", est: {} }], false);
  });

  construir(EXEMPLO, "Exemplo", false);
  proximoRotulo = 7;
  Object.assign(rep.quadros[rep.quadros.length - 1], { op: "PRONTO", texto: "Exemplo com 7 pontos já construído. Use ⏮ e ▶ para ver a construção pela mediana, ou clique no plano para buscar o ponto mais próximo." });
  rep.redesenhar();
}

// ========================================================================== Feira
function iniciarFeira() {
  let passos = [];
  const gravar = (origem) => (arv, texto) => passos.push([origem, texto]);
  const feira = new Feira({ aoPassoRN: gravar("RN"), aoPasso234: gravar("2-3-4") });
  feira.carregarExemplo();
  passos = [];
  const legenda = $("#feira-legenda");
  const corpo = $("#feira-tabela");
  const mapa = $("#feira-mapa");
  const campos = { codigo: $("#f-codigo"), nome: $("#f-nome"), preco: $("#f-preco"), qtd: $("#f-qtd"), banca: $("#f-banca") };
  let selecionado = null;
  let destaqueRN = [];
  let destaque234 = [];
  let cliente = null;
  let resposta = null;
  let visitadasMapa = new Set();

  const reais = (v) => v.toFixed(2).replace(".", ",");

  function tabela(produtos, titulo) {
    $("#feira-titulo-tabela").textContent = titulo;
    corpo.innerHTML = produtos.length
      ? produtos.map((p) => `<tr data-codigo="${p.codigo}" class="${p.codigo === selecionado ? "selecionada" : ""}">` +
        `<td class="num">${p.codigo}</td><td>${escaparHTML(p.nome)}</td><td class="num">${reais(p.preco)}</td>` +
        `<td class="num">${p.quantidade}</td><td class="num">${escaparHTML(p.banca)}</td></tr>`).join("")
      : `<tr><td colspan="5">Nenhum produto encontrado.</td></tr>`;
  }

  function log(extras = []) {
    const itens = [...extras, ...passos];
    $("#feira-log").innerHTML = itens.length
      ? itens.map(([o, t]) => `<li><span class="origem">${escaparHTML(o)}</span>${escaparHTML(t)}</li>`).join("")
      : "<li>Nenhuma mudança de estrutura nesta operação.</li>";
    passos = [];
  }

  function indices() {
    const f1 = fotoRN(feira.porCodigo, destaqueRN);
    const f2 = foto234(feira.porPreco, destaque234, [], (c) => (c % 100 === 0 ? String(c / 100) : reais(c / 100)));
    desenharFoto($("#feira-rn"), f1, null, 1, { maxUnidade: 44 });
    desenharFoto($("#feira-234"), f2, null, 1, { maxUnidade: 60 });
    mostrarEstatisticas($("#feira-info-rn"), f1.info.slice(0, 3));
    mostrarEstatisticas($("#feira-info-234"), f2.info.slice(0, 3));
  }

  function desenharMapa() {
    const W = mapa.clientWidth;
    const H = mapa.clientHeight;
    if (!W || !H) return;
    mapa.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const lado = Math.min(W, H) - 24;
    const ox = (W - lado) / 2;
    const oy = (H - lado) / 2;
    const tela = (x, y) => [ox + (x / 100) * lado, oy + (1 - y / 100) * lado];
    const p = [`<rect class="moldura" x="${ox}" y="${oy}" width="${lado}" height="${lado}"/>`];
    const cortes = (no, x0, x1, y0, y1) => {
      if (!no) return;
      if (no.eixo === 0) {
        const [a, b] = [tela(no.ponto[0], y0), tela(no.ponto[0], y1)];
        p.push(`<line class="corte-x corte-suave" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`);
        cortes(no.esq, x0, no.ponto[0], y0, y1);
        cortes(no.dir, no.ponto[0], x1, y0, y1);
      } else {
        const [a, b] = [tela(x0, no.ponto[1]), tela(x1, no.ponto[1])];
        p.push(`<line class="corte-y corte-suave" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`);
        cortes(no.esq, x0, x1, y0, no.ponto[1]);
        cortes(no.dir, x0, x1, no.ponto[1], y1);
      }
    };
    cortes(feira.bancas.raiz, 0, 100, 0, 100);
    if (cliente && resposta) {
      const [cx, cy] = tela(...cliente);
      const [bx, by] = tela(...resposta.no.ponto);
      p.push(`<circle class="circulo-busca" cx="${cx}" cy="${cy}" r="${(resposta.dist / 100) * lado}"/>`);
      p.push(`<line class="linha-busca" x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}"/>`);
    }
    BANCAS.forEach(([nome, [x, y]]) => {
      const [px, py] = tela(x, y);
      const escolhida = resposta && resposta.no.rotulo === nome;
      const visitada = visitadasMapa.has(nome);
      p.push(`<g class="banca${escolhida ? " escolhida" : visitada ? " visitada" : ""}"><rect x="${px - 17}" y="${py - 11}" width="34" height="22" rx="4"/>` +
             `<text x="${px}" y="${py}">${nome}</text></g>`);
    });
    if (cliente) {
      const [cx, cy] = tela(...cliente);
      p.push(`<circle class="ponto melhor" cx="${cx}" cy="${cy}" r="7"/><text class="rotulo-alvo" x="${cx}" y="${cy + 19}">você</text>`);
    }
    mapa.innerHTML = p.join("");
  }

  function todos(mensagem) {
    tabela(feira.listar(), `Produtos (${feira.porCodigo.tamanho}, em ordem de código)`);
    if (mensagem) definirLegenda(legenda, mensagem[0], mensagem[1], mensagem[2]);
  }

  function lerCodigo() {
    const codigo = Number(campos.codigo.value);
    if (!campos.codigo.value.trim() || !Number.isInteger(codigo)) {
      definirLegenda(legenda, "", "Informe um código inteiro no campo Código.", true);
      campos.codigo.focus();
      return null;
    }
    return codigo;
  }

  function preencher(p) {
    campos.codigo.value = p.codigo;
    campos.nome.value = p.nome;
    campos.preco.value = reais(p.preco);
    campos.qtd.value = p.quantidade;
    campos.banca.value = p.banca;
  }

  corpo.addEventListener("click", (e) => {
    const linha = e.target.closest("tr[data-codigo]");
    if (!linha) return;
    selecionado = Number(linha.dataset.codigo);
    const p = feira.porCodigo.localizar(selecionado).valor;
    preencher(p);
    $$("tr", corpo).forEach((tr) => tr.classList.toggle("selecionada", tr === linha));
    destaqueRN = [p.codigo];
    destaque234 = [p.centavos];
    indices();
  });

  $("#feira-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const codigo = lerCodigo();
    if (codigo === null) return;
    const preco = Number(campos.preco.value.replace(",", "."));
    const qtd = Number(campos.qtd.value);
    if (!(preco > 0) || !Number.isInteger(qtd) || qtd <= 0) {
      definirLegenda(legenda, "", "Para cadastrar, informe um preço maior que zero e uma quantidade inteira.", true);
      return;
    }
    const nome = campos.nome.value.trim() || "Produto sem nome";
    const banca = (campos.banca.value.trim() || "B01").toUpperCase();
    const msg = feira.cadastrar(codigo, nome, preco, qtd, banca);
    selecionado = codigo;
    destaqueRN = [codigo];
    destaque234 = [feira.porCodigo.localizar(codigo).valor.centavos];
    todos(["CADASTRAR", msg]);
    log();
    indices();
  });

  $("#f-buscar").addEventListener("click", () => {
    const codigo = lerCodigo();
    if (codigo === null) return;
    const p = feira.buscar(codigo);
    const caminho = feira.porCodigo.passos.map((t) => ["RN", t]);
    passos = [];
    if (p) {
      selecionado = codigo;
      preencher(p);
      destaqueRN = [codigo];
      destaque234 = [p.centavos];
    }
    todos(["BUSCAR", p ? `#${codigo} encontrado em ${caminho.length} comparações na Rubro-Negra: ${p.nome}, R$ ${reais(p.preco)}, estoque ${p.quantidade}.`
      : `#${codigo} não existe (${caminho.length} comparações até chegar numa folha vazia).`, !p]);
    log(caminho);
    indices();
  });

  $("#f-vender").addEventListener("click", () => {
    const codigo = lerCodigo();
    if (codigo === null) return;
    const qtd = Number(campos.qtd.value);
    if (!Number.isInteger(qtd) || qtd <= 0) {
      definirLegenda(legenda, "", "Informe no campo Qtd quantas unidades foram vendidas.", true);
      return;
    }
    const msg = feira.vender(codigo, qtd);
    const p = feira.porCodigo.localizar(codigo);
    if (p) campos.qtd.value = p.valor.quantidade;
    destaqueRN = p ? [codigo] : [];
    destaque234 = p ? [p.valor.centavos] : [];
    todos(["VENDER", msg, /não encontrado|insuficiente/.test(msg)]);
    log();
    indices();
  });

  $("#f-remover").addEventListener("click", () => {
    const codigo = lerCodigo();
    if (codigo === null) return;
    const msg = feira.remover(codigo);
    destaqueRN = [];
    destaque234 = [];
    todos(["REMOVER", msg, /não encontrado/.test(msg)]);
    log();
    indices();
  });

  $("#feira-faixa").addEventListener("submit", (e) => {
    e.preventDefault();
    const a = Number($("#f-min").value.replace(",", "."));
    const b = Number($("#f-max").value.replace(",", "."));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      definirLegenda(legenda, "", "Informe os preços mínimo e máximo, por exemplo 8 e 12.", true);
      return;
    }
    const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
    const produtos = feira.faixaDePreco(lo, hi);
    tabela(produtos, `Produtos de R$ ${reais(lo)} a R$ ${reais(hi)}`);
    destaque234 = feira.porPreco.intervalo(Math.round(lo * 100), Math.round(hi * 100)).map((e2) => e2.chave);
    destaqueRN = produtos.map((p) => p.codigo);
    definirLegenda(legenda, "FAIXA", `${produtos.length} produto(s) entre R$ ${reais(lo)} e R$ ${reais(hi)}. A 2-3-4 só entra nas subárvores que podem ter preços nessa faixa.`);
    indices();
  });

  $("#f-todos").addEventListener("click", () => {
    destaqueRN = [];
    destaque234 = [];
    todos(["LISTAR", "Todos os produtos, na ordem do percurso em ordem da Rubro-Negra (ordenados por código)."]);
    indices();
  });

  mapa.addEventListener("click", (e) => {
    const r = mapa.getBoundingClientRect();
    const W = mapa.clientWidth;
    const H = mapa.clientHeight;
    const lado = Math.min(W, H) - 24;
    const x = ((e.clientX - r.left - (W - lado) / 2) / lado) * 100;
    const y = (1 - (e.clientY - r.top - (H - lado) / 2) / lado) * 100;
    if (x < 0 || y < 0 || x > 100 || y > 100) return;
    cliente = [Math.round(x), Math.round(y)];
    resposta = feira.bancaMaisProxima(...cliente);
    visitadasMapa = new Set(feira.bancas.eventos.filter((ev) => ev[0] === "visita").map((ev) => ev[1].rotulo));
    tabela(resposta.produtos, `Produtos da banca ${resposta.no.rotulo}`);
    destaqueRN = resposta.produtos.map((p) => p.codigo);
    destaque234 = [];
    definirLegenda(legenda, "k-D", `A banca mais próxima de (${cliente.join(", ")}) é a ${resposta.no.rotulo}, a ${resposta.dist.toFixed(1)} m. ` +
      `A k-D visitou ${visitadasMapa.size} de ${BANCAS.length} bancas.`);
    log(feira.bancas.passos.map((t) => ["k-D", t]));
    desenharMapa();
    indices();
  });

  aoRedimensionar([mapa], desenharMapa);
  aoRedimensionar([$("#feira-rn"), $("#feira-234")], indices);
  todos(["", "Clique numa linha da tabela para preencher o formulário, ou clique no mapa para achar a banca mais próxima."]);
  log();
  $("#feira-log").innerHTML = "<li>Os passos internos das árvores aparecem aqui depois de cada operação.</li>";
}

// ========================================================================== Capa
function iniciarCapa() {
  const arv = new ArvoreRubroNegra();
  CHAVES_PADRAO.forEach((v) => arv.inserir(v));
  const svg = $("#capa-arvore");
  const desenhar = () => desenharFoto(svg, fotoRN(arv), null, 1, { maxUnidade: 40 });
  aoRedimensionar([svg], desenhar);
}

// ========================================================================== Rotas
const VISTAS = ["inicio", "rubro-negra", "arvore-234", "comparar", "kd", "feira"];

function aplicarRota() {
  const nome = VISTAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
  $$("[data-vista]").forEach((s) => { s.hidden = s.dataset.vista !== nome; });
  $$(".abas a").forEach((a) => {
    if (a.getAttribute("href") === "#" + nome) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

new VistaArvore($("#v-rubro-negra"), {
  titulo: "Árvore Rubro-Negra",
  resumo: "Árvore binária de busca com uma cor em cada nó. As regras de cor limitam a altura; quando uma inserção ou remoção quebra uma regra, a árvore recolore nós e faz rotações.",
  mensagemInicial: "25 valores já carregados, com o 31 repetido. Experimente: Limpar, depois inserir 10 20 30 para ver a primeira rotação.",
  conceitos: CONCEITOS_RN,
  criar: () => new ArvoreRubroNegra(),
  foto: (arv, destaque = [], caminho = []) => fotoRN(arv, destaque, caminho),
  caso: casoRN,
  caminho: caminhoRN,
});

new VistaArvore($("#v-arvore-234"), {
  titulo: "Árvore 2-3-4",
  resumo: "Árvore não-binária: cada nó guarda de 1 a 3 chaves. Em vez de rotações, ela divide, empresta e funde nós, e todas as folhas ficam sempre no mesmo nível.",
  mensagemInicial: "25 valores já carregados, com o 31 repetido. Experimente remover 38: duas fusões, e a raiz desce um nível.",
  conceitos: CONCEITOS_234,
  criar: () => new Arvore234(),
  foto: (arv, destaque = [], caminho = []) => foto234(arv, destaque, caminho),
  caso: caso234,
  caminho: caminho234,
});

iniciarComparar();
iniciarKD();
iniciarFeira();
iniciarCapa();
window.addEventListener("hashchange", aplicarRota);
aplicarRota();
