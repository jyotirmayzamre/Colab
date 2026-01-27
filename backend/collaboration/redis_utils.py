import json
import redis.asyncio as redis
from asgiref.sync import sync_to_async
from documents.services import DocumentService
from versions.services import VersionService
from .crdt import remoteDelete, remoteInsert
import colorsys

# client: redis.Redis = redis.Redis(host='redis', port=6379, db=0)
client: redis.Redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

'''
Used for cursor labels
'''
async def redis_generate_colours(document_id, n=200, saturation=0.65, value=0.95):
    set_exists = await client.exists(f'colours:{document_id}')
    if not set_exists:
        colours = set()
        for i in range(n):
            hue = i / n
            r, g, b = colorsys.hsv_to_rgb(hue, saturation, value)
            colours.add(f"#{int(r*255):02X}{int(g*255):02X}{int(b*255):02X}")

        await client.sadd(f'colours:{document_id}', *colours) # type: ignore

async def redis_assign_colour(document_id):
    colour = await client.spop(f'colours:{document_id}') #type: ignore
    return colour


async def redis_add_colour(document_id, colour):
    await client.sadd(f'colours:{document_id}', colour) #type: ignore


async def redis_remove_colours(document_id):
    await client.delete(f'colours:{document_id}')




async def redis_load_crdt(document_id):
    state_json = await client.get(f'crdt:{document_id}')
    title = await client.get(f'title:{document_id}')
    if state_json and title:
        return json.loads(state_json), title
    
    doc = await sync_to_async(DocumentService.get_document)(document_id)
    state = doc.state
    title = doc.title

    await client.set(
        f'crdt:{document_id}',
        json.dumps(state)
    )

    await client.set(
        f'title:{document_id}',
        title
    )

    
    return state, title
    

async def redis_update_crdt(document_id, content):
    state_json = await client.get(f'crdt:{document_id}')
    if state_json is None:
        return
    
    state = json.loads(state_json)
    
    for operation in content['data']:
        if operation['oper'] == 'Insert':
            state = remoteInsert(operation['row'], operation['char'], state)
        else:
            state = remoteDelete(operation['row'], operation['char'], state)

    await client.set(f'crdt:{document_id}', json.dumps(state))


async def redis_restore_version(version_id):
    state, document_id = await sync_to_async(VersionService.get_version_state)(version_id)
    await client.set(
        f'crdt:{document_id}',
        json.dumps(state)
    )
    return state

async def redis_add_user(document_id, user_id):
    await client.sadd(f'users:{document_id}', user_id) #type: ignore

async def redis_remove_user(document_id, user_id):
    await client.srem(f'users:{document_id}', user_id) #type: ignore

async def redis_get_user_count(document_id):
    count = await client.scard(f'users:{document_id}') #type: ignore
    return count


async def redis_flush_to_db(document_id):
    state = await client.get(f'crdt:{document_id}')
    if(state):
        state_decoded = json.loads(state)
        await sync_to_async(DocumentService.update_state)(
            document_id=document_id,
            state=state_decoded
        )
    await client.delete(f'crdt:{document_id}')
    await client.delete(f'users:{document_id}')
    await client.delete(f'colours:{document_id}')


    