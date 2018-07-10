import unittest
import sys
import os.path
import json
import smtplib
from bson.json_util import dumps
from minimock import Mock
from tornado.testing import AsyncHTTPTestCase

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), os.path.pardir)))
import main
from test_utils import create_basic_db


class TestPresentationLayer(AsyncHTTPTestCase):
    def get_app(self):
        return main.get_app()

    def __init__(self, *args, **kwargs):
        super(TestPresentationLayer, self).__init__(*args, **kwargs)
        self._generated_dbs = []

    def tearDown(self):
        for p in self._generated_dbs:
            try:
                if os.path.isfile(p):
                    os.remove(p)
            except OSError as e:
                print(e)
        self._generated_dbs = []

    def create_basic_db(self):
        """ use_basic_db

        Generate a basic SQLite DB with one driver iteration

        Returns:
            filename
        """
        db_id = len(self._generated_dbs)
        fname = create_basic_db(db_id)
        self._generated_dbs.append(fname)
        return fname

    def _connect_sellar_grouped(self):
        file_path = os.path.join(os.path.dirname(__file__),
                                 'sellar_grouped_py2.db')
        body = {'location': file_path}
        response = self.fetch('/connect', method='POST',
                              body=json.dumps(body))
        return response

    def test_connect(self):
        response = self._connect_sellar_grouped()
        self.assertEqual(response.code, 200)

    def test_disconnect(self):
        self._connect_sellar_grouped()
        response = self.fetch('/disconnect')
        self.assertEqual(response.code, 200)
        res_body = json.loads(response.body)
        self.assertEqual(res_body, {'status': 'Success'})

    def test_get_layout(self):
        self._connect_sellar_grouped()
        response = self.fetch('/layout')
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_post_layout(self):
        fname = self.create_basic_db()
        response = self.fetch('/connect', method='POST', body=json.dumps({'location': fname}))
        self.assertEqual(response.code, 200)
        response_layout1 = json.loads(self.fetch('/layout').body)
        self.assertEqual(response_layout1, [])
        succ = self.fetch('/layout', method='POST', body=json.dumps({'test': True}))
        self.assertEqual(succ.code, 200)
        self.assertEqual(json.loads(succ.body), {'status': 'Success'})
        response_layout2 = json.loads(self.fetch('/layout').body)
        self.assertEqual(response_layout2, [{'test': True}])
        self.fetch('/disconnect')

    def test_driver_iteration_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/driver_iterations')
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_driver_iteration_get_var(self):
        self._connect_sellar_grouped()
        response = self.fetch('/driver_iterations/pz.z')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)
        self.assertEqual(len(body), 7)

    def test_driver_iteration_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/driver_iterations',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_driver_iteration_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/driver_iterations', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_driver_metadata_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/driver_metadata')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)
        self.assertEqual(len(body), 1)

    def test_driver_metadata_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/driver_metadata',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_driver_metadata_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/driver_metadata', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_global_iterations_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/global_iterations')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_global_iterations_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/global_iterations',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_global_iterations_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/global_iterations', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_solver_iterations_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/solver_iterations')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_solver_iterations_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/solver_iterations',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_solver_iterations_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/solver_iterations', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_solver_metadata_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/solver_metadata')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_solver_metadata_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/solver_metadata',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_solver_metadata_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/solver_metadata', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_system_iteration_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/system_iterations')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_system_iteration_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/system_iterations',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_system_iteration_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/system_iterations', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_system_metadata_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/system_metadata')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_system_metadata_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/system_metadata',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_system_metadata_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/system_metadata', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_metadata_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/metadata')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_metadata_post(self):
        self._connect_sellar_grouped()
        response = self.fetch('/metadata',
                              method='POST', body='{}')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_metadata_delete(self):
        self._connect_sellar_grouped()
        response = self.fetch(
            '/metadata', method='DELETE')
        self.assertEqual(response.code, 200)
        body = json.loads(response.body)
        self.assertEqual(body['status'], 'Failed')

    def test_get_desvars(self):
        self._connect_sellar_grouped()
        response = self.fetch('/allvars')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(body)


def cleanup():
    pass


if __name__ == "__main__":
    try:
        unittest.main()
    except Exception as e:
        print("Error: " + str(e))
    finally:
        cleanup()
