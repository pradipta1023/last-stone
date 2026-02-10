import {
  broadcast,
  handleCloseConnection,
  handleConnection,
  playWithBot,
  write,
} from "./reQuestHandler.js";

const buffer = new Uint8Array(1024);
const decoder = new TextDecoder();

export const handleLobby = async (lobby, roomId) => {
  try {
    console.log(`Room opened with room id: ${roomId}`);
    await handleConnection(lobby, roomId);
  } catch {
    await broadcast(
      players,
      "\nUnexpected error appeared\nPlease join again\n",
    );
    await handleCloseConnection(lobby, roomId);
    return;
  }
};

const getPlayerName = async (conn) => {
  const hasLeft = (await write(conn, "\nEnter your name\n> ")).isClosed;
  if (hasLeft) return { isClosed: true };
  const bytesRead = await conn.read(buffer);
  if (bytesRead === null) return { isClosed: true };
  return { name: decoder.decode(buffer.slice(0, bytesRead)) };
};

const getPlayerChoice = async (conn) => {
  const hasLeft = await write(
    conn,
    "\n1. Single player\n2. Multi player\nEnter your choice\n> ",
  ).isClosed;

  if (hasLeft) return { isClosed: true };
  const bytesRead = await conn.read(buffer);

  if (bytesRead === null) {
    console.log("Player left");
    return { isClosed: true };
  }

  const choice = decoder.decode(buffer.slice(0, bytesRead)).trim();

  if (!(["1", "2"].includes(choice))) {
    await write(conn, "\nPlease enter a valid choice");
    return await getPlayerChoice(conn);
  }

  return { playerChoice: choice };
};

let players = [];
function* generateId() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

const lobby = {};

const idIterator = generateId();
let lobbyId;

export const handlePlayerRequest = async (conn) => {
  const repsonse = await getPlayerName(conn);
  if (repsonse.isClosed) return;

  const player = { conn, name: repsonse.name };

  const choiceResponse = await getPlayerChoice(conn);

  if (choiceResponse.isClosed) return;

  const { playerChoice } = choiceResponse;

  if (playerChoice === "1") {
    return playWithBot(player);
  }

  players.push(player);

  if (players.length === 1) {
    lobbyId = idIterator.next().value;
    lobby[lobbyId] = players;
    await broadcast(lobby[lobbyId], `\nWaiting for another player to join\n`);
  }
  if (players.length === 2) {
    handleLobby(lobby, lobbyId);
    players = [];
  }
};
