
const Modes = {
    Pan: "pan",
    Build: "build",
    Door: "door",
    Buttons: "buttons",
    Delete: "delete",
    SetSpawn: "set_spawn",
    SetExit: "set_exit"
}

const TileTypes = {
    Basic: "Basic",
    Home: "Home",
    Exit: "Exit"
}

const Images = {
    Home: new Image(),
    Exit: new Image()
}
Images.Home.src = "home.png"
Images.Exit.src = "exit.png"

let mode = Modes.Pan

const SCROLL_MULTIPLIER = 0.001;

let scrollX = 0;
let scrollY = 0;

let mouseX = 0;
let mouseY = 0;

let width = 0;
let height = 0;

let zoom = 1;

let scrollValue = 0;

let mouseClicked = false;

/**
 * 
 * @param {[number, number]} pos 
 */
function toWorldSpace(screenPos) {
    return [
        ((screenPos[0] / zoom) - width / 2 - scrollX) / 50,
        ((screenPos[1] / zoom) - height / 2 - scrollY) / 50
    ]
}

/**
 * 
 * @param {[number, number]} pos 
 * @param {number?} z
 */
function toScreenSpace(worldPos) {
    return [(worldPos[0] * 50 + scrollX + width / 2) * zoom, (worldPos[1] * 50 + scrollY + height / 2) * zoom]
}

class Tile {
    /**
     * 
     * @param {[number number]} position 
     * @param {boolean} up 
     * @param {boolean} left 
     * @param {boolean} down 
     * @param {boolean} right 
     * @param {keyof TileTypes} type 
     */
    constructor(position, up, left, down, right, type) {
        this.position = position;
        this.up = up;
        this.down = down;
        this.left = left;
        this.right = right;
        
        this.type = type;
    }
    toJSON() {
        return {
            position: this.position,
            up: this.up,
            down: this.down,
            left: this.left,
            right: this.right,
            type: this.type
        }
    }
    /**
     * 
     * @param {Object} object 
     */
    static fromJSON(object) {
        return new Tile(object.position, object.up, object.left, object.down, object.right, object.type)
    }
}
class Door {
    /**
     * 
     * @param {[number, number]} position 
     * @param {string} direction 
     */
    constructor(position, direction) {
        this.position = position
        this.direction = direction
    }
    toJSON() {
        return {
            position: this.position,
            direction: this.direction
        }
    }
    static fromJSON(object) {
        return new Door(object.position, object.direction)
    }
}
class Button {
    /**
     * 
     * @param {[number, number]} position 
     * @param {string} direction 
     */
    constructor(position, direction) {
        this.position = position
        this.direction = direction
    }
    toJSON() {
        return {
            position: this.position,
            direction: this.direction
        }
    }
    static fromJSON(object) {
        return new Door(object.position, object.direction)
    }
}

/**
 * @type {Tile[]}
 */
let tiles = []

/**
 * @type {Door[]}
 */
let doors = []

/**
 * @type {Button[]}
 */
