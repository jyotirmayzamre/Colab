import json
import redis.asyncio as redis
from asgiref.sync import sync_to_async
from documents.services import DocumentService
from versions.services import VersionService
from .crdt import remoteDelete, remoteInsert
import colorsys

# client: redis.Redis = redis.Redis(host='redis', port=6379, db=0)
client: redis.Redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)


async def redis_generate_colours(docId, n=200, saturation=0.65, value=0.95):
    set_exists = await client.exists(f'colours:{docId}')
    if not set_exists:
        colours = set()
        for i in range(n):
            hue = i / n
            r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
            colours.add(f"#{int(r*255):02X}{int(g*255):02X}{int(b*255):02X}")

        await client.sadd(f'colours:{docId}', *colours) # type: ignore

async def redis_assign_colour(docId):
    colour = await client.spop(f'colours:{docId}') #type: ignore
    return colour


async def redis_add_colour(docId, colour):
    await client.sadd(f'colours:{docId}', colour) #type: ignore


async def redis_remove_colours(docId):
    await client.delete(f'colours:{docId}')

# Loads CRDT from redis, used for users joining on active document
async def redis_load_crdt(docId):
    state_json = await client.get(f'crdt:{docId}')
    if state_json:
        return json.loads(state_json)
    
    #if document just became active, crdt is obtained from document and set in redis
    doc = await sync_to_async(DocumentService.get_document)(docId)
    state = doc.state

    await client.set(
        f'crdt:{docId}',
        json.dumps(state)
    )
    return state
    

async def redis_update_crdt(docId, content):
    state_json = await client.get(f'crdt:{docId}')
    if state_json is None:
        return
    
    state = json.loads(state_json)

    if content['oper'] == 'Insert':
        newState = remoteInsert(content['row'], content['char'], state)
    else:
        newState = remoteDelete(content['row'], content['char'], state)

    await client.set(f'crdt:{docId}', json.dumps(newState))


async def redis_restore_version(versionId):
    state, docId = await sync_to_async(VersionService.get_version_state)(versionId)
    await client.set(
        f'crdt:{docId}',
        json.dumps(state)
    )
    return state

async def redis_add_user(docId, userId):
    await client.sadd(f'users:{docId}', userId) #type: ignore

async def redis_remove_user(docId, userId):
    await client.srem(f'users:{docId}', userId) #type: ignore

async def redis_get_user_count(docId):
    count = await client.scard(f'users:{docId}') #type: ignore
    return count


async def redis_flush_to_db(docId):
    state = await client.get(f'crdt:{docId}')
    if(state):
        state_decoded = json.loads(state)
        await sync_to_async(DocumentService.update_state)(
            docId=docId,
            state=state_decoded
        )
    await client.delete(f'crdt:{docId}')
    await client.delete(f'users:{docId}')


    