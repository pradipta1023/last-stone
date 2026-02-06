export const init = async (port) => await Deno.listen({ port });

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buffer = new Uint8Array(1024);

const broadcast = async (players, message) => {
  for (const player of players) {
    await player.conn.write(encoder.encode(message));
  }
};

const getUserInput = async (player) => {
  const bytesRead = await player.conn.read(buffer);
  const userInput = +decoder.decode(buffer.slice(0, bytesRead));
  return userInput;
};

const handleConnection = async (players) => {
  await broadcast(players, "\nReady to play!!\n");
  let noOfSticks = 8;
  let turn = 0;
  while (noOfSticks > 0) {
    const player = players[turn];
    await player.conn.write(encoder.encode("\nEnter your move \n> "));
    const userInput = await getUserInput(player);
    turn = 1 - turn;
    noOfSticks -= userInput;
    await broadcast(players, `\nSticks left: ${noOfSticks}\n`);
  }
  broadcast(players, `Winner: Player${(1 - turn) + 1}`);
};

export const listen = async (port) => {
  const listener = await init(port);
  const players = [];
  for await (const conn of listener) {
    players.push({ conn });
    if (players.length === 2) {
      await handleConnection(players);
    }
  }
};
