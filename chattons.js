document.addEventListener('DOMContentLoaded', function() {
	buttons = document.getElementById('buttons');
	buttonContent = document.getElementById('buttonContent');
	buttonName = document.getElementById('buttonName')
	overlay = document.getElementById('overlay');
	overlays = document.getElementsByClassName('overlay');
	overlayButtonForm = document.getElementById('buttonForm');
	overlaySettings = document.getElementById('settings');

	try {
		chattonsStorage = JSON.parse(localStorage.chattons);
		document.getElementById('username').value = chattonsStorage.settings.user;
		document.getElementById('channel').value = chattonsStorage.settings.chan;
		document.getElementById('oauth').value = chattonsStorage.settings.pass;
		connect();
	} catch(exception) {
		chattonsStorage = {};
		chattonsStorage.buttons = {};
		chattonsStorage.settings = {
			user : '',
			chan : '',
			pass : ''
		};
	}

	for(var name in chattonsStorage.buttons) {
		addButton(name, chattonsStorage.buttons[name], false);
	}

	var connectButtons = document.getElementsByClassName('connect');
	for(var i = 0; i < connectButtons.length; i++) {
		connectButtons[i].addEventListener('click', connect);
	}
	document.getElementById('resetButtons').addEventListener('click', function() {
		chattonsStorage.buttons = {};
		localStorage.chattons = JSON.stringify(chattonsStorage);
		var l = document.getElementsByClassName('customChattonsButton');
		for(var i = l.length - 1; i >= 0; i--) {
			l[i].remove();
		}

	});
	document.getElementById('startAddButton').addEventListener('click', startAddNewButton);
	overlay.addEventListener('click', function() {
		hideOverlay();
		var l = document.getElementsByClassName('overlay-page');
		for(var i = 0; i < l.length; i++) {
			l[i].classList.remove('active');
		}
	});
	//document.getElementById('helper').addEventListener('click', function() {event.stopPropagation();});
	document.getElementById('addButton').addEventListener('click', function() {
			addNewButton();
			showOverlay();
	});
	document.getElementById('openSettings').addEventListener('click', function() {
		overlaySettings.classList.add('active');
		showOverlay();
	});
});

function showOverlay() {
	for(var i = 0; i < overlays.length; i++) {
		overlays[i].classList.add('active');
	}
}

function hideOverlay() {
	for(var i = 0; i < overlays.length; i++) {
		overlays[i].classList.remove('active');
	}
}

function startAddNewButton() {
	overlayButtonForm.classList.add('active');
	showOverlay();
}

function addNewButton() {
	addButton(buttonName.value, buttonContent.value, true);
}

function addButton(name, content, addToStorage) {
	var newButton = document.createElement('button');
	newButton.classList.add('chattonsButton');
	newButton.classList.add('customChattonsButton');
	buttons.prepend(newButton);
	newButton.addEventListener('click', (function(content) {
		return function() {
			window.chattons.send(content);
		}
	}(content)));
	newButton.textContent = name;
	if(addToStorage) {
		window.chattonsStorage.buttons[buttonName.value] = content;
		localStorage.chattons = JSON.stringify(chattonsStorage);
	}
}

var chattons = chattonsC;

function chattonsC(options) {
	this.user = options.user;
	this.pass = options.pass;
	this.chan = options.chan.toLowerCase();
	this.server = 'irc-ws.chat.twitch.tv';
	this.port = 443;
}

chattons.prototype.open = function open() {
	this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');

	this.webSocket.onopen = this.onOpen.bind(this);
	this.webSocket.onclose = this.onClose.bind(this);
	this.webSocket.onerror = this.onError.bind(this);
	this.webSocket.onmessage = this.onMessage.bind(this);
}

chattons.prototype.onOpen = function onOpen(){
    var socket = this.webSocket;

    if (socket !== null && socket.readyState === 1) {
        console.log('Connecting and authenticating...');

        socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        socket.send('PASS ' + this.pass);
        socket.send('NICK ' + this.user);
        socket.send('JOIN #' + this.chan);
    }
};

chattons.prototype.onMessage = function onMessage(message) {
	var messageLines = message.split('\n');
	console.log(message);
	console.log(message.data);
	//:<user>.tmi.twitch.tv 353 <user> = #<channel> :<user> <user2> <user3>
	if(message.data === 'PING :tmi.twitch.tv') {
		this.webSocket.send('PONG :tmi.twitch.tv');
	} else {
		var startOfTheMessage = (':' + this.user + '.tmi.twitch.tv 353 ' + this.user + ' = #' + this.chan + ' :').toLowerCase();
		if(message.data.startsWith(startOfTheMessage)) {
			var users = message.data.split(startOfTheMessage)[1].split(' ');
			for(var i = users.length; i >= 0; i--) {
				if(!chattons.users.includes(users[i])) {
					chattons.users.push(users[i]);
				}
			}
		}
	}
}

chattons.prototype.send = function send(message) {
	if(this.webSocket.readyState > 1) {
		this.open();
	}
	this.webSocket.send('PRIVMSG #' + this.chan + ' :' + message);
}

chattons.prototype.onError = function onError(message){
    console.log('Error: ' + message);
};

chattons.prototype.onClose = function onClose(){
    console.log('Disconnected from the chat server.');
};

chattons.prototype.close = function close(){
    if(this.webSocket){
        this.webSocket.close();
        this.open();
    }
};

function connect() {
	var chattonsOptions = setupOptions();
	window.chattons = new chattonsC(chattonsOptions);

	chattons.open();
	window.chattons.timeoutID = window.setTimeout(openConnection, 3000);
}

function openConnection() {
	console.log("openConnection");
	chattons.open();
}


function setupOptions() {
	var chattonsOptions = {
		chan: '',
		user: '',
		pass: '',
	};

	chattonsOptions.user = document.getElementById('username').value;
	chattonsOptions.chan = document.getElementById('channel').value;
	chattonsOptions.pass = document.getElementById('oauth').value;
	var chattonsStorageOverride = false;
	if(typeof(chattonsOptions.user) !== 'string' || (typeof(chattonsOptions.user) === 'string' && chattonsOptions.user.trim() === '')) {
		chattonsOptions.user = chattonsStorage.settings.user;
	} else {
		chattonsStorage.settings.user = chattonsOptions.user;
		chattonsStorageOverride = true;
	}
	if(typeof(chattonsOptions.chan) !== 'string' || (typeof(chattonsOptions.chan) === 'string' && chattonsOptions.chan.trim() === '')) {
		chattonsOptions.chan = chattonsStorage.settings.chan;
	} else {
		chattonsStorage.settings.chan = chattonsOptions.chan;
		chattonsStorageOverride = true;
	}
	if(typeof(chattonsOptions.pass) !== 'string' || (typeof(chattonsOptions.pass) === 'string' && chattonsOptions.pass.trim() === '')) {
		chattonsOptions.pass = chattonsStorage.settings.pass;
	} else {
		chattonsStorage.settings.pass = chattonsOptions.pass;
		chattonsStorageOverride = true;
	}
	console.log(chattonsStorage.settings.pass);

	if(chattonsStorageOverride) {
		localStorage.chattons = JSON.stringify(chattonsStorage);
	}

	return chattonsOptions;
}
