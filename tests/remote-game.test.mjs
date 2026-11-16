import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(file, aliases = {}) {
  const filename = path.join(root, file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireOriginal = loaded.require.bind(loaded);
  loaded.require = (name) => aliases[name] ?? requireOriginal(name);
  loaded._compile(code, filename);
  return loaded.exports;
}

test("remote games share Redis, handle simultaneous updates, turns, timeouts and rematches", async (t) => {
  const oldFetch = global.fetch;
  const oldUrl = process.env.KV_REST_API_URL;
  const oldToken = process.env.KV_REST_API_TOKEN;
  process.env.KV_REST_API_URL = "https://redis.example.test";
  process.env.KV_REST_API_TOKEN = "test";
  t.after(() => {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.KV_REST_API_URL; else process.env.KV_REST_API_URL = oldUrl;
    if (oldToken === undefined) delete process.env.KV_REST_API_TOKEN; else process.env.KV_REST_API_TOKEN = oldToken;
  });
  const records = new Map();
  global.fetch = async (_url, options) => {
    const execute = ([command, ...args]) => {
      let result;
      switch (command.toLowerCase()) {
        case "get": result = records.get(args[0]) ?? null; break;
        case "set":
          if (args.includes("NX") && records.has(args[0])) result = null;
          else { records.set(args[0], args[1]); result = "OK"; }
          break;
        case "eval": {
          const [, , key, oldValue, newValue] = args;
          result = records.get(key) === oldValue ? 1 : 0;
          if (result) records.set(key, newValue);
          break;
        }
        default: throw new Error(`Unexpected Redis command ${command}`);
      }
      return { result };
    };
    const body = JSON.parse(options.body);
    return new Response(JSON.stringify(Array.isArray(body[0]) ? body.map(execute) : execute(body)));
  };
  const aliases = {
    "@/lib/game-logic": load("src/lib/game-logic.ts"),
    "@/lib/game-state": load("src/lib/game-state.ts"),
  };
  const db = load("src/lib/remote-db.ts", aliases);
  // A separate module instance stands in for a second serverless instance.
  const other = load("src/lib/remote-db.ts", aliases);
  const game = await db.createRemoteGame();
  assert.equal((await other.getRemoteGame(game.id)).status, "waiting");
  await Promise.all([db.setPlayerName(game.id, 1, "Alice"), other.setPlayerName(game.id, 2, "Bob")]);
  await Promise.all([db.setReady(game.id, 1, ["cold"]), other.setReady(game.id, 2, ["cold"])]);
  let state = await db.getRemoteGame(game.id);
  assert.equal(state.player1Name, "Alice");
  assert.equal(state.player2Name, "Bob");
  assert.equal(state.status, "playing");
  assert.deepEqual(state.history, ["cold"]);
  const dictionary = new Set(["cold", "cord", "card", "ward"]);
  await assert.rejects(other.submitMove(game.id, 2, "cord", dictionary), /not your turn/);
  await assert.rejects(db.submitMove(game.id, 1, "xxxx", dictionary), /dictionary/);
  state = await db.submitMove(game.id, 1, "cord", dictionary);
  assert.equal(state.currentPlayer, 2);
  assert.deepEqual((await other.getRemoteGame(game.id)).history, ["cold", "cord"]);
  state.turnStartTime = Date.now() - 31000;
  records.set(`game:remote:${game.id}`, JSON.stringify(state));
  state = await other.getRemoteGame(game.id);
  assert.equal(state.status, "game_over");
  assert.equal(state.winner, 1);
  assert.equal(state.endReason, "timeout");
  state = await db.restartGame(game.id, ["cold"]);
  assert.equal(state.status, "playing");
  assert.deepEqual(state.history, ["cold"]);
  assert.equal(await db.getRemoteGame("missing"), null);
});
