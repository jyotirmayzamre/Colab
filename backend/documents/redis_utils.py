import json
import redis.asyncio as redis
# from crdt import serialize
from asgiref.sync import sync_to_async
from .models import Document
from .crdt import remoteDelete, remoteInsert

client: redis.Redis = redis.Redis(host='localhost', port=6379, db=0)

async def loadCRDT(docId):
    state_json = await client.get(f'crdt:{docId}')
    if state_json:
        return json.loads(state_json)
    
    doc = await sync_to_async(Document.objects.get)(id=docId)
    state = doc.state

    await client.set(
        f'crdt:{docId}',
        json.dumps(state)
    )
    return state
    

async def remote_operation(docId, content):
    state_json = await client.get(f'crdt:{docId}')
    if state_json is None:
        return
    
    state = json.loads(state_json)

    if content['oper'] == 'Insert':
        newState = remoteInsert(content['row'], content['char'], state)
    else:
        newState = remoteDelete(content['row'], content['char'], state)

    await client.set(f'crdt:{docId}', json.dumps(newState))

async def add_user(docId, userId):
    await client.sadd(f'users:{docId}', userId) #type: ignore

async def remove_user(docId, userId):
    await client.srem(f'users:{docId}', userId) #type: ignore

async def get_user_count(docId):
    count = await client.scard(f'users:{docId}') #type: ignore
    return int(count)



async def flush_to_db(docId):
    state_bytes = await client.get(f'crdt:{docId}')
    if(state_bytes):
        state_str = state_bytes.decode('utf-8')
        state = json.loads(state_str)
        await sync_to_async(Document.objects.filter(id=docId).update)(
            state=state
        )
    await client.delete(f'crdt:{docId}')


    