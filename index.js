const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const csv = require('csv-parser');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

let mensagensFixas = [];
let contatosCSV = [];
let enviados = 0;
let visualizados = 0;
let pulados = 0;
let invalidos = 0;
let processoAtivo = false;

const DATA_FILE = 'data.json';
let historico = {};
if (fs.existsSync(DATA_FILE)) {
  historico = fs.readJsonSync(DATA_FILE);
}

const client = new Client();

client.on('qr', qr => {
  fs.writeFileSync('public/qr.txt', qr);
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
});

client.on('message_ack', (msg, ack) => {
  if (ack === 3) visualizados++; // 3 = mensagem lida
});

client.initialize();

function intervaloAleatorio() {
  return Math.floor(Math.random() * (51 - 12 + 1) + 12) * 1000;
}

function normalizarNumero(numero) {
  let limpo = numero.replace(/\D/g, '');
  if (limpo.length < 10) return null;

  let ddd = limpo.substring(0, 2);
  let resto = limpo.substring(2);

  // fixo (8 dígitos) ou celular (9 dígitos)
  if (resto.length === 8) {
    // se começar com 6,7,8,9 → celular sem o 9 → adiciona
    if (['6','7','8','9'].includes(resto[0])) {
      resto = '9' + resto;
    }
  }
  return `55${ddd}${resto}`;
}

function montarMensagem(nome) {
  const saudacao = nome ? `Olá ${nome}, tudo bem?` : "Olá, tudo bem?";
  const corpo = mensagensFixas.length > 0 
    ? mensagensFixas[Math.floor(Math.random() * mensagensFixas.length)] 
    : "Confira nosso catálogo digital: https://catalogo-topmix.web.app/";
  return `${saudacao} ${corpo}`;
}

async function enviarLote(lote) {
  for (let i = 0; i < lote.length; i++) {
    if (!processoAtivo) break;
    const numeroOriginal = lote[i].numero;
    const nome = lote[i].nome || null;
    const numeroNormalizado = normalizarNumero(numeroOriginal);

    if (!numeroNormalizado) {
      invalidos++;
      continue;
    }

    const