const greekLetterNames = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Epsilon',
  'Zeta',
  'Eta',
  'Theta',
  'Iota',
  'Kappa',
  'Lambda',
  'Mu',
  'Nu',
  'Xi',
  'Omicron',
  'Pi',
  'Rho',
  'Sigma',
  'Tau',
  'Upsilon',
  'Phi',
  'Chi',
  'Psi',
  'Omega',
]

/*
 Return true if the user has directed edges on, false otherwise.
 */
function checkDirected() {
  return document.getElementById('directed').checked
}

function convertLatexShortcuts(text) {
  // html greek characters
  for (let i = 0; i < greekLetterNames.length; i++) {
    const name = greekLetterNames[i]
    text = text.replace(
      new RegExp('\\\\' + name, 'g'),
      String.fromCharCode(913 + i + (i > 16))
    )
    text = text.replace(
      new RegExp('\\\\' + name.toLowerCase(), 'g'),
      String.fromCharCode(945 + i + (i > 16))
    )
  }

  // subscripts
  for (let i = 0; i < 10; i++) {
    text = text.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i))
  }

  return text
}

function textToXML(text) {
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c >= 0x20 && c <= 0x7e) {
      result += text[i]
    } else {
      result += '&#' + c + ';'
    }
  }
  return result
}

function drawArrow(c, x, y, angle) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  c.beginPath()
  c.moveTo(x, y)
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx)
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx)
  c.fill()
}

function canvasHasFocus() {
  return (document.activeElement || document.body) === document.body
}

function drawText(c, originalText, x, y, angleOrNull, isSelected) {
	let text = convertLatexShortcuts(originalText)
  c.font = '20px "Times New Roman", serif'
  const width = c.measureText(text).width

  // center the text
  x -= width / 2

  // position the text intelligently if given an angle
  if (angleOrNull != null) {
    const cos = Math.cos(angleOrNull)
    const sin = Math.sin(angleOrNull)
    const cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1)
    const cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1)
    const slide =
      sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
      cos * Math.pow(Math.abs(cos), 10) * cornerPointY
    x += cornerPointX - sin * slide
    y += cornerPointY + cos * slide
  }

  // draw text and caret (round the coordinates so the caret falls on a pixel)
  if ('advancedFillText' in c) {
    c.advancedFillText(text, originalText, x + width / 2, y, angleOrNull)
  } else {
    x = Math.round(x)
    y = Math.round(y)
    c.fillText(text, x, y + 6)
    if (isSelected && caretVisible && canvasHasFocus() && document.hasFocus()) {
      x += width
      c.beginPath()
      c.moveTo(x, y - 10)
      c.lineTo(x, y + 10)
      c.stroke()
    }
  }
}

let caretTimer
let caretVisible = true

function resetCaret() {
  clearInterval(caretTimer)
  caretTimer = setInterval('caretVisible = !caretVisible; draw()', 500)
  caretVisible = true
}

let canvas
const nodeRadius = 30
const nodes = []
const links = []

const cursorVisible = true
const snapToPadding = 6 // pixels
const hitTargetPadding = 6 // pixels
const gridSnapPadding = 30 // pixels
let selectedObject = null // either a Link or a Node
let currentLink = null // a Link
let movingObject = false
let originalClick

function drawUsing(c) {
  c.clearRect(0, 0, canvas.width, canvas.height)
  c.save()
  c.translate(0.5, 0.5)

  for (let i = 0; i < nodes.length; i++) {
    c.lineWidth = 1
    c.fillStyle = c.strokeStyle = nodes[i] === selectedObject ? 'blue' : 'black'
    nodes[i].draw(c)
  }
  for (let i = 0; i < links.length; i++) {
    c.lineWidth = 1
    c.fillStyle = c.strokeStyle = links[i] === selectedObject ? 'blue' : 'black'
    links[i].draw(c)
  }
  if (currentLink != null) {
    c.lineWidth = 1
    c.fillStyle = c.strokeStyle = 'black'
    currentLink.draw(c)
  }

  c.restore()
}

function draw() {
  drawUsing(canvas.getContext('2d'))
  saveBackup()
}

function selectObject(x, y) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].containsPoint(x, y)) {
      return nodes[i]
    }
  }
  for (let i = 0; i < links.length; i++) {
    if (links[i].containsPoint(x, y)) {
      return links[i]
    }
  }
  return null
}

function snapNode(node) {
  const element = document.getElementById('gridsnap')
  const gridSnap = element.checked
  if (gridSnap) {
    const xTemp = node.x + Math.floor(gridSnapPadding / 2)
    const yTemp = node.y + Math.floor(gridSnapPadding / 2)
    node.x = xTemp - (xTemp % gridSnapPadding)
    node.y = yTemp - (yTemp % gridSnapPadding)
  } else {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] === node) continue

      if (Math.abs(node.x - nodes[i].x) < snapToPadding) {
        node.x = nodes[i].x
      }

      if (Math.abs(node.y - nodes[i].y) < snapToPadding) {
        node.y = nodes[i].y
      }
    }
  }
}

window.onload = function () {
  document.getElementById('clearCanvas').onclick = function () {
    localStorage['fsm'] = ''
    location.reload()
  }

  document.getElementById('clearNodes').onclick = function () {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].text = ''
    }
    draw()
  }

  document.getElementById('importButton').onclick = function () {
    const element = document.getElementById('output')
    localStorage['fsm'] = element.value
    location.reload()
  }

  canvas = document.getElementById('canvas')
  restoreBackup()
  draw()

  canvas.onmousedown = function (e) {
    const mouse = crossBrowserRelativeMousePos(e)

    selectedObject = selectObject(mouse.x, mouse.y)
    movingObject = false
    originalClick = mouse
    if (selectedObject != null) {
      if (shift && selectedObject instanceof Node) {
        currentLink = new SelfLink(selectedObject, mouse, checkDirected())
      } else {
        movingObject = true
        deltaMouseX = deltaMouseY = 0
        if (selectedObject.setMouseStart) {
          selectedObject.setMouseStart(mouse.x, mouse.y)
        }
      }
      resetCaret()
    } else if (shift) {
      currentLink = new TemporaryLink(mouse, mouse, checkDirected())
    }

    draw()

    if (canvasHasFocus()) {
      // disable drag-and-drop only if the canvas is already focused
      return false
    } else {
      // otherwise, let the browser switch the focus away from wherever it was
      resetCaret()
      return true
    }
  }

  canvas.ondblclick = function (e) {
    const mouse = crossBrowserRelativeMousePos(e)

    selectedObject = selectObject(mouse.x, mouse.y)
    if (selectedObject == null) {
      selectedObject = new Node(mouse.x, mouse.y)
      nodes.push(selectedObject)
      resetCaret()
      draw()
    } else if (selectedObject instanceof Node) {
      selectedObject.isAcceptState = !selectedObject.isAcceptState
      draw()
    }
  }

  canvas.onmousemove = function (e) {
    const mouse = crossBrowserRelativeMousePos(e)

    if (currentLink != null) {
      let targetNode = selectObject(mouse.x, mouse.y)
      if (!(targetNode instanceof Node)) {
        targetNode = null
      }

      if (selectedObject == null) {
        if (targetNode != null) {
          currentLink = new StartLink(
            targetNode,
            originalClick,
            checkDirected()
          )
        } else {
          currentLink = new TemporaryLink(originalClick, mouse, checkDirected())
        }
      } else {
        if (targetNode === selectedObject) {
          currentLink = new SelfLink(selectedObject, mouse, checkDirected())
        } else if (targetNode != null) {
          currentLink = new Link(selectedObject, targetNode, checkDirected())
        } else {
          currentLink = new TemporaryLink(
            selectedObject.closestPointOnCircle(mouse.x, mouse.y),
            mouse,
            checkDirected()
          )
        }
      }
      draw()
    }

    if (movingObject) {
      selectedObject.setAnchorPoint(mouse.x, mouse.y)
      if (selectedObject instanceof Node) {
        snapNode(selectedObject)
      }
      draw()
    }
  }

  canvas.onmouseup = function (e) {
    movingObject = false

    if (currentLink != null) {
      if (!(currentLink instanceof TemporaryLink)) {
        selectedObject = currentLink
        links.push(currentLink)
        resetCaret()
      }
      currentLink = null
      draw()
    }
  }
}

let shift = false

document.onkeydown = function (e) {
  const key = crossBrowserKey(e)

  if (key === 16) {
    shift = true
  } else if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true
  } else if (key === 8) {
    // backspace key
    if (selectedObject != null && 'text' in selectedObject) {
      selectedObject.text = selectedObject.text.substr(
        0,
        selectedObject.text.length - 1
      )
      resetCaret()
      draw()
    }

    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false
  } else if (key === 46) {
    // delete key
    if (selectedObject != null) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === selectedObject) {
          nodes.splice(i--, 1)
        }
      }
      for (let i = 0; i < links.length; i++) {
        if (
          links[i] === selectedObject ||
          links[i].node === selectedObject ||
          links[i].nodeA === selectedObject ||
          links[i].nodeB === selectedObject
        ) {
          links.splice(i--, 1)
        }
      }
      selectedObject = null
      draw()
    }
  }
}

document.onkeyup = function (e) {
  const key = crossBrowserKey(e)

  if (key === 16) {
    shift = false
  }
}

document.onkeypress = function (e) {
  // don't read keystrokes when other things have focus
  const key = crossBrowserKey(e)
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true
  } else if (
    key >= 0x20 &&
    key <= 0x7e &&
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    selectedObject != null &&
    'text' in selectedObject
  ) {
    selectedObject.text += String.fromCharCode(key)
    resetCaret()
    draw()

    // don't let keys do their actions (like space scrolls down the page)
    return false
  } else if (key === 8) {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false
  }
}

function crossBrowserKey(e) {
  e = e || window.event
  return e.which || e.keyCode
}

function crossBrowserElementPos(e) {
  e = e || window.event
  let obj = e.target || e.srcElement
  let x = 0, y = 0
  while (obj.offsetParent) {
    x += obj.offsetLeft
    y += obj.offsetTop
    obj = obj.offsetParent
  }
  return { x: x, y: y }
}

function crossBrowserMousePos(e) {
  e = e || window.event
  return {
    x:
      e.pageX ||
      e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y:
      e.pageY ||
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
  }
}

function crossBrowserRelativeMousePos(e) {
  const element = crossBrowserElementPos(e)
  const mouse = crossBrowserMousePos(e)
  return {
    x: mouse.x - element.x,
    y: mouse.y - element.y,
  }
}

function output(text, showInput) {
  const element = document.getElementById('output')
  element.style.display = 'block'
  element.value = text
  setInputButtonHidden(!showInput)
}

function saveAsPNG() {
  const oldSelectedObject = selectedObject
  selectedObject = null
  drawUsing(canvas.getContext('2d'))
  selectedObject = oldSelectedObject
  const pngData = canvas.toDataURL('image/png')
  const pngLink = document.getElementById('pngLink')
  pngLink.download = 'image.png'
  pngLink.href = pngData.replace(
    /^data:image\/[^;]/,
    'data:application/octet-stream'
  )
}

function saveAsSVG() {
  const exporter = new ExportAsSVG()
  const oldSelectedObject = selectedObject
  selectedObject = null
  drawUsing(exporter)
  selectedObject = oldSelectedObject
  const svgData = exporter.toSVG()
  output(svgData)
  // Chrome isn't ready for this yet, the 'Save As' menu item is disabled
  // document.location.href = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function saveAsLaTeX() {
  const exporter = new ExportAsLaTeX()
  const oldSelectedObject = selectedObject
  selectedObject = null
  drawUsing(exporter)
  selectedObject = oldSelectedObject
  const texData = exporter.toLaTeX()
  output(texData)
}

function saveAsJSON() {
  if (!JSON) {
    return
  }
  const backup = backupData()
  output(JSON.stringify(backup))
}

function setInputButtonHidden(isHidden) {
  const importButton = document.getElementById('importButton')
  importButton.hidden = isHidden
}

function loadFromJSON() {
  output('', true)
}
