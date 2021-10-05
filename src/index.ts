
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

// escuchamos a todoinsumos.com
const socket = io('ws://todoinsumos.com:4000', {
	reconnectionDelayMax: 10000
});

interface DataTag {
	boxes: string,
	name: string,
	phone: string,
	address: string,
	city: string,
	details: string
}

socket.on('-tag-', (data: DataTag) => {
	const { boxes, name, phone, address, city, details } = data;
	const dir = path.join(__dirname, '../../../');
	// console.log(dir);
	fs.writeFile(dir + '/envio.txt', `${boxes};${name};${phone};${address};${city};${details}`, () => { })
});