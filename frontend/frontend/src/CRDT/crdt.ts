import { type Char, type Identifier, LamportClock, generateCharPosition, binarySearch } from "./utils";

class CRDT {
    user: number;
    store: Char[][];
    clock: LamportClock;

    constructor(user: number){
        this.user = user;
        this.store = [];
        this.clock = new LamportClock();
    }

    generateChar(row: number, col: number): Identifier[]{
        const prevIndex: Identifier[] = this.store[row][col-1] ? this.store[row][col-1].position : [];
        const nextIndex: Identifier[] = this.store[row][col] ? this.store[row][col].position : [];

        const newIndex: Identifier[] = generateCharPosition(prevIndex, nextIndex, this.user);
        return newIndex;
    }

    localInsert(value: string, row: number, col: number): Char {
        this.clock.tick();
        this.store[row] = this.store[row] ? this.store[row] : [];
        const newPosition = this.generateChar(row, col);
        const newChar: Char = {position: newPosition, lamport: this.clock.counter, value: value};
        this.store[row].splice(col, 0, newChar);
        return newChar
    }

    localDelete(row: number, col: number): Char {
        this.clock.tick();
        const deletedChar: Char = this.store[row].splice(col, 1)[0];
        return deletedChar;
    }

    remoteInsert(row: number, inChar: Char){
        this.clock.receive(inChar.lamport);
        this.store[row] = this.store[row] ? this.store[row] : [];
        const index = binarySearch(this.store[row], inChar.position);
        this.store[row].splice(index, 0, inChar);
        
    }

    remoteDelete(row: number, delChar: Char){
        this.clock.receive(delChar.lamport);
        const index = binarySearch(this.store[row], delChar.position);
        this.store[row].splice(index, 1);
    }
}



export default CRDT;