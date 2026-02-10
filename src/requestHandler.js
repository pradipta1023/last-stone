import { botMove } from "./bot.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buffer = new Uint8Array(1024);

export const broadcast = async (players, message) => {
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

export const write = async (conn, message) => {
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
  try {
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
  } catch {
    return { isClosed: true };
  }
};

const createSticks = (length) => Array(length).fill(" 🦯 ").join("");

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

export const handleCloseConnection = async (lobby, roomId) => {
  const players = lobby[roomId];

  for (const player of players) {
    await player.conn.close();
  }

  delete lobby[roomId];
  console.log(`Room closed with room id: ${roomId}`);
  return true;
};

export const handleConnection = async (lobby, roomId) => {
  const players = lobby[roomId];
  const readyMsg = "\nReady to play!!\n";
  let [noOfSticks, turn, isError, winWhileLastLeft] = [10, 0, false, false];
  await broadcast(players, readyMsg + sticksRemainingMessage(noOfSticks));

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

    if (hasLeft) return await broadcast(players, "Your opponent left");

    if (noOfSticks === 1) {
      winWhileLastLeft = true;
      break;
    }
  }
  const winner = winWhileLastLeft ? players[1 - turn].name : players[turn].name;
  const msgToShow = isError ? "\nYour opponent left\n" : `Winner: ${winner}\n`;

  await broadcast(players, msgToShow);
  await handleCloseConnection(lobby, roomId);
};

export const playWithBot = async (player) => {
  // await write(player.conn, "\nPlaying With BOT\n");
  let noOfSticks = 10;
  let turn = 0;
  while (noOfSticks > 0) {
    const userInput = await getUserInput(player, noOfSticks);
    if (userInput.isClosed) return console.log(`${player.name} left the game`);

    noOfSticks -= userInput.parsedInput;
    if (noOfSticks === 1) break;
    turn = 1 - turn;

    const moveOfBot = botMove(noOfSticks);
    noOfSticks -= moveOfBot;
    const repsonse = await write(player.conn, `Bot's move: ${moveOfBot}`);
    if (repsonse.isClosed) return console.log(`${player.name} left the game`);
    await write(player.conn, sticksRemainingMessage(noOfSticks));

    if (noOfSticks === 1) break;
    turn = 1 - turn;
  }
  if (turn === 1) await write(player.conn, "\nBot wins\n");
  else await write(player.conn, `\n${player.name} wins\n`);
  try {
    await player.conn.close();
  } catch {
    console.log("Player left");
  }
};
