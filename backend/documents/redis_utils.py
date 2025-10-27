import json
import redis.asyncio as redis
# from crdt import serialize
from asgiref.sync import sync_to_async
from .models import Document
from .crdt import remoteDelete, remoteInsert

client = redis.from_url('redis://localhost:6379')

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


async def increment_user_count(docId):
    await client.incr(f'users:{docId}')

async def decrement_user_count(docId):
    count = await client.decr(f'users:{docId}')
    if count <= 0:
        await client.delete(f'users:{docId}')
        return 0
    return count

async def get_user_count(docId):
    count = await client.get(f'users:{docId}')
    return int(count) if count else 0


async def flush_to_db(docId):
    state_bytes = await client.get(f'crdt:{docId}')
    if(state_bytes):
        state_str = state_bytes.decode('utf-8')
        state = json.loads(state_str)
        await sync_to_async(Document.objects.filter(id=docId).update)(
            state=state
        )
    await client.delete(f'crdt:{docId}')


    