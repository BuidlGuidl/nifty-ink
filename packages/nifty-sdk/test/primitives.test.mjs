import { test } from 'node:test';
import assert from 'node:assert/strict';
import { directoryFor } from '../dist/artifacts.mjs';
import { createBgipfsProvider, uploadDirectory, artifactReference, fetchArtifactData, uploadArtifact } from '../dist/uploads.js';
import { buyCopies } from '../dist/chain.js';

const cid = 'bafybeidi6djywulc3xgxlblogdtvxdekfuqfwkbqh7mngzqtfvmlpuuhwu';
const other = 'bafybeicqwp7dpanraovmmx2qva5weutu4cz2ht7q366mhtwetaszjqxbxu';
const files = [{ path: 'data.json', content: new TextEncoder().encode('{}') }];

const fixtureFiles = {
  "data.json": Buffer.from(
    '{"version":1,"name":"Fixture","board":{"w":1,"h":1},"background":"#ffffff","strokes":[]}'
  ),
  "image.png": Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4N8AAAAASUVORK5CYII=",
    "base64"
  ),
  "animation.svg": Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>'
  ),
};
test('artifact extraction preserves the existing onchain identity fixture', async () => {
  const fixture = await directoryFor(fixtureFiles);
  assert.equal(fixture.cid, cid);
  assert.equal(fixture.digest, artifactReference(cid).digest);
});

test('provider failures and wrong CIDs preserve successful uploads in configured order', async () => {
  const result = await uploadDirectory(files, cid, [
    { id: 'good', upload: async () => ({ cid }) },
    { id: 'wrong', upload: async () => ({ cid: other }) },
    { id: 'offline', upload: async () => { throw new Error('offline'); } },
  ]);
  assert.equal(result.success, false);
  assert.equal(result.cid, cid);
  assert.deepEqual(result.results.map(r => [r.id, r.success]), [['good', true], ['wrong', false], ['offline', false]]);
  assert.match(result.results[1].error, /different CID/);
  assert.equal(result.results[2].error, 'offline');
});

test('duplicate destinations fail before any uploads', async () => {
  let called = false;
  const provider = { id: 'same', upload: async () => { called = true; return { cid }; } };
  await assert.rejects(uploadDirectory(files, cid, [provider, provider]), /unique/);
  assert.equal(called, false);
});

test('gateway fallback retrieves JSON and upload references reject inconsistent IDs', async () => {
  const original = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async url => {
      calls.push(url);
      return calls.length === 1 ? new Response('', { status: 503 }) : Response.json({ name: 'Fixture' });
    };
    assert.deepEqual(await fetchArtifactData(cid, ['https://one.test/ipfs/', 'https://two.test/ipfs']), { name: 'Fixture' });
    assert.equal(calls[1], `https://two.test/ipfs/${cid}/data.json`);
    globalThis.fetch = async () => Response.json({ cid, digest: '0x00' });
    await assert.rejects(uploadArtifact('/artifacts', { data: {}, image: '', animation: '' }), /disagree/);
  } finally { globalThis.fetch = original; }
});

test('buy simulates the approved price, quantity, recipient and deadline before sending', async () => {
  const account = '0x1111111111111111111111111111111111111111';
  let simulated, sent;
  const client = {
    simulateContract: async request => { simulated = request; return { request }; },
    waitForTransactionReceipt: async () => ({ status: 'success' }),
  };
  const wallet = { writeContract: async request => { sent = request; return '0x1234'; } };
  const input = { account, recipient: account, id: 42n, quantity: 3n, unitPrice: 7n, deadline: 1000n };
  await buyCopies(client, wallet, { address: account, abi: [] }, input);
  assert.equal(simulated.value, 21n);
  assert.deepEqual(simulated.args, [42n, 3n, account, 7n, 1000n]);
  assert.equal(sent, simulated);
  await assert.rejects(buyCopies(client, wallet, { address: account, abi: [] }, { ...input, quantity: 0n }), /quantity/);
  client.waitForTransactionReceipt = async () => ({ status: 'reverted' });
  await assert.rejects(buyCopies(client, wallet, { address: account, abi: [] }, input), /reverted/);
});


test('BGIPFS sends a wrapped directory and rejects an error after streamed file results', async () => {
  const original = globalThis.fetch;
  const provider = createBgipfsProvider({ id: 'bg', url: 'https://upload.example.test', apiKey: 'test-only' });
  try {
    globalThis.fetch = async (url, request) => {
      assert.equal(url.searchParams.get('wrap-with-directory'), 'true');
      assert.equal(url.searchParams.get('raw-leaves'), 'true');
      assert.equal(request.body.getAll('file')[0].name, 'data.json');
      return new Response(JSON.stringify({ Hash: cid }) + '\n' + JSON.stringify({ Error: 'pin failed' }));
    };
    const failed = await uploadDirectory(files, cid, [provider]);
    assert.equal(failed.success, false);
    assert.equal(failed.results[0].error, 'pin failed');
    globalThis.fetch = async () => new Response(JSON.stringify({ Hash: other }) + '\n' + JSON.stringify({ Hash: cid }));
    assert.equal((await uploadDirectory(files, cid, [provider])).success, true);
  } finally { globalThis.fetch = original; }
});
