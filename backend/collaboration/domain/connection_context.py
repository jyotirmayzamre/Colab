from dataclasses import dataclass, field
from urllib.parse import parse_qs


@dataclass
class ConnectionContext:
    document_id: str
    channel_name: str
    username: str
    group_name: str
    colour: str = ""
    syncing: bool = False
    buffer: list = field(default_factory=list)


    @classmethod
    def from_scope(cls, scope: dict, channel_name: str) -> "ConnectionContext":
        document_id = scope.get(
                "url_route", {}).get(
                "kwargs", {}).get(
                "document_id", "")

        query_string = scope["query_string"].decode()
        params = parse_qs(query_string)
        username = params.get("username", [None])[0]
        return cls(
                document_id=document_id,
                channel_name=channel_name,
                username=username,
                group_name=f"document_{document_id}",
            )
