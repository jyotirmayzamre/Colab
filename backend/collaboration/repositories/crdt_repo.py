from typing import Dict, List, cast
from channels.db import database_sync_to_async
from ..crdt import CRDT, Char
from ..domain.results import VersionRestoreResult



class CRDTRepository:

    def __init__(self, store: dict, document_service, version_service):
        self._store = store
        self._document_service = document_service
        self._version_service = version_service


    async def get_or_load(self, document_id: str) -> CRDT:
        crdt = self._store.get(document_id)
        if crdt:
            return crdt

        doc = await self._fetch_document(document_id)
        typed_state = cast(List[List[Char]], doc.state)
        typed_version_vector = cast(Dict[str, int], doc.version_vector)
        typed_title = cast(str, doc.title)

        new_crdt = CRDT(typed_state, typed_version_vector, typed_title)
        self._store[document_id] = new_crdt
        return new_crdt


    def apply_operations(self, document_id: str, operations: list) -> None:
        crdt = self._store.get(document_id)
        if not crdt:
            raise RuntimeError(f"CRDT for document {document_id!r} is not loaded.")

        for op in operations:
            char = cast(Char, op["char"])
            if op["oper"] == "Insert":
                crdt.remote_insert(char)
            else:
                crdt.deletion_buffer.append(char)

        crdt.process_deletion_buffer()


    async def restore_version(self, version_id: str) -> VersionRestoreResult:
        state, version_vector, document_id = await self._fetch_version(version_id)
        typed_id = str(document_id)
        typed_state = cast(List[List[Char]], state)
        typed_version_vector = cast(Dict[str, int], version_vector)

        crdt = self._store.get(typed_id)
        if not crdt:
            raise RuntimeError(f"Cannot restore version for unloaded document {typed_id!r}.")

        crdt.state = typed_state
        crdt.version_vector = typed_version_vector

        return VersionRestoreResult(
            version_id=version_id,
            state=typed_state,
            version_vector=typed_version_vector,
        )


    def set_title(self, document_id: str, title: str) -> None:
        crdt = self._store.get(document_id)
        if not crdt:
            raise RuntimeError(f"CRDT for document {document_id!r} is not loaded.")
        crdt.doc_title = title


    async def flush_to_db(self, document_id: str) -> None:
        crdt = self._store.get(document_id)
        if not crdt:
            raise RuntimeError(f"Document {document_id!r} has no CRDT in memory.")

        await self._persist_document(document_id, crdt.state, crdt.version_vector)
        self._store.pop(document_id, None)



    @database_sync_to_async
    def _fetch_document(self, document_id: str):
        return self._document_service.get_document(document_id)

    @database_sync_to_async
    def _fetch_version(self, version_id: str):
        return self._version_service.get_version_state(version_id)

    @database_sync_to_async
    def _persist_document(self, document_id: str, state, version_vector):
        return self._document_service.update_state(document_id, state, version_vector)
