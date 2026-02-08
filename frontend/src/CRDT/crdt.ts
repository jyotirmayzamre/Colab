import { type Char, type Identifier, generateCharPosition, binarySearch } from "./utils";

class CRDT {
    user: number;
    state: Char[][];

    constructor(user: number){
        this.user = user;
        this.state = [];
    }

    
    private generateChar(row: number, col: number): Identifier[]{
        let prevIndex: Identifier[];
        let nextIndex: Identifier[];

        if (col === 0 && row === 0) {
            prevIndex = [];
        } else if (col === 0 && row > 0) {
            prevIndex = this.state[row - 1]?.at(-1)?.position ?? [];
        } else {
            prevIndex = this.state[row][col - 1]?.position ?? [];
        }

        
        const lineLength = this.state[row]?.length ?? 0;

        if (col === lineLength && row < this.state.length - 1) {
            nextIndex = this.state[row + 1]?.at(0)?.position ?? [];
        } else if (col === lineLength && row === this.state.length - 1) {
            nextIndex = [];
        } else {
            nextIndex = this.state[row][col]?.position ?? [];
        }
        
        return generateCharPosition(prevIndex, nextIndex, this.user);
    }

    private handleInsert(row: number, col: number, char: Char): void {
        const lineLength = this.state[row].length;
        this.state[row].splice(col, 0, char)
        if(char.value == '\n' && col < lineLength){  
            const rest = this.state[row].splice(col+1);
            this.state.splice(row+1, 0, rest);  
        }
    }

    localInsert(value: string, row: number, col: number): Char {
        this.state[row] = this.state[row] ? this.state[row] : [];
        const newPosition = this.generateChar(row, col);
        const newChar: Char = {position: newPosition, value: value};
        this.handleInsert(row, col, newChar);
        return newChar
    }

    remoteInsert(row: number, inChar: Char){
        this.state[row] = this.state[row] ? this.state[row] : [];
        const col = binarySearch(this.state[row], inChar.position);
        this.handleInsert(row, col, inChar);
    }


    localDelete(row: number, col: number): Char {
        const deletedChar: Char = this.state[row].splice(col, 1)[0];
        if(deletedChar.value === '\n'){
            this.state[row] = this.state[row].concat(this.state[row+1]);
            this.state.splice(row+1, 1);
        }
        return deletedChar;
    }

    

    remoteDelete(row: number, delChar: Char): void{
        const index = binarySearch(this.state[row], delChar.position);
        this.state[row].splice(index, 1);
        if(delChar.value === '\n'){
            this.state[row] = this.state[row].concat(this.state[row+1]);
            this.state.splice(row+1, 1);
        }
    }
}



export default CRDT;