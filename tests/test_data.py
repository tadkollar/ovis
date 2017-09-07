import unittest
import sys
import os.path
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
from data_server.data import data
from data_server.shared import collections

token = data.get_new_token('Unit Test', 'UnitTest@fake.com')

def cleanup():
    data.delete_token(token)

class TestData(unittest.TestCase):

    def test_create_token(self):
        self.assertNotEqual(token, -1)

    def test_create_case(self):
        body = {}
        case = data.create_case(body, token)
        self.assertNotEqual(case, -1)

    def test_case_exists1(self):
        body = {}
        case = data.create_case(body, token)
        case_obj = json.loads(data.get_case_with_id(case, token))
        self.assertEqual(case_obj['users'][0], token)

    def test_cleanup(self):
        new_token = data.get_new_token('Unit Test Cleanup', 'blah@fake.com')
        new_case = data.create_case({}, new_token)
        self.assertEqual(data.token_exists(new_token), True)
        self.assertNotEqual(data.get_case_with_id(new_case, new_token), {})
        data.delete_token(new_token)
        self.assertEqual(data.token_exists(new_token), False)
        self.assertEqual(data.get_case_with_id(new_case, new_token), {})

    def test_delete_case(self):
        new_case = data.create_case({}, token)
        self.assertNotEqual(data.get_case_with_id(new_case, token), {})
        data.delete_case_with_id(new_case, token)
        self.assertEqual(data.get_case_with_id(new_case, token), {})

    def test_user_exists(self):
        self.assertTrue(data.user_exists(email='UnitTest@fake.com'))

    def test_user_exists2(self):
        self.assertTrue(data.user_exists(token=token))

    def test_user_does_not_exist(self):
        self.assertFalse(data.user_exists(email='defiitelynotinthedb'))

    def test_user_does_not_exist2(self):
        self.assertFalse(data.user_exists(token='defiitelynotinthedb'))

    def test_user_does_not_exist3(self):
        self.assertFalse(data.user_exists(token=-1))

    def test_generic_create(self):
        new_case = data.create_case({}, token)
        
        

if __name__ == "__main__":
    unittest.main()
    cleanup()