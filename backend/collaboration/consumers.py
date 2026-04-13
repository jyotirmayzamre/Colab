import logging
import redis.asyncio as redis
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models.connection_context import ConnectionContext
from .repositories.crdt_repository import CRDTRepository
from .repositories.colour_repository import ColourRepository
from .repositories.presence_repository import PresenceRepository
from .services.document_session_service import DocumentSessionService
from .commands.registry import CommandRegistry, UnknownCommandError
from .commands.document_commands import (
    CharCommand,
    VersionRestoreCommand,
    DocumentRenameCommand,
    CursorUpdateCommand,
)
from documents.services import DocumentService
from versions.services import VersionService

logger = logging.getLogger(__name__)


_redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
_crdt_store: dict = {}

_crdt_repo = CRDTRepository(_crdt_store, DocumentService, VersionService)
_colour_repo = ColourRepository(_redis_client)
_presence_repo = PresenceRepository(_redis_client)
_session_service = DocumentSessionService(_crdt_repo, _colour_repo, _presence_repo)


def _build_registry(channel_layer) -> CommandRegistry:
    registry = CommandRegistry()
    registry.register("char", CharCommand(_session_service, channel_layer))
    registry.register("version_restore", VersionRestoreCommand(_session_service, channel_layer))
    registry.register("document_rename", DocumentRenameCommand(_session_service, channel_layer))
    registry.register("cursor_update", CursorUpdateCommand(channel_layer))
    return registry


class DocumentConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.ctx = ConnectionContext.from_scope(self.scope, self.channel_name)
        self.registry = _build_registry(self.channel_layer)

        await self.channel_layer.group_add(self.ctx.group_name, self.channel_name)

        self.ctx.syncing = True
        await self.accept()

        join_result = await _session_service.join_session(self.ctx)
        await self.send_json(join_result.to_load_payload())

        for buffered_op in self.ctx.buffer:
            await self.send_json({"event": "crdt.oper", "content": buffered_op})

        self.ctx.syncing = False
        self.ctx.buffer.clear()

        await self.channel_layer.group_send(
            self.ctx.group_name,
            {
                "type": "userCount.updated",
                "sender": self.channel_name,
                "user_count": join_result.user_count,
            },
        )

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.ctx.group_name, self.channel_name)

        leave_result = await _session_service.leave_session(self.ctx)

        if not leave_result.should_flush:
            await self.channel_layer.group_send(
                self.ctx.group_name,
                {
                    "type": "userCount.updated",
                    "sender": self.channel_name,
                    "user_count": leave_result.remaining_count,
                },
            )
            await self.channel_layer.group_send(
                self.ctx.group_name,
                {
                    "type": "cursor.remove",
                    "username": leave_result.username,
                    "sender": self.channel_name,
                },
            )

    async def receive_json(self, content):
        try:
            await self.registry.dispatch(content["type"], content, self.ctx)
        except UnknownCommandError:
            logger.warning(
                "Unknown message type %r from channel %s",
                content.get("type"),
                self.channel_name,
            )

    async def crdt_oper(self, event):
        if event["sender"] == self.channel_name:
            return

        if self.ctx.syncing:
            self.ctx.buffer.append(event["content"])
        else:
            await self.send_json({"event": "crdt.oper", "content": event["content"]})

    async def version_restore(self, event):
        await self.send_json(
            {
                "event": "version.restore",
                "versionId": event["versionId"],
                "state": event["state"],
                "version_vector": event["version_vector"],
            }
        )

    async def cursor_update(self, event):
        if event["sender"] != self.channel_name:
            await self.send_json(
                {
                    "event": "cursor.update",
                    "username": event["username"],
                    "col": event["col"],
                    "row": event["row"],
                    "colour": event["colour"],
                }
            )

    async def cursor_remove(self, event):
        if event["sender"] != self.channel_name:
            await self.send_json({"event": "cursor.remove", "username": event["username"]})

    async def userCount_updated(self, event):
        if event["sender"] != self.channel_name:
            await self.send_json({"event": "userCount.updated", "user_count": event["user_count"]})

    async def document_rename(self, event):
        await self.send_json({"event": "document.rename", "newTitle": event["newTitle"]})
