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


class TestPresentationLayer(AsyncHTTPTestCase):
    def get_app(self):
        return main.get_app()

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

    def test_get_layout(self):
        self._connect_sellar_grouped()
        response = self.fetch('/layout')
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

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
