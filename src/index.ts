
import express from 'express';
import { Request, Response } from 'express';
import { io } from 'socket.io-client';
import { print, getPrinters } from 'unix-print';
// import { print, getPrinters } from 'pdf-to-printer';
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
	console.log(`server started at http://${url}:` + PORT);
});

// TODO: manejar dev production con env
// const url = 'todoinsumos.com';
const url = 'localhost';
const socket = io(`ws://${url}:4000`, {
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
	fs.writeFile(dir + 'label.txt', `SKU: ${codigo_pr};${nombre_pr}`, (err) => {
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
		url: `http://${url}:3000/invoices/pdf`,
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
				const printer = 'EPSON_XP_2100_Series';
				const options = [ '-o media=A4' ];
				err && console.log(err);
				print('../cns-local/invoice.pdf', printer, options)
					.then((status: string) => {
						console.log(status);
						fs.unlink('../cns-local/invoice.pdf', console.log);
					}).catch((err: Error) => {
						console.log(err);
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
		url: `http://${url}:3000/orders/pdf`,
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
			fs.createWriteStream('../cns-local/order.pdf').write(Buffer.from(data.data, 'utf8'), (err) => {
				const printer = 'EPSON_XP_2100_Series';
				const options = [ '-o media=A4' ];
				err && console.log(err);
				print('../cns-local/order.pdf', printer, options)
					.then((status: string) => {
						console.log(status);
						fs.unlink('../cns-local/order.pdf', () => console.log);
					}).catch((err: Error) => {
						console.log(err);
					});
			});
		})
		.catch(error => {
			console.log(error);
		});

});