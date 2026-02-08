import json
import redis.asyncio as redis
from redis.asyncio.client import Redis as AsyncRedis
import asyncio
from documents.services import DocumentService
from versions.services import VersionService
from .crdt import remoteDelete, remoteInsert, Char
import colorsys
from channels.db import database_sync_to_async
from typing import List, cast

# client: redis.Redis = redis.Redis(host='redis', port=6379, db=0)
client: AsyncRedis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

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

async def redis_load_crdt(document_id):
    state_json, title = await client.mget(
        f'crdt:{document_id}',
        f'title:{document_id}'
    )
   
    if state_json and title:
        return json.loads(state_json), title
    
    doc = await _get_document(document_id)

    await client.mset({
        f'crdt:{document_id}': json.dumps(doc.state),
        f'title:{document_id}': doc.title
    })
    
    return doc.state, doc.title
    

def _apply_crdt_ops(state: List[List[Char]], operations) -> List[List[Char]]:
    for op in operations:
        if op["oper"] == "Insert":
            state = remoteInsert(op["row"], op["char"], state)
        else:
            state = remoteDelete(op["row"], op["char"], state)
    return state


async def redis_update_crdt(document_id, content): 
    key = f'crdt:{document_id}'

    while True:
        try:
            async with client.pipeline(transaction=True) as pipe:
                await pipe.watch(key)
                
                state_json = await pipe.get(key)
                
                if state_json is None:
                    await pipe.unwatch()
                    return
                
                state = cast(List[List[Char]], json.loads(state_json))
                state = await asyncio.to_thread(
                    _apply_crdt_ops, state, content["data"]
                )
                
                pipe.multi()
                pipe.set(key, json.dumps(state))
                await pipe.execute()
                return 
            
        except redis.WatchError:
            await asyncio.sleep(0)
        

@database_sync_to_async
def _get_version_state(version_id):
    return VersionService.get_version_state(version_id)

async def redis_restore_version(version_id):
    state, document_id = await _get_version_state(version_id)
    await client.set(f'crdt:{document_id}',json.dumps(state))
    return state

async def redis_add_user(document_id, user_id):
    client.sadd(f'users:{document_id}', user_id)

async def redis_remove_user(document_id, user_id):
    client.srem(f'users:{document_id}', user_id) 

async def redis_get_user_count(document_id):
    count = await client.scard(f'users:{document_id}')  # type: ignore
    return count


@database_sync_to_async
def _flush_document_state(document_id, state):
    DocumentService.update_state(document_id, state)

async def redis_flush_to_db(document_id):
    state_json = await client.get(f'crdt:{document_id}')

    if not state_json:
        return
    
    state = json.loads(state_json)

    await _flush_document_state(document_id, state)

    await client.delete(
        f'crdt:{document_id}',
        f'users:{document_id}',
        f'colours:{document_id}',
        f'title:{document_id}'
    )
    


async def redis_set_title(title, document_id):
    await client.set(f'title:{document_id}', title)