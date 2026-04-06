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
        const mid = lo + ((hi-lo) >>> 1);
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
