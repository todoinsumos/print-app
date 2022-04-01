
import express from 'express';
import { Request, Response } from 'express';
import { io } from 'socket.io-client';
// import { print, getPrinters } from 'unix-print';
import { print } from 'pdf-to-printer';
// import { getPrinters } from 'pdf-to-printer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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
	console.log('server started on port:' + PORT);
});

const urlSocket = 'wss://socket.todoinsumos.com';
const urlApi = 'https://api.todoinsumos.com';
const socket = io(urlSocket, {
	reconnectionDelayMax: 10000,
	transports: [ 'websocket' ], port: '4000'
});

// ETIQUETA DE ENVIO
interface DeliveryTag {
	boxes: string,
	name: string,
	phone: string,
	address: string,
	city: string,
	details: string
}
socket.on('print-tag-order', (tag: DeliveryTag) => {
	const { boxes, name, phone, address, city, details } = tag;
	const dir = path.join(__dirname, '../../cns-local/etiquetas/');
	fs.writeFile(dir + 'envio.txt', `${boxes};${name};${phone};${address};${city};${details}`, 'latin1', (err) => {
		err
			? console.warn(err)
			: console.log('Etiqueta pedido ', name);
	});
});

// ETIQUETA DE PRODUCTO
socket.on('print-tag-product', ({ codigo_pr, nombre_pr }: { codigo_pr: string, nombre_pr: string }) => {
	const dir = path.join(__dirname, '../../cns-local/etiquetas/label/');
	fs.writeFile(dir + 'label.txt', `SKU: ${codigo_pr};${nombre_pr}`, err => {
		err
			? console.warn(err)
			: console.log('Etiqueta producto ', nombre_pr);
	});
});

// IMPRESION DE FACTURA
interface PrintInvoice {
	cliente_id: string,
	pedido_id: string,
	cbte_numero: string,
	authorization: string
}
socket.on('print-invoice', (data: PrintInvoice) => {
	// getPrinters().then(console.log);
	const file = `F${data.pedido_id}.pdf`;
	axios({
		url: `${urlApi}/invoices/pdf?pedido_id=${data.pedido_id}&cliente_id=${data.cliente_id}&cbte_numero=${data.cbte_numero}`,
		method: 'GET',
		responseType: 'arraybuffer',
		headers: {
			authorization: data.authorization,
		}
	})
		.then(data => {
			fs.createWriteStream(`../cns-local/pdfs/${file}`).write(Buffer.from(data.data, 'utf8'), (err) => {
				// const printer = 'EPSON_XP_2100_Series'; // only macos
				// const options = [ '-o media=A4' ]; // only macos
				const options = {
					printer: 'RICOH MP C306Z PCL 6',
					win32: [ '-print-settings "fit"' ],
				};
				err && console.log(err);
				// print('../cns-local/invoice.pdf', printer, options) // only macos
				print(`../cns-local/pdfs/${file}`, options)
					.then(() => {
						console.log('Factura impresa', file);
						fs.unlinkSync(`../cns-local/pdfs/${file}`);
					}).catch((err) => {
						console.log('Error al imprimir factura', err);
						fs.unlinkSync(`../cns-local/pdfs/${file}`);
					});
			});
		})
		.catch(error => {
			console.log(error);
		});

});

// IMPRESION DE REMITO
interface PrintOrder {
	cliente_id: string,
	pedido_id: string,
	authorization: string
}
socket.on('print-order', (data: PrintOrder) => {
	// getPrinters().then(console.log);
	const file = `R${data.pedido_id}.pdf`;
	axios({
		url: `${urlApi}/orders/pdf`,
		method: 'POST',
		responseType: 'arraybuffer',
		headers: {
			authorization: data.authorization,
		},
		data: {
			cliente_id: data.cliente_id,
			pedido_id: data.pedido_id
		}
	})
		.then(data => {
			fs.createWriteStream(`../cns-local/pdfs/${file}`).write(Buffer.from(data.data, 'utf8'), (err) => {
				err && console.log('error escribiendo archivo');
				// const printer = 'EPSON_XP_2100_Series';  // only macos
				// const options = [ '-o media=A4' ];  // only macos
				const options = {
					printer: 'RICOH MP C306Z PCL 6',
					win32: [ '-print-settings "fit"' ],
				};

				print(`../cns-local/pdfs/${file}`, options)
					.then(() => {
						console.log('Remito impreso', file);
						fs.unlinkSync(`../cns-local/pdfs/${file}`);
					}).catch((err) => {
						console.log('Error al imprimir remito', err);
						fs.unlinkSync(`../cns-local/pdfs/${file}`);
					});
			});
		})
		.catch(error => {
			console.log('Error axios', error);
		});

});