from dataclasses import dataclass

from ..crdt import Char
from typing import List, Dict

@dataclass
class JoinResult:
    state: List[List[Char]]
    version_vector: Dict[str, int]
    deletion_buffer: List[Char]
    title: str
    user_count: int
    colour: str

    def to_payload(self) -> Dict:
        return {
            "event": "load.crdt",
            "state": self.state,
            "version_vector": self.version_vector,
            "deletion_buffer": self.deletion_buffer,
            "title": self.title,
            "user_count": self.user_count,
    }



@dataclass
class LeaveResult:
    remaining_count: int
    username: str
    should_flush: bool  # True when this was the last user
 
 
@dataclass
class VersionRestoreResult:
    version_id: str
    state: List[List[Char]]
    version_vector: Dict[str, int]
