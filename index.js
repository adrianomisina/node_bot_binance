const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');

const ws = new WebSocket(`wss://testnet.binance.vision/ws/${process.env.SYMBOL.toLowerCase()}@ticker`);
const API_URL = 'https://testnet.binance.vision/api';

const PROFITABILITY = parseFloat(process.env.PROFITABILITY);
let sellPrice = 0;

ws.onmessage = (event) => {
    console.clear();
    const obj = JSON.parse(event.data);
    console.log(event.data);
    console.log("Symbol: " + obj.s);
    console.log("Best Ask: " + obj.a);
    console.log("prevClose - O preço de fechamento do período anterior: " + obj.x)

    const currentPrice = parseFloat(obj.a);
    if (sellPrice === 0 && currentPrice < parseFloat(obj.x)) {
        console.log("Bom para Comprar");
        newOrder("0.001", "BUY");
        sellPrice = currentPrice + PROFITABILITY;
    } else if (sellPrice !== 0 && currentPrice >= sellPrice) {
        console.log("Bom para Vender");
        newOrder("0.001", "SELL");
        sellPrice = 0;
    } else {
        console.log("Esperando...Sell Price: " + sellPrice);
    }
};

async function newOrder(quantity, side) {
    const data = {
        symbol: process.env.SYMBOL,
        side,
        type: 'MARKET',
        quantity,
        timestamp: Date.now(),
        recvWindow: 60000,
    };

    const signature = crypto
        .createHmac('sha256', process.env.SECRET_KEY)
        .update(`symbol=${data.symbol}&side=${data.side}&type=${data.type}&quantity=${data.quantity}&timestamp=${data.timestamp}&recvWindow=${data.recvWindow}`)
        .digest('hex');

    const qs = `?${new URLSearchParams({ ...data, signature })}`;

    try {
        const result = await axios({
            method: 'POST',
            url: `${API_URL}/v3/order${qs}`,
            headers: { 'X-MBX-APIKEY': process.env.API_KEY },
        });
        console.log(result.data);
    } catch (err) {
        console.log("Erro ao criar ordem:", err.response.data);
    }
}

