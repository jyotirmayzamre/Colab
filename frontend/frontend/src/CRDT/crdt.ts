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

    localInsert(value: string, row: number, col: number): void {
        this.clock.tick();
        this.store[row] = this.store[row] ? this.store[row] : [];
        const newPosition = this.generateChar(row, col);
        const newChar: Char = {position: newPosition, lamport: this.clock.counter, value: value};
        this.store[row].splice(col, 0, newChar);
    }

    localDelete(row: number, col: number): Char {
        this.clock.tick();
        const deletedChar: Char = this.store[row].splice(col, 1)[0];
        return deletedChar;
    }

    // remoteInsert(inChar: Char){
    //     this.clock.receive(inChar.lamport);
    //     const index = binarySearch(this.store, inChar.position);
    //     if(index){
    //         this.store.splice(index, 0, inChar);
    //     } else{
    //         console.error('No available position for character', inChar);
    //     }
    // }

    // remoteDelete(delChar: Char){
    //     this.clock.receive(delChar.lamport);
    //     const index = binarySearch(this.store, delChar.position);
    //     if(index){
    //         this.store.splice(index, 1);
    //     } else{
    //         console.error('This character does not exist', delChar);
    //     }
    // }
}



export default CRDT;