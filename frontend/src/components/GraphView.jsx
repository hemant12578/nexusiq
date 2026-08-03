import { useEffect, useRef } from "react"
import * as d3 from "d3"
import { Trash2 } from "lucide-react"

const NODE_COLORS = {
  person: "#00ff88",
  document: "#7c3aed",
  policy: "#f59e0b",
  date: "#06b6d4",
  organization: "#ec4899",
  event: "#f97316",
  location: "#84cc16",
  unknown: "#6b7280"
} // Define node colors for different entity types

export default function GraphView({ graphData, onNodeClick, onClearGraph }) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)

  const safeNodes = Array.isArray(graphData?.nodes) ? graphData.nodes : []
  const safeEdges = Array.isArray(graphData?.edges) ? graphData.edges : []

  const lastCountRef = useRef({ nodes: 0, edges: 0 })

  useEffect(() => {
    if (!svgRef.current) return
    const newCount = { nodes: safeNodes.length, edges: safeEdges.length }
    if (newCount.nodes === lastCountRef.current.nodes && newCount.edges === lastCountRef.current.edges) return
    lastCountRef.current = newCount

    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    d3.select(svgRef.current).selectAll("*").remove()

    if (!safeNodes.length) return

    const width = svgRef.current.clientWidth || 800
    const height = svgRef.current.clientHeight || 600

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)

    const defs = svg.append("defs")

    const radialGrad = defs.append("radialGradient")
      .attr("id", "bgGlow")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%")
    radialGrad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(124, 58, 237, 0.1)")
    radialGrad.append("stop").attr("offset", "100%").attr("stop-color", "transparent")
    svg.append("rect")
      .attr("width", width).attr("height", height)
      .attr("fill", "url(#bgGlow)")

    const filterSoft = defs.append("filter").attr("id", "glow-soft")
    filterSoft.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur")
    const fmSoft = filterSoft.append("feMerge")
    fmSoft.append("feMergeNode").attr("in", "coloredBlur")
    fmSoft.append("feMergeNode").attr("in", "SourceGraphic")

    const filterStrong = defs.append("filter").attr("id", "glow-strong")
    filterStrong.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "coloredBlur")
    const fmStrong = filterStrong.append("feMerge")
    fmStrong.append("feMergeNode").attr("in", "coloredBlur")
    fmStrong.append("feMergeNode").attr("in", "SourceGraphic")

    const nodes = safeNodes.map((d) => ({ ...d }))
    
    const validNodeIds = new Set(nodes.map(n => n.id))
    const edges = safeEdges
      .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .map((d) => ({ ...d }))

    const zoomGroup = svg.append("g")

    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform))

    svg.call(zoom)

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))

    simulationRef.current = simulation

    const edgeGroup = zoomGroup.append("g").attr("class", "edges")

    const link = edgeGroup.selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("stroke", "rgba(167, 139, 250, 0.25)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2")

    const edgeLabels = edgeGroup.selectAll("text")
      .data(edges)
      .enter()
      .append("text")
      .text((d) => d.relation || '')
      .attr("fill", "#6b7280")
      .attr("font-size", "8px")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .attr("dy", -4)

    const nodeGroup = zoomGroup.append("g").attr("class", "nodes")

    const node = nodeGroup.selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation()
        if (onNodeClick) onNodeClick(d)
      })

    node.append("circle")
      .attr("r", (d) => 16 + Math.min((d.connections || 0) * 3, 16))
      .attr("fill", (d) => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("fill-opacity", 0.15)
      .attr("stroke", (d) => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1)
      .attr("filter", "url(#glow-soft)")

    node.append("circle")
      .attr("r", (d) => 10 + Math.min((d.connections || 0) * 2, 10))
      .attr("fill", (d) => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .attr("filter", "url(#glow-strong)")

    node.append("text")
      .text((d) => d.name || d.id || '')
      .attr("dy", (d) => 26 + Math.min((d.connections || 0) * 2, 10))
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("font-family", "sans-serif")

    node.append("title")
      .text((d) => `${d.name || d.id} (${d.type || 'unknown'})\nSource: ${d.source || 'Unknown'}\nConnections: ${d.connections || 0}`)

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)

      edgeLabels
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2)

      node.attr("transform", (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [graphData, onNodeClick, safeNodes.length, safeEdges.length])

  const handleExport = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    let source = new XMLSerializer().serializeToString(svgElement);

    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    
    const rect = svgElement.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = function() {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = "nexus_graph.png";
        a.href = pngUrl;
        a.click();
    };
    img.src = url;
  };

  return (
    <div className="relative w-full h-full">
      {/* 7-Type Node Color Legend Overlay & Actions */}
      {safeNodes.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow transition-colors"
            >
              Export Graph
            </button>
            {onClearGraph && (
              <button 
                onClick={onClearGraph}
                className="px-3 py-1.5 text-xs font-semibold text-red-200 bg-red-950/70 hover:bg-red-900/90 border border-red-800/40 rounded-lg shadow transition-colors flex items-center gap-1.5"
                title="Clear all nodes and reset knowledge graph"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Clear Graph</span>
              </button>
            )}
          </div>
          <div className="bg-nexus-900/80 backdrop-blur-md p-3 rounded-xl border border-purple-900/40 shadow-xl flex flex-wrap items-center gap-3 max-w-md">
          {[
            { label: "Person", color: NODE_COLORS.person },
            { label: "Document", color: NODE_COLORS.document },
            { label: "Policy", color: NODE_COLORS.policy },
            { label: "Date", color: NODE_COLORS.date },
            { label: "Org", color: NODE_COLORS.organization },
            { label: "Event", color: NODE_COLORS.event },
            { label: "Location", color: NODE_COLORS.location },
          ].map((type) => (
            <div key={type.label} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: type.color }} />
              <span>{type.label}</span>
            </div>
          ))}
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  )
}
