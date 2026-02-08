import {
  broadcast,
  handleCloseConnection,
  handleConnection,
  write,
} from "./reQuestHandler.js";

const buffer = new Uint8Array(1024);
const decoder = new TextDecoder();

export const handleLobby = async (lobby, roomId) => {
  try {
    console.log(`Room opened with room id: ${roomId}`);
    const players = lobby[roomId];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const hasLeft =
        (await write(player.conn, "\nEnter your name\n> ")).isClosed;
      if (hasLeft) return await handleCloseConnection(lobby, roomId);

      const bytesRead = await player.conn.read(buffer);
      if (bytesRead === null) {
        players.splice(i, 1);
        await broadcast(players, "\nYour opponent left\n");
        return await handleCloseConnection(lobby, roomId);
      }
      const name = decoder.decode(buffer.subarray(0, bytesRead));
      player["name"] = name;
      await handleConnection(lobby, roomId);
    }
  } catch {
    await broadcast(
      players,
      "\nUnexpected error appeared\nPlease join again\n",
    );
    await handleCloseConnection(lobby, roomId);
    return;
  }
};
