// Open Figma Desktop
// Hit ⌘⇧B (Ctrl-Shift-B for Windows) in Visual Studio Code, 
// then select tsc: watch - tsconfig.json. 
// This tells Visual Studio Code to compile code.ts into code.js. 
// It will watch for changes to code.ts and automatically re-generate code.js every time code.ts is saved.
function visit(node, nodeCount, nodeTypeCounts) {
    nodeTypeCounts.set(node.type, 1 + (nodeTypeCounts.get(node.type) | 0));
    nodeCount++;
    if ("children" in node) {
        node.children.forEach(function (node) {
            nodeCount = visit(node, nodeCount, nodeTypeCounts);
        });
    }
    return nodeCount;
}
function traverse(node, outline, indent) {
    const inset = '                '.substring(1, Math.min(indent + 1, 16));
    outline += nodeDetail(node, indent);
    if ("children" in node) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i];
            indent += 1;
            outline = traverse(child, outline, indent);
            indent -= 1;
        }
        // }
    }
    return outline;
}
function nodeDetail(node, indent) {
    const inset = '                  '.substring(1, Math.min(indent + 1, 16));
    let detail = "";
    detail += `${inset} ${node.id} ${node.type}: ${node.name}]\n`;
    if (node.type === "RECTANGLE") {
        detail += `${inset}   scene[visible: ${node.visible}, locked: ${node.locked}]\n`;
        detail += `${inset}   reaction[count: ${node.reactions.length}]\n`;
        detail += `${inset}   blend[opacity: ${node.opacity}]\n`;
        detail += `${inset}   geometry[fillStyleId: ${String(node.fillStyleId)}, strokeStyleId: ${node.strokeStyleId}]\n`;
        detail += `${inset}   layout[x: ${node.x}, y: ${node.y}, width: ${node.width}, height: ${node.height}]\n`;
        detail += `${inset}   export[settings count: ${node.exportSettings.length}]\n`;
        detail += `${inset}   constraints[horizontal: ${node.constraints.horizontal}, vertical: ${node.constraints.vertical}]\n`;
    }
    else if (node.type === "TEXT") {
        detail += `${inset}   constraints[horizontal: ${node.constraints.horizontal}, vertical: ${node.constraints.vertical}]\n`;
        const fontFamily = (node.fontName !== figma.mixed) ? node.fontName.family : 'mixed';
        const fontStyle = (node.fontName !== figma.mixed) ? node.fontName.style : 'mixed';
        detail += `${inset}   font[family: ${fontFamily}, style: ${fontStyle}, size: ${String(node.fontSize)}]\n`;
    }
    return detail;
}
figma.showUI(__html__);
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-rectangles') {
        const nodes = [];
        for (let i = 0; i < msg.count; i++) {
            const rect = figma.createRectangle();
            rect.x = i * 150;
            rect.fills = [{ type: 'SOLID', color: { r: 0, g: 0.5, b: 1 } }];
            figma.currentPage.appendChild(rect);
            nodes.push(rect);
        }
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
    }
    if (msg.type === 'stats') {
        const nodeTypeCounts = new Map;
        const count = visit(figma.root, 0, nodeTypeCounts);
        let text = `Node count: ${count}\n`;
        let nodeTypes = Array.from(nodeTypeCounts.entries());
        nodeTypes.sort((a, b) => b[1] - a[1]);
        text += `Node types:` + nodeTypes.map(([k, v]) => `\n  ${k}: ${v}`).join('');
        console.log(`Stats:\n${text}`);
    }
    if (msg.type === 'outline') {
        let node = figma.root.findOne(node => node.type === 'FRAME' && node.name === 'Flutter');
        if (node === null) {
            node = figma.currentPage.selection[0];
        }
        if (node === null) {
            node = figma.root;
        }
        const outline = traverse(node, '', 0);
        console.log(`Outline:\n${outline}`);
        let text = "";
        const textStyles = figma.getLocalTextStyles();
        for (const style of textStyles) {
            text += `${style.name}\n`;
        }
        console.log(`Text Styles:\n${text}`);
        let paint = "";
        const paintStyles = figma.getLocalPaintStyles();
        for (const style of paintStyles) {
            paint += `${style.name}\n`;
        }
        console.log(`Color Styles:\n${paint}`);
        let effect = "";
        const effectStyles = figma.getLocalEffectStyles();
        for (const style of effectStyles) {
            effect += `${style.name}\n`;
        }
        console.log(`Effect Styles:\n${effect}`);
        let grid = "";
        const gridStyles = figma.getLocalGridStyles();
        for (const style of gridStyles) {
            grid += `${style.name}\n`;
        }
        console.log(`Grid Styles:\n${grid}`);
        figma.viewport.scrollAndZoomIntoView([node]);
    }
    figma.closePlugin();
};
