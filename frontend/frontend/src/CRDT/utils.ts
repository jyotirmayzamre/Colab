export class Identifier {
    digit: number;
    user: string;

    constructor(digit: number, user: string){
        this.digit = digit;
        this.user = user;
    }
}

export class Char {
    position: Identifier[];
    lamport: number;
    value: string;

    constructor(position: Identifier[], lamport: number, value: string){
        this.position = position;
        this.lamport = lamport;
        this.value = value;
    }
}

export class LamportClock {
    counter: number;

    constructor(){
        this.counter = 0;
    }

    tick(): void {
        this.counter += 1;
    }

    receive(t: number): void {
        this.counter = Math.max(this.counter, t) + 1;
    }
}




function compareIdentifier(id1: Identifier, id2: Identifier): number {
    if(id1.digit != id2.digit) return id1.digit - id2.digit;
    return id1.user.localeCompare(id2.user);
}



function comparePosition(p1: Identifier[], p2: Identifier[]): number {
    const l1 = p1.length;
    const l2 = p2.length;
    for(let i = 0; i < Math.min(l1, l2); i++){
        const res = compareIdentifier(p1[i], p2[i]);
        if (res !== 0) return res;
    }

    return l1 - l2;
}


/*
Returns number array of an identifier
*/
function toNum(p: Identifier[]): number[] {
    const res: number[] = []
    const length = p.length;

    for (let i = 0; i < length; i++){
        res.push(p[i].digit)
    }
    return res
}


/*
Returns num2 - num1
*/
function subtract(num1: number[], num2: number[]): number[] {
     const len1 = num1.length;
    const len2 = num2.length;
    const res: number[] = [];

    const maxLen = Math.max(len1, len2);

    const num1Padded = num1.concat(Array(maxLen - len1).fill(0));
    const num2Padded = num2.concat(Array(maxLen - len2).fill(0));

    let borrow = 0;

    for (let i = maxLen - 1; i >= 0; i--){
        const dig1 = num1Padded[i];
        const dig2 = num2Padded[i];

        let diff = dig2 - dig1 - borrow;
        if (diff < 0) {
            diff += 10;
            borrow = 1;
        } else {
            borrow = 0;
        }
        res.push(diff);
    }

    return res.reverse();
}


/*
Works with the assumption that all results will be less than 1 (because adding diff)
*/
function add(num1: number[], num2: number[]): number[] {
    const len1 = num1.length;
    const len2 = num2.length;
    const res: number[] = [];

    const maxLen = Math.max(len1, len2);

    const num1Padded = num1.concat(Array(maxLen - len1).fill(0));
    const num2Padded = num2.concat(Array(maxLen - len2).fill(0));

    let carry = 0;

    for(let i = maxLen - 1; i >= 0; i--){
        const dig1 = num1Padded[i];
        const dig2 = num2Padded[i];

        const sum = dig1 + dig2 + carry;
        res.push(sum % 10);
        carry = Math.floor(sum / 10);
    }
    return res.reverse();
}




function increment(num: number[], delta: number[]): number[] {
    const firstNonZeroDigit = delta.findIndex(x => x != 0);
    const inc = delta.slice(0, firstNonZeroDigit).concat([0, 1]);
    console.log(inc);
    const check1 = add(num, inc);
    const check2 = check1[check1.length - 1] === 0 ? add(check1, inc) : check1;
    return check2;
}




function toPosition(n1: number[], before: Identifier[], after: Identifier[], user_id: string): Identifier[]{
    const res: Identifier[] = [];
    const n1Len = n1.length;
    const beforeLen = before.length;
    const afterLen = after.length;

    for(let i = 0; i < n1Len; i++){
        if(i < beforeLen && n1[i] == before[i].digit){
            res.push(new Identifier(n1[i], before[i].user))
            continue;
        }

        if(i < afterLen && n1[i] == after[i].digit){
            res.push(new Identifier(n1[i], after[i].user))
        }

        if(i == n1Len - 1){
            res.push(new Identifier(n1[i], user_id))
        }
    }

    return res;
}



export function generateCharPosition(before: Identifier[], after: Identifier[], user_id: string): Identifier[] {
    const head1: Identifier = before[0] || new Identifier(0, user_id);
    const head2: Identifier = after[0] || new Identifier(1, user_id);

    if(head1.digit !== head2.digit){
        const n1: number[] = toNum(before);
        const n2: number[] = toNum(after);
        const delta = subtract(n1, n2);
        const next = increment(n1, delta);
        return toPosition(next, before, after, user_id);
    } else {
        if (head1.user < head2.user){
            const middle = generateCharPosition(before.slice(1), [], user_id);
            return middle.splice(0, 0, head1);
        } else if (head1.user === head2.user){
            const middle = generateCharPosition(before.slice(1), after.slice(1), user_id);
            return middle.splice(0, 0, head1);
        } else{
            throw new Error("Invalid ordering");
        }
    }
}

export function binarySearch(arr: Char[], item: Identifier[], compare: (p1: Identifier[], p2: Identifier[]) => number = comparePosition){
    function algo(L: number, R: number){
        if (L >= R){
            return L;
        } else{
            const M = Math.floor((L + R) / 2);
            const res = compare(item, arr[M].position);
            if (res < 0){
                return algo(L, M)
            } else if (res > 0){
                return algo(M+1, R);
            } else{
                return M;
            }
        }
    }
    return algo(0, arr.length);
}
