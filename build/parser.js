const fs = require('fs');
const _ = require('lodash');
let path = require('path');
const request = require('request');
const env = process.env;
const[NAME_COIN, NAME_COIN_TWO, BBANDS_INTERVAL, EXCHANGE] = [env.NAME_COIN, env.NAME_COIN_TWO, env.BBANDS_INTERVAL, env.EXCHANGE];

// ******** НАЧАЛО ОСНОВНОЙ ПРОГРАММЫ
(async () => {
	let data = await getData(EXCHANGE);
	writeJson(data);
	console.log('JSON ГОТОВ');
	process.exit(-1);
})();
// ******** КОНЕЦ ОСНОВНОЙ ПРОГРАММЫ

async function getData(exch) { // возвращаем массив
	let url = '';
	let data = '';
	switch (exch.toLowerCase()) {
	case ('bittrex'):
		if (BBANDS_INTERVAL == 10 || BBANDS_INTERVAL == 15) {
			console.log('СЧИТАЕМ НА ' + BBANDS_INTERVAL + ' минут!');
			var intervalFromBittrex = 'fiveMin';
		} else {
			let numbers = [1, 5, 30, 60, 1440];
			let words = ['oneMin', 'fiveMin', 'thirtyMin', 'hour', 'day'];
			var intervalFromBittrex = words[numbers.indexOf(+BBANDS_INTERVAL)];
		}

		url = `https://bittrex.com/Api/v2.0/pub/market/GetTicks?marketName=${NAME_COIN}-${NAME_COIN_TWO}&tickInterval=${intervalFromBittrex}`;
		data = await req(url);
		var arr = data.result.reverse().slice(1, 200);
		var step = 1
		if (BBANDS_INTERVAL == 10 || BBANDS_INTERVAL == 15) {
			step = ~~(BBANDS_INTERVAL / 5)
		}
		var json = [];
		for(let index in arr) {
			if (index % step == 0) {
				json.push(arr[index].C);
			};
		};
		json = json.reverse();
		break;
		
	case ('bitfinexdemo'):
	case ('bitfinex'):
		url = `https://api.bitfinex.com/v2/candles/trade:${BBANDS_INTERVAL}m:t${NAME_COIN}${NAME_COIN_TWO}/hist`;
		data = await req(url);
		var arr = data.slice(1, 200).reverse();
		var json = [];
		for(let order of arr) {
			json.push(order[2]);
		};
		break;
		
	case ('poloniex'):
		url = `https://poloniex.com/public?command=returnChartData&currencyPair=${NAME_COIN}_${NAME_COIN_TWO}&start=${+(new Date().getTime().toString().slice(0,10))-172800}&end=9999999999&period=${+BBANDS_INTERVAL*60}`;
		data = await req(url);
		if(data.error){
			console.log('ОШИБКА СБОРА ДАННЫХ:', data.error);
		}
		var arr = data.slice(1, 200);
		var json = [];
		for(let order of arr) {
			json.push(order.close);
		};
		break;

	case ('poloniex2'):  // тестовая версия с криптовача
		url = `https://api.cryptowat.ch/markets/poloniex/${NAME_COIN_TWO}${NAME_COIN}/ohlc?periods=${+BBANDS_INTERVAL*60}`;
		data = await req(url);
		if(data.error){
			console.log('ОШИБКА СБОРА ДАННЫХ:', data.error);
		}
		var arr = data.result[BBANDS_INTERVAL*60].slice(1, 200);
		var json = [];
		for(let order of arr) {
			json.push(order[4]);
		};
		break;

	case ('wex'):
		url = `https://api.cryptowat.ch/markets/btce/${NAME_COIN}${NAME_COIN_TWO}/ohlc?periods=${+BBANDS_INTERVAL*60}`;
		data = await req(url);
		if(data.error){
			console.log('ОШИБКА СБОРА ДАННЫХ:', data.error);
		}
		var arr = data.result[BBANDS_INTERVAL*60].slice(1, 200);
		var json = [];
		for(let order of arr) {
			json.push(order[4]);
		};
		break;

	case ('cex'):
		url = `https://cex.io/api/ohlcv2/d/${+BBANDS_INTERVAL}m/${NAME_COIN}/${NAME_COIN_TWO}`;
		data = await req(url);
		var arr = data.ohlcv.reverse().slice(1, 200).reverse();
		var json = [];
		for(let order of arr) {
			json.push(order[4]);
		};
		break;
	};
	console.log('ССЫЛКА ', url);
	return json;
};

function req(url){  // запрос данных с url
	return new Promise((resolve, reject) => {
		request.get(url,
		(err, res, body) => {
			if (err) throw err
			resolve(JSON.parse(body));
		});
	});
};

function ensureDirectoryExistence(filePath) {  // создаёт каталог, если его нет
	var dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
};

function writeJson(data) { // Записываем json в файл
	file = "./saveBBands/" + EXCHANGE + "/" + NAME_COIN.toLowerCase() + '_' + NAME_COIN_TWO.toLowerCase() + ".json";
	ensureDirectoryExistence(file);
	fs.writeFileSync(file, JSON.stringify(data));
};
