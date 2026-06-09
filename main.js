
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
    Exit: new Image(),
    Up: new Image(),
}
Images.Home.src = "home.png"
Images.Exit.src = "exit.png"
Images.Up.src = "layerup.png"

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
     * @param {boolean} top 
     * @param {boolean} bottom 
     * @param {keyof TileTypes} type 
     */
    constructor(position, up, left, down, right, top, bottom, type) {
        this.position = position;
        this.up = up;
        this.down = down;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        
        this.type = type;
    }
    toJSON() {
        return {
            position: this.position,
            up: this.up,
            down: this.down,
            left: this.left,
            right: this.right,
            top: this.top,
            bottom: this.bottom,
            type: this.type
        }
    }
    /**
     * 
     * @param {Object} object 
     */
    static fromJSON(object) {
        return new Tile(object.position, object.up ?? false, object.left ?? false, object.down ?? false, object.right ?? false, object.top ?? false, object.bottom ?? false, object.type)
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
class Layer {
    /** @type {Tile[]} */
    tiles = []
    /** @type {Door[]} */
    doors = []
    /** @type {Button[]} */
    buttons = []
    constructor() {
        this.tiles = []
        this.doors = []
        this.buttons = []
    }
    toJSON() {
        return {
            tiles: this.tiles,
            doors: this.doors,
            buttons: this.buttons
        }
    }
    static fromJSON(object) {
        const layer = new Layer()
        for (const element of object.tiles) {
            layer.tiles.push(Tile.fromJSON(element))
        }
        for (const element of object.doors) {
            layer.doors.push(Door.fromJSON(element))
        }
        for (const element of object.buttons) {
            layer.buttons.push(Button.fromJSON(element))
        }
        return layer
    }
}

let layers = {
    0: new Layer()
}
let currentLayer = 0;

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
function draw(ctx) {
    const tiles = layers[currentLayer].tiles
    const doors = layers[currentLayer].doors
    const buttons = layers[currentLayer].buttons

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

    // Draw shadows of lower layer tiles
    let lowerLayer = layers[currentLayer - 1]
    if (lowerLayer != undefined) {
        for (const tile of lowerLayer.tiles) {
            const screenCorner = toScreenSpace(tile.position)
            rect(ctx, [screenCorner, [gridSize, gridSize]], undefined, "#eeeeee")
        }
    }
    
    // Draw tiles
    for (const tile of tiles) {
        const oneTenth = gridSize / 10;
        const twoTenths = oneTenth * 2;
        const eightTenths = twoTenths * 4;
        const oneHalf = gridSize / 2;
        const oneFourth = gridSize / 4;
        const sixTenths = oneTenth * 6;
        const nineTenths = gridSize - oneTenth;
        const screenCorner = toScreenSpace(tile.position)
        const screenCenter = screenCorner.map((e) => e + oneHalf)
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
        if (tile.bottom) {
            if (lowerLayer != undefined && lowerLayer.tiles.find((lowerTile) => lowerTile.position[0] == tile.position[0] && lowerTile.position[1] == tile.position[1])) {
                rect(ctx, [[screenCorner[0] + twoTenths, screenCorner[1] + twoTenths], [sixTenths, sixTenths]], undefined, "#eeeeee")
            } else {
                rect(ctx, [[screenCorner[0] + twoTenths, screenCorner[1] + twoTenths], [sixTenths, sixTenths]], undefined, "white")
            }
        }
        if (tile.top) {
            ctx.drawImage(Images.Up, screenCenter[0] - oneFourth - 8, screenCenter[1] - oneFourth - 8)
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
            const oneHalf = gridSize / 2;
            const oneSixth = gridSize / 6;
            const twoThirds = oneThird * 2;
            
            const up = [[corner[0] + oneThird, corner[1]], [oneThird, oneThird]];
            const inUp = inRect(mouse, up);
            const left = [[corner[0], corner[1] + oneThird], [oneThird, oneThird]];
            const inLeft = inRect(mouse, left);
            const right = [[corner[0] + twoThirds, corner[1] + oneThird], [oneThird, oneThird]];
            const inRight = inRect(mouse, right);
            const down = [[corner[0] + oneThird, corner[1] + twoThirds], [oneThird, oneThird]];
            const inDown = inRect(mouse, down);
            const top = [[corner[0] + oneThird, corner[1] + oneThird], [oneThird, oneSixth]];
            const inTop = inRect(mouse, top);
            const bottom = [[corner[0] + oneThird, corner[1] + oneHalf], [oneThird, oneSixth]];
            const inBottom = inRect(mouse, bottom);
            
            if (mode == Modes.Build) {
                if (mouseClicked && (inUp || inLeft || inRight || inDown || inTop || inBottom)) {
                    let tile = tiles.find((tile) => tile.position[0] == worldCoordinates[0] && tile.position[1] == worldCoordinates[1])
                    
                    if (tile == undefined) {
                        tile = new Tile(worldCoordinates, false, false, false, false, false, false, TileTypes.Basic)
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
                    if (inTop) {
                        tile.top = !tile.top;
                    }
                    if (inBottom) {
                        tile.bottom = !tile.bottom;
                    }

                    if (!(tile.up || tile.left || tile.right || tile.down || tile.top || tile.bottom)) {
                        layers[currentLayer].tiles = tiles.filter((test) => test != tile)
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
                        layers[currentLayer].doors = doors.filter((test) => test != door);
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
                        layers[currentLayer].buttons = buttons.filter((test) => test != button);
                    }
                }
            }
            rect(ctx, up, "black", inUp ? "gray" : undefined);
            rect(ctx, left, "black", inLeft ? "gray" : undefined);
            rect(ctx, right, "black", inRight ? "gray" : undefined);
            rect(ctx, down, "black", inDown ? "gray" : undefined);
            if (mode == Modes.Build) {
                rect(ctx, top, "black", inTop ? "gray" : undefined);
                rect(ctx, bottom, "black", inBottom ? "gray" : undefined);
            }
        } else if (mode == Modes.SetSpawn || mode == Modes.SetExit || mode == Modes.Delete) {
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
                        layers[currentLayer].tiles = tiles.filter((test) => test != tile)
                        layers[currentLayer].doors = doors.filter((door) => !doorsOnTile.includes(door))
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

        const cursor = [event.clientX, event.clientY];
        const worldUnderCursor = toWorldSpace(cursor);

        scrollValue -= event.deltaY * SCROLL_MULTIPLIER;

        if (scrollValue < -5) {
            scrollValue = -5
        }

        zoom = Math.exp(scrollValue);

        scrollX = cursor[0] / zoom - width / 2 - worldUnderCursor[0] * 50;
        scrollY = cursor[1] / zoom - height / 2 - worldUnderCursor[1] * 50;
    });

    { // Dragging
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        canvas.addEventListener('mousedown', function(event) {
            startX = event.clientX;
            startY = event.clientY;
            isDragging = true;
            if (event.button == 0) {
                mouseClicked = true;
            }
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

    const allButtons = [
        "pan",
        "delete",
        "hammer",
        "door",
        "button",
        "home",
        "exit"
    ].map((id) => document.getElementById(id))

    function setActiveButton(id) {
        allButtons.forEach((button) => {
            if (button.id == id) {
                button.classList.add("selected")
            } else {
                button.classList.remove("selected")
            }
        })
    }

    {
        const keymap = {}
        function setMode(newMode, id, key) {
            function action() {
                mode = newMode;
                setActiveButton(id);
            }
            document.getElementById(id).addEventListener("click", action);
            keymap[key] = action;
        }
        function layerUp() {
            currentLayer++;
            if (layers[currentLayer] == undefined) {
                layers[currentLayer] = new Layer()
            }
        }
        keymap["ArrowUp"] = layerUp;
        function layerDown() {
            currentLayer--;
            if (layers[currentLayer] == undefined) {
                layers[currentLayer] = new Layer()
            }
        }
        keymap["ArrowDown"] = layerDown;
        function layerCenter() {
            currentLayer = 0;
            scrollX = 0;
            scrollY = 0;
            zoom = 1;
            scrollValue = 0;
        }
        keymap["Backspace"] = layerCenter
        setMode(Modes.Pan, "pan", "1")
        setMode(Modes.Delete, "delete", "2")
        setMode(Modes.Build, "hammer", "3")
        setMode(Modes.Door, "door", "4")
        setMode(Modes.Buttons, "button", "5")
        setMode(Modes.SetSpawn, "home", "6")
        setMode(Modes.SetExit, "exit", "7")
        async function downloadSave() {
            // Downlaod
            const save = JSON.stringify(layers)

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
        }
        document.getElementById("download").addEventListener("click", downloadSave)
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
                    layers = {
                        0: new Layer()
                    }

                    for (const element of saveData) {
                        layers[0].tiles.push(Tile.fromJSON(element))
                    }

                } else if (saveData.tiles != undefined && saveData.doors != undefined && saveData.buttons != undefined) {
                    layers = {
                        0: new Layer()
                    }

                    for (const element of saveData.tiles) {
                        layers[0].tiles.push(Tile.fromJSON(element))
                    }
                    for (const element of saveData.doors) {
                        layers[0].doors.push(Door.fromJSON(element))
                    }
                    for (const element of saveData.buttons) {
                        layers[0].buttons.push(Door.fromJSON(element))
                    }
                } else {
                    layers = {}
                    
                    for (const layer of Object.keys(saveData)) {
                        layers[layer] = Layer.fromJSON(saveData[layer])
                    }
                }
            }

            reader.readAsText(file)
        })
        document.getElementById("restart").addEventListener("click", function(event) {
            if (confirm("Reset workspace?")) {
                layers = {
                    0: new Layer()
                }
                layerCenter();
            }
        })

        // Sidebar buttons
        
        document.getElementById("layerup").addEventListener("click", layerUp);
        document.getElementById("layercenter").addEventListener("click", layerCenter);
        document.getElementById("layerdown").addEventListener("click", layerDown);

        document.addEventListener("keydown", function(event) {
            if (keymap[event.key] != undefined) {
                keymap[event.key]()
            }

            // Save
            if (event.ctrlKey && event.key == "s") {
                event.preventDefault()
                downloadSave();
            }
        })
    }

    try {
        const saveData = JSON.parse(localStorage.getItem("velocityMapMaker-cache") ?? `{"0": {"tiles": [], "doors": [], "buttons": []}}`)

        layers = {}
        for (const layer of Object.keys(saveData)) {
            layers[layer] = Layer.fromJSON(saveData[layer])
        }
        if (Object.keys(layers).length == 0) {
            layers = {
                0: new Layer()
            }
        }
    } catch (err) {
        localStorage.removeItem("velocityMapMaker-cache")
    }

    addEventListener("beforeunload", function() {
        localStorage.setItem("velocityMapMaker-cache", JSON.stringify(layers))
    })
    

    const ctx = canvas.getContext('2d');

    requestAnimationFrame(function() {
        draw(ctx);
    });
});