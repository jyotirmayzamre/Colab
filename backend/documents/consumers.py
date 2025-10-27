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

        await increment_user_count(self.doc_id)
        current_count = await get_user_count(self.doc_id)

        state = await loadCRDT(self.doc_id)
        text = getText(state)
        
        await self.send_json({'event': 'Load', 'crdt': state, 'text': text})


        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'count': current_count}
        )


    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

        remaining_count = await decrement_user_count(self.doc_id)

        if(remaining_count > 0):

            await self.channel_layer.group_send(
                self.group_name, {'type': 'userCount.updated', 'count': remaining_count}
            )

        else:
            await flush_to_db(self.doc_id)

    #Received character obj from client
    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.group_name, {'type': 'crdt.oper', 'content': content, 'sender': self.channel_name}
        )

        await remote_operation(self.doc_id, content)

    #Get remote operation from another user
    async def crdt_oper(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'crdt.oper', 'content': event['content']})
        

    #User joined or left so send correct count
    async def userCount_updated(self, event):
        await self.send_json({'event': 'userCount_updated', 'count': event.get('count')})

    