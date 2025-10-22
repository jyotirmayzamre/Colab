from django.test import TestCase
from accounts.models import User
from .models import Document, DocumentAccess
import uuid

class DocumentTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123', email='test@test.com')

    
    def test_create_document(self):
        doc = Document.objects.create_document(userId=self.user.id, title='My Doc') # type: ignore

        #Test title + user in authors
        self.assertEqual(doc.title, 'My Doc')
        self.assertIn(self.user, doc.authors.all())

        #Test access level
        access = DocumentAccess.objects.get(document=doc, user=self.user)
        self.assertEqual(access.level, 'owner')


        #Test invalid user
        with self.assertRaises(ValueError):
            Document.objects.create_document(uuid.uuid4(), title='My Doc')

        #Test without title
        doc2 = Document.objects.create_document(userId=self.user.id) # type: ignore
        self.assertEqual(doc2.title, 'Untitled Document')


    def test_delete_document(self):
        doc = Document.objects.create_document(userId=self.user.id, title='My Doc') # type: ignore
        doc_id = doc.id
        Document.objects.delete_document(doc_id)

        #Test invalid document
        with self.assertRaises(ValueError):
            Document.objects.delete_document(uuid.uuid4())

        #Test document existing after deletion
        with self.assertRaises(Document.DoesNotExist):
            Document.objects.get(pk=doc.id)

        #Test document access existing after deletion
        with self.assertRaises(DocumentAccess.DoesNotExist):
            DocumentAccess.objects.get(document_id=doc_id, user_id=self.user.id) # type: ignore

          

    def test_create_access(self):
        doc = Document.objects.create_document(userId=self.user.id, title='My Doc') # type: ignore
        new_user = User.objects.create_user(username='new_user', password='password123')

        access = DocumentAccess.objects.create_access(doc.id, new_user.id, 'viewer') # type: ignore

        #Test access level
        self.assertEqual(access.level, 'viewer')

        #Test user in authors
        self.assertIn(new_user, doc.authors.all())

        #Test invalid doc
        with self.assertRaises(ValueError):
            access = DocumentAccess.objects.create_access(uuid.uuid4(), new_user.id, 'viewer') # type: ignore

        #Test invalid user
        with self.assertRaises(ValueError):
            access = DocumentAccess.objects.create_access(doc.id, uuid.uuid4(), 'viewer')

    
    def test_update_access(self):
        doc = Document.objects.create_document(userId=self.user.id, title='My Doc') # type: ignore

        #Test updating owner
        with self.assertRaises(ValueError):
            DocumentAccess.objects.update_access(doc.id, self.user.id, 'editor') # type: ignore


        new_user = User.objects.create_user(username='new_user', password='password123')
        DocumentAccess.objects.create_access(doc.id, new_user.id, 'view') # type: ignore
        new_access = DocumentAccess.objects.update_access(doc.id, new_user.id, 'editor') # type: ignore

        #Test new access level
        self.assertEqual(new_access.level, 'editor')

        #Test user in authors
        self.assertIn(new_user, doc.authors.all())

        #Test invalid level
        with self.assertRaises(ValueError):
            DocumentAccess.objects.update_access(doc.id, new_user.id, 'xyz') # type: ignore

        #Test access level not existing
        with self.assertRaises(ValueError):
            DocumentAccess.objects.update_access(uuid.uuid4(), uuid.uuid4(), 'editor')

    def test_delete_access(self):
        doc = Document.objects.create_document(userId=self.user.id, title='My Doc') # type: ignore

        #Test invalid doc
        with self.assertRaises(ValueError):
            DocumentAccess.objects.delete_access(uuid.uuid4(), self.user.id) # type: ignore
        
        #Test invalid user
        with self.assertRaises(ValueError):
            DocumentAccess.objects.delete_access(doc.id, self.user.id) # type: ignore
            

        #Test no existing access
        new_user = User.objects.create_user(username='new_user', password='password123')
        with self.assertRaises(ValueError):
            DocumentAccess.objects.delete_access(doc.id, new_user.id) # type: ignore

        
        #Test deleting owner access
        with self.assertRaises(ValueError):
             DocumentAccess.objects.delete_access(doc.id, self.user.id) # type: ignore
            
        #Test correct deletion
        access = DocumentAccess.objects.create_access(doc.id, new_user.id, 'viewer') # type: ignore
        DocumentAccess.objects.delete_access(doc.id, new_user.id) # type: ignore
        self.assertNotIn(new_user, doc.authors.all())
