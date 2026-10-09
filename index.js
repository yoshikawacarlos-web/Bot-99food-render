globalThis.crypto = require('crypto');
 
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const express = require('express')
const app = express()
const PORT = process.env.PORT || 10000

// LINK OIA CORRIGIDO - OFICIAL 99FOOD
const LINK_99FOOD = "https://oia.99app.com/dlp9/6Xujxo"

const MENSAGEM = `Olá! 👋 Bem-vindo(a)!

Peca com ENTREGA GRATIS e ate 60% OFF aqui na 99Food:
👉 ${LINK_99FOOD}

Escolha seu restaurante favorito! 🍔🔥`

let qrString = ""
let statusBot = "Iniciando..."

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({ 
        auth: state, 
        printQRInTerminal: true,
        browser: ["Bot 99Food", "Chrome", "1.0"]
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) {
            qrString = qr
            statusBot = "QR Gerado - Escaneie em /qr"
            console.log("QR GERADO")
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("Conexao fechada, reconectando:", shouldReconnect)
            statusBot = "Desconectado - Reconectando..."
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            statusBot = "CONECTADO - Bot 99Food ON"
            console.log("BOT CONECTADO COM SUCESSO!")
            qrString = ""
        }
    })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if(!msg.key.fromMe && msg.message && !msg.key.remoteJid.includes('@g.us')) {
            try {
                await sock.sendMessage(msg.key.remoteJid, { text: MENSAGEM })
                console.log(`Respondeu para: ${msg.key.remoteJid}`)
            } catch(e) { console.log("Erro ao responder", e) }
        }
    })
}

app.get('/', (req,res) => {
    res.send(`<h1>Bot 99Food - ${statusBot}</h1><p>Link OIA: ${LINK_99FOOD}</p><p><a href='/qr'>Ver QR Code</a></p><p>Replit 76% -> Render MIGRADO</p>`)
})

app.get('/qr', (req, res) => {
    if(statusBot.includes("CONECTADO")) {
        return res.send(`<h1 style='color:green'>✅ BOT JA CONECTADO</h1><p>Link ativo: ${LINK_99FOOD}</p><p>Pode fechar essa pagina.</p>`)
    }
    if(!qrString) return res.send(`<h2>${statusBot}</h2><p>Aguarde 10 segundos e atualize a pagina...</p><meta http-equiv='refresh' content='5'>`)
    res.send(`
        <html><body style="text-align:center;font-family:sans-serif;padding:20px">
        <h1>Bot 99Food - Escaneie o QR</h1>
        <p>Link OIA Corrigido: <b>${LINK_99FOOD}</b></p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrString)}" style="border:10px solid #000;border-radius:10px" />
        <p>1. Abra WhatsApp > Aparelhos conectados > Conectar aparelho</p>
        <p>2. Escaneie esse QR</p>
        <p>Status: ${statusBot}</p>
        </body></html>
    `)
})

app.listen(PORT, () => console.log("Servidor ON na porta " + PORT))
startBot()
