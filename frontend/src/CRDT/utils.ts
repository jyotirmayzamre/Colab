export type Identifier = {
    digit: number;
    site_id: number;
}

export type Char = {
    position: Identifier[];
    value: string;
}


export function comparePosition(p1: Identifier[], p2: Identifier[]): number {
    const l1 = p1.length;
    const l2 = p2.length;
    for(let i = 0; i < Math.min(l1, l2); i++){
        const d = p1[i].digit - p2[i].digit;
        if (d !== 0) return d;
        const s = p1[i].site_id - p2[i].site_id;
        if (s !== 0) return s;
    }

    return l1 - l2;
}


/*
Returns number array of an identifier
*/
// function toNum(p: Identifier[]): number[] {
//     const length = p.length;
//     const res = new Array<number>(length);
//     for(let i = 0; i < length; i++){
//         res[i] = p[i].digit;
//     }
   
//     return res
// }


/*
Returns num2 - num1
*/
// function subtract(num1: number[], num2: number[]): number[] {
//     const len1 = num1.length;
//     const len2 = num2.length;
    
//     const maxLen = Math.max(len1, len2);
//     const res = new Array<number>(maxLen);

//     let borrow = 0;

//     for (let i = maxLen - 1; i >= 0; i--){
//         const dig1 = i < len1 ? num1[i] : 0;
//         const dig2 = i < len2 ? num2[i] : 0;

//         let diff = dig2 - dig1 - borrow;
//         if (diff < 0) {
//             diff += 65536;
//             borrow = 1;
//         } else {
//             borrow = 0;
//         }
//         res[i] = diff;
//     }

//     return res;
// }


// function add(num1: number[], num2: number[]): number[] {
//     const len1 = num1.length;
//     const len2 = num2.length;

//     const maxLen = Math.max(len1, len2);
//     const res = new Array<number>(maxLen);

//     let carry = 0;

//     for(let i = maxLen - 1; i >= 0; i--){
//         const dig1 = i < len1 ? num1[i] : 0;
//         const dig2 = i < len2 ? num2[i] : 0;

//         const sum = dig1 + dig2 + carry;
//         res[i] = sum % 65536;
//         carry = Math.floor(sum / 65536);
//     }
//     return res;
// }


// function increment(num: number[], delta: number[]): number[] {
//     const firstNonZeroDigit = delta.findIndex(x => x != 0);
//     const incLen = firstNonZeroDigit + 2;
//     const inc = new Array<number>(incLen).fill(0);
//     inc[incLen - 1] = 1;
//     const check1 = add(num, inc);
//     const check2 = check1[check1.length - 1] === 0 ? add(check1, inc) : check1;
//     return check2;
// }




// function toPosition(n1: number[], before: Identifier[], after: Identifier[], site_id: number): Identifier[]{
//     const n1Len = n1.length;
//     const beforeLen = before.length;
//     const afterLen = after.length;
//     const res = new Array<Identifier>(n1Len);

//     for(let i = 0; i < n1Len; i++){
//         if(i < beforeLen && n1[i] == before[i].digit){
//             res[i] = {digit: n1[i], site_id: before[i].site_id}
//             continue;
//         }

//         if(i < afterLen && n1[i] == after[i].digit){
//             res[i] = {digit: n1[i], site_id: after[i].site_id}
//             continue;
//         }

//         if(i == n1Len - 1){
//             res[i] = {digit: n1[i], site_id: site_id}
//             continue;
//         }
//         res[i] = {digit: n1[i], site_id: site_id};
//     }

//     return res;
// }



// export function generateCharPosition(before: Identifier[], after: Identifier[], site_id: number): Identifier[] {
//     const head1: Identifier = before[0] || {digit: 0, site_id};
//     const head2: Identifier = after[0] || {digit: 65536, site_id};

//     if(head1.digit !== head2.digit){
//         const n1: number[] = toNum(before);
//         const n2: number[] = toNum(after);
//         const delta = subtract(n1, n2);
//         const next = increment(n1, delta);
//         return toPosition(next, before, after, site_id);
//     } else {
//         if (head1.site_id < head2.site_id){
//             const middle = generateCharPosition(before.slice(1), [], site_id);
//             return [head1, ...middle];
//         } else if (head1.site_id === head2.site_id){
//             const middle = generateCharPosition(before.slice(1), after.slice(1), site_id);
//             return [head1, ...middle]
//         } else{
//             throw new Error("Invalid ordering");
//         }
//     }
// }

export function generateCharPosition(before: Identifier[], after: Identifier[], site_id: number): Identifier[] {
    const bLen = before.length;
    const aLen = after.length;

    const bDigit = bLen > 0 ? before[0].digit : 0;
    const aDigit = aLen > 0 ? after[0].digit : 65536;
    const bSite = bLen > 0 ? before[0].site_id : site_id;
    const aSite = aLen > 0 ? after[0].site_id : site_id;

    if(aDigit - bDigit >= 2){
        const boundary = Math.min(bDigit + 10, aDigit - 1);
        const d = bDigit + 1 + Math.floor(Math.random() * (boundary - bDigit));
        return [{ digit: d, site_id }];
    }

    if(aDigit - bDigit === 1){
        const rest = generateCharPosition(before.slice(1), [], site_id);
        return [{ digit: bDigit, site_id: bSite }, ...rest];
    }

    if (bSite < aSite) {
        const rest = generateCharPosition(before.slice(1), [], site_id);
        return [{ digit: bDigit, site_id: bSite }, ...rest];
    }

    if (bSite === aSite) {
        const rest = generateCharPosition(before.slice(1), after.slice(1), site_id);
        return [{ digit: bDigit, site_id: bSite }, ...rest];
    }

    throw new Error("Invalid ordering");
}



export function binarySearch(arr: Char[], item: Identifier[], compare: (p1: Identifier[], p2: Identifier[]) => number = comparePosition){
    let lo = 0;
    let hi = arr.length;
    while (lo < hi){
        const mid = (lo + hi) >>> 1;
        if(compare(item, arr[mid].position) > 0){
            lo = mid + 1;
        } else{
            hi = mid;
        }
    }
    return lo;
}



export function crdtToString(state: Char[][]){
    return state.map(row => row.map(char => char.value).join('')).join('');
}