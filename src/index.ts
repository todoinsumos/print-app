
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

const urlSocket = 'ws://todoinsumos.com:4000';
const urlApi = 'https://todoinsumos.com/api';
const socket = io(urlSocket, {
	reconnectionDelayMax: 10000
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
	fs.writeFile(dir + 'envio.txt', `${boxes};${name};${phone};${address};${city};${details}`, (err) => {
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
	factura_id: string,
	authorization: string
}
socket.on('print-invoice', (data: PrintInvoice) => {
	// getPrinters().then(console.log);
	axios({
		url: `${urlApi}/invoices/pdf`,
		method: 'GET',
		responseType: 'arraybuffer',
		headers: {
			authorization: data.authorization,
			uid: data.cliente_id,
			pid: data.pedido_id,
			fid: data.factura_id
		}
	})
		.then(data => {
			fs.createWriteStream('../cns-local/invoice.pdf').write(Buffer.from(data.data, 'utf8'), (err) => {
				// const printer = 'EPSON_XP_2100_Series'; // only macos
				// const options = [ '-o media=A4' ]; // only macos
				const options = {
					printer: 'EPSON_XP_2100_Series',
					win32: [ '-print-settings "fit"' ],
				};
				err && console.log(err);
				// print('../cns-local/invoice.pdf', printer, options) // only macos
				print('../cns-local/invoice.pdf', options)
					.then(() => {
						console.log('Factura impresa');
						fs.unlink('../cns-local/invoice.pdf', console.log);
					}).catch(() => {
						console.log('Error al imprimir factura');
						fs.unlink('../cns-local/invoice.pdf', console.log);
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
			fs.createWriteStream('../cns-local/order2.pdf').write(Buffer.from(data.data), (err) => {
				// const printer = 'EPSON_XP_2100_Series';  // only macos
				// const options = [ '-o media=A4' ];  // only macos
				const options = {
					printer: 'EPSON_XP_2100_Series',
					win32: [ '-print-settings "fit"' ],
				};
				err && console.log('error escribiendo archivo');
				// print('../cns-local/order.pdf', printer, options) // only macos
				print('../cns-local/order.pdf', options)
					.then(() => {
						console.log('Remito impreso');
						fs.unlink('../cns-local/order.pdf', console.log);
					}).catch(() => {
						console.log('Error al imprimir remito');
						fs.unlink('../cns-local/order.pdf', console.log);
					});
			});
		})
		.catch(error => {
			console.log('Error axios', error);
		});

});