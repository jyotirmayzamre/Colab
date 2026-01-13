from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .redis_utils import *
from urllib.parse import parse_qs


class DocumentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.doc_id = self.scope.get("url_route", {}).get("kwargs", {}).get("document_id")
        self.group_name = f"document_{self.doc_id}"

        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        self.username = params.get("username", [None])[0]

        await self.channel_layer.group_add(
            self.group_name, self.channel_name
        )
        await redis_generate_colours(self.doc_id)
        self.colour = await redis_assign_colour(self.doc_id)

        
        await self.accept()

        await redis_add_user(self.doc_id, self.channel_name)
        current_count = await redis_get_user_count(self.doc_id)

        state, title = await redis_load_crdt(self.doc_id)
        await self.send_json({'event': 'load.crdt', 'state': state, 'user_count': current_count, 'title': title})

        await self.channel_layer.group_send(
            self.group_name, {'type': 'userCount.updated', 'sender': self.channel_name, 'user_count': current_count}
        )


    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name, self.channel_name
        )

        await redis_add_colour(self.doc_id, self.colour)

        await redis_remove_user(self.doc_id, self.channel_name)
        remaining_count = await redis_get_user_count(self.doc_id)
         
        if(remaining_count > 0):
            await self.channel_layer.group_send(
                self.group_name, {'type': 'userCount.updated', 'user_count': remaining_count}
            )
        else:
            await redis_remove_colours(self.doc_id)
            await redis_flush_to_db(self.doc_id)



    async def receive_json(self, content):
        if(content['type'] == 'char'):
            await self.channel_layer.group_send(
                self.group_name, {'type': 'crdt.oper', 'content': content, 'sender': self.channel_name}
            )
            await redis_update_crdt(self.doc_id, content)

        elif(content['type'] == 'version_restore'):
            state = await redis_restore_version(content['versionId'])

            await self.channel_layer.group_send(
                self.group_name, {'type': 'version.restore', 'versionId': content['versionId'], 'state': state}
            )

        elif(content['type'] == 'document_rename'):
            await self.channel_layer.group_send(
                self.group_name, {'type': 'document.rename', 'newTitle': content['newTitle']}
            )

        elif(content['type'] == 'cursor_update'):
            await self.channel_layer.group_send(
                self.group_name, {'type': 'cursor.update', 'sender': self.channel_name, 
                                  'username': self.username, 'col': content['col'], 'row': content['row'],
                                  'colour': self.colour}
            )

        else:
            pass



    async def version_restore(self, event):
        await self.send_json({'event': 'version.restore', 'versionId': event['versionId'], 'state': event['state']})

        
    #Get remote operation (character or cursor) from another user
    async def crdt_oper(self, event):
        if(self.channel_name != event['sender']):
            await self.send_json({'event': 'crdt.oper', 'content': event['content']})
        

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
