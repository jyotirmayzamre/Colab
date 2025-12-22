import json
import redis.asyncio as redis
from asgiref.sync import sync_to_async
from documents.services import DocumentService
from versions.services import VersionService
from .crdt import remoteDelete, remoteInsert

# client: redis.Redis = redis.Redis(host='redis', port=6379, db=0)
client: redis.Redis = redis.Redis(host='localhost', port=6379, db=0)


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
    return int(count)


async def redis_flush_to_db(docId):
    state_bytes = await client.get(f'crdt:{docId}')
    if(state_bytes):
        state_str = state_bytes.decode('utf-8')
        state = json.loads(state_str)
        await sync_to_async(DocumentService.update_document_state)(
            docId=docId,
            state=state
        )
    await client.delete(f'crdt:{docId}')
    await client.delete(f'users:{docId}')


    