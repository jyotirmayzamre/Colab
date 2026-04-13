from .domain.connection_context import ConnectionContext
from .services.document_session_service import DocumentSessionService


class CharCommand:

    def __init__(self, service: DocumentSessionService, channel_layer):
        self._service = service
        self._channel_layer = channel_layer

    async def execute(self, payload: dict, ctx: ConnectionContext) -> None:
        self._service.apply_char_operations(ctx, payload)

        await self._channel_layer.group_send(
            ctx.group_name,
            {
                "type": "crdt.oper",
                "content": payload,
                "sender": ctx.channel_name,
            },
        )


class VersionRestoreCommand:

    def __init__(self, service: DocumentSessionService, channel_layer):
        self._service = service
        self._channel_layer = channel_layer

    async def execute(self, payload: dict, ctx: ConnectionContext) -> None:
        version_id = payload["versionId"]
        result = await self._service.restore_version(ctx, version_id)

        await self._channel_layer.group_send(
            ctx.group_name,
            {
                "type": "version.restore",
                "versionId": result.version_id,
                "state": result.state,
                "version_vector": result.version_vector,
            },
        )


class DocumentRenameCommand:
    def __init__(self, service: DocumentSessionService, channel_layer):
        self._service = service
        self._channel_layer = channel_layer

    async def execute(self, payload: dict, ctx: ConnectionContext) -> None:
        new_title = payload["newTitle"]
        self._service.rename_document(ctx, new_title)

        await self._channel_layer.group_send(
            ctx.group_name,
            {"type": "document.rename", "newTitle": new_title},
        )


class CursorUpdateCommand:

    def __init__(self, channel_layer):
        self._channel_layer = channel_layer

    async def execute(self, payload: dict, ctx: ConnectionContext) -> None:
        await self._channel_layer.group_send(
            ctx.group_name,
            {
                "type": "cursor.update",
                "sender": ctx.channel_name,
                "username": ctx.username,
                "col": payload["col"],
                "row": payload["row"],
                "colour": ctx.colour,
            },
        )
