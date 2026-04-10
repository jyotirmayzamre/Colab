import CRDT from "./crdt";
import { type Char } from "./crdt";

function benchmarkOp(durationMs: number, fn: () => boolean): number {
  let ops = 0;
  const start = performance.now();
  while (performance.now() - start < durationMs) {
    if (!fn()) break;
    ops++;
  }
  return ops;
}

function seedDocument(crdt: CRDT, numChars: number): void {
  for (let i = 0; i < numChars; i++) {
    const row = crdt.state.length - 1;
    const col = crdt.state[row].length;
    // Scatter some newlines to create a realistic multi-line doc
    const char = i % 80 === 79 ? "\n" : "a";
    crdt.localInsert(char, row, col);
  }
}

interface SizeResult {
  localInsert: number;
  localDelete: number;
  remoteInsert: number;
  remoteDelete: number;
}

function benchmarkAtSize(
  label: string,
  seedSize: number,
  durationMs: number
): SizeResult {
  console.log(`\n--- ${label} (seed: ${seedSize.toLocaleString()} chars) ---`);

  // localInsert: insert into an already-populated document
  const crdt1 = new CRDT(1);
  seedDocument(crdt1, seedSize);
  const localInsertOps = benchmarkOp(durationMs, () => {
    const row = Math.floor(Math.random() * crdt1.state.length);
    const col = Math.floor(Math.random() * (crdt1.state[row].length + 1));
    crdt1.localInsert("a", row, col);
    return true;
  });
  console.log(`  localInsert:  ${localInsertOps.toLocaleString()} ops`);

  // localDelete: delete from a populated document (re-seed each time it empties)
  const crdt2 = new CRDT(1);
  seedDocument(crdt2, seedSize);
  const localDeleteOps = benchmarkOp(durationMs, () => {
    if (crdt2.state.length === 0 || (crdt2.state.length === 1 && crdt2.state[0].length === 0)) {
      seedDocument(crdt2, seedSize);
    }
    const row = Math.floor(Math.random() * crdt2.state.length);
    if (crdt2.state[row].length === 0) return true;
    const col = Math.floor(Math.random() * crdt2.state[row].length);
    crdt2.localDelete(row, col);
    return true;
  });
  console.log(`  localDelete:  ${localDeleteOps.toLocaleString()} ops`);

  // remoteInsert: remote peer inserts into a populated document
  const crdt3 = new CRDT(1);
  const remote = new CRDT(2);
  seedDocument(crdt3, seedSize);
  seedDocument(remote, seedSize);
  const remoteInsertOps = benchmarkOp(durationMs, () => {
    const row = Math.floor(Math.random() * remote.state.length);
    const col = Math.floor(Math.random() * (remote.state[row].length + 1));
    const char = remote.localInsert("b", row, col);
    crdt3.remoteInsert(char);
    return true;
  });
  console.log(`  remoteInsert: ${remoteInsertOps.toLocaleString()} ops`);

  // remoteDelete: collect a snapshot of chars, then delete them
  const crdt4 = new CRDT(1);
  seedDocument(crdt4, seedSize);
  const snapshot: Array<{ row: number; char: Char }> = [];
  for (let r = 0; r < crdt4.state.length; r++) {
    for (const char of crdt4.state[r]) {
      snapshot.push({ row: r, char });
    }
  }
  let i = 0;
  const remoteDeleteOps = benchmarkOp(durationMs, () => {
    if (i >= snapshot.length) return false;
    const { row, char } = snapshot[i++];
    crdt4.remoteDelete(char);
    return true;
  });
  console.log(`  remoteDelete: ${remoteDeleteOps.toLocaleString()} ops`);

  return { localInsert: localInsertOps, localDelete: localDeleteOps, remoteInsert: remoteInsertOps, remoteDelete: remoteDeleteOps };
}

function benchmark(durationMs: number = 1000) {
  console.log(`Running each test for ${durationMs}ms...\n`);

  const sizes = [
    { label: "Small",  seed: 100 },
    { label: "Medium", seed: 5_000 },
    { label: "Large",  seed: 50_000 },
  ];

  const allResults: SizeResult[] = [];
  for (const { label, seed } of sizes) {
    allResults.push(benchmarkAtSize(label, seed, durationMs));
  }

  // Consolidated: average ops/sec across all sizes and ops
  const ops = ["localInsert", "localDelete", "remoteInsert", "remoteDelete"] as const;
  console.log("\n=== Consolidated ops/sec (avg across all document sizes) ===");
  let grandTotal = 0;
  let grandCount = 0;
  for (const op of ops) {
    const avg = Math.round(allResults.reduce((sum, r) => sum + r[op], 0) / allResults.length);
    console.log(`  ${op.padEnd(14)}: ${avg.toLocaleString()} ops/sec`);
    grandTotal += avg;
    grandCount++;
  }
  console.log(`  ${"overall".padEnd(14)}: ${Math.round(grandTotal / grandCount).toLocaleString()} ops/sec`);
}

benchmark();


