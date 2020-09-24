function SelfLink(node, mouse, directed) {
  this.node = node
  this.anchorAngle = 0
  this.mouseOffsetAngle = 0
  this.text = ''

  this.directed = directed

  if (mouse) {
    this.setAnchorPoint(mouse.x, mouse.y)
  }
}

SelfLink.prototype.setMouseStart = function (x, y) {
  this.mouseOffsetAngle =
    this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x)
}

SelfLink.prototype.setAnchorPoint = function (x, y) {
  this.anchorAngle =
    Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle
  // snap to 90 degrees
  const snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2)
  if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap
  // keep in the range -pi to pi so our containsPoint() function always works
  if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI
  if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI
}

SelfLink.prototype.getEndPointsAndCircle = function () {
  const circleX = this.node.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle)
  const circleY = this.node.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle)
  const circleRadius = 0.75 * nodeRadius
  const startAngle = this.anchorAngle - Math.PI * 0.8
  const endAngle = this.anchorAngle + Math.PI * 0.8
  const startX = circleX + circleRadius * Math.cos(startAngle)
  const startY = circleY + circleRadius * Math.sin(startAngle)
  const endX = circleX + circleRadius * Math.cos(endAngle)
  const endY = circleY + circleRadius * Math.sin(endAngle)
  return {
    hasCircle: true,
    startX: startX,
    startY: startY,
    endX: endX,
    endY: endY,
    startAngle: startAngle,
    endAngle: endAngle,
    circleX: circleX,
    circleY: circleY,
    circleRadius: circleRadius,
  }
}

SelfLink.prototype.draw = function (c) {
  const stuff = this.getEndPointsAndCircle()
  // draw arc
  c.beginPath()
  c.arc(
    stuff.circleX,
    stuff.circleY,
    stuff.circleRadius,
    stuff.startAngle,
    stuff.endAngle,
    false
  )
  c.stroke()
  // draw the text on the loop farthest from the node
  const textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle)
  const textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle)
  drawText(c, this.text, textX, textY, this.anchorAngle, selectedObject === this)
  // draw the head of the arrow
  if (this.directed) {
    drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4)
  }
}

SelfLink.prototype.containsPoint = function (x, y) {
  const stuff = this.getEndPointsAndCircle()
  const dx = x - stuff.circleX
  const dy = y - stuff.circleY
  const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius
  return Math.abs(distance) < hitTargetPadding
}