let buttons = []

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
function draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const mouse = [mouseX, mouseY];

    const center = [ctx.canvas.width / 2, ctx.canvas.height / 2];
    const dimensions = [ctx.canvas.width, ctx.canvas.height];

    const origin = toScreenSpace([0, 0]);

    // Draw grid
    const gridSize = 50 * zoom;
    {
        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 1;
        for (let x = origin[0] % gridSize; x < dimensions[0]; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, dimensions[1]);
            ctx.stroke();
        }
        for (let y = origin[1] % gridSize; y < dimensions[1]; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(dimensions[0], y);
            ctx.stroke();
        }
    }

    // Draw tiles
    for (const tile of tiles) {
        const oneTenth = gridSize / 10;
        const twoTenths = oneTenth * 2;
        const eightTenths = twoTenths * 4;
        const nineTenths = gridSize - oneTenth;
        const screenCorner = toScreenSpace(tile.position)
        const screenCenter = screenCorner.map((e) => e + gridSize / 2)
        rect(ctx, [screenCorner, [gridSize, gridSize]], undefined, "#444444")
        rect(ctx, [screenCorner.map((e) => e + oneTenth), [gridSize, gridSize].map(e => e - twoTenths)], undefined, "#dddddd")

        if (tile.up) {
            rect(ctx, [[screenCorner[0] + oneTenth, screenCorner[1]], [eightTenths, oneTenth + 1]], undefined, "#dddddd")
        }
        if (tile.left) {
            rect(ctx, [[screenCorner[0], screenCorner[1] + oneTenth], [oneTenth + 1, eightTenths]], undefined, "#dddddd")
        }
        if (tile.down) {
            rect(ctx, [[screenCorner[0] + oneTenth, screenCorner[1] + nineTenths - 1], [eightTenths, oneTenth + 1]], undefined, "#dddddd")
        }
        if (tile.right) {
            rect(ctx, [[screenCorner[0] + nineTenths - 1, screenCorner[1] + oneTenth], [oneTenth + 1, eightTenths]], undefined, "#dddddd")
        }

        if (tile.type == TileTypes.Exit || tile.type == TileTypes.Home) {
            ctx.drawImage(Images[tile.type], screenCenter[0] - 8, screenCenter[1] - 8)
        }
    }

    for (const door of doors) {
        const oneTenth = gridSize / 10;
        const twoTenths = oneTenth * 2;
        const eightTenths = twoTenths * 4;
        const nineTenths = gridSize - oneTenth;

        const screenCorner = toScreenSpace(door.position)

        if (door.direction == "up") {
            rect(ctx, [[screenCorner[0] + oneTenth, screenCorner[1]], [eightTenths, oneTenth + 1]], undefined, "#704d00")
        }
        if (door.direction == "left") {
            rect(ctx, [[screenCorner[0], screenCorner[1] + oneTenth], [oneTenth + 1, eightTenths]], undefined, "#704d00")
        }
        if (door.direction == "down") {
            rect(ctx, [[screenCorner[0] + oneTenth, screenCorner[1] + nineTenths - 1], [eightTenths, oneTenth + 1]], undefined, "#704d00")
        }
        if (door.direction == "right") {
            rect(ctx, [[screenCorner[0] + nineTenths - 1, screenCorner[1] + oneTenth], [oneTenth + 1, eightTenths]], undefined, "#704d00")
        }
    }
    for (const button of buttons) {
        const oneTenth = gridSize / 10;
        const twoTenths = oneTenth * 2;
        const fourTenths = oneTenth * 4;
        const oneHalf = gridSize / 2;
        const eightTenths = twoTenths * 4;
        const nineTenths = gridSize - oneTenth;

        const screenCorner = toScreenSpace(button.position)

        if (button.direction == "up") {
            rect(ctx, [[screenCorner[0] + fourTenths, screenCorner[1] + oneTenth], [twoTenths, oneTenth + 1]], undefined, "red")
        }
        if (button.direction == "left") {
            rect(ctx, [[screenCorner[0] + oneTenth, screenCorner[1] + fourTenths], [oneTenth + 1, twoTenths]], undefined, "red")
        }
        if (button.direction == "down") {
            rect(ctx, [[screenCorner[0] + fourTenths, screenCorner[1] + eightTenths - 1], [twoTenths, oneTenth + 1]], undefined, "red")
        }
        if (button.direction == "right") {
            rect(ctx, [[screenCorner[0] + eightTenths - 1, screenCorner[1] + fourTenths], [oneTenth + 1, twoTenths]], undefined, "red")
        }
    }

    if (scrollValue >= -0.6) {
        if (mode == Modes.Build || mode == Modes.Door || mode == Modes.Buttons) {
            const worldCoordinates = toWorldSpace(mouse).map((e) => Math.floor(e))
            const corner = toScreenSpace(worldCoordinates)

            // Draw 4 boxes, up right down left
            const oneThird = gridSize / 3;
            const twoThirds = oneThird * 2;
            
            const up = [[corner[0] + oneThird, corner[1]], [oneThird, oneThird]];
            const inUp = inRect(mouse, up);
            const left = [[corner[0], corner[1] + oneThird], [oneThird, oneThird]];
            const inLeft = inRect(mouse, left);
            const right = [[corner[0] + twoThirds, corner[1] + oneThird], [oneThird, oneThird]];
            const inRight = inRect(mouse, right);
            const down = [[corner[0] + oneThird, corner[1] + twoThirds], [oneThird, oneThird]];
            const inDown = inRect(mouse, down);
            
            if (mode == Modes.Build) {
                if (mouseClicked && (inUp || inLeft || inRight || inDown)) {
                    let tile = tiles.find((tile) => tile.position[0] == worldCoordinates[0] && tile.position[1] == worldCoordinates[1])
                    
                    if (tile == undefined) {
                        tile = new Tile(worldCoordinates, false, false, false, false, TileTypes.Basic)
                        tiles.push(tile)
                    }

                    if (inUp) {
                        tile.up = !tile.up;
                    }
                    if (inLeft) {
                        tile.left = !tile.left;
                    }
                    if (inRight) {
                        tile.right = !tile.right;
                    }
                    if (inDown) {
                        tile.down = !tile.down;
                    }

                    if (!(tile.up || tile.left || tile.right || tile.down)) {
                        tiles = tiles.filter((test) => test != tile)
                    }
                }
            } else if (mode == Modes.Door) {
                if (mouseClicked && (inUp || inLeft || inRight || inDown)) {
                    let doorsOnTile = doors.filter((door) => door.position[0] == worldCoordinates[0] && door.position[1] == worldCoordinates[1])

                    const dir = (inUp ? "up" : (inLeft ? "left" : (inRight ? "right" : (inDown ? "down" : ""))))

                    let door = doorsOnTile.find((door) => door.direction == dir)

                    if (door == undefined) {
                        door = new Door(worldCoordinates, dir)
                        doors.push(door)
                    } else {
                        doors = doors.filter((test) => test != door);
                    }
                }
            } else if (mode == Modes.Buttons) {
                if (mouseClicked && (inUp || inLeft || inRight || inDown)) {
                    let buttonsOnTile = buttons.filter((button) => button.position[0] == worldCoordinates[0] && button.position[1] == worldCoordinates[1])

                    const dir = (inUp ? "up" : (inLeft ? "left" : (inRight ? "right" : (inDown ? "down" : ""))))

                    let button = buttonsOnTile.find((button) => button.direction == dir)

                    if (button == undefined) {
                        button = new Button(worldCoordinates, dir)
                        buttons.push(button)
                    } else {
                        buttons = buttons.filter((test) => test != button);
                    }
                }
            }
            rect(ctx, up, "black", inUp ? "gray" : undefined);
            rect(ctx, left, "black", inLeft ? "gray" : undefined);
            rect(ctx, right, "black", inRight ? "gray" : undefined);
            rect(ctx, down, "black", inDown ? "gray" : undefined);
        } else {
            const worldCoordinates = toWorldSpace(mouse).map((e) => Math.floor(e))
            const corner = toScreenSpace(worldCoordinates)

            const oneThird = gridSize / 3;

            const box = [corner.map(e => e + oneThird), [oneThird, oneThird]]

            const inBox = inRect(mouse, box)

            let tile = tiles.find((tile) => tile.position[0] == worldCoordinates[0] && tile.position[1] == worldCoordinates[1])
            let doorsOnTile = doors.filter((door) => door.position[0] == worldCoordinates[0] && door.position[1] == worldCoordinates[1])

            if (tile != undefined || doorsOnTile.length > 0) {
                if (mouseClicked && inBox) {
                    if (mode == Modes.SetSpawn) {
                        if (tile.type == TileTypes.Home) {
                            tile.type = TileTypes.Basic
                        } else {
                            tile.type = TileTypes.Home
                        }
                    } else if (mode == Modes.SetExit) {
                        if (tile.type == TileTypes.Exit) {
                            tile.type = TileTypes.Basic
                        } else {
                            tile.type = TileTypes.Exit
                        }
                    } else if (mode == Modes.Delete) {
                        tiles = tiles.filter((test) => test != tile)
                        doors = doors.filter((door) => !doorsOnTile.includes(door))
                    }
                }

                rect(ctx, box, "black", inBox ? "gray" : undefined)
            }
        }
    }

    // Draw axes
    { // X axis
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin[0], 0);
        ctx.lineTo(origin[0], dimensions[1]);
        ctx.stroke();
    }
    
    { // Y axis
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, origin[1]);
        ctx.lineTo(dimensions[0], origin[1]);
        ctx.stroke();
    }

    // Draw origin
    {
        point(ctx, origin, "black", 5)
    }
    

    requestAnimationFrame(function() {
        draw(ctx);
        mouseClicked = false;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('main');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    width = window.innerWidth;
    height = window.innerHeight;

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            if (entry.target === canvas) {
                canvas.width = entry.contentRect.width;
                canvas.height = entry.contentRect.height;
                width = entry.contentRect.width;
                height = entry.contentRect.height;
            }
        }
    });

    resizeObserver.observe(canvas);

    canvas.addEventListener('wheel', function(event) {
        event.preventDefault();
        scrollValue -= event.deltaY * SCROLL_MULTIPLIER;

        if (scrollValue < -5) {
            scrollValue = -5
        }

        zoom = Math.exp(scrollValue);

        // scrollX += (event.clientX - canvas.width / 2) * (1 - 1 / zoom);
        // scrollY += (event.clientY - canvas.height / 2) * (1 - 1 / zoom);
    });

    { // Dragging
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        canvas.addEventListener('mousedown', function(event) {
            startX = event.clientX;
            startY = event.clientY;
            isDragging = true;
            mouseClicked = true;
        });
        canvas.addEventListener('mousemove', function(event) {
            mouseX = event.clientX;
            mouseY = event.clientY;
            if (isDragging) {
                scrollX += (event.clientX - startX) / zoom;
                scrollY += (event.clientY - startY) / zoom;
                startX = event.clientX;
                startY = event.clientY;
            }
        });
        canvas.addEventListener('mouseup', function(event) {
            isDragging = false;
        });
    }

    {
        document.getElementById("pan").addEventListener("click", function(event) {
            mode = Modes.Pan
        })
        document.getElementById("delete").addEventListener("click", function(event) {
            mode = Modes.Delete
        })
        document.getElementById("hammer").addEventListener("click", function(event) {
            mode = Modes.Build
        })
        document.getElementById("door").addEventListener("click", function(event) {
            mode = Modes.Door
        })
        document.getElementById("button").addEventListener("click", function(event) {
            mode = Modes.Buttons
        })
        document.getElementById("home").addEventListener("click", function(event) {
            mode = Modes.SetSpawn
        })
        document.getElementById("exit").addEventListener("click", function(event) {
            mode = Modes.SetExit
        })
        document.getElementById("download").addEventListener("click", async function(event) {
            // Downlaod
            const save = JSON.stringify({
                tiles,
                doors,
                buttons
            })

            const handle = await window.showSaveFilePicker({
                suggestedName: 'map.json',
                startIn: "downloads",
                types: [{
                    description: 'JSON File',
                    accept: {'application/json': ['.json']},
                }],
            });

            // 2. Create a writable stream to save data
            const writable = await handle.createWritable();
            await writable.write(save);
            await writable.close();
        })
        document.getElementById("upload").addEventListener("click", async function(event) {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }],
                excludeAcceptAllOption: true,
                multiple: false
            });
            const file = await fileHandle.getFile();
            const reader = new FileReader();

            reader.onload = function(event) {
                const content = event.target.result;
                
                const saveData = JSON.parse(content)

                if (saveData instanceof Array) {
                    tiles = []
                    doors = []
                    buttons = []

                    for (const element of saveData) {
                        tiles.push(Tile.fromJSON(element))
                    }

                } else {
                    tiles = []
                    doors = []
                    buttons = []

                    for (const element of saveData.tiles) {
                        tiles.push(Tile.fromJSON(element))
                    }
                    for (const element of saveData.doors) {
                        doors.push(Door.fromJSON(element))
                    }
                    for (const element of saveData.buttons) {
                        buttons.push(Door.fromJSON(element))
                    }
                }
            }

            reader.readAsText(file)
        })
        document.getElementById("restart").addEventListener("click", function(event) {
            if (confirm("Reset workspace?")) {
                tiles = []
                doors = []
                buttons = []
            }
        })
    }

    try {
        const saveData = JSON.parse(localStorage.getItem("velocityMapMaker-cache") ?? `{"tiles":[],"doors":[]}`)

        for (const element of saveData.tiles) {
            tiles.push(Tile.fromJSON(element))
        }
        for (const element of saveData.doors) {
            doors.push(Door.fromJSON(element))
        }
        for (const element of saveData.buttons) {
            buttons.push(Door.fromJSON(element))
        }
    } catch (err) {
        localStorage.removeItem("velocityMapMaker-cache")
    }

    addEventListener("beforeunload", function() {
        localStorage.setItem("velocityMapMaker-cache", JSON.stringify({
            tiles,
            doors,
            buttons
        }))
    })
    

    const ctx = canvas.getContext('2d');

    requestAnimationFrame(function() {
        draw(ctx);
    });
});