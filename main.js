/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/engine/src/main.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uniqueUserName = exports.validUserName = void 0;
const tslib_1 = __webpack_require__("tslib");
const admin_ui_1 = __webpack_require__("@socket.io/admin-ui");
const socket_io_1 = __webpack_require__("socket.io");
const serverLogic_1 = __webpack_require__("./libs/core-components/src/lib/lobby/serverLogic.ts");
const serverLogic_2 = __webpack_require__("./libs/game/number-game/src/lib/serverLogic.ts");
const io = new socket_io_1.Server(3000, {
    cors: {
        origin: [/(localhost)./, /(minerva.us)/, /(ravenwood.io)/, "https://admin.socket.io", /()/],
        credentials: true
    },
});
(0, admin_ui_1.instrument)(io, {
    auth: false
});
const randomString = (int) => Array.from(Array(int), () => Math.floor(Math.random() * 36).toString(36)).join('');
const omit = (obj, keys) => Object.keys(obj).filter((k) => !keys.includes(k)).reduce((res, k) => Object.assign(res, { [k]: obj[k] }), {});
const Games = [
    { name: '/', logic: null },
    { name: 'lobby', logic: serverLogic_1.LobbyLogic },
    { name: 'area', logic: null },
    { name: 'stellcon', logic: null },
    { name: 'number-game', logic: serverLogic_2.ServerLogic },
];
let users = [];
const validUserName = (name) => /^([a-zA-Z0-9_-]){1,10}$/.test(name);
exports.validUserName = validUserName;
const uniqueUserName = (name) => !users.some(u => u.name === name);
exports.uniqueUserName = uniqueUserName;
const userLoggedIn = (user) => users.filter(u => isEqual(u, user));
const isEqual = (...objects) => objects.every((obj) => JSON.stringify(obj) === JSON.stringify(objects[0]));
const getRoomData = (game) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const rooms = [];
    const gameRooms = yield game.adapter.rooms;
    try {
        for (var gameRooms_1 = tslib_1.__asyncValues(gameRooms), gameRooms_1_1; gameRooms_1_1 = yield gameRooms_1.next(), !gameRooms_1_1.done;) {
            const [roomName] = gameRooms_1_1.value;
            if (true) {
                const players = [];
                const watchers = [];
                game.in(roomName).fetchSockets().then((sockets) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    sockets.forEach((s) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        var _b;
                        const isPlayer = (_b = s.data.playing) === null || _b === void 0 ? void 0 : _b.includes(roomName);
                        isPlayer ? players.push(s.data.user.name) : watchers.push(s.data.user.name);
                    }));
                }));
                rooms.push({ name: roomName, players: players, watchers: watchers });
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (gameRooms_1_1 && !gameRooms_1_1.done && (_a = gameRooms_1.return)) yield _a.call(gameRooms_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return rooms;
});
const getRoomUsers = (game, room) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const users = [];
    yield game.in(room).fetchSockets().then(sockets => sockets.forEach(s => users.push(omit(s.data.user, ['token']))));
    return users;
});
const cleanUpUsers = () => {
};
Games.map(gameInfo => {
    const game = io.of(gameInfo.name);
    let messages = [];
    game.use((socket, next) => {
        const requestedUser = socket.handshake.auth;
        if (requestedUser === null || requestedUser === void 0 ? void 0 : requestedUser.token) {
            const loggedin = userLoggedIn(requestedUser);
            if (loggedin)
                socket.data.user = requestedUser;
        }
        else {
            if (!(0, exports.validUserName)(requestedUser.name))
                return new Error("Username must be 1 to 10 alphanumeric characters long");
            if (!(0, exports.uniqueUserName)(requestedUser.name))
                return new Error("User already exists");
            const user = { name: requestedUser.name, id: socket.id, token: randomString(20) };
            socket.data.user = user;
            users.push(user);
        }
        next();
    });
    game.on('connection', (socket) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const user = socket.data.user;
        game.to(user.id).emit('joined', user);
        game.emit('rooms', yield getRoomData(game));
        socket.on("disconnect", () => {
            var _a;
            (_a = socket.data.playing) === null || _a === void 0 ? void 0 : _a.forEach((r) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                const message = { room: r, name: 'System', message: `${user.name} left room ${r} for ${game.name}` };
                messages.unshift(message);
                game.to(r).emit('message', messages.filter(m => m.room === r));
                game.to(r).emit('users', yield getRoomUsers(game, r));
            }));
        });
        socket.on(('joinRoom'), ({ room = randomString(4), joinAsPlayer }, callback) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const roomUsers = yield getRoomUsers(game, room);
            const joinedBefore = roomUsers.some(r => r.name === socket.data.user.name);
            if (joinAsPlayer) {
                const roomsAsPlayer = ((_a = socket.data.playing) === null || _a === void 0 ? void 0 : _a.length) ? socket.data.playing : [];
                socket.data.playing = [...roomsAsPlayer, room];
            }
            socket.join(room);
            const message = { room: room, name: 'System', message: `${user.name} joining room ${room} for ${game.name}` };
            messages.unshift(message);
            game.to(room).emit('message', messages.filter(m => m.room === room));
            game.to(room).emit('users', yield getRoomUsers(game, room));
            callback(room);
        }));
        socket.on("message", ({ room = '', message: incomingMsg }) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const message = { room: room, name: user.name, message: incomingMsg };
            messages.unshift(message);
            game.to(room).emit('message', messages.filter(m => m.room === room));
            game.to(room).emit('users', yield getRoomUsers(game, room));
        }));
        if (gameInfo.logic)
            game.name === 'lobby' ? gameInfo.logic(game, socket, io) : gameInfo.logic(game, socket);
    }));
});


/***/ }),

/***/ "./libs/core-components/src/lib/lobby/serverLogic.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LobbyLogic = void 0;
const tslib_1 = __webpack_require__("tslib");
const randomString = (int) => Array.from(Array(int), () => Math.floor(Math.random() * 36).toString(36)).join('');
const LobbyLogic = (lobby, socket, io) => {
    const getRoomData = (gameName) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const rooms = [];
        const gameNameSpace = io.of(gameName);
        const gameRooms = yield gameNameSpace.adapter.rooms;
        try {
            for (var gameRooms_1 = tslib_1.__asyncValues(gameRooms), gameRooms_1_1; gameRooms_1_1 = yield gameRooms_1.next(), !gameRooms_1_1.done;) {
                const [roomName] = gameRooms_1_1.value;
                const players = [];
                const watchers = [];
                lobby.in(roomName).fetchSockets().then((sockets) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                    sockets.forEach((s) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
                        var _b;
                        const isPlayer = (_b = s.data.playing) === null || _b === void 0 ? void 0 : _b.includes(roomName);
                        isPlayer ? players.push(s.data.userName) : watchers.push(s.data.userName);
                    }));
                }));
                rooms.push({ name: roomName, players: players, watchers: watchers });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (gameRooms_1_1 && !gameRooms_1_1.done && (_a = gameRooms_1.return)) yield _a.call(gameRooms_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return rooms;
    });
    socket.on('getRooms', (game) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        socket.emit('rooms', yield getRoomData(game));
    }));
};
exports.LobbyLogic = LobbyLogic;


/***/ }),

/***/ "./libs/game/number-game/src/lib/helpers.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gameState = exports.playerInitState = exports.roomInitState = exports.playerNumber = exports.numcheck = exports.dupeCheck = exports.validGuess = void 0;
const validGuess = (guess) => /^(\d)(?!.*\1)(\d)(?!.*\2)(\d)(?!.*\3)(\d)(?!.*\4)\d$/.test(guess);
exports.validGuess = validGuess;
const dupeCheck = (guess, guesses) => guesses.some(g => g === guess);
exports.dupeCheck = dupeCheck;
const numcheck = (number, guess) => {
    let p = 0, n = 0;
    for (let i = 0; i < 5; i++)
        guess.indexOf(number.charAt(i)) !== -1 && (guess.charAt(i) == number.charAt(i) ? p++ : n++);
    return { guess: guess, p: p, n: n };
};
exports.numcheck = numcheck;
const playerNumber = (players, player) => Object.entries(players).findIndex(([_, v]) => v.user.id === player.id) + 1;
exports.playerNumber = playerNumber;
exports.roomInitState = {
    players: {},
    maxPlayers: 2,
    turn: 2,
    state: 0
};
exports.playerInitState = {
    user: {},
    guesses: [],
    number: ''
};
var gameState;
(function (gameState) {
    gameState[gameState["open"] = 0] = "open";
    gameState[gameState["initalizing"] = 1] = "initalizing";
    gameState[gameState["playing"] = 2] = "playing";
    gameState[gameState["finished"] = 3] = "finished";
})(gameState = exports.gameState || (exports.gameState = {}));


/***/ }),

/***/ "./libs/game/number-game/src/lib/serverLogic.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ServerLogic = exports.serverState = void 0;
const helpers_1 = __webpack_require__("./libs/game/number-game/src/lib/helpers.ts");
exports.serverState = {
    roomData: {},
    initRoom(room) { if (!this.roomData.hasOwnProperty(room))
        this.roomData[room] = JSON.parse(JSON.stringify(helpers_1.roomInitState)); },
    addUser(room, player) { var _a; for (let i = 1; i <= this.roomData[room].maxPlayers; i++) {
        if (!this.roomData[room].players.hasOwnProperty(i) && ((_a = this.roomData[room].players[i - 1]) === null || _a === void 0 ? void 0 : _a.user.id) !== player.id) {
            this.roomData[room].players[i] = JSON.parse(JSON.stringify(Object.assign(Object.assign({}, helpers_1.playerInitState), { user: player })));
            return i;
        }
    } },
    deleteRoom(room) { delete this.roomData[room]; },
    addGuess(room, player, guess) { this.roomData[room].players[this.getPlayerNumber(room, player)].guesses.push(guess); },
    getPlayerGuesses(room, player) { return this.roomData[room].players[this.getPlayerNumber(room, player)].guesses.map(o => o['guess']); },
    setRoomState(room, state) { this.roomData[room].state = state; },
    getPlayerNumber(room, player) { return (0, helpers_1.playerNumber)(this.roomData[room].players, player); },
    setPlayerNumber(room, player, number) { this.roomData[room].players[this.getPlayerNumber(room, player)].number = number; },
    playersAddedNumbers(room) { let numbersAdded = 0; Object.values(this.roomData[room].players).map((v) => v.number !== '' && numbersAdded++); return numbersAdded === this.roomData[room].maxPlayers; }
};
const ServerLogic = (game, socket) => {
    socket.on('getServerState', () => {
        socket.emit('serverState', exports.serverState);
    });
    socket.on('joinedRoom', (data) => {
        exports.serverState.initRoom(data.room);
        console.log(helpers_1.roomInitState);
        const playerAdded = exports.serverState.addUser(data.room, data.player);
        playerAdded === exports.serverState.roomData[data.room].maxPlayers && exports.serverState.setRoomState(data.room, helpers_1.gameState.initalizing);
        playerAdded
            ? game.to(data.room).emit('roomData', exports.serverState.roomData[data.room])
            : socket.emit('roomData', exports.serverState.roomData[data.room]);
    });
    socket.on('setNumber', (data) => {
        if (!(0, helpers_1.validGuess)(data.number)) {
            game.to(socket.id).emit('guessError', 'Number must be 5 unique digits');
            return;
        }
        exports.serverState.setPlayerNumber(data.room, data.player, data.number);
        if (exports.serverState.playersAddedNumbers(data.room)) {
            exports.serverState.setRoomState(data.room, helpers_1.gameState.playing);
            game.to(data.room).emit('roomData', exports.serverState.roomData[data.room]);
        }
    });
    socket.on('guess', (data, callback) => {
        if (!(0, helpers_1.validGuess)(data.guess)) {
            game.to(socket.id).emit('guessError', 'Guess must be 5 unique numbers');
            return;
        }
        if ((0, helpers_1.dupeCheck)(data.guess, exports.serverState.getPlayerGuesses(data.room, data.player))) {
            game.to(socket.id).emit('guessError', 'You guessed that already');
            return;
        }
        exports.serverState.addGuess(data.room, data.player, (0, helpers_1.numcheck)('12345', data.guess));
        game.to(data.room).emit('roomData', exports.serverState.roomData[data.room]);
        callback(data);
        socket.emit('serverState', exports.serverState);
    });
};
exports.ServerLogic = ServerLogic;


/***/ }),

/***/ "@socket.io/admin-ui":
/***/ ((module) => {

module.exports = require("@socket.io/admin-ui");

/***/ }),

/***/ "socket.io":
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),

/***/ "tslib":
/***/ ((module) => {

module.exports = require("tslib");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./apps/engine/src/main.ts");
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map