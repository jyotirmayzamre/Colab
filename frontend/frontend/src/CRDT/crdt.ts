import { Char, Identifier, LamportClock, generateCharPosition, binarySearch } from "./utils";

class CRDT {
    user: string;
    store: Char[];
    clock: LamportClock;

    constructor(user: string){
        this.user = user;
        this.store = [];
        this.clock = new LamportClock();
    }

    generateChar(index: number){
        const prevIndex: Identifier[] = (this.store[index-1] && this.store[index-1].position) || [];
        const nextIndex: Identifier[] = (this.store[index] && this.store[index].position) || [];

        const newIndex: Identifier[] = generateCharPosition(prevIndex, nextIndex, this.user);
        return newIndex;
    }

    localInsert(value: string, index: number){
        const newPosition = this.generateChar(index);
        this.clock.tick();
        const newChar = new Char(newPosition, this.clock.counter, value);
        this.store.splice(index, 0, newChar);
    }

    localDelete(index: number): Char {
        this.clock.tick();
        const deletedChar: Char = this.store.splice(index, 1)[0];
        return deletedChar;
    }

    remoteInsert(inChar: Char){
        this.clock.receive(inChar.lamport);
        const index = binarySearch(this.store, inChar.position);
        if(index){
            this.store.splice(index, 0, inChar);
        } else{
            console.error('No available position for character', inChar);
        }
    }

    remoteDelete(delChar: Char){
        this.clock.receive(delChar.lamport);
        const index = binarySearch(this.store, delChar.position);
        if(index){
            this.store.splice(index, 1);
        } else{
            console.error('This character does not exist', delChar);
        }
    }
}



export default CRDT;