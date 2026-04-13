from redis.asyncio.client import Redis as AsyncRedis


class PresenceRepository:

    def __init__(self, client: AsyncRedis):
        self._client = client

    def _key(self, document_id: str) -> str:
        return f"users:{document_id}"

    async def add(self, document_id: str, channel_name: str) -> None:
        await self._client.sadd(self._key(document_id), channel_name)  # type: ignore

    async def remove(self, document_id: str, channel_name: str) -> None:
        await self._client.srem(self._key(document_id), channel_name)  # type: ignore

    async def count(self, document_id: str) -> int:
        return await self._client.scard(self._key(document_id))  # type: ignore

    async def clear(self, document_id: str) -> None:
        await self._client.delete(self._key(document_id))
