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
import data_server.shared.data_type as db_type


class TestPresentationLayer(AsyncHTTPTestCase):
    def get_app(self):
        return main.get_app()

    def _connect_sellar_grouped(self):
        file_path = os.path.join(os.path.dirname(__file__),
                                 'sellar_grouped.db')
        body = {'location': file_path}
        response = self.fetch('/connect', method='POST',
                              body=json.dumps(body))
        return response

    def test_index(self):
        response = self.fetch('/')
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_connect(self):
        response = self._connect_sellar_grouped()
        self.assertEqual(response.code, 200)

    def test_logout(self):
        response = self.fetch('/logout')
        self.assertEqual(response.code, 200)

    def test_case_handler_get(self):
        response = self.fetch('/case')
        if db_type.is_sqlite():
            self.assertEqual(response.code, 400)
        else:
            self.assertEqual(response.code, 200)

    def test_case_handler_post(self):
        response = self.fetch('/case', method='POST', body='{"token": 123}')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertEqual(body['case_id'], -1)

    def test_case_handler_del(self):
        response = self.fetch('/case', method='DELETE')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertEqual(body['status'], 'Failed')

    def test_case_handler_patch(self):
        response = self.fetch('/case', method='PATCH', body='{}')
        body = json.loads(response.body)
        self.assertEqual(response.code, 200)
        self.assertEqual(body['status'], 'Failed')

    def test_get_layout(self):
        self._connect_sellar_grouped()
        response = self.fetch('/case/0/layout')
        self.assertEqual(response.code, 200)
        self.assertIsNotNone(response.body)

    def test_driver_iteration_get(self):
        self._connect_sellar_grouped()
        response = self.fetch('/case/0/driver_iterations')
        self.assertEqual(response.code, 200)


def cleanup():
    pass


if __name__ == "__main__":
    try:
        unittest.main()
    except Exception as e:
        print("Error: " + str(e))
    finally:
        cleanup()
