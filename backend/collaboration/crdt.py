'''
Implementation for server side CRDT
'''
from typing import TypedDict, List, Callable

class Identifier(TypedDict):
    digit: int
    site_id: int

class Char(TypedDict):
    position: List[Identifier]
    lamport: int
    value: str


def comparePosition(p1: List[Identifier], p2: List[Identifier]) -> int:
    l1 = len(p1)
    l2 = len(p2)
    for i in range(min(l1, l2)):
        d = p1[i]['digit'] - p2[i]['digit']
        if d != 0: return d
        s = p1[i]['site_id'] - p2[i]['site_id']
        if s != 0: return s
       
    return l1-l2
    
def binarySearch(arr: List[Char], item: List[Identifier], compare: Callable[[List[Identifier], List[Identifier]], int] = comparePosition):
    lo = 0
    hi = len(arr)

    while lo < hi:
        mid = (lo + hi) >> 1
        if compare(item, arr[mid]['position']) > 0:
            lo = mid + 1
        else:
            hi = mid
    return lo
    

def remoteInsert(row: int, inChar: Char, state: List[List[Char]]) -> List[List[Char]]:
    while len(state) <= row:
        state.append([])

    col = binarySearch(state[row], inChar['position'])
    line = state[row]
    if inChar['value'] != '\n':
        line.insert(col, inChar)
        return state
    
    tail = line[col:]
    del line[col:]
    line.append(inChar)
    state.insert(row+1, tail)
    return state
    

def remoteDelete(row: int, delChar: Char, state: List[List[Char]]) -> List[List[Char]]:
    if row >= len(state) or row < 0: return state
    col = binarySearch(state[row], delChar['position'])
    
    if col >= len(state[row]): return state
   
    foundChar = state[row][col]
    if comparePosition(foundChar['position'], delChar['position']) != 0:
        return state

    del state[row][col]

    if(delChar['value'] == '\n'):
        next_line = state[row+1]
        state[row].extend(next_line)
        del state[row+1]
        
    return state


def getText(state: List[List[Char]]):
    return ''.join(
        ''.join(char['value'] for char in row)
            for row in state
    )

