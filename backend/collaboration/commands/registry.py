from typing import Protocol, Dict
from ..domain.connection_context import ConnectionContext


class Command(Protocol):

    async def execute(self, payload: dict, ctx: ConnectionContext) -> None:
        ...


class UnknownCommandError(Exception):
    pass


class CommandRegistry:
    def __init__(self):
        self._commands: Dict[str, Command] = {}

    def register(self, event_type: str, command: Command) -> None:
        self._commands[event_type] = command

    async def dispatch(self, event_type: str, payload: dict, ctx: ConnectionContext) -> None:
        command = self._commands.get(event_type)
        if command is None:
            raise UnknownCommandError(
                f"No command registered for event type {event_type!r}. "
                f"Registered types: {list(self._commands.keys())}"
            )
        await command.execute(payload, ctx)

    @property
    def registered_types(self) -> list:
        return list(self._commands.keys())
