/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {[[number, number], [number, number]]} rect 
 * @param {string} strokeColor
 * @param {string} fillColor
 */
function rect(ctx, rect, strokeColor = undefined, fillColor = undefined) {
    ctx.beginPath()
    ctx.rect(rect[0][0], rect[0][1], rect[1][0], rect[1][1])

    if (strokeColor != undefined) {
        ctx.strokeStyle = strokeColor;
        ctx.stroke()
    }
    if (fillColor != undefined) {
        ctx.fillStyle = fillColor;
        ctx.fill()
    }
}

/**
 * 
 * @param {[number, number]} point 
 * @param {[[number, number], [number, number]]} rect 
 */
function inRect(point, rect) {
    const left = rect[0][0]
    const top = rect[0][1]
    const right = rect[0][0] + rect[1][0]
    const bottom = rect[0][1] + rect[1][1]

    return point[0] > left && point[0] < right && point[1] > top && point[1] < bottom
}

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {[number, number]} point 
 * @param {string} color
 * @param {number?} radius
 */
function point(ctx, point, color, radius = 5) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(point[0], point[1], radius, radius, 0, 0, 360, false)
    ctx.fill()
}