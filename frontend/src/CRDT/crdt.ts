import { type Char, type Identifier, generateCharPosition, binarySearch } from "./utils";

class CRDT {
    user: number;
    state: Char[][];

    constructor(user: number){
        this.user = user;
        this.state = [];
    }

    private generateChar(row: number, col: number): Identifier[]{
        const prevIndex: Identifier[] = this.state[row][col-1] ? this.state[row][col-1].position : [];
        const nextIndex: Identifier[] = this.state[row][col] ? this.state[row][col].position : [];

        const newIndex: Identifier[] = generateCharPosition(prevIndex, nextIndex, this.user);
        return newIndex;
    }

    localInsert(value: string, row: number, col: number): Char {
        this.state[row] = this.state[row] ? this.state[row] : [];
        const newPosition = this.generateChar(row, col);
        const newChar: Char = {position: newPosition, value: value};
        this.state[row].splice(col, 0, newChar);
        return newChar
    }

    localDelete(row: number, col: number): Char {
        const deletedChar: Char = this.state[row].splice(col, 1)[0];
        return deletedChar;
    }

    remoteInsert(row: number, inChar: Char){
        this.state[row] = this.state[row] ? this.state[row] : [];
        const index = binarySearch(this.state[row], inChar.position);
        this.state[row].splice(index, 0, inChar);
        
    }

    remoteDelete(row: number, delChar: Char){
        const index = binarySearch(this.state[row], delChar.position);
        this.state[row].splice(index, 1);
    }
}



export default CRDT;