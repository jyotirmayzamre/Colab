import json
import redis.asyncio as redis
from redis.asyncio.client import Redis as AsyncRedis
from documents.services import DocumentService
from versions.services import VersionService
from .crdt import CRDT, Char
from typing import TypedDict, List, Dict, cast
import colorsys
from channels.db import database_sync_to_async

# client: redis.Redis = redis.Redis(host='redis', port=6379, db=0)
client: AsyncRedis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

#using in memory cache for now 
documents = {}

'''
Used for cursor labels
'''
    
async def redis_generate_colours(document_id, n=200, saturation=0.65, value=0.95):
    if await client.exists(f'colours:{document_id}'):
        return
    
    colours = set()
    for i in range(n):
        hue = i/n
        r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
        colours.add(f"#{int(r*255):02X}{int(g*255):02X}{int(b*255):02X}")


    await client.sadd(f'colours:{document_id}', *colours)  # type: ignore

    
async def redis_assign_colour(document_id):
    colour = await client.spop(f'colours:{document_id}')  # type: ignore
    return colour


async def redis_add_colour(document_id, colour):
    client.sadd(f'colours:{document_id}', colour)


@database_sync_to_async
def _get_document(document_id):
    return DocumentService.get_document(document_id)


class CRDT_payload(TypedDict):
    state: List[List[Char]]
    version_vector: Dict[int, int]
    deletion_buffer: List[Char]
    title: str

async def redis_load_crdt(document_id) -> CRDT_payload:
    crdt = documents.get(document_id)

    if crdt:
        return {
                "state": crdt.state,
                "version_vector": crdt.version_vector,
                "deletion_buffer": crdt.deletion_buffer,
                "title": crdt.doc_title
                }

    doc = await _get_document(document_id)
    typed_state = cast(List[List[Char]], doc.state)
    typed_title = cast(str, doc.title)
    typed_version_vector = cast(Dict[str, int], doc.version_vector)
    new_crdt = CRDT(typed_state, typed_version_vector, typed_title)
    documents[document_id] = new_crdt
    return {
            "state": new_crdt.state,
            "version_vector": new_crdt.version_vector,
            "deletion_buffer": [],
            "title": new_crdt.doc_title
            }


async def redis_update_crdt(document_id, content):
    crdt = documents.get(document_id)
    if not crdt:
        raise RuntimeError('CRDT does not exist')
    
    for op in content["data"]:
        char = cast(Char, op["char"])
        if op["oper"] == "Insert":
            crdt.remote_insert(char)
        else:
            crdt.deletion_buffer.append(char)

        crdt.process_deletion_buffer()

@database_sync_to_async
def _get_version_state(version_id):
    return VersionService.get_version_state(version_id)

async def redis_restore_version(version_id):
    state, version_vector, document_id = await _get_version_state(version_id)
    typed_id = str(document_id)
    typed_state = cast(List[List[Char]], state)
    typed_version_vector = cast(Dict[str, int], version_vector)
    documents[typed_id].state = typed_state
    documents[typed_id].version_vector = typed_version_vector
    return typed_state, typed_version_vector


async def redis_add_user(document_id, user_id):
    await client.sadd(f'users:{document_id}', user_id) # type: ignore

async def redis_remove_user(document_id, user_id):
    await client.srem(f'users:{document_id}', user_id)  # type: ignore

async def redis_get_user_count(document_id):
    count = await client.scard(f'users:{document_id}')  # type: ignore
    return count


@database_sync_to_async
def _flush_document_state(document_id, state, version_vector):
    DocumentService.update_state(document_id, state, version_vector)

async def redis_flush_to_db(document_id):
    crdt = documents.get(document_id)
    
    if not crdt:
        raise Exception(f'Document: {document_id} does not have CRDT in memory')
    
    await _flush_document_state(document_id, crdt.state, crdt.version_vector)

    documents.pop(document_id, None) 
    await client.delete(
        f'users:{document_id}',
        f'colours:{document_id}',
    ) 


async def redis_set_title(title, document_id):
    documents[document_id].doc_title = title
