/* ========================================== FIREBASE ========================================== */

const firebaseConfig = { apiKey: "AIzaSyAYBh_xHUGeUGMjpHEOxBU-Nppc5ymum6g", authDomain: "yasmim-dc181.firebaseapp.com", projectId: "yasmim-dc181", storageBucket: "yasmim-dc181.firebasestorage.app", messagingSenderId: "773790336369", appId: "1:773790336369:web:9292e70565a551b4bf22d0", measurementId: "G-MRCSX5RNGN" };

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore(); const auth = firebase.auth();

/* ========================================== ELEMENTOS ========================================== */

const loading = document.getElementById("loading"); const site = document.getElementById("site");

const formRsvp = document.getElementById("formRsvp"); const convidadoInput = document.getElementById("convidado"); const mensagem = document.getElementById("mensagem");

/* ========================================== ABRIR CONVITE ========================================== */

function abrirConvite() {

if (!loading || !site) return; loading.classList.add("esconder"); site.classList.add("visivel"); setTimeout(() => { loading.style.display = "none"; }, 900); 

}

/* Permite tocar no envelope para abrir. */

if (loading) {

loading.addEventListener("click", abrirConvite); 

}

/* ========================================== AUTENTICAÇÃO ANÔNIMA ========================================== */

let usuarioAutenticado = null;

auth.onAuthStateChanged((user) => {

usuarioAutenticado = user; 

});

async function garantirAutenticacao() {

if (usuarioAutenticado) { return usuarioAutenticado; } const resultado = await auth.signInAnonymously(); usuarioAutenticado = resultado.user; return usuarioAutenticado; 

}

/* ========================================== CONTAGEM REGRESSIVA ========================================== */

function atualizarContador() {

const agora = new Date(); /* 05 de dezembro às 20h00. O ano é definido automaticamente para o próximo dia 05 de dezembro disponível. */ let ano = agora.getFullYear(); let dataFesta = new Date( ano, 11, 5, 20, 0, 0 ); if (agora >= dataFesta) { dataFesta = new Date( ano + 1, 11, 5, 20, 0, 0 ); } const diferenca = dataFesta - agora; if (diferenca <= 0) { return; } const dias = Math.floor( diferenca / (1000 * 60 * 60 * 24) ); const horas = Math.floor( (diferenca / (1000 * 60 * 60)) % 24 ); const minutos = Math.floor( (diferenca / (1000 * 60)) % 60 ); const segundos = Math.floor( (diferenca / 1000) % 60 ); const elementoDias = document.getElementById("dias"); const elementoHoras = document.getElementById("horas"); const elementoMinutos = document.getElementById("minutos"); const elementoSegundos = document.getElementById("segundos"); if (elementoDias) { elementoDias.textContent = String(dias).padStart(2, "0"); } if (elementoHoras) { elementoHoras.textContent = String(horas).padStart(2, "0"); } if (elementoMinutos) { elementoMinutos.textContent = String(minutos).padStart(2, "0"); } if (elementoSegundos) { elementoSegundos.textContent = String(segundos).padStart(2, "0"); } 

}

atualizarContador();

setInterval(atualizarContador, 1000);

/* ========================================== NORMALIZAR TEXTO ========================================== */

function normalizar(texto) {

return texto .toString() .normalize("NFD") .replace(/[\u0300-\u036f]/g, "") .toLowerCase() .trim(); 

}

/* ========================================== BUSCAR CONVITE ========================================== */

function buscarConvite(nomeDigitado) {

const busca = normalizar(nomeDigitado); if (!busca) { return []; } return convidados.filter((convite) => { const familia = normalizar(convite.familia); const pessoas = convite.pessoas.some((pessoa) => normalizar(pessoa).includes(busca) ); return familia.includes(busca) || pessoas; }); 

}

/* ========================================== FORMULÁRIO DE BUSCA ========================================== */

if (formRsvp) {

formRsvp.addEventListener("submit", async function(event) { event.preventDefault(); const nome = convidadoInput.value.trim(); mensagem.innerHTML = ""; if (!nome) { mensagem.innerHTML = ` <div class="mensagem-erro"> Digite o nome da família ou de uma pessoa. </div> `; return; } mensagem.innerHTML = ` <div class="mensagem-info"> Procurando seu convite... </div> `; try { await garantirAutenticacao(); const resultados = buscarConvite(nome); if (resultados.length === 0) { mensagem.innerHTML = ` <div class="mensagem-erro"> Não encontramos esse nome na lista de convidados. </div> `; return; } mostrarResultados(resultados); } catch (erro) { console.error(erro); mensagem.innerHTML = ` <div class="mensagem-erro"> Não foi possível verificar o convite. Tente novamente. </div> `; } }); 

}

/* ========================================== MOSTRAR RESULTADOS ========================================== */

