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

// Gaming
var players = new Array();
var fruits = new Array();
var spawnFruits = false;
var debugMode = true;

// Cria um loop, que executa a função abaixo a cada X milesegundos,
// definido pela variável posterior a função
setInterval(function(){
	// Se ele puder spawnar frutas (se for verdadeiro)
	if(spawnFruits) {
		// Se existir pelo menos dois jogadores para brincar
		if(players.length > 1) {
			if(fruits.length <= 10) {
				// Gera posições aleatórias possíveis
				var posX = generateRandomCanvasPixel();
				var posY = generateRandomCanvasPixel();
				// Seleciona um tipo de fruta, ou uma "cor";
				var colors = ["lightgreen"];
				// Seleciona um índice randômico da array cores
				var pickColor = Math.floor(Math.random() * colors.length);
				
				// Envia para a array de frutas, a nova frutinha criada.
				fruits.push({posX: posX, posY: posY, color: colors[pickColor]});

				// Transmite a array de frutas pros clientes conectados.
				io.emit('fruitsAtt', fruits);
				
				if(debugMode) {
					console.log(`Nova fruta acabou de spawnar em [${posX},${posY}]! Total: ${fruits.length}`);
				}
			} else {
				if(debugMode) {
					console.log(`Não foi possível spawnar mais uma fruta, pois foi atingido o limite de ${fruits.length} frutas em campo.`);
				}
			}
		} else {
			if(debugMode) {
				console.log(`Não existem jogadores suficiente para jogar, o jogo está sendo reiniciado, e todas as frutas removidas.`);
			}
			// Se não tiver pelo menos dois jogadores, deleta todas as frutas do campo.
			fruits = new Array();

			// Transmite a array de frutas pros clientes conectados.
			io.emit('fruitsAtt', fruits);
		}
	}

}, 2000);

function testCollisionWithFruit(player) {
	var score = false;

	// Varre a lista de frutas, e para cada..
	for(var i = 0; i < fruits.length; i++) {
		// Checa se o player está na posição X e Y igual a da fruta atual
		if(fruits[i].posX == player.posX && fruits[i].posY == player.posY) {
			// Primeiro vamos remover a fruta do campo
			fruits.splice(i, 1);
			// Atualize todos os clientes para saber que frutas foram atualizadas.
			io.emit('fruitsAtt', fruits);
			// Retorna que o player teve um score positivo.
			score = true;

			if(debugMode) {
				console.log(`Jogador ${player.socketId} acabou de pegar uma fruta na posição [${player.posX},${player.posY}]. Total: ${player.score + 1}`);
			}
		}
	}

	return score;
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

			console.log(`O usuário ${this.id} acabou de desconectar. Jogadores atuais: ${players.length}`);

			// Emitimos a atualização para todos os jogadores.
			io.emit('playersAtt', players);
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
	console.log(players);

	io.emit('playersAtt', players);

	/*
	// Gera uma uma posição X e Y randômica e válida para um jogador
	var posX = generateRandomCanvasPixel();
	var posY = generateRandomCanvasPixel();

	// Envia para a array de jogadores, o novo jogador, com sua respectiva posição e id
	players.push({posX: posX, posY: posY, socketId: socket.id, score: 0});

	// Emite mensagem no console do servidor.
	console.log(`O usuário de ID ${socket.id} conectou. Total de jogadores: ${players.length}`);

	// Emite para o cliente, o ID do próprio cliente.
	socket.emit('id', socket.id);

	// Emite um pong para o cliente, para enviar o primeir ping

	// Emite para o cliente, todas as frutas spawnadas.
	socket.emit('fruitsAtt', fruits);

	// Emite para todos os jogadores, a lista de jogadores atual.
	io.emit('playersAtt', players);

	socket.on('sendPing', function() {
		socket.emit('sendPong');
	});

	// Ao receber uma informação de move (movimento) do socket (cliente)...
	socket.on('move', function(key) {
		// Varre a lista de jogadores
		for(var i = 0; i < players.length; i++) {
			// E procura o jogador que pressionou a tecla
			if(players[i].socketId == socket.id) {
				// Vamos verificar qual tecla foi pressionada
				switch(key) {
					case 'left':
						// Se o jogador puder se mexer o suficiente para não sair da tela, ou seja,
						// se o valor não ficar negativo, então é possível mexê-lo.
						if((players[i].posX - playerW) >= 0) {
							// Faz o jogador se mover a um pixel de jogador para a esquerda;
							players[i].posX -= playerW;
							// Chama a função que testa a colisão com uma fruta.
							if(testCollisionWithFruit(players[i])) {
								// Se a colisão aconteceu, aumenta um ponto para o jogador.
								players[i].score += 1;
								// Se o jogador fez pontuação igual a múltiplo de 10
								if(players[i].score % 10 == 0) {
									// Emite som para todos
									io.emit('audio', 'fruitCollect10');
									console.log('DEBUG: Emitindo som pra todos.')
								} else {
									// Emite som só pra ele
									socket.emit('audio', 'fruitCollect');
									console.log('DEBUG: Emitindo som pro cliente.');
								}
							}
							// Emit this update to everyone
							io.emit('playersAtt', players);
						}
						break;
					case 'up':
						if((players[i].posY - playerH) >= 0) {
							players[i].posY -= playerH;
							if(testCollisionWithFruit(players[i])) {
								players[i].score += 1;
								// Se o jogador fez pontuação igual a múltiplo de 10
								if(players[i].score % 10 == 0) {
									// Emite som para todos
									io.emit('audio', 'fruitCollect10');
									console.log('DEBUG: Emitindo som pra todos.')
								} else {
									// Emite som só pra ele
									socket.emit('audio', 'fruitCollect');
									console.log('DEBUG: Emitindo som pro cliente.');
								}
							}
							io.emit('playersAtt', players);
						}
						break;
					case 'right':
						if((players[i].posX + playerW) < canvasW) {
							players[i].posX += playerW;
							if(testCollisionWithFruit(players[i])) {
								players[i].score += 1;
								// Se o jogador fez pontuação igual a múltiplo de 10
								if(players[i].score % 10 == 0) {
									// Emite som para todos
									io.emit('audio', 'fruitCollect10');
									console.log('DEBUG: Emitindo som pra todos.')
								} else {
									// Emite som só pra ele
									socket.emit('audio', 'fruitCollect');
									console.log('DEBUG: Emitindo som pro cliente.');
								}
							}
							io.emit('playersAtt', players);
						}
						break;
					case 'down':
						if((players[i].posY + playerH) < canvasH) {
							players[i].posY += playerH;
							if(testCollisionWithFruit(players[i])) {
								players[i].score += 1;
								// Se o jogador fez pontuação igual a múltiplo de 10
								if(players[i].score % 10 == 0) {
									// Emite som para todos
									io.emit('audio', 'fruitCollect10');
									console.log('DEBUG: Emitindo som pra todos.')
								} else {
									// Emite som só pra ele
									socket.emit('audio', 'fruitCollect');
									console.log('DEBUG: Emitindo som pro cliente.');
								}
							}
							io.emit('playersAtt', players);
						}
						break;
					default:
				}
			}
		}
		
	});

	*/

	// Quando um jogador desconecta, ele deve ser removido.
	socket.on('disconnect', playerDisconnect);
	
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});