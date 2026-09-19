"""Store graph pathfinding and route ordering (open-path TSP)."""
import heapq
from itertools import permutations

from app.db import get_conn


def load_graph():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, type, x, y, aisle_id FROM store_nodes")
    nodes = {r["id"]: r for r in cur.fetchall()}
    cur.execute("SELECT node_a, node_b, distance FROM store_edges")
    adj: dict[str, list[tuple[str, float]]] = {n: [] for n in nodes}
    for e in cur.fetchall():
        adj[e["node_a"]].append((e["node_b"], e["distance"]))
        adj[e["node_b"]].append((e["node_a"], e["distance"]))
    cur.close()
    conn.close()
    return nodes, adj


def dijkstra(adj, source: str) -> dict[str, float]:
    dist = {source: 0.0}
    pq = [(0.0, source)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float("inf")):
            continue
        for v, w in adj[u]:
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist


def all_pairs_distances(adj, node_ids: list[str]) -> dict[str, dict[str, float]]:
    return {n: dijkstra(adj, n) for n in node_ids}


def solve_open_path_order(start: str, end: str, stops: list[str], dist: dict[str, dict[str, float]]):
    """Exact optimal visiting order for fixed start/end (Held-Karp style, brute force for small n)."""
    if not stops:
        return [], dist[start].get(end, float("inf"))

    if len(stops) <= 9:
        best_order, best_cost = None, float("inf")
        for perm in permutations(stops):
            cost = dist[start].get(perm[0], float("inf"))
            for a, b in zip(perm, perm[1:]):
                cost += dist[a].get(b, float("inf"))
            cost += dist[perm[-1]].get(end, float("inf"))
            if cost < best_cost:
                best_cost, best_order = cost, perm
        return list(best_order), best_cost

    # nearest-neighbor + 2-opt heuristic for larger lists
    remaining = set(stops)
    order = []
    current = start
    while remaining:
        nxt = min(remaining, key=lambda n: dist[current].get(n, float("inf")))
        order.append(nxt)
        remaining.remove(nxt)
        current = nxt

    def total_cost(seq):
        c = dist[start].get(seq[0], float("inf"))
        for a, b in zip(seq, seq[1:]):
            c += dist[a].get(b, float("inf"))
        c += dist[seq[-1]].get(end, float("inf"))
        return c

    improved = True
    while improved:
        improved = False
        for i in range(len(order) - 1):
            for j in range(i + 1, len(order)):
                new_order = order[:i] + order[i:j + 1][::-1] + order[j + 1:]
                if total_cost(new_order) < total_cost(order):
                    order = new_order
                    improved = True

    return order, total_cost(order)


def build_route(item_nodes: list[str]):
    nodes, adj = load_graph()
    unique_nodes = list(dict.fromkeys(item_nodes))
    all_nodes = ["entrance", "checkout"] + unique_nodes
    dist = all_pairs_distances(adj, all_nodes)

    order, total_distance = solve_open_path_order("entrance", "checkout", unique_nodes, dist)

    full_stops = ["entrance"] + order + ["checkout"]
    stops_with_coords = [
        {"node": n, "x": nodes[n]["x"], "y": nodes[n]["y"], "type": nodes[n]["type"]}
        for n in full_stops
    ]
    return {
        "stops": stops_with_coords,
        "order": order,
        "total_distance": round(total_distance, 2),
    }
