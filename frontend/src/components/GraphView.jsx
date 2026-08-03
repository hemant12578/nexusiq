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

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

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
    // Apply a soft glow filter for node highlighting
    filterSoft.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur")
    const fmSoft = filterSoft.append("feMerge")
    fmSoft.append("feMergeNode").attr("in", "coloredBlur")
    fmSoft.append("feMergeNode").attr("in", "SourceGraphic")


    const filterStrong = defs.append("filter").attr("id", "glow-strong")
    filterStrong.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "coloredBlur")
    const fmStrong = filterStrong.append("feMerge")
    fmStrong.append("feMergeNode").attr("in", "coloredBlur")
    fmStrong.append("feMergeNode").attr("in", "SourceGraphic")


    const patternSize = 40
    const gridPattern = defs.append("pattern")
      .attr("id", "grid").attr("width", patternSize).attr("height", patternSize)
      .attr("patternUnits", "userSpaceOnUse")
    gridPattern.append("circle")
      .attr("cx", patternSize/2).attr("cy", patternSize/2).attr("r", 0.5)
      .attr("fill", "rgba(124,58,237,0.15)")
    svg.append("rect")
      .attr("width", width).attr("height", height)
      .attr("fill", "url(#grid)")
      .attr("opacity", 0.5)


    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 24).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#7c3aed")
      .attr("fill-opacity", 0.5)

    const g = svg.append("g")

    svg.call(
      d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => g.attr("transform", event.transform))
    )

    const nodes = safeNodes.map(n => ({ ...n }))
    
    const nodeIdMap = new Map()
    nodes.forEach(n => {
      nodeIdMap.set(String(n.id).toLowerCase().trim(), n.id)
    })

    const links = safeEdges
      .map(e => {
        // e.source is the document name from backend, DO NOT USE IT for node matching. Use e.from.
        const rawSource = String(e.from).toLowerCase().trim()
        const rawTarget = String(e.to).toLowerCase().trim()
        return {
          source: nodeIdMap.get(rawSource),
          target: nodeIdMap.get(rawTarget),
          relation: e.relation
        }
      })
      .filter(e => e.source !== undefined && e.target !== undefined)

    // Configure D3 force simulation parameters
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(50))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03))

    simulationRef.current = simulation


    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#7c3aed")
      .attr("stroke-opacity", 0.4) // Slightly more visible
      .attr("stroke-width", 1.8) // Slightly thicker
      .attr("stroke-dasharray", "6 3")
      .attr("marker-end", "url(#arrow)")


    function animateDash() {
      link
        .attr("stroke-dashoffset", 0)
        .transition("dashAnim")
        .duration(3000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", -18)
        .on("end", animateDash)
    }
    animateDash()


    const linkLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .text(d => d.relation)
      .attr("font-size", "7px")
      .attr("fill", "#a78bfa")
      .attr("fill-opacity", 0)
      .attr("text-anchor", "middle")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", 400)

    linkLabel.transition()
      .delay((d, i) => 600 + i * 50)
      .duration(400)
      .attr("fill-opacity", 0.5)


    const nodeGlow = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", d => NODE_COLORS[d.type?.toLowerCase()] || NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("stroke-opacity", 0.12)
      .attr("stroke-width", 5)
      .attr("filter", "url(#glow-soft)")


    nodeGlow.transition()
      .delay((d, i) => i * 80)
      .duration(800)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr("r", 24)


    function breathe() {
      nodeGlow
        .transition()
        .duration(2500)
        .ease(d3.easeSinInOut)
        .attr("r", 27)
        .attr("stroke-opacity", 0.2)
        .transition()
        .duration(2500)
        .ease(d3.easeSinInOut)
        .attr("r", 24)
        .attr("stroke-opacity", 0.12)
        .on("end", breathe)
    }
    setTimeout(breathe, 1500)


    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 0)
      .attr("fill", d => NODE_COLORS[d.type?.toLowerCase()] || NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("fill-opacity", 0.9)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("filter", "url(#glow-soft)")


    node.transition()
      .delay((d, i) => i * 60)
      .duration(900)
      .ease(d3.easeElasticOut.amplitude(1.1).period(0.4))
      .attr("r", d => 14 + Math.min(d.connections || 0, 6) * 1.5)

    node
      .on("click", (event, d) => {

        const clickCircle = g.append("circle")
          .attr("cx", d.x).attr("cy", d.y)
          .attr("r", 16)
          .attr("fill", "none")
          .attr("stroke", NODE_COLORS[d.type?.toLowerCase()] || NODE_COLORS[d.type] || "#7c3aed")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.8)
        clickCircle.transition()
          .duration(500)
          .ease(d3.easeQuadOut)
          .attr("r", 50)
          .attr("stroke-opacity", 0)
          .remove()
        onNodeClick(d)
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition("nodeHover").duration(200)
          .attr("r", (14 + Math.min(d.connections || 0, 6) * 1.5) + 5)
          .attr("fill-opacity", 1)
          .attr("filter", "url(#glow-strong)")
          .attr("stroke-width", 3)


        link.transition("hoverAnim").duration(200)
          .attr("stroke-opacity", l =>
            l.source.id === d.id || l.target.id === d.id ? 0.7 : 0.1
          )
          .attr("stroke-width", l =>
            l.source.id === d.id || l.target.id === d.id ? 2.5 : 1.8
          )
        linkLabel.transition("labelHover").duration(200)
          .attr("fill-opacity", l =>
            l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.15
          )
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition("nodeHover").duration(300)
          .attr("r", 14 + Math.min(d.connections || 0, 6) * 1.5)
          .attr("fill-opacity", 0.9)
          .attr("filter", "url(#glow-soft)")
          .attr("stroke-width", 2)

        link.transition("hoverAnim").duration(300)
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 1.8)
        linkLabel.transition("labelHover").duration(300)
          .attr("fill-opacity", 0.5)
      })
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on("drag", (event, d) => {
            d.fx = event.x; d.fy = event.y
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )


    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => d.name.length > 16 ? d.name.substring(0, 16) + "…" : d.name)
      .attr("font-size", "10px")
      .attr("fill", "#e2e8f0")
      .attr("fill-opacity", 0)
      .attr("text-anchor", "middle")
      .attr("dy", d => (14 + Math.min(d.connections || 0, 6) * 1.5) + 14)
      .attr("font-family", "Inter, sans-serif")
      .attr("font-weight", 500)
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 6px rgba(0,0,0,0.9)")

    label.transition()
      .delay((d, i) => 400 + i * 60)
      .duration(500)
      .attr("fill-opacity", 0.85)


    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y)

      linkLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)

      nodeGlow
        .attr("cx", d => d.x).attr("cy", d => d.y)

      node
        .attr("cx", d => d.x).attr("cy", d => d.y)

      label
        .attr("x", d => d.x).attr("y", d => d.y)
    })

    return () => { simulation.stop() }
  }, [graphData])

  const handleExport = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

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
        ctx.fillStyle = "#0f172a"; // Match slate-900 background roughly
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
      {/* 7-Type Node Color Legend Overlay */}
      {safeNodes.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow transition-colors max-w-fit"
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
