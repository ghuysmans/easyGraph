function StartLink(node, start, directed) {
  this.node = node
  this.deltaX = 0
  this.deltaY = 0
  this.text = ''

  this.directed = directed

  if (start) {
    this.setAnchorPoint(start.x, start.y)
  }
}

StartLink.prototype.setAnchorPoint = function (x, y) {
  this.deltaX = x - this.node.x
  this.deltaY = y - this.node.y

  if (Math.abs(this.deltaX) < snapToPadding) {
    this.deltaX = 0
  }

  if (Math.abs(this.deltaY) < snapToPadding) {
    this.deltaY = 0
  }
}

StartLink.prototype.getEndPoints = function () {
  const startX = this.node.x + this.deltaX
  const startY = this.node.y + this.deltaY
  const end = this.node.closestPointOnCircle(startX, startY)
  return {
    startX: startX,
    startY: startY,
    endX: end.x,
    endY: end.y,
  }
}

StartLink.prototype.draw = function (c) {
  const stuff = this.getEndPoints()

  // draw the line
  c.beginPath()
  c.moveTo(stuff.startX, stuff.startY)
  c.lineTo(stuff.endX, stuff.endY)
  c.stroke()

  // draw the text at the end without the arrow
  const textAngle = Math.atan2(
    stuff.startY - stuff.endY,
    stuff.startX - stuff.endX
  )
  drawText(
    c,
    this.text,
    stuff.startX,
    stuff.startY,
    textAngle,
    selectedObject === this
  )

  // draw the head of the arrow
  if (this.directed) {
    drawArrow(c, stuff.endX, stuff.endY, Math.atan2(-this.deltaY, -this.deltaX))
  }
}

StartLink.prototype.containsPoint = function (x, y) {
  const stuff = this.getEndPoints()
  const dx = stuff.endX - stuff.startX
  const dy = stuff.endY - stuff.startY
  const length = Math.sqrt(dx * dx + dy * dy)
  const percent =
    (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length)
  const distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length
  return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding
}
