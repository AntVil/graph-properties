const RESOLUTION = 800;

let canvas;
let ctxt;

let graph;

window.onload = () => {
    canvas = document.getElementById("canvas");
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;
    ctxt = canvas.getContext("2d");

    graph = new Graph(6, 0.3, 0.5);

    graph.render(ctxt);

    document.getElementById("vertices").innerText = graph.v;
    document.getElementById("edges").innerText = graph.e;
    document.getElementById("faces").innerText = graph.f;
    document.getElementById("components").innerText = graph.c;
}

function ccw(ax, ay, bx, by, cx, cy) {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}

function linesIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    return (
        ccw(ax, ay, cx, cy, dx, dy) != ccw(bx, by, cx, cy, dx, dy) &&
        ccw(ax, ay, bx, by, cx, cy) != ccw(ax, ay, bx, by, dx, dy)
    );
}

class Graph {
    constructor(gridSize, vertexProbability, relativePotentialEdgeCount) {
        this.gridSize = gridSize;
        this.vertices = [];
        this.edgeMatrix = [];

        for(let y=0;y<gridSize;y++) {
            for(let x=0;x<gridSize;x++) {
                if(Math.random() < vertexProbability) {
                    this.vertices.push([x, y]);
                }
            }
        }

        for(let i=0;i<this.vertices.length;i++) {
            let edgeRow = [0];
            for(let j=0;j<i;j++) {
                edgeRow.push(0);
            }
            this.edgeMatrix.push(edgeRow);
        }

        let potentialEdgeCount = relativePotentialEdgeCount * Math.pow(this.vertices.length, 2);

        for(let p=0;p<potentialEdgeCount;p++) {
            let index1 = Math.floor(Math.random() * this.vertices.length);
            let index2 = Math.floor(Math.random() * this.vertices.length);

            if(index1 < index2) {
                let temp = index1;
                index1 = index2;
                index2 = temp;
            }

            if (index1 === index2) {
                continue
            }

            let a = this.vertices[index1];
            let b = this.vertices[index2];

            if(
                this.lineIntersectsVertices(a[0], a[1], b[0], b[1]) ||
                this.lineIntersectsEdges(a[0], a[1], b[0], b[1])
            ) {
                continue;
            }

            this.edgeMatrix[index1][index2] = 1;
        }

        this.v = this.vertices.length;
        this.e = this.edgeMatrix.reduce((a, b) => a + b.reduce((c, d) => c + d), 0);

        let visited = [];
        let components = [];
        for(let v=0;v<this.vertices.length;v++) {
            if(visited.includes(v)) {
                continue;
            }

            let stack = [v];
            let component = [];

            while(stack.length > 0) {
                let current = stack.pop();
                for(let i=0;i<this.edgeMatrix[current].length;i++) {
                    if(this.edgeMatrix[current][i] > 0 && !visited.includes(i)) {
                        stack.push(i);
                        visited.push(i);
                        component.push(i);
                    }
                }
                for(let i=current+1;i<this.edgeMatrix.length;i++) {
                    if(this.edgeMatrix[i][current] > 0 && !visited.includes(i)) {
                        stack.push(i);
                        visited.push(i);
                        component.push(i);
                    }
                }
            }

            components.push(component);
        }

        this.c = components.length;
        this.f = this.c + this.e - this.v + 1;
    }

    lineIntersectsEdges(ax, ay, bx, by) {
        for(let i=0;i<this.edgeMatrix.length;i++) {
            for(let j=0;j<this.edgeMatrix[i].length;j++) {
                if(this.edgeMatrix[i][j] === 0) {
                    continue;
                }

                let c = this.vertices[i];
                let d = this.vertices[j];

                if(linesIntersect(ax, ay, bx, by, c[0], c[1], d[0], d[1])) {
                    return true;
                }
            }
        }

        return false;
    }

    lineIntersectsVertices(ax, ay, bx, by) {
        let dx = bx - ax;
        let dy = by - ay;

        if(dx === 0 && dy === 0) {
            return false;
        }

        let minX;
        let maxX;
        let minY;
        let maxY;

        if(ax > bx) {
            minX = bx;
            maxX = ax;
        } else {
            minX = ax;
            maxX = bx;
        }
        if(ay > by) {
            minY = by;
            maxY = ay;
        }else {
            minY = ay;
            maxY = by;
        }

        if(dx === 0) {
            for(let vertex of this.vertices) {
                if (vertex[0] === ax && vertex[1] > minY && vertex[1] < maxY) {
                    return true;
                }
            }
        } else if(dy === 0) {
            for(let vertex of this.vertices) {
                if (vertex[1] === ay && vertex[0] > minX && vertex[0] < maxX) {
                    return true;
                }
            }
        } else {
            for(let vertex of this.vertices) {
                if (vertex[0] <= minX || vertex[0] >= maxX || vertex[1] <= minY || vertex[1] >= maxY) {
                    continue;
                }

                let dxv = vertex[0] - ax;
                let dyv = vertex[1] - ay;

                let factor1 = dx / dxv;
                let factor2 = dy / dyv;

                if(Math.abs(factor1 - factor2) < 0.1) {
                    return true;
                }
            }
        }

        return false;
    }

    render(ctxt) {
        ctxt.save();
        ctxt.scale(RESOLUTION / this.gridSize, RESOLUTION / this.gridSize);
        ctxt.translate(0.5, 0.5);

        ctxt.strokeStyle = "#000";
        ctxt.fillStyle = "#000";
        ctxt.lineWidth = 0.01;

        for(let vertex of this.vertices) {
            ctxt.beginPath();
            ctxt.arc(vertex[0], vertex[1], 0.05, 0, 2 * Math.PI);
            ctxt.fill();
        }

        let edgeIndex = 0;
        for(let i=0;i<this.edgeMatrix.length;i++) {
            for(let j=0;j<this.edgeMatrix[i].length;j++) {
                if(this.edgeMatrix[i][j] === 0) {
                    continue;
                }

                ctxt.strokeStyle = `hsl(${edgeIndex * 10}, 100%, 50%)`;

                let vertex1 = this.vertices[i];
                let vertex2 = this.vertices[j];

                ctxt.beginPath();
                ctxt.moveTo(vertex1[0], vertex1[1]);
                ctxt.lineTo(vertex2[0], vertex2[1]);
                ctxt.stroke();

                edgeIndex++;
            }
        }

        ctxt.restore();
    }
}
