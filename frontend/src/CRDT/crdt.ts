import { type Char, type Identifier, comparePosition, generateCharPosition, binarySearch } from "./utils";

class CRDT {
    user: number;
    state: Char[][];

    constructor(user: number){
        this.user = user;
        this.state = [[]];
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
        const line = this.state[row];

        if(char.value !== '\n'){
            line.splice(col, 0, char);
            return;
        }

        const tail = line.splice(col);
        line.push(char);
        this.state.splice(row+1, 0, tail);
        
        return;
    }

    public localInsert(value: string, row: number, col: number): Char {
        while (this.state.length <= row) {
            this.state.push([]);
        }
        const newPosition = this.generateChar(row, col);
        const newChar: Char = {position: newPosition, value: value};
        this.handleInsert(row, col, newChar);
        return newChar
    }

    public remoteInsert(row: number, inChar: Char){
        while (this.state.length <= row) {
            this.state.push([]);
        }
        const col = binarySearch(this.state[row], inChar.position);
        this.handleInsert(row, col, inChar);
    }


    public localDelete(row: number, col: number): Char {
        const deletedChar: Char = this.state[row].splice(col, 1)[0];
        if(deletedChar.value === '\n'){
            const nextLine = this.state[row+1];
            const length = nextLine.length;
            for(let i = 0; i < length; i++){
                this.state[row].push(nextLine[i])
            }
            this.state.splice(row+1, 1);
        }
        return deletedChar;
    }

    

    public remoteDelete(row: number, delChar: Char): void{
        if (row >= this.state.length || row < 0) return;
        const col = binarySearch(this.state[row], delChar.position);

        if (col >= this.state[row].length) return;
        else {
            const foundChar = this.state[row][col];
            if(comparePosition(foundChar.position, delChar.position) !== 0){
                return;
            }
        }

        this.state[row].splice(col, 1);
        if(delChar.value === '\n'){
            const nextLine = this.state[row+1];
            const length = nextLine.length;
            for(let i = 0; i < length; i++){
                this.state[row].push(nextLine[i])
            }
            this.state.splice(row+1, 1);
        }
    }
}



export default CRDT;