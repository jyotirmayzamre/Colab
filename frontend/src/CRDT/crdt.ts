
export type Char = {
  position: number[];
  value: string;
  site_id: number;
  counter: number;
}

export function crdtToString(state: Char[][]){
  return state.map(row => row.map(char => char.value).join('')).join('');
}



class CRDT {
    site_id: number;
    state: Char[][];
    version_vector: Record<number, number>;
    deletion_buffer: Char[];

    constructor(site_id: number){
        this.site_id = site_id;
        this.state = [[]];
        this.version_vector = {};
        this.deletion_buffer = [];
    }


    //Helper methods

    private comparePosition(p1: number[], p2: number[]): number {
      const l1 = p1.length;
      const l2 = p2.length;
      const loopLength = Math.min(l1, l2);
      for(let i = 0; i < loopLength; i+= 2){
        const d = p1[i] - p2[i];
        if (d!==0) return d;
        const s = p1[i+1] - p2[i+1];
        if (s!==0) return s;
      }
      return l1 - l2;
    }

    /*
     Current iterative implementation
      - Using 2^16 as the base
      - If the difference of the first digits is > 2, can insert in between
      - If the difference of the first digits is = 1, go one level deeper with b's first digit
      - If the b's site_id < a's site_id, go one level deeper with b's first digit
      - If the site_id's are the same, go one level deeper in both position objects
    */

    private generateCharPosition(before: number[], after: number[]): number[] {
      const result: number[] = [];
      let i = 0;
      const bLen = before.length;
      let aLen = after.length;
      const EMPTY: number[] = [];

      while(true){
        const bDigit = i < bLen ? before[i] : 0;
        const bSite = i < bLen ? before[i+1] : this.site_id;

        const aDigit = i < aLen ? after[i] : 65536;
        const aSite = i < aLen ? after[i+1] : this.site_id;

        if(aDigit - bDigit >= 2){
          const boundary = Math.min(bDigit + 100, aDigit - 1);
          const d = bDigit + 1 + Math.floor(Math.random() * (boundary - bDigit));
          result.push(d, this.site_id);
          return result;
        }

        if(aDigit - bDigit === 1 || bSite < aSite){
          result.push(bDigit, bSite);
          i += 2;
          after = EMPTY;
          aLen = 0;
          continue;
        }

        if(bSite === aSite){
          result.push(bDigit, bSite);
          i += 2;
          continue;
        }

        throw new Error('Invalid ordering');
      }
    }



    private generateChar(row: number, col: number): number[]{
        let prevPosition: number[];
        let nextPosition: number[];

        /*
          prevPosition is either:
            - Empty (inserting into first row, first col)
            - Last row's last character, which will be a newline (inserting into non-first row, first col)
            - Preceding character (inserting into non-first row, non-first col)

          Assumptions:
            - When inserting into a non-first row, the previous row will always exist, so no need to check existence
            - When inserting into a non-first col, the previous col will always exist, so no need to check existence
        */
        if (col > 0){
          prevPosition = this.state[row][col-1].position;
        } else if (row > 0) {
          prevPosition = this.state[row-1].at(-1).position;
        } else {
          prevPosition = [];
        }


        const numRows = this.state.length;
        const numCols = this.state[row]?.length ?? 0;

        /*
          nextPosition is either:
          - if inserting at the end of the row, then next row's first character (or empty)
          - if end of row and last active row, then empty
          - if inserting after a newline in last active row, then empty
          - otherwise, next character
        */

        if(col == numCols && row < numRows - 1){
          nextPosition = this.state[row+1]?.at(0)?.position ?? [];
        } else if (col == numCols && row === numRows-1){
          nextPosition = []
        } else if (col == 0 && row > numRows-1){
          nextPosition = []
        } else {
          nextPosition = this.state[row][col]?.position ?? [];
        }

        return this.generateCharPosition(prevPosition, nextPosition);
    }


    /*
      Used to handle deletion of newline characters
    */
    private mergeRows(row: number): void {
      if(this.state[row+1]){
        this.state[row] = this.state[row].concat(this.state[row+1]);
        this.state.splice(row+1, 1);
      }
    }


    /*
      Used to handle insertion of newline characters
    */
    private splitRows(row: number, col: number): void {
      const tail = this.state[row].splice(col);
      if(tail.length > 0){
        this.state.splice(row+1, 0, tail);
      }
    }


 
    /*
    - Handle insert method: if inserting newlines, split the line
    */
    private handleInsert(row: number, col: number, char: Char): void {
        if(row === this.state.length) this.state.push([]);

        if(char.value === '\n'){
          this.splitRows(row, col);
          this.state[row].push(char);
          return
        }

        this.state[row].splice(col, 0, char);
        return
    }



    public localInsert(value: string, row: number, col: number): Char {
      if (this.version_vector[this.site_id]) this.version_vector[this.site_id] += 1;
      else this.version_vector[this.site_id] = 1;
      const newPosition = this.generateChar(row, col);

      const newChar: Char = {
        position: newPosition,
        value: value,
        site_id: this.site_id,
        counter: this.version_vector[this.site_id]
      };

      this.handleInsert(row, col, newChar);
      return newChar
    }

    /*
    Used to remove empty lines created by delete operations
    */

    private removeEmptyLines(){
      const numRows = this.state.length;
      for(let row = numRows-1; row >= 0; row--){
        if(this.state[row].length === 0){
          this.state.splice(row, 1);
        }
      }
      if(this.state.length == 0){
        this.state.push([]);
      }
    }



    public localDelete(row: number, col: number): Char {
      const deletedChar: Char = this.state[row].splice(col, 1)[0];
      if(deletedChar.value === '\n'){
        this.mergeRows(row);
      }
      this.removeEmptyLines();
      return deletedChar;
    }


    private isEmpty(){
      return this.state.length == 1 && this.state[0].length == 0;
    }

    /*
    - performs binary search over rows of the CRDT to find which row to insert into/delete from
    */

    private findInsertPos(char: Char): [number, number] {
      let lo = 0;
      let numRows = this.state.length;
      let hi = numRows-1;
 
      //check first character
      if(this.isEmpty()) return [0, 0];
      const firstChar = this.state[0][0]
      if(this.comparePosition(char.position, firstChar.position) <= 0){
        return [0, 0];
      }

      //check last char - handles insert after newline 
      const lastChar = this.state[hi].at(-1);
      if(this.comparePosition(char.position, lastChar.position) > 0){
        return lastChar.value == '\n' ? [numRows, 0] : [numRows-1, this.state[hi].length];

      }

      //bs 
      while(lo+1< hi){
        const mid = Math.floor(lo + (hi-lo)/2);
        const currChar = this.state[mid].at(-1);
        const cmp = this.comparePosition(char.position, currChar.position);

        if(cmp == 0){
          return [mid, this.state[mid].length - 1];
        } else if (cmp < 0){
          hi = mid;
        } else{
          lo = mid;
        }
      }

      const minLastChar = this.state[lo].at(-1);
      let correctRow: number;
      if(this.comparePosition(char.position, minLastChar.position) <= 0){
        correctRow = lo;
      } else {
        correctRow = hi;
      }

      return [correctRow, this.findInsertCol(char, correctRow)];
    }


    private findDeletePos(char: Char): [number, number] | null {
      let lo = 0;
      let numRows = this.state.length;
      let hi = numRows-1;
 
      //check first character
      if(this.isEmpty()) return null;
      const firstChar = this.state[0][0]
      if(this.comparePosition(char.position, firstChar.position) < 0){
        return null;
      }

      //check last char
      const lastChar = this.state[hi].at(-1);
      if(this.comparePosition(char.position, lastChar.position) > 0){
        return null;
      }

      //bs
      while(lo+1<hi){
        const mid = Math.floor(lo + (hi-lo)/2);
        const currChar = this.state[mid].at(-1);
        const cmp = this.comparePosition(char.position, currChar.position);

        if(cmp == 0){
          return [mid, this.state[mid].length-1];
        } else if (cmp < 0){
          hi = mid;
        } else{
          lo = mid;
        }
      }

      const minLastChar = this.state[lo].at(-1);
      let correctRow: number;
      if(this.comparePosition(char.position, minLastChar.position) <= 0){
        correctRow = lo;
      } else {
        correctRow = hi;
      }

      const col: number | null = this.findDeleteCol(char, correctRow);
      if(col === null) return null;
      return [correctRow, col];
    }
 
    private findInsertCol(char: Char, row: number): number {
      let lo = 0;
      const numCols = this.state[row].length;
      let hi = numCols - 1;

      //check against first and last
      if(numCols == 0 || this.comparePosition(char.position, this.state[row][lo].position) < 0){
        return lo
      } else if (this.comparePosition(char.position, this.state[row][hi].position) > 0){
        return numCols;
      }

      while(lo+1< hi){
        const mid = Math.floor(lo + (hi-lo)/2);
        const cmp = this.comparePosition(char.position, this.state[row][mid].position);

        if(cmp == 0){
          return mid;
        } else if (cmp > 0){
          lo = mid;
        } else {
          hi = mid;
        }
      }

      if(this.comparePosition(char.position, this.state[row][lo].position) == 0){
        return lo;
      } else {
        return hi;
      }
    }

    private findDeleteCol(char: Char, row: number): number | null {
      let lo = 0;
      const numCols = this.state[row].length;
      let hi = numCols - 1;

      //check against first and last
      if(numCols == 0 || this.comparePosition(char.position, this.state[row][lo].position) < 0){
        return lo
      } else if (this.comparePosition(char.position, this.state[row][hi].position) > 0){
        return numCols;
      }

      while(lo+1< hi){
        const mid = Math.floor(lo + (hi-lo)/2);
        const cmp = this.comparePosition(char.position, this.state[row][mid].position);

        if(cmp == 0){
          return mid;
        } else if (cmp > 0){
          lo = mid;
        } else {
          hi = mid;
        }
      }

      if(this.comparePosition(char.position, this.state[row][lo].position) == 0){
        return lo;
      } else if (this.comparePosition(char.position, this.state[row][hi].position) == 0){
        return hi;
      } else{
        return null;
      }
    }



    private isOperationAlreadyApplied(char: Char): boolean {
      const current = this.version_vector[char.site_id] ?? -1;
      return char.counter <= current;
    }


    /*
    - Remote inserts use version vectors to keep track of operation number for each peer
    */
    public remoteInsert(inChar: Char): [number, number] | null {
      if(this.isOperationAlreadyApplied(inChar)) return null;
      const [row, col] = this.findInsertPos(inChar); 
      this.handleInsert(row, col, inChar);
      this.version_vector[inChar.site_id] = inChar.counter;
      return [row, col];
    } 


    private remoteDelete(delChar: Char): [number, number] | null { 
      const result = this.findDeletePos(delChar);
      if(result == null) return null;

      const [row, col] = result;
      const foundChar = this.state[row][col];
      if(this.comparePosition(foundChar.position, delChar.position) !== 0){
        return null;
      }

      this.state[row].splice(col, 1);
      if(delChar.value === '\n'){
        this.mergeRows(row);
      }
      this.removeEmptyLines();

      return [row, col];
    }

    public processDeletionBuffer(): [number, number][] {
      const length = this.deletion_buffer.length;
      const delChanges: [number, number][] = [];
      for(let i = length-1; i >= 0; i--){
        let char = this.deletion_buffer[i];
        if(this.version_vector[char.site_id] >= char.counter){
          const result = this.remoteDelete(char);
          if(result !== null){
            delChanges.push(result);
          }
          this.deletion_buffer.splice(i, 1);
        }
      }
      return delChanges;
    }

}



export default CRDT;
