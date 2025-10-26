from channels.generic.websocket import AsyncJsonWebsocketConsumer
import aioredis


class DocumentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope.get("url_route", {}).get("kwargs", {}).get("document_id")
        self.group_name = f"document_{self.doc_id}";

        self.redis = await aioredis.from_url('redis://localhost:6379')

        await self.redis.sadd(f"{self.group_name}:users", self.channel_name)
        current_count = await self.redis.scard(f"{self.group_name}:users")


        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )
        
        await self.accept()

        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'count': current_count}
        )


    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

        await self.redis.srem(f"{self.group_name}:users", self.channel_name)
        remaining_count = await self.redis.scard(f"{self.group_name}:users")

        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'count': remaining_count}
        )
        await self.redis.close()

    #Received character obj from client
    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.group_name, {'type': 'crdt.oper', 'content': content, 'sender': self.channel_name}
        )

    #Get remote operation from another user
    async def crdt_oper(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json(event['content'])
        

    #User joined or left so send correct count
    async def userCount_updated(self, event):
        await self.send_json({'event': 'userCount_updated', 'count': event.get('count')})

    