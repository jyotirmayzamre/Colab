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

    public remoteInsert(inChar: Char): [number, number]{
      const row = this.findRow(inChar);
      if(row >= this.state.length) this.state.push([]);
      const col = binarySearch(this.state[row], inChar.position);
      this.handleInsert(row, col, inChar);
      return [row, col];
    }

    
    private mergeRows(row: number): void {
      this.state[row].push(...this.state[row+1]);
      this.state.splice(row+1, 1);
    }

    private removeEmptyLines(): void {
      const length = this.state.length;
      for(let i = length - 1; i > 0; i--){
        if(this.state[i].length === 0) this.state.splice(i, 1);
      }
      if(this.state.length === 0) this.state.push([]);
    }


    private findRow(char: Char): number {
      let lo = 0;
      let hi = this.state.length-1;

      while(lo + 1 < hi){
        let mid = lo + ((hi-lo) >>> 1);
        let currRow = this.state[mid];
        if(!currRow.length){
          hi = mid;
          continue;
        }
        let lastChar = currRow[currRow.length - 1];
        let result = comparePosition(char.position, lastChar.position);
        if(result === 0) return mid;
        else if(result < 0) hi = mid;
        else lo = mid; 
      }

      const minRow = this.state[lo];
      if(!minRow.length) return hi;
      if(comparePosition(char.position, minRow[minRow.length - 1].position) <= 0){
        return lo;
      } else{
        return hi;
      }
    }

    public localDelete(row: number, col: number): Char {
        const deletedChar: Char = this.state[row].splice(col, 1)[0];
        if(deletedChar.value === '\n' && this.state[row+1]){
          this.mergeRows(row);
        }
        return deletedChar;
    }

    

    public remoteDelete(delChar: Char): [number, number] | null{
      const row = this.findRow(delChar);
      if (row >= this.state.length || row < 0) return null;
      const col = binarySearch(this.state[row], delChar.position);

      //check for whether character actuallly exists
      if (col >= this.state[row].length) return null;
      else {
        const foundChar = this.state[row][col];
        if(comparePosition(foundChar.position, delChar.position) !== 0){
          return null;
        }
      }

      //if deleted char is newline, merge next line with current line
      this.state[row].splice(col, 1);
      if(delChar.value === '\n' && this.state[row+1]){
        this.mergeRows(row);
        this.removeEmptyLines();
      }

      return [row, col];
  }

    
}



export default CRDT;
