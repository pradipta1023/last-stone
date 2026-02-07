export const init = async (port) => await Deno.listen({ port });

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buffer = new Uint8Array(1024);

const broadcast = async (players, message) => {
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    try {
      await write(player.conn, message);
    } catch {
      console.log("Player left while broadcasting");
      players.splice(i, 1);
      return { isClosed: true };
    }
  }
  return { isClosed: false };
};

const isInRange = (value) => value >= 1 && value <= 3;

const write = async (conn, message) => {
  try {
    await conn.write(encoder.encode(message));
  } catch {
    console.log("Player left while giving name");
    return { isClosed: true };
  }
  return { isClosed: false };
};

const getUserInput = async (player, noOfSticks) => {
  await write(player.conn, "\nEnter your move \n> ");
  const bytesRead = await player.conn.read(buffer);
  if (bytesRead === null) return { isClosed: true };
  const userInput = decoder.decode(buffer.slice(0, bytesRead));
  const parsedInput = +userInput;
  const isNotInteger = !Number.isInteger(parsedInput);
  const sticksLeft = noOfSticks - parsedInput;

  if (isNotInteger || !isInRange(parsedInput) || sticksLeft < 0) {
    await write(player.conn, `\n${userInput.trim()} is not a valid move\n`);
    return getUserInput(player);
  }

  return { parsedInput };
};

const createSticks = (length) => Array(length).fill("🦯").join("");

const pad = (str, length) => {
  let newStr;
  const totalLength = 50;
  const padLength = totalLength - length;
  const padStart = Math.ceil(padLength / 2);
  const padEnd = padLength - padStart;

  newStr = str.padStart(padStart);
  newStr = newStr.padEnd(padEnd);
  return newStr;
};

const sticksRemainingMessage = (sticksLeft) => {
  const stars = "*".repeat(50);
  const sticksRemaining = `\n${stars}
  ${pad(createSticks(sticksLeft), sticksLeft)}\n${stars}\n`;
  return sticksRemaining;
};

const handleConnection = async (roomId) => {
  const players = lobby[roomId];
  await broadcast(players, "\nReady to play!!\n");
  let [noOfSticks, turn, isError] = [8, 0, false];

  while (noOfSticks > 0) {
    const userInput = await getUserInput(players[turn], noOfSticks);
    if (userInput.isClosed) {
      players.splice(turn, 1);
      isError = true;
      break;
    }
    turn = 1 - turn;
    noOfSticks -= Number(userInput.parsedInput);

    const hasLeft =
      (await broadcast(players, sticksRemainingMessage(noOfSticks))).isClosed;
    if (hasLeft) {
      await broadcast(players, "Your opponent left");
      return;
    }
    noOfSticks;
    if (noOfSticks === 1) break;
  }

  if (isError) await broadcast(players, "\nYour opponent left\n");
  else await broadcast(players, `Winner: ${players[1 - turn].name}\n`);
  await handleCloseConnection(roomId);
};

const lobby = {};

function* generateId() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

const handleCloseConnection = async (roomId) => {
  const players = lobby[roomId];

  for (const player of players) {
    await player.conn.close();
  }

  delete lobby[roomId];
  console.log(`Room closed with room id: ${roomId}`);
};

const handleLobby = async (roomId) => {
  console.log(`Room opened with room id: ${roomId}`);
  const players = lobby[roomId];
  let i = 0;
  for (const player of players) {
    await write(player.conn, "\nEnter your name\n> ");

    const bytesRead = await player.conn.read(buffer);
    if (bytesRead === null) {
      players.splice(i, 1);
      await broadcast(players, "\nYour opponent left\n");
      return await handleCloseConnection(roomId);
    }

    const name = decoder.decode(buffer.subarray(0, bytesRead));
    player["name"] = name;
    i++;
  }

  await handleConnection(roomId);
  console.log(`Room closed with room id: ${roomId}`);
};

export const listen = async (port) => {
  const listener = await init(port);
  const idIterator = generateId();
  let players = [];
  let currentLobbyId;
  for await (const conn of listener) {
    players.push({ conn });
    if (players.length === 1) {
      currentLobbyId = idIterator.next().value;
      lobby[currentLobbyId] = players;
      await broadcast(
        lobby[currentLobbyId],
        `\nWaiting for another player to join\n`,
      );
    }
    if (players.length === 2) {
      handleLobby(currentLobbyId);
      players = [];
    }
  }
};
