import math
from typing import List, TypedDict, Dict, Union, Tuple, Optional

class Char(TypedDict):
    position: List[int]
    value: str
    site_id: int
    counter: int

class CRDT:
    def __init__(self, state: List[List[Char]], title: str):
        self.doc_title = title
        self.state: List[List[Char]] = state
        self.version_vector: Dict[int, int] = {}
        self.deletion_buffer: List[Char] = []

    def crdt_to_string(self) -> str:
        return "".join("".join(char['value'] for char in row) for row in self.state)

    def _compare_position(self, p1: List[int], p2: List[int]) -> int:
        l1, l2 = len(p1), len(p2)
        loop_length = min(l1, l2)
        for i in range(0, loop_length, 2):
            d = p1[i] - p2[i]
            if d != 0: return d
            s = p1[i+1] - p2[i+1]
            if s != 0: return s
        return l1 - l2


    def _merge_rows(self, row: int) -> None:
        if row + 1 < len(self.state):
            self.state[row].extend(self.state[row+1])
            self.state.pop(row+1)

    def _split_rows(self, row: int, col: int) -> None:
        tail = self.state[row][col:]
        self.state[row] = self.state[row][:col]
        if len(tail) > 0:
            self.state.insert(row + 1, tail)

    def _handle_insert(self, row: int, col: int, char: Char) -> None:
        if row == len(self.state):
            self.state.append([])

        if char['value'] == '\n':
            self._split_rows(row, col)
            self.state[row].append(char)
            return

        self.state[row].insert(col, char)


    def _remove_empty_lines(self) -> None:
        for r in range(len(self.state) - 1, -1, -1):
            if len(self.state[r]) == 0:
                self.state.pop(r)
        if len(self.state) == 0:
            self.state.append([])


    def _is_empty(self) -> bool:
        return len(self.state) == 1 and len(self.state[0]) == 0

    def _find_insert_row(self, char: Char) -> Tuple[int, int]:
        lo = 0
        num_rows = len(self.state)
        hi = num_rows - 1

        # check first char
        if self._is_empty() or self._compare_position(char['position'], self.state[0][0]['position']) < 0:
            return (0, 0)

        # check last char
        last_char = self.state[hi][-1]
        if self._compare_position(char['position'], last_char['position']) > 0:
            if last_char['value'] == '\n':
                return (num_rows, 0)
            else:
                return (num_rows - 1, len(self.state[hi]))

        # binary search
        while lo+1 < hi:
            mid = math.floor(lo + (hi-lo)//2)
            curr_char = self.state[mid][-1]
            cmp = self._compare_position(char['position'], curr_char['position'])

            if cmp == 0:
                return (mid, len(self.state[mid]) - 1)
            elif cmp < 0:
                hi = mid
            else:
                lo = mid

        min_last_char = self.state[lo][-1]
        if self._compare_position(char['position'], min_last_char['position']) <= 0:
            return (lo, self._find_insert_col(char, lo))
        else:
            return (hi, self._find_insert_col(char, hi))

    def _find_delete_row(self, char: Char):
        lo = 0
        num_rows = len(self.state)
        hi = num_rows - 1

        # check first char
        if self._is_empty() or self._compare_position(char['position'], self.state[0][0]['position']) < 0:
            return False

        # check last char
        last_char = self.state[hi][-1]
        if self._compare_position(char['position'], last_char['position']) > 0:
            return False

        # binary search
        while lo+1 < hi:
            mid = math.floor(lo+(hi-lo)//2)
            curr_char = self.state[mid][-1]
            cmp = self._compare_position(char['position'], curr_char['position'])

            if cmp == 0:
                return (mid, len(self.state[mid]) - 1)
            elif cmp < 0:
                hi = mid
            else:
                lo = mid

        min_last_char = self.state[lo][-1]
        if self._compare_position(char['position'], min_last_char['position']) <= 0:
            return (lo, self._find_delete_col(char, lo))
        else:
            return (hi, self._find_delete_col(char, hi))
        

    def _find_insert_col(self, char: Char, row: int) -> int:
        lo = 0
        num_cols = len(self.state[row])
        hi = num_cols - 1

        if num_cols == 0 or self._compare_position(char['position'], self.state[row][lo]['position']) < 0:
            return lo
        elif self._compare_position(char['position'], self.state[row][hi]['position']) > 0:
            return num_cols

        while lo+1 < hi:
            mid = math.floor(lo+(hi-lo)//2)
            cmp = self._compare_position(char['position'], self.state[row][mid]['position'])

            if cmp == 0:
                return mid
            elif cmp > 0:
                lo = mid
            else:
                hi = mid

        if self._compare_position(char['position'], self.state[row][lo]['position']) == 0:
            return lo
        else:
            return hi 


    def _find_delete_col(self, char: Char, row: int):
        lo = 0
        num_cols = len(self.state[row])
        hi = num_cols - 1

        if num_cols == 0 or self._compare_position(char['position'], self.state[row][lo]['position']) < 0:
            return lo
        elif self._compare_position(char['position'], self.state[row][hi]['position']) > 0:
            return num_cols

        while lo+1 < hi:
            mid = math.floor(lo+(hi-lo)//2)
            cmp = self._compare_position(char['position'], self.state[row][mid]['position'])

            if cmp == 0:
                return mid
            elif cmp > 0:
                lo = mid
            else:
                hi = mid

        if self._compare_position(char['position'], self.state[row][lo]['position']) == 0:
            return lo
        elif self._compare_position(char['position'], self.state[row][hi]['position']) == 0:
            return hi
        else:
            return False

    def _is_operation_already_applied(self, char: Char) -> bool:
        current = self.version_vector.get(char['site_id'], -1)
        return char['counter'] <= current

    def remote_insert(self, in_char: Char) -> Optional[Tuple[int, int]]:
        if self._is_operation_already_applied(in_char):
            return None

        row, col = self._find_insert_row(in_char)
        self._handle_insert(row, col, in_char)
        self.version_vector[in_char['site_id']] = in_char['counter']
        return (row, col)
    

    def remote_delete(self, del_char: Char) -> Optional[Tuple[int, int]]:
        result = self._find_delete_row(del_char)
        if result is False:
            return None

        row, col = result

        if col == False or col == None: return None

        found_char = self.state[row][col]
        if self._compare_position(found_char['position'], del_char['position']) != 0:
            return None

        self.state[row].pop(col)

        if del_char['value'] == '\n':
            self._merge_rows(row)

        self._remove_empty_lines()
        return (row, col)

    def process_deletion_buffer(self) -> None:
        del_changes = []
        for i in range(len(self.deletion_buffer) - 1, -1, -1):
            char = self.deletion_buffer[i]
            if self.version_vector.get(char['site_id'], -1) >= char['counter']:
                result = self.remote_delete(char)
                if result:
                    del_changes.append(result)
                self.deletion_buffer.pop(i)
