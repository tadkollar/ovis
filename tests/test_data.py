import unittest
import sys
import os.path
import json
from bson.json_util import dumps
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir)))
from data_server.data import data
from data_server.shared import collections

token = data.get_new_token('Unit Test', 'UnitTestData@fake.com')
data.activate_account(token)

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
        data.activate_account(new_token)
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
        self.assertTrue(data.user_exists(email='UnitTestData@fake.com'))

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
        data.generic_create(collections.DRIVER_ITERATIONS, {'test': True}, new_case, token, False)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token))[0]
        self.assertTrue(driv_iter['test'])

    def test_generic_create_fail(self):
        new_case = data.create_case({}, token)
        result = data.generic_create(collections.DRIVER_ITERATIONS, {'test': True}, new_case, 'badtoken', False)
        self.assertFalse(result)

    def test_generic_delete(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'test': True}, new_case, token, False)
        data.generic_delete(collections.DRIVER_ITERATIONS, new_case, token)
        self.assertEqual(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token), '[]')

    def test_create_replace_iter_coord(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'iteration_coordinate': '123', 'test': True}, new_case, token, False)
        data.generic_create(collections.DRIVER_ITERATIONS, {'iteration_coordinate': '123', 'test': False}, new_case, token, True)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token))[0]
        self.assertFalse(driv_iter['test'])

    def test_create_replace_counter(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'counter': '123', 'test': True}, new_case, token, False)
        data.generic_create(collections.DRIVER_ITERATIONS, {'counter': '123', 'test': False}, new_case, token, True)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token))[0]
        self.assertFalse(driv_iter['test'])

    def test_create_replace_solver_class(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'solver_class': '123', 'test': True}, new_case, token, False)
        data.generic_create(collections.DRIVER_ITERATIONS, {'solver_class': '123', 'test': False}, new_case, token, True)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token))[0]
        self.assertFalse(driv_iter['test'])

    def test_create_replace_none(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'test': True}, new_case, token, False)
        data.generic_create(collections.DRIVER_ITERATIONS, {'test': False}, new_case, token, True)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, token))[0]
        self.assertFalse(driv_iter['test'])

    def test_get_system_iteration_data(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': '123', 'data':1}, new_case, token, False)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': '124', 'data':2}, new_case, token, False)
        sys_iters = dumps(data.get_system_iteration_data(new_case))
        self.assertEqual(len(json.loads(sys_iters)), 2)

    def test_get_driver_iteration_data(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'iteration_coordinate': '123', 'data':1}, new_case, token, False)
        data.generic_create(collections.DRIVER_ITERATIONS, {'iteration_coordinate': '124', 'data':2}, new_case, token, False)
        driv_iters = dumps(data.get_driver_iteration_data(new_case))
        self.assertEqual(len(json.loads(driv_iters)), 2)

    def test_get_many(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':1}, new_case, token, False)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':2}, new_case, token, False)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':3}, new_case, token, False)
        sol_iters = json.loads(data.generic_get(collections.SOLVER_ITERATIONS, new_case, token, get_many=True))
        self.assertEqual(len(sol_iters), 3)

    def test_get_one(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':1}, new_case, token, False)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':2}, new_case, token, False)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':3}, new_case, token, False)
        sol_iters = json.loads(data.generic_get(collections.SOLVER_ITERATIONS, new_case, token, get_many=False))
        self.assertEqual(sol_iters['test'], 1)

    def test_delete_token(self):
        new_token = data.get_new_token('test-delete-token', 'test@fake2.com')
        data.activate_account(new_token)
        new_case = data.create_case({}, new_token)
        data.generic_create(collections.DRIVER_ITERATIONS, {'test': True}, new_case, new_token, False)
        self.assertTrue(data.token_exists(new_token))
        case = json.loads(data.get_case_with_id(new_case, new_token))
        self.assertEqual(case['case_id'], new_case)
        driv_iter = json.loads(data.generic_get(collections.DRIVER_ITERATIONS, new_case, new_token))[0]
        self.assertTrue(driv_iter['test'])
        data.delete_token(new_token)
        self.assertFalse(data.token_exists(new_token))
        self.assertEqual(data.get_case_with_id(new_case, new_token), {})
        self.assertEqual(data.generic_get(collections.DRIVER_ITERATIONS, new_case, new_token), '[]')

    def test_delete_without_access(self):
        new_token = data.get_new_token('temp-token', 'test@fake3.com')
        data.activate_account(new_token)
        new_case = data.create_case({}, token)
        data.generic_create(collections.SOLVER_ITERATIONS, {'test':1}, new_case, token, False)
        self.assertFalse(data.delete_case_with_id(new_case, new_token))
        data.delete_token(new_token)
        data.delete_case_with_id(new_case, token)

    def test_create_case_bad_token(self):
        new_case = data.create_case({}, 'bad token')
        self.assertEqual(new_case, -1)

    def test_get_many_globally_accepted_token(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'test': True}, new_case, token, False)
        sys_iters = json.loads(data.generic_get(collections.SYSTEM_ITERATIONS, new_case, data._GLOBALLY_ACCEPTED_TOKEN))
        self.assertEqual(len(sys_iters), 1)

    def test_get_one_globally_accepted_token(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'test': True}, new_case, token, False)
        sys_iters = json.loads(data.generic_get(collections.SYSTEM_ITERATIONS, new_case, data._GLOBALLY_ACCEPTED_TOKEN, False))
        self.assertTrue(sys_iters['test'])

    def test_update_without_access(self):
        new_case = data.create_case({}, token)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': 123, 'test': True}, new_case, token, False)
        self.assertFalse(data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': 123, 'test': False}, new_case, 'bad token', True))

    def test_update_without_access2(self):
        new_token = data.get_new_token('temp-token', 'test@fake4.com')
        data.activate_account(new_token)
        new_case = data.create_case({}, token)
        data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': 123, 'test': True}, new_case, token, False)
        self.assertFalse(data.generic_create(collections.SYSTEM_ITERATIONS, {'iteration_coordinate': 123, 'test': False}, new_case, new_token, True))
        data.delete_token(new_token)

    def test_get_user(self):
        new_token = data.get_new_token('temp-token', 'test@fake5.com')
        data.activate_account(new_token)
        user = data.get_user(new_token)
        self.assertEqual(user['name'], 'temp-token')
        data.delete_token(new_token)

    def test_get_fake_user(self):
        user = data.get_user('fake token')
        self.assertEqual(user, {})

    def test_user_active(self):
        new_token = data.get_new_token('temp-token', 'test@fake6.com')
        data.activate_account(new_token)
        self.assertTrue(data.user_active(new_token))
        data.delete_token(new_token)

    def test_user_not_active(self):
        new_token = data.get_new_token('temp-token', 'test@fake7.com')
        self.assertFalse(data.user_active(new_token))
        data.delete_token(new_token)

    def test_user_not_active_fake_token(self):
        self.assertFalse(data.user_active('fake token'))

if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        cleanup()
