
import express from 'express';
import { Request, Response } from 'express';
import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

const app = express();

const {
	PORT = 3006,
} = process.env;

app.get('/', (req: Request, res: Response) => {
	res.send({
		message: 'hello world',
	});
});
app.listen(PORT, () => {
	console.log('server started at http://localhost:' + PORT);
});
const socket = io('ws://todoinsumos.com:4000', {
	reconnectionDelayMax: 10000
});


// ETIQUETAS DE ENVIOS
interface DeliveryTag {
	boxes: string,
	name: string,
	phone: string,
	address: string,
	city: string,
	details: string
}
socket.on('-tag-', (tag: DeliveryTag) => {
	const { boxes, name, phone, address, city, details } = tag;
	const dir = path.join(__dirname, '../../cns-local/etiquetas/');
	console.log('Etiqueta impresa: envio', name);
	fs.writeFile(dir + 'envio.txt', `${boxes};${name};${phone};${address};${city};${details}`, (err) => {
		console.log(err);
	});
});

// ETIQUETAS DE PRODUCTOS
interface ProductTag {
	codigo_pr: string,
	nombre_pr: string,
}
socket.on('-tag-product-', (data: ProductTag) => {
	const { codigo_pr, nombre_pr, } = data;
	const dir = path.join(__dirname, '../../cns-local/etiquetas/label/');
	console.log('Etiqueta impresa: producto', nombre_pr);
	fs.writeFile(dir + 'label.txt', `SKU: ${codigo_pr};${nombre_pr}`, (err) => {
		console.log(err);
	});
});