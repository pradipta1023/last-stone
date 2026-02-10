import { handlePlayerRequest } from "./lobbyHandler.js";

export const init = async (port) => await Deno.listen({ port });

export const listen = async (port) => {
  const listener = await init(port);
  for await (const conn of listener) {
    handlePlayerRequest(conn);
  }
};
