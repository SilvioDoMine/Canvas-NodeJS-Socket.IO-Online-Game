var express	= require('express');
var app		= express();
var http	= require('http').createServer(app);
var io		= require('socket.io')(http);
// Game Variables
var canvasW = 460;
var canvasH = 460;
var playerW = 20;
var playerH = 20;
var fruitsW = playerW;
var fruitsH = playerH;
var players = [];
var fruits = [];
var spawnFruits = true;
var spawnFruitsTimer = 2000;
var fruitsMax = 15;
var debugMode = true;

app.use(express.static('public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});


function generateRandomCanvasPixel()
{
    var success = false;
    var result = 0;

    while(success == false) {
        var pixel = Math.floor(Math.random() * (canvasW - playerW));

        if ((pixel % playerH) == 0) {
            result = pixel;
            success = true;
        }
    }

    return result;
}

function generateRandomCanvasCoordenates(unique = false) {

	var position = {
		success: false,
		X: 0,
		Y: 0,
	}

	// Se eu desejo uma cordenada única
	if(unique) {

	} else {
	// Se não...
		// Enquanto success for for falso...
		while(!position.success) {
			// Gera duas cordenadas e armazêna-os na variável positio
			position.X = Math.floor(Math.random() * (canvasW - playerW));
			position.Y = Math.floor(Math.random() * (canvasH - playerH));

			// Precisamos que o ponto gerado pela equação acima, bata perfeitamente com o grid do nosso
			// jogo, e para isso, precisamos que o resto da divisão entre a posição gerada, menos a
			// largura do personagem, seja igual a zero.
			if(position.X % playerW == 0 && position.Y % playerH == 0) {
				// A cordenada é válida e foi um sucesso, então mudamos a variável para sair do loop.
				position.success = true;
			}
		}
	}

    return position;
}

function playerDisconnect()
{
	// Varre a lista de jogadores
	for(i = 0; i < players.length; i++)
	{
		// Se o id do jogador que estamos varrendo, for igual ao do cliente que desconectou...
		if(players[i].id == this.id)
		{
			// Removemos o jogador exato
			players.splice(i,1);

			console.log(`CONSOLE: O usuário ${this.id} acabou de desconectar. Jogadores atuais: ${players.length}`);

			// Emitimos a atualização para todos os jogadores.
			io.emit('playersAtt', players);
		}
	}
}

function playerInputHandler(key)
{
	// Varremos a lista de jogadores
	for(var i = 0; i < players.length; i++)
	{
		// Dentro dessa lista, vamos procurar o jogador que pressionou a tecla.
		if(players[i].id == this.id)
		{
			// Agora vamos procurar que tecla ele apertou
			switch(key)
			{
				case 'left':
					// Verificamos se após o movimento, ele vai passar da parede, se não..
					if((players[i].posX - playerW) >= 0)
					{
						// Move o jogador
						players[i].posX -= playerW;

						// Checa se houve colisão com frutas
						playerCheckCollisionWithFruits(players[i], this);

						// Transmite o movimento para todos os clientes conectados.
						io.emit('playersAtt', players);
					}
					break;
				case 'up':
					// Verificamos se após o movimento, ele vai passar da parede, se não...
					if((players[i].posY - playerH) >= 0)
					{
						// Move o jogador
						players[i].posY -= playerH;

						// Checa se houve colisão com frutas
						playerCheckCollisionWithFruits(players[i], this);

						// Transmite o movimento para todos os clientes conectados.
						io.emit('playersAtt', players);
					}
					break;
				case 'right':
					// Verificamos se após o movimento, ele vai passar da parede, se não...
					if((players[i].posX + playerW) < canvasW)
					{
						// Move o jogador
						players[i].posX += playerW;

						// Checa se houve colisão com frutas
						playerCheckCollisionWithFruits(players[i], this);

						// Transmite o moviemnt para todos os clientes conectados.
						io.emit('playersAtt', players);
					}
					break;
				case 'down':
					// Verificamos se após o movimento, ele vai passar da parede, se não...
					if((players[i].posY + playerH) < canvasH)
					{
						// Move o jogador
						players[i].posY += playerH;

						// Checa se houve colisão com frutas
						playerCheckCollisionWithFruits(players[i], this);

						// Transmite o moviemnt para todos os clientes conectados.
						io.emit('playersAtt', players);
					}
					break;
				default:
					// null
			}
		}
	}
}

function generateFruits() {
	if(spawnFruits)
	{
		if(fruits.length < fruitsMax) {
			var position = generateRandomCanvasCoordenates();
			var colors = ['lightgreen'];
			var indexPicker = Math.floor(Math.random() * colors.length);
	
			fruits.push({posX: position.X, posY: position.Y, color: colors[indexPicker]});
	
			io.emit('fruitsAtt', fruits);
					
			if(debugMode) {
				console.log(`CONSOLE: Nova fruta acabou de spawnar em [${position.X},${position.Y}]! Total: ${fruits.length}`);
			}
		} else {
			if(debugMode) {
				console.log(`CONSOLE: Não foi possível gerar uma nova fruita, pois existem ${fruits.length} frutas no campo, e o limite é ${fruitsMax}.`);
			}
		}
	}
}

function playerCheckCollisionWithFruits(player, socket)
{
	var score = false;

	// Varre a lista de frutas, e para cada...
	for(var i = 0; i < fruits.length; i++)
	{
		// Checa se o player está na posição X e Y igual a da fruta atual
		if(fruits[i].posX == player.posX && fruits[i].posY == player.posY)
		{
			console.log(`CONSOLE: Jogador ${player.id} pegou uma frutinha em [${fruits[i].posX},${fruits[i].posY}], e agora ele tem ${player.score + 1} pontos!`);

			// Vamos remover a fruta da lista
			fruits.splice(i, 1);

			// Vamos enviar a lista com a fruta removida para todos os clientes conectados
			io.emit('fruitsAtt', fruits);

			// Vamos aumentar um score pro jogador
			player.score += 1;

			// Vamos enviar os jogadores para todos.
			io.emit('playersAtt', players);

			// Se a pontuação for um múltiplo de 10, executa um som para todos.
			if(player.score % 10 == 0)
			{
				io.emit('audio', '10points');
			}
			else
			{
				socket.emit('audio', '1point');
			}
		}
	}
}

/*************
 * Networking
 ************* */

 // Uppon player connection
io.on('connection', function(socket){

	var position = generateRandomCanvasCoordenates();

	let data = {
		canvasW: canvasW,
		canvasH: canvasH,
		playerW: playerW,
		playerH: playerH,
		fruitsW: fruitsW,
		fruitsH: fruitsH,
		player: {
			posX: position.X,
			posY: position.Y,
			score: 0,
			id: socket.id,
			name: 'name',
		},
	}

	socket.emit('init', data);

	players.push(data.player);

	io.emit('playersAtt', players);

	socket.on('sendPing', function() { socket.emit('sendPong'); });


	console.log(`Console: O usuário de ID ${socket.id} conectou. Total de jogadores: ${players.length}`);

	// Emite para o cliente, todas as frutas spawnadas.
	socket.emit('fruitsAtt', fruits);

	// Ao receber uma informação de move (movimento) do socket (cliente)...
	socket.on('input', playerInputHandler);

	// Quando um jogador desconecta, ele deve ser removido.
	socket.on('disconnect', playerDisconnect);
	
});

// Cria um loop, que executa a função abaixo a cada X milesegundos,
// definido pela variável posterior a função
setInterval(generateFruits, spawnFruitsTimer);

http.listen(3000, function(){
	console.log('listening on *:3000');
});