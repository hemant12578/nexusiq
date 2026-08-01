import { useEffect, useRef } from "react"
import * as d3 from "d3"

const NODE_COLORS = {
  person: "#00ff88",
  document: "#7c3aed",
  policy: "#f59e0b",
  date: "#06b6d4",
  organization: "#ec4899",
  event: "#f97316",
  location: "#84cc16",
  unknown: "#6b7280"
}

export default function GraphView({ graphData, onNodeClick }) {
  const svgRef = useRef(null)
  const simulationRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return

    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    d3.select(svgRef.current).selectAll("*").remove()

    if (!graphData.nodes.length) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)

    const defs = svg.append("defs")

    // ── Animated background gradient ──
    const radialGrad = defs.append("radialGradient")
      .attr("id", "bgGlow")
      .attr("cx", "50%").attr("cy", "50%").attr("r", "50%")
    radialGrad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(124, 58, 237, 0.1)")
    radialGrad.append("stop").attr("offset", "100%").attr("stop-color", "transparent")
    svg.append("rect")
      .attr("width", width).attr("height", height)
      .attr("fill", "url(#bgGlow)")

    // ── Glow filter (soft) ──
    const filterSoft = defs.append("filter").attr("id", "glow-soft")
    filterSoft.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur")
    const fmSoft = filterSoft.append("feMerge")
    fmSoft.append("feMergeNode").attr("in", "coloredBlur")
    fmSoft.append("feMergeNode").attr("in", "SourceGraphic")

    // ── Glow filter (strong, for hover) ──
    const filterStrong = defs.append("filter").attr("id", "glow-strong")
    filterStrong.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "coloredBlur")
    const fmStrong = filterStrong.append("feMerge")
    fmStrong.append("feMergeNode").attr("in", "coloredBlur")
    fmStrong.append("feMergeNode").attr("in", "SourceGraphic")

    // ── Animated grid pattern ──
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

    // ── Arrow marker ──
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

    const nodes = graphData.nodes.map(n => ({ ...n }))
    const nodeIds = new Set(nodes.map(n => n.id))
    const links = graphData.edges
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map(e => ({
        source: e.from,
        target: e.to,
        relation: e.relation
      }))

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(50))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03))

    simulationRef.current = simulation

    // ── Links with animated dash ──
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#7c3aed")
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6 3")
      .attr("marker-end", "url(#arrow)")

    // Animate links appearing
    link.transition()
      .delay((d, i) => 300 + i * 50)
      .duration(600)
      .attr("stroke-opacity", 0.3)

    // Animate dash movement
    function animateDash() {
      link
        .attr("stroke-dashoffset", 0)
        .transition()
        .duration(3000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", -18)
        .on("end", animateDash)
    }
    animateDash()

    // ── Link labels ──
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

    // ── Outer glow ring (animated breathing) ──
    const nodeGlow = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 0)
      .attr("fill", "none")
      .attr("stroke", d => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("stroke-opacity", 0.12)
      .attr("stroke-width", 5)
      .attr("filter", "url(#glow-soft)")

    // Animate glow rings appearing
    nodeGlow.transition()
      .delay((d, i) => i * 80)
      .duration(800)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr("r", 24)

    // Breathing animation on glow rings
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

    // ── Nodes (with elastic entrance) ──
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 0)
      .attr("fill", d => NODE_COLORS[d.type] || NODE_COLORS.unknown)
      .attr("fill-opacity", 0.9)
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .attr("filter", "url(#glow-soft)")

    // Elastic pop-in animation
    node.transition()
      .delay((d, i) => i * 60)
      .duration(900)
      .ease(d3.easeElasticOut.amplitude(1.1).period(0.4))
      .attr("r", d => 14 + Math.min(d.connections || 0, 6) * 1.5)

    node
      .on("click", (event, d) => {
        // Click ripple
        const clickCircle = g.append("circle")
          .attr("cx", d.x).attr("cy", d.y)
          .attr("r", 16)
          .attr("fill", "none")
          .attr("stroke", NODE_COLORS[d.type] || "#7c3aed")
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
          .transition().duration(200)
          .attr("r", (14 + Math.min(d.connections || 0, 6) * 1.5) + 5)
          .attr("fill-opacity", 1)
          .attr("filter", "url(#glow-strong)")
          .attr("stroke-width", 3)

        // Highlight connected links
        link.transition().duration(200)
          .attr("stroke-opacity", l =>
            l.source.id === d.id || l.target.id === d.id ? 0.7 : 0.1
          )
          .attr("stroke-width", l =>
            l.source.id === d.id || l.target.id === d.id ? 2.5 : 1
          )
        linkLabel.transition().duration(200)
          .attr("fill-opacity", l =>
            l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.15
          )
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition().duration(300)
          .attr("r", 14 + Math.min(d.connections || 0, 6) * 1.5)
          .attr("fill-opacity", 0.9)
          .attr("filter", "url(#glow-soft)")
          .attr("stroke-width", 2)

        link.transition().duration(300)
          .attr("stroke-opacity", 0.3)
          .attr("stroke-width", 1.5)
        linkLabel.transition().duration(300)
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

    // ── Labels (fade in) ──
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

    // ── Tick ──
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

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  )
}
