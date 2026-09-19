import { pool } from "../db.js";

async function loadGraph() {
  const nodesRes = await pool.query("SELECT id, type, x, y, aisle_id FROM store_nodes");
  const nodes = new Map(nodesRes.rows.map((r) => [r.id, r]));

  const adj = new Map([...nodes.keys()].map((id) => [id, []]));
  const edgesRes = await pool.query("SELECT node_a, node_b, distance FROM store_edges");
  for (const e of edgesRes.rows) {
    adj.get(e.node_a).push([e.node_b, e.distance]);
    adj.get(e.node_b).push([e.node_a, e.distance]);
  }
  return { nodes, adj };
}

function dijkstra(adj, source) {
  const dist = new Map([[source, 0]]);
  const visited = new Set();
  while (true) {
    let u = null;
    let best = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < best) {
        best = d;
        u = node;
      }
    }
    if (u === null) break;
    visited.add(u);
    for (const [v, w] of adj.get(u)) {
      const nd = best + w;
      if (nd < (dist.get(v) ?? Infinity)) dist.set(v, nd);
    }
  }
  return dist;
}

function allPairsDistances(adj, nodeIds) {
  const dist = {};
  for (const n of nodeIds) dist[n] = dijkstra(adj, n);
  return dist;
}

function* permutations(arr) {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) yield [arr[i], ...perm];
  }
}

function pathCost(start, end, seq, dist) {
  let cost = dist[start].get(seq[0]) ?? Infinity;
  for (let i = 0; i < seq.length - 1; i++) {
    cost += dist[seq[i]].get(seq[i + 1]) ?? Infinity;
  }
  cost += dist[seq[seq.length - 1]].get(end) ?? Infinity;
  return cost;
}

function solveOpenPathOrder(start, end, stops, dist) {
  if (stops.length === 0) return { order: [], cost: dist[start].get(end) ?? Infinity };

  if (stops.length <= 9) {
    let bestOrder = null;
    let bestCost = Infinity;
    for (const perm of permutations(stops)) {
      const cost = pathCost(start, end, perm, dist);
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = perm;
      }
    }
    return { order: bestOrder, cost: bestCost };
  }

  // nearest-neighbor + 2-opt heuristic for larger lists
  const remaining = new Set(stops);
  let order = [];
  let current = start;
  while (remaining.size > 0) {
    let next = null;
    let best = Infinity;
    for (const n of remaining) {
      const d = dist[current].get(n) ?? Infinity;
      if (d < best) {
        best = d;
        next = n;
      }
    }
    order.push(next);
    remaining.delete(next);
    current = next;
  }

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const reversed = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        if (pathCost(start, end, reversed, dist) < pathCost(start, end, order, dist)) {
          order = reversed;
          improved = true;
        }
      }
    }
  }

  return { order, cost: pathCost(start, end, order, dist) };
}

export async function buildRoute(itemNodes) {
  const { nodes, adj } = await loadGraph();
  const uniqueNodes = [...new Set(itemNodes)];
  const allNodes = ["entrance", "checkout", ...uniqueNodes];
  const dist = allPairsDistances(adj, allNodes);

  const { order, cost } = solveOpenPathOrder("entrance", "checkout", uniqueNodes, dist);

  const fullStops = ["entrance", ...order, "checkout"];
  const stops = fullStops.map((n) => {
    const node = nodes.get(n);
    return { node: n, x: node.x, y: node.y, type: node.type };
  });

  return { stops, order, total_distance: Math.round(cost * 100) / 100 };
}
