export const init = async (port) => await Deno.listen({ port });

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buffer = new Uint8Array(1024);

const broadcast = async (players, message) => {
  for (const player of players) {
    await write(player.conn, message);
  }
};

const isInRange = (value) => value >= 1 && value <= 3;

const write = async (conn, message) =>
  await conn.write(encoder.encode(message));

const getUserInput = async (player) => {
  await write(player.conn, "\nEnter your move \n> ");
  const bytesRead = await player.conn.read(buffer);
  const userInput = decoder.decode(buffer.slice(0, bytesRead));
  const parsedInput = +userInput;

  if (!Number.isInteger(parsedInput) || !isInRange(parsedInput)) {
    await write(player.conn, `\n${userInput} is not a valid move\n`);
    return getUserInput(player);
  }

  return parsedInput;
};

const closeConnections = async (players) => {
  for (const player of players) {
    await player.conn.close();
  }
};

const handleConnection = async (players) => {
  await broadcast(players, "\nReady to play!!\n");
  let noOfSticks = 8;
  let turn = 0;
  while (noOfSticks > 0) {
    const userInput = await getUserInput(players[turn]);
    turn = 1 - turn;
    noOfSticks -= userInput;
    await broadcast(players, `\nSticks left: ${noOfSticks}\n`);
  }
  await broadcast(players, `Winner: Player${(1 - turn) + 1}\n`);
  await closeConnections(players);
};

export const listen = async (port) => {
  const listener = await init(port);
  let players = [];
  for await (const conn of listener) {
    players.push({ conn });
    if (players.length === 2) {
      await handleConnection(players);
      players = [];
    }
  }
};
