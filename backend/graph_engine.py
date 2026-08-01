import networkx as nx
from typing import List, Dict

class GraphEngine:
    def __init__(self):
        self.G = nx.DiGraph()
        self.documents = []
    
    def add_entities(self, entities: List[Dict], source: str):
        for entity in entities:
            self.G.add_node(
                entity["id"],
                name=entity.get("name", entity["id"]),
                type=entity.get("type", "unknown"),
                source=source
            )
    
    def add_relationships(self, relationships: List[Dict], source: str):
        for rel in relationships:
            if rel["from"] in self.G and rel["to"] in self.G:
                self.G.add_edge(
                    rel["from"],
                    rel["to"],
                    relation=rel.get("relation", "related to"),
                    source=source
                )
    
    def get_graph_json(self) -> Dict:
        nodes = []
        for node_id, data in self.G.nodes(data=True):
            nodes.append({
                "id": node_id,
                "name": data.get("name", node_id),
                "type": data.get("type", "unknown"),
                "source": data.get("source", ""),
                "connections": self.G.degree(node_id)
            })
        
        edges = []
        for u, v, data in self.G.edges(data=True):
            edges.append({
                "from": u,
                "to": v,
                "relation": data.get("relation", ""),
                "source": data.get("source", "")
            })
        
        return {"nodes": nodes, "edges": edges}
    
    def get_context_for_query(self) -> str:
        context_lines = []
        for u, v, data in self.G.edges(data=True):
            u_name = self.G.nodes[u].get("name", u)
            v_name = self.G.nodes[v].get("name", v)
            relation = data.get("relation", "related to")
            source = data.get("source", "unknown")
            context_lines.append(
                f"{u_name} {relation} {v_name} [Source: {source}]"
            )
        
        for node_id, data in self.G.nodes(data=True):
            if self.G.degree(node_id) == 0:
                context_lines.append(
                    f"{data.get('name', node_id)} is a "
                    f"{data.get('type', 'entity')} "
                    f"[Source: {data.get('source', 'unknown')}]"
                )
        
        return "\n".join(context_lines)
    
    def clear(self):
        self.G.clear()
        self.documents.clear()
