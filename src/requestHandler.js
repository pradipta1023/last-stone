export const init = async (port) => await Deno.listen({ port });

const encoder = new TextEncoder();

const broadcast = async (players) => {
  for (const player of players) {
    await player.conn.write(encoder.encode("Ready to play!!"));
  }
};

const handleConnection = async (players) => {
  await broadcast(players);
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
