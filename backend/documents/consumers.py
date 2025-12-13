from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .redis_utils import *
from .crdt import getText


class DocumentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope.get("url_route", {}).get("kwargs", {}).get("document_id")
        self.group_name = f"document_{self.doc_id}"

        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )

        
        await self.accept()

        #adds user to the group
        await redis_add_user(self.doc_id, self.channel_name)
        current_count = await redis_get_user_count(self.doc_id)

        #loads the crdt from db/redis and sends it to the client
        state = await redis_load_crdt(self.doc_id)
        text = getText(state)
        await self.send_json({'event': 'load.crdt', 'crdt': state, 'text': text})

        #updates the user count in redis
        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'count': current_count}
        )


    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

        #updates the user count, if last user leaves, then crdt in redis is flushed to db
        remaining_count = await redis_get_user_count(self.doc_id)
        await redis_remove_user(self.doc_id, self.channel_name) 
        if(remaining_count > 0):
            await self.channel_layer.group_send(
                self.group_name, {'type': 'userCount.updated', 'count': remaining_count}
            )
        else:
            await redis_flush_to_db(self.doc_id)



    #Received character obj from client
    async def receive_json(self, content):
        #send the received operation to the rest of the group
        await self.channel_layer.group_send(
            self.group_name, {'type': 'crdt.oper', 'content': content, 'sender': self.channel_name}
        )

        #update crdt in redis
        await redis_update_crdt(self.doc_id, content)

        

    #Get remote operation (character or cursor) from another user
    async def crdt_oper(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'crdt.oper', 'content': event['content']})
        

    #User joined or left so send correct count
    async def userCount_updated(self, event):
        await self.send_json({'event': 'userCount.updated', 'count': event.get('count')})


