import { handleLobby } from "./lobbyHandler.js";
import { broadcast } from "./reQuestHandler.js";

export const init = async (port) => await Deno.listen({ port });

function* generateId() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

const lobby = {};

export const listen = async (port) => {
  const listener = await init(port);
  const idIterator = generateId();
  let players = [];
  let lobbyId;
  for await (const conn of listener) {
    players.push({ conn });
    if (players.length === 1) {
      lobbyId = idIterator.next().value;
      lobby[lobbyId] = players;
      await broadcast(lobby[lobbyId], `\nWaiting for another player to join\n`);
    }
    if (players.length === 2) {
      handleLobby(lobby, lobbyId);
      players = [];
    }
  }
};
