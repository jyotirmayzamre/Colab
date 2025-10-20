from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync

class DocumentConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.doc_id = self.scope.get("url_route", {}).get("kwargs", {}).get("document_id")
        self.group_name = f"document_{self.doc_id}"

        async_to_sync(self.channel_layer.group_add)(
            self.group_name, self.channel_name
        )
        self.accept()


    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name, self.channel_name
        )


    #Received character obj from client
    def receive_json(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.group_name, {'type': 'chat.message', 'content': content, 'sender': self.channel_name}
        )

    #Get remote operation from another user
    def chat_message(self, event):
        if(self.channel_name != event['sender']):
            self.send_json(event['content'])
        
        