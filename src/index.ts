import * as express from 'express';
import { Request, Response } from 'express';
import { io } from 'socket.io-client';

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

socket.on('logs', (data) => {
	console.log(data);
});