from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .redis_utils import *
from urllib.parse import parse_qs
import asyncio


class DocumentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.document_id = self.scope.get("url_route", {}).get("kwargs", {}).get("document_id")
        self.group_name = f"document_{self.document_id}"

        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        self.username = params.get("username", [None])[0]

        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )
        await redis_generate_colours(self.document_id)
        self.colour = await redis_assign_colour(self.document_id)

        
        await self.accept()

        await redis_add_user(self.document_id, self.channel_name)
        current_count = await redis_get_user_count(self.document_id)

        state, title = await redis_load_crdt(self.document_id)
        await self.send_json({'event': 'load.crdt', 'state': state, 'user_count': current_count, 'title': title})

        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'sender': self.channel_name, 'user_count': current_count}
        )


    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

        await redis_add_colour(self.document_id, self.colour)

        await redis_remove_user(self.document_id, self.channel_name)
        remaining_count = await redis_get_user_count(self.document_id)
         
        if(remaining_count > 0):
            
            await self.channel_layer.group_send(
                self.group_name, {'type': 'userCount.updated', 'sender': self.channel_name, 'user_count': remaining_count}
            )

            await self.channel_layer.group_send(
                self.group_name, {'type': 'cursor.remove', 'username': self.username, 'sender': self.channel_name}
            )
        else:
            await redis_flush_to_db(self.document_id)



    async def receive_json(self, content):
        match content['type']:
            case 'char':
                await self.channel_layer.group_send(
                    self.group_name, {'type': 'crdt.oper', 'content': content, 'sender': self.channel_name}
                )
                await redis_update_crdt(self.document_id, content)
                
            case 'version_restore':
                state = await redis_restore_version(content['versionId'])
                await self.channel_layer.group_send(
                    self.group_name, {'type': 'version.restore', 'versionId': content['versionId'], 'state': state}
                )

            case 'document_rename':
                await redis_set_title(content['newTitle'], self.document_id)
                await self.channel_layer.group_send(
                    self.group_name, {'type': 'document.rename', 'newTitle': content['newTitle']}
                )

            case 'cursor_update':
                await self.channel_layer.group_send(
                self.group_name, {
                    'type': 'cursor.update', 'sender': self.channel_name, 
                    'username': self.username, 'col': content['col'], 'row': content['row'],
                    'colour': self.colour
                    })
                
            case _:
                pass
                


    async def version_restore(self, event):
        await self.send_json({'event': 'version.restore', 'versionId': event['versionId'], 'state': event['state']})

        
    #Get remote operation (character or cursor) from another user
    async def crdt_oper(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'crdt.oper', 'content': event['content']})
    
    async def cursor_remove(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'cursor.remove', 'username': event['username']})

    #User joined or left so send correct count
    async def userCount_updated(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'userCount.updated', 'user_count': event['user_count']})


    async def document_rename(self, event):
        await self.send_json({'event': 'document.rename', 'newTitle': event['newTitle']})

    async def cursor_update(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'cursor.update', 
                                'username': event['username'], 
                                'col': event['col'],
                                'row': event['row'],
                                'colour': event['colour']
                                  })
