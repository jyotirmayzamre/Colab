from ..domain.connection_context import ConnectionContext
from ..domain.results import JoinResult, LeaveResult
from ..repositories.crdt_repo import CRDTRepository
from ..repositories.colour_repo import ColourRepository
from ..repositories.presence_repo import PresenceRepository


class DocumentSessionService:
    def __init__(
        self,
        crdt_repo: CRDTRepository,
        colour_repo: ColourRepository,
        presence_repo: PresenceRepository,
    ):
        self._crdt = crdt_repo
        self._colour = colour_repo
        self._presence = presence_repo

    async def join_session(self, ctx: ConnectionContext) -> JoinResult:
        await self._colour.initialise(ctx.document_id)
        colour = await self._colour.assign(ctx.document_id)
        ctx.colour = colour

        snapshot = await self._crdt.get_or_load(ctx.document_id)

        await self._presence.add(ctx.document_id, ctx.channel_name)
        user_count = await self._presence.count(ctx.document_id)

        return JoinResult(
            state=snapshot.state,
            version_vector=snapshot.version_vector,
            deletion_buffer=snapshot.deletion_buffer,
            title=snapshot.doc_title,
            user_count=user_count,
            colour=colour,
        )

    async def leave_session(self, ctx: ConnectionContext) -> LeaveResult:
        await self._colour.release(ctx.document_id, ctx.colour)
        await self._presence.remove(ctx.document_id, ctx.channel_name)
        remaining_count = await self._presence.count(ctx.document_id)
        should_flush = remaining_count == 0

        if should_flush:
            await self._crdt.flush_to_db(ctx.document_id)
            await self._presence.clear(ctx.document_id)
            await self._colour.clear(ctx.document_id)

        return LeaveResult(
            remaining_count=remaining_count,
            username=ctx.username,
            should_flush=should_flush,
        )

    def apply_char_operations(self, ctx: ConnectionContext, content: dict) -> None:
        self._crdt.apply_operations(ctx.document_id, content.get("data", []))

    async def restore_version(self, ctx: ConnectionContext, version_id: str):
        return await self._crdt.restore_version(version_id)

    def rename_document(self, ctx: ConnectionContext, new_title: str) -> None:
        self._crdt.set_title(ctx.document_id, new_title)
