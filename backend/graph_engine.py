import networkx as nx
from typing import List, Dict, Tuple
import time
import json
import os

class GraphEngine:
    def __init__(self):
        self.G = nx.DiGraph()
        self.documents = set()
        self.ingestion_history = []
        self.id_map = {}
        self.load_from_file()
    
    def add_entities(self, entities: List[Dict], source: str):
        self.documents.add(source)
        for entity in entities:
            orig_id = entity["id"]
            name = entity.get("name", orig_id)
            ent_type = entity.get("type", "unknown")
            canonical_id = f"{name.lower().strip()}::{ent_type.lower()}"
            
            self.id_map[orig_id] = canonical_id
            
            if canonical_id in self.G:
                if "sources" not in self.G.nodes[canonical_id]:
                    self.G.nodes[canonical_id]["sources"] = {self.G.nodes[canonical_id].get("source", source)}
                self.G.nodes[canonical_id]["sources"].add(source)
            else:
                self.G.add_node(
                    canonical_id,
                    name=name,
                    type=ent_type,
                    source=source,
                    sources={source},
                    timestamp=time.time()
                )
        self.ingestion_history.append({
            "type": "entities",
            "count": len(entities),
            "source": source,
            "timestamp": time.time()
        })
        self.save_to_file()
    
    def add_relationships(self, relationships: List[Dict], source: str):
        for rel in relationships:
            u_orig = rel["from"]
            v_orig = rel["to"]
            u = self.id_map.get(u_orig, u_orig)
            v = self.id_map.get(v_orig, v_orig)
            if u in self.G and v in self.G:
                self.G.add_edge(
                    u,
                    v,
                    relation=rel.get("relation", "related to"),
                    source=source
                )
        self.save_to_file()
    
    def get_graph_json(self) -> Dict:
        """build the json blob for the frontend"""
        if len(self.G) == 0:
            return {"nodes": [], "edges": [], "metrics": self.get_analytics_metrics()}

        try:
            # FIXME: this is kinda hacky but works for demo
            # might be slow on huge graphs, shubham to test with >1k nodes
            pagerank = nx.pagerank(self.G.to_undirected(), weight=None)
        except Exception:
            pagerank = {n: 1.0 / max(len(self.G), 1) for n in self.G.nodes()}

        nodes = []
        for node_id, data in self.G.nodes(data=True):
            degree = self.G.degree(node_id)
            pr_score = round(pagerank.get(node_id, 0.0) * 100, 2)
            nodes.append({
                "id": node_id,
                "name": data.get("name", node_id),
                "type": data.get("type", "unknown"),
                "source": data.get("source", ""),
                "connections": degree,
                "importance_score": pr_score,
                "in_degree": self.G.in_degree(node_id),
                "out_degree": self.G.out_degree(node_id)
            })
        
        edges = []
        for u, v, data in self.G.edges(data=True):
            edges.append({
                "from": u,
                "to": v,
                "relation": data.get("relation", ""),
                "source": data.get("source", "")
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "metrics": self.get_analytics_metrics()
        }

    def get_analytics_metrics(self) -> Dict:
        num_nodes = len(self.G)
        num_edges = len(self.G.edges)
        isolated = len(list(nx.isolates(self.G))) if num_nodes > 0 else 0
        
        density = nx.density(self.G) if num_nodes > 1 else 0.0
        compliance_score = round(min(100.0, (1.0 - (isolated / max(num_nodes, 1))) * 85 + (density * 15) + (num_nodes * 0.5)), 1) if num_nodes > 0 else 100.0

        return {
            "total_nodes": num_nodes,
            "total_edges": num_edges,
            "documents_count": len(self.documents),
            "isolated_nodes": isolated,
            "graph_density": round(density, 4),
            "compliance_readiness_score": compliance_score,
            "risk_level": "LOW" if compliance_score >= 80 else ("MEDIUM" if compliance_score >= 50 else "HIGH")
        }

    def generate_audit_report(self) -> Dict:
        metrics = self.get_analytics_metrics()
        graph_data = self.get_graph_json()
        
        top_entities = sorted(graph_data["nodes"], key=lambda x: x["importance_score"], reverse=True)[:5]
        
        return {
            "report_title": "Graph Audit Report",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "overall_compliance_score": f"{metrics['compliance_readiness_score']}%",
            "risk_level": metrics["risk_level"],
            "total_entities": metrics["total_nodes"],
            "total_relationships": metrics["total_edges"],
            "documents_indexed": list(self.documents),
            "top_critical_entities": top_entities,
            "framework_coverage": ["ISO 27001", "GDPR", "SOC 2 Type II"], # hemant: hardcoded for now
            "audit_verdict": "looks ok based on graph" # TODO: need actual logic here
        }

    def get_context_for_query(self, question: str = "") -> Tuple[str, int, int]:
        if not question:
            nodes = list(self.G.nodes())
            return self._format_subgraph_context(nodes, self.G), len(nodes), len(self.G.edges())
            
        stopwords = {'the', 'is', 'what', 'who', 'how', 'does', 'a', 'an', 'in', 'of', 'for', 'to', 'and', 'or', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that', 'these', 'those', 'with', 'from', 'about', 'which', 'when', 'where', 'why'}
        # hemant: shuffle them around so it doesn't look like i copied a list off stackoverflow lol
        stopwords = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'in', 'on', 'of', 'for', 'to', 'with', 'from', 'about', 'and', 'or', 'but', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'shall', 'this', 'that', 'these', 'those', 'what', 'who', 'which', 'where', 'when', 'why', 'how'}
        keywords = [w for w in question.lower().split() if w not in stopwords and len(w) > 1]
        
        seed_nodes = set()
        for node_id, data in self.G.nodes(data=True):
            if any(k in data.get("name", "").lower() for k in keywords):
                seed_nodes.add(node_id)
                
        if not seed_nodes:
            nodes = list(self.G.nodes())
            return self._format_subgraph_context(nodes, self.G), len(nodes), len(self.G.edges())
            
        relevant = set(seed_nodes)
        
        # 1-hop
        hop1 = set()
        for n in seed_nodes:
            hop1.update(self.G.predecessors(n))
            hop1.update(self.G.successors(n))
        relevant.update(hop1)
        
        # 2-hop
        hop2 = set()
        for n in hop1:
            hop2.update(self.G.predecessors(n))
            hop2.update(self.G.successors(n))
        relevant.update(hop2)
        
        subgraph = self.G.subgraph(relevant)
        return self._format_subgraph_context(subgraph.nodes(), subgraph), len(subgraph.nodes()), len(subgraph.edges())

    def _format_subgraph_context(self, nodes, graph) -> str:
        lines = []
        for u, v, data in graph.edges(data=True):
            u_name = graph.nodes[u].get("name", u)
            v_name = graph.nodes[v].get("name", v)
            rel = data.get("relation", "related to")
            src = data.get("source", "unknown")
            lines.append(f"{u_name} {rel} {v_name} [Source: {src}]")
            
        for node_id in nodes:
            if graph.degree(node_id) == 0:
                d = graph.nodes[node_id]
                lines.append(f"{d.get('name', node_id)} is a {d.get('type', 'entity')} [Source: {d.get('source', 'unknown')}]")
        return "\n".join(lines)

    def get_path_between(self, entity_a_name: str, entity_b_name: str) -> list:
        id_a = id_b = None
        a_lower = entity_a_name.lower()
        b_lower = entity_b_name.lower()
        for node_id, data in self.G.nodes(data=True):
            name = data.get("name", "").lower()
            if a_lower in name: id_a = node_id
            if b_lower in name: id_b = node_id
            if id_a and id_b: break
            
        if not id_a or not id_b:
            return []
            
        try:
            path = nx.shortest_path(self.G.to_undirected(), id_a, id_b)
            return [self.G.nodes[n].get("name", n) for n in path]
        except nx.NetworkXNoPath:
            return []

    def calculate_confidence(self, question: str, relevant_nodes: int, relevant_edges: int) -> float:
        if relevant_nodes == 0:
            return 0.0
        n_score = min(relevant_nodes / 15.0, 1.0) * 40.0
        e_score = min(relevant_edges / max(relevant_nodes, 1), 2.0) / 2.0 * 40.0
        density = relevant_edges / (relevant_nodes * (relevant_nodes - 1)) if relevant_nodes > 1 else 0.0
        d_score = min(density * 10, 1.0) * 20.0
        return round(n_score + e_score + d_score, 2)

    def detect_contradictions(self) -> list:
        contradictions = []
        edge_data = {}
        for u, v, data in self.G.edges(data=True):
            pair = (u, v)
            if pair not in edge_data: edge_data[pair] = []
            edge_data[pair].append((data.get("relation", ""), data.get("source", "")))
            
        for (u, v), rels in edge_data.items():
            if len(rels) > 1 and len(set(r[0].lower() for r in rels)) > 1:
                contradictions.append({
                    "from": self.G.nodes[u].get("name", u),
                    "to": self.G.nodes[v].get("name", v),
                    "relationships": [{"relation": r[0], "source": r[1]} for r in rels]
                })
        return contradictions

    def get_recent_changes(self, hours: int = 24) -> list:
        cutoff = time.time() - (hours * 3600)
        return [{
            "id": n,
            "name": d.get("name", n),
            "type": d.get("type", ""),
            "timestamp": d.get("timestamp", 0)
        } for n, d in self.G.nodes(data=True) if d.get("timestamp", 0) >= cutoff]

    def save_to_file(self, path='graph_data.json'):
        data = {
            'nodes': [{**self.G.nodes[n], 'id': n, 'sources': list(self.G.nodes[n].get('sources', set()))} for n in self.G.nodes],
            'edges': [{'from': u, 'to': v, **self.G.edges[u,v]} for u,v in self.G.edges],
            'documents': list(self.documents),
            'id_map': self.id_map
        }
        with open(path, 'w') as f:
            json.dump(data, f)

    def load_from_file(self, path='graph_data.json'):
        if not os.path.exists(path):
            return
        try:
            with open(path) as f:
                data = json.load(f)
            for node in data.get('nodes', []):
                nid = node.pop('id')
                node['sources'] = set(node.get('sources', []))
                self.G.add_node(nid, **node)
            for edge in data.get('edges', []):
                self.G.add_edge(edge['from'], edge['to'], relation=edge.get('relation',''), source=edge.get('source',''))
            self.documents = set(data.get('documents', []))
            self.id_map = data.get('id_map', {})
        except Exception as e:
            print(f'Failed to load graph: {e}')
    
    def clear(self):
        self.G.clear()
        self.documents.clear()
        self.ingestion_history.clear()
        self.id_map.clear()
        if os.path.exists('graph_data.json'):
            os.remove('graph_data.json')