async function mostrarResultados(resultados) {

mensagem.innerHTML = ""; for (const convite of resultados) { const jaConfirmado = await verificarConfirmacao(convite.id); const bloco = document.createElement("div"); bloco.className = "resultado-convite"; if (jaConfirmado) { bloco.innerHTML = ` <h3>${escapeHTML(convite.familia)}</h3> <div class="mensagem-sucesso"> Esta confirmação já foi realizada para este convite. </div> `; mensagem.appendChild(bloco); continue; } const lista = document.createElement("div"); lista.className = "lista-pessoas"; convite.pessoas.forEach((pessoa, index) => { const label = document.createElement("label"); label.className = "pessoa"; label.innerHTML = ` <input type="checkbox" class="pessoa-selecionada" value="${index}" data-nome="${escapeHTML(pessoa)}" > <span> ${escapeHTML(pessoa)} </span> `; lista.appendChild(label); }); bloco.innerHTML = ` <h3> ${escapeHTML(convite.familia)} </h3> `; bloco.appendChild(lista); const botao = document.createElement("button"); botao.type = "button"; botao.className = "botao-confirmar"; botao.textContent = "Confirmar presença"; botao.addEventListener("click", () => { confirmarPresenca( convite, bloco, botao ); }); bloco.appendChild(botao); mensagem.appendChild(bloco); } 

}

/* ========================================== VERIFICAR CONFIRMAÇÃO ========================================== */

async function verificarConfirmacao(conviteId) {

try { await garantirAutenticacao(); const documento = await db .collection("confirmacoes") .doc(conviteId) .get(); return documento.exists; } catch (erro) { console.error( "Erro ao verificar confirmação:", erro ); return false; } 

}

/* ========================================== CONFIRMAR PRESENÇA ========================================== */

async function confirmarPresenca( convite, bloco, botao ) {

const checkboxes = bloco.querySelectorAll( ".pessoa-selecionada:checked" ); if (checkboxes.length === 0) { mostrarErroNoBloco( bloco, "Selecione pelo menos uma pessoa para confirmar." ); return; } const pessoasSelecionadas = []; checkboxes.forEach((checkbox) => { pessoasSelecionadas.push( checkbox.dataset.nome ); }); botao.disabled = true; botao.textContent = "Confirmando..."; try { await garantirAutenticacao(); /* Usamos set() apenas se o documento ainda não existir. As regras do Firestore também impedem uma segunda criação para o mesmo convite. */ const referencia = db .collection("confirmacoes") .doc(convite.id); const documento = await referencia.get(); if (documento.exists) { bloco.innerHTML = ` <h3> ${escapeHTML(convite.familia)} </h3> <div class="mensagem-sucesso"> Este convite já foi confirmado. </div> `; return; } await referencia.set({ conviteId: convite.id, familia: convite.familia, pessoas: pessoasSelecionadas, quantidade: pessoasSelecionadas.length, confirmadoEm: firebase.firestore.FieldValue.serverTimestamp() }); bloco.innerHTML = ` <div class="mensagem-sucesso"> <strong> Presença confirmada! 🩵 </strong> <br><br> Obrigada por confirmar sua presença, ${escapeHTML(convite.familia)}! <br><br> Pessoas confirmadas: <br> ${pessoasSelecionadas .map((pessoa) => escapeHTML(pessoa)) .join("<br>")} </div> `; } catch (erro) { console.error( "Erro ao confirmar presença:", erro ); if ( erro.code === "permission-denied" ) { bloco.innerHTML = ` <h3> ${escapeHTML(convite.familia)} </h3> <div class="mensagem-sucesso"> Este convite já foi confirmado. </div> `; return; } botao.disabled = false; botao.textContent = "Confirmar presença"; mostrarErroNoBloco( bloco, "Não foi possível confirmar a presença. Tente novamente." ); } 

}

/* ========================================== ERRO DENTRO DO CONVITE ========================================== */

function mostrarErroNoBloco( bloco, texto ) {

const erroAnterior = bloco.querySelector(".mensagem-erro"); if (erroAnterior) { erroAnterior.remove(); } const erro = document.createElement("div"); erro.className = "mensagem-erro"; erro.textContent = texto; bloco.appendChild(erro); 

}

/* ========================================== PROTEÇÃO CONTRA HTML ========================================== */

function escapeHTML(texto) {

return texto .replace(/&/g, "&amp;") .replace(/</g, "&lt;") .replace(/>/g, "&gt;") .replace(/"/g, "&quot;") .replace(/'/g, "&#039;"); 

}

/* ========================================== ENTER NO CAMPO DE BUSCA ========================================== */

if (convidadoInput) {

convidadoInput.addEventListener( "keydown", function(event) { if (event.key === "Enter") { event.preventDefault(); formRsvp.requestSubmit(); } } ); 

}

