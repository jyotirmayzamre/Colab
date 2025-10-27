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

def compareIdentifier(id1: Identifier, id2: Identifier) -> int:
    if(id1['digit'] != id2['digit']):
        return id1['digit'] - id2['digit']
    return id1['site_id'] - id2['site_id']

def comparePosition(p1: List[Identifier], p2: List[Identifier]) -> int:
    l1 = len(p1)
    l2 = len(p2)
    for i in range(max(l1, l2)):
        res = compareIdentifier(p1[i], p2[i])
        if(res != 0):
            return res
    
    return l1-l2
    
def binarySearch(arr: List[Char], item: List[Identifier], compare: Callable[[List[Identifier], List[Identifier]], int] = comparePosition):
    def algo(L: int, R: int) -> int:
        if L >= R:
            return L
        else:
            M = (L+R) // 2
            res = compare(item, arr[M]['position'])
            if res < 0:
                return algo(L, M)
            elif res > 0:
                return algo(M+1, R)
            else:
                return M
    return algo(0, len(arr))




def remoteInsert(row: int, inChar: Char, state: List[List[Char]]):
    while len(state) <= row:
        state.append([])

    state[row] = state[row] or []
    index = binarySearch(state[row], inChar['position'])
    state[row].insert(index, inChar)
    return state

def remoteDelete(row: int, delChar: Char, state: List[List[Char]]):
    index = binarySearch(state[row], delChar['position'])
    del state[row][index]
    return state


def getText(state: List[List[Char]]):
    return ''.join(
        ''.join(char['value'] for char in row)
            for row in state
    )

