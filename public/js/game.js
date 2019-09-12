class Board
{
	constructor()
	{
		this.width = 460;
		this.height = 460;
		this.color = "lightgray";
		this.init();
	}

	getContext()
	{
		this.context = this.canvas.getContext("2d");
		return this.context;
	}

	init()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		document.body.appendChild(this.canvas);
		this.getContext();
		
	}

	draw()
	{
		this.drawBoard();
		this.drawPlayers();
	}

	drawBoard()
	{
		this.context.fillStyle = this.color;
		this.context.fillRect(0, 0, this.width, this.height);
	}

	drawFruits()
	{
		for(let i = 0; i < fruitList.length; i++) {
			this.context.fillStyle = fruitList[i].color;
			this.context.fillRect(fruitList[i].posX, fruitList[i].posY, fruitWidth, fruitHeight);
		}
	}

	drawPlayers()
	{
		// Varre a lista de jogadores
		for(let i = 0; i < playerList.length; i++) {
			
			// Se nosso jogador ainda não entrou no game
			if(myPlayer == null) {
				// Desenha todos os jogadores da lista, pois ele não está lá.
				this.context.fillStyle = 'darkgray';
				this.context.fillRect(playerList[i].posX, playerList[i].posY, playerWidth, playerHeight);

				// Desenha o score do player, no meio dele
				this.context.fillStyle = '#666664';
				this.context.font = "10px Arial";
				if(playerList[i].score < 10) {
					this.context.fillText(playerList[i].score, playerList[i].posX + (playerWidth / 3.0), playerList[i].posY + (playerHeight / 1.5));
				} else {
					this.context.fillText(playerList[i].score, playerList[i].posX + (playerWidth / 4.5), playerList[i].posY + (playerHeight / 1.5));
				}
			} else {
				// Se o nosso jogador já entrou no game, então desenhe todos, MENOS ele.
				if(playerList[i].id != myPlayer.id) {
					// Desenha todos os jogadores da lista, pois ele não está lá.
					this.context.fillStyle = 'darkgray';
					this.context.fillRect(playerList[i].posX, playerList[i].posY, playerWidth, playerHeight);

					// Desenha o score do player, no meio dele
					this.context.fillStyle = '#666664';
					this.context.font = "10px Arial";
					if(playerList[i].score < 10) {
						this.context.fillText(playerList[i].score, playerList[i].posX + (playerWidth / 3.0), playerList[i].posY + (playerHeight / 1.5));
					} else {
						this.context.fillText(playerList[i].score, playerList[i].posX + (playerWidth / 4.5), playerList[i].posY + (playerHeight / 1.5));
					}
				} else {
					// Quando o nosso próprio jogador aparecer aqui
					// Atualizaremos o score dele, pro score recebido.
					myPlayer.score = playerList[i].score;
				}
			}
		}
		
		if(myPlayer != null) {
			// Então o desenha o nosso player de amarelo.
			this.context.fillStyle = '#ffec75';
			this.context.fillRect(myPlayer.posX, myPlayer.posY, playerWidth, playerHeight);

			// Desenha o score do player, no meio dele
			this.context.fillStyle = '#999057';
			this.context.font = "10px Arial";
			// Se o score do player só tiver um digito, desenharemos no meio do quadrado.
			if(myPlayer.score < 10) {
				this.context.fillText(myPlayer.score, myPlayer.posX + (playerWidth / 3.0), myPlayer.posY + (playerHeight / 1.5));
			} else {
			// Se tiver mais de um dígito, desenharemos um pouco antes do meio, para ficar centralizado.
				this.context.fillText(myPlayer.score, myPlayer.posX + (playerWidth / 4.5), myPlayer.posY + (playerHeight / 1.5));
			}
		}

	}

	drawFPS()
	{
		this.context.font = "12px Arial";
    	this.context.fillStyle = 'red';
    	this.context.fillText(`FPS: ${fps} | PING: ${ping} ms`, 5, 15)
	}

	calculateFPS()
	{
		if(!fpsLastCalledTime) {
			fpsLastCalledTime = performance.now();
			fps = 0;
			return;
		}
	
		var delta = (performance.now() - fpsLastCalledTime) / 1000;
		fpsLastCalledTime = performance.now();
		fps = Math.round(1/delta);
	}
}

var socket = io();
var board = new Board();
var playerList = new Array();
var myPlayer = null;
var fruitList = new Array();
var canvasWidth = 460;
var canvasHeight = 460;
var playerWidth = 20;
var playerHeight = 20;
var fruitWidth = 20;
var fruitHeight = 20;
var fps = 0;
var fpsLastCalledTime = 0;
var ping = 0;
var startTimer;

/************
 * Funções
 ***********/

// Função que recebe os parâmetros iniciais de jogo.
function recieveInitalParams(data) {
	// Pega informações deste jogador do cliente, e armazêna-o.
	myPlayer = data.player;
	
	// NOTA: também recebemos outras informações, mas não usaremos agora.
}

// Função que atualiza a lista de players para a atual.
function updateAllPlayers(players) {
	playerList = players;
}

// Função que atualiza a lista de frutas para a atual.
function updateAllFruits(fruits) {
	fruitList = fruits;
}

/**
 * Networking with socket ID
 */
socket.on('init', recieveInitalParams);

// Função que escuta playersAtt e executa a função abaixo
socket.on('playersAtt', updateAllPlayers);

// Função que escuta fruitsAtt e executa a função abaixo
socket.on('fruitsAtt', updateAllFruits);

/*
// Função que escuta a hora de ativar um efeito sonoro
socket.on('audio', function(audio){
	var sound_coin = document.getElementById("sound_coin");
	var sound_oneup = document.getElementById("sound_oneup");
	
	switch(audio) {
		case 'fruitCollect':
			sound_coin.volume = 0.2;
			if(sound_coin.ended) {
				sound_coin.play();
			} else {
				sound_coin.load();
				sound_coin.play();
			}
			
			break;
		case 'fruitCollect10':
			sound_oneup.volume = 0.2;
			if(sound_oneup.ended) {
				sound_oneup.play();
			} else {
				sound_oneup.load();
				sound_oneup.play();
			}

			break;
		default:
			// DO NOTHING
	}
	
});
*/

/**
 * Inputs
 */

// Atualização do movimento: adiciona um escutador de evento, que executará
// a função abaixo quando o evento "keyup" (Pressionar tecla) for ativado, passando
// como parâmetro a própria tecla (e).
document.addEventListener('keyup', function(e){
	// Vamos criar uma variavel para a tecla que o usuário apertou.
	var key = e.keyCode;

	// Agora vamos identificar qual tecla ele apertou:
	switch(key) {
		case 37:
			if((myPlayer.posX - playerWidth) >= 0) {
				// Se ele apertou setinha para esquerda, move o jogador
				myPlayer.posX -= playerWidth; 
				// e depois envia uma alteração de movimento pro servidor.
				socket.emit('input', 'left');
			}
			break;
		case 38:
			if((myPlayer.posY - playerHeight) >= 0) {
				// Se ele apertou setinha para cima, move o jogador
				myPlayer.posY -= playerHeight; 
				// e depois envia uma alteração de movimento pro servidor.
				socket.emit('input', 'up');
			}
			break;
		case 39:
			if((myPlayer.posX + playerWidth) < canvasWidth) {
				// Se ele apertou setinha para direita, move o jogador
				myPlayer.posX += playerWidth; 
				// e depois envia uma alteração de movimento pro servidor.
				socket.emit('input', 'right');
			}
			break;
		case 40:
			if((myPlayer.posY + playerHeight) < canvasHeight) {
				// Se ele apertou setinha para baixo, move o jogador
				myPlayer.posY += playerHeight; 
				// e depois envia uma alteração de movimento pro servidor.
				socket.emit('input', 'down');
			}
			break;
		default:
			// Não faz nada
	}

});

// NOTA: Essa não é a melhor forma de fazê-lo, o ideal seria o ping ser do servidor pro cliente,
// e não do cliente pro servidor. ;)
setInterval(function(){
	startTimer = Date.now();
	socket.emit('sendPing');
}, 2000);

socket.on('sendPong', function(){ 
	ping = Date.now() - startTimer;
})

//Game loop
function gameLoop() {

	board.drawBoard();
	board.drawFruits();
	board.drawPlayers();
	board.drawFPS();
	board.calculateFPS();
	window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);