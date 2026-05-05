import colorsys
from redis.asyncio.client import Redis as AsyncRedis


class ColourRepository:

    def __init__(
        self,
        client: AsyncRedis,
        n: int = 200,
        saturation: float = 0.65,
        value: float = 0.95,
    ):
        self._client = client
        self._n = n
        self._saturation = saturation
        self._value = value

    def _key(self, document_id: str) -> str:
        return f"colours:{document_id}"

    def _generate_colours(self) -> set:
        colours = set()
        for i in range(self._n):
            hue = i / self._n
            r, g, b = colorsys.hsv_to_rgb(hue, self._saturation, self._value)
            colours.add(f"#{int(r*255):02X}{int(g*255):02X}{int(b*255):02X}")
        return colours

    async def initialise(self, document_id: str) -> None:
        key = self._key(document_id)
        if await self._client.exists(key):
            return
        colours = self._generate_colours()
        await self._client.sadd(key, *colours)  # type: ignore

    async def assign(self, document_id: str) -> str:
        colour = await self._client.spop(self._key(document_id))  # type: ignore
        if type(colour) is str:
            return colour
        return "#FFFFFF"

    async def release(self, document_id: str, colour: str) -> None:
        await self._client.sadd(self._key(document_id), colour)  # type: ignore

    async def clear(self, document_id: str) -> None:
        await self._client.delete(self._key(document_id))
