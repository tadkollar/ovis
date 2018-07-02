import unittest
import sys
import os.path
import json
import smtplib
from bson.json_util import dumps
from minimock import Mock

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), os.path.pardir)))

from data_server.logic import logic
from data_server.shared import collection_names as collections
from test_utils import create_new_db

class TestLogic(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TestLogic, self).__init__(*args, **kwargs)
        self._sellar_grouped_location_py3 = os.path.join(os.path.dirname(__file__),
                                                         'sellar_grouped_py3.db')
        self._sellar_grouped_location_py2 = os.path.join(os.path.dirname(__file__),
                                                         'sellar_grouped_py2.db')
        self._generated_dbs = []

    def create_new_db(self):
        """ create_new_db

        Generate a new SQLite DB and return path.

        Returns:
            Filepath as string
        """
        db_id = len(self._generated_dbs)
        fname = create_new_db(db_id)
        self._generated_dbs.append(fname)
        return fname

    def tearDown(self):
        for p in self._generated_dbs:
            try:
                if os.path.isfile(p):
                    os.remove(p)
            except OSError as e:
                print(e)
        self._generated_dbs = []

    def create_system_iteration(self):
        ret = {}
        ret['iteration_coordinate'] = 'it|1'
        ret['counter'] = 1
        ret['inputs'] = [{'name': 'var1'}]
        ret['outputs'] = [{'name': 'var2'}]
        ret['residuals'] = [{'name': 'var3'}]
        return ret

    def create_driver_iteration(self):
        ret = {}
        ret['iteration_coordinate'] = 'it|2'
        ret['counter'] = 1
        ret['desvars'] = [{'name': 'var1'}]
        ret['objectives'] = [{'name': 'var2'}]
        ret['constraints'] = [{'name': 'var3'}]
        ret['sysincludes'] = [{'name': 'var4'}]
        return ret

    def connect_to_sellar2(self):
        """ connect_to_sellar2 helper method

        Connect to the sellar_grouped_py2 DB

        Returns:
            True if successful, False otherwise
        """
        return logic.connect(self._sellar_grouped_location_py2)

    def connect_to_sellar3(self):
        """ connect_to_sellar3 helper method

        Connect to the sellar_grouped_py3 DB

        Returns:
            True if successful, False otherwise
        """
        return logic.connect(self._sellar_grouped_location_py3)

    def test_connect(self):
        fname = self.create_new_db()
        self.assertTrue(logic.connect(fname))

    def test_connect_fail(self):
        self.assertFalse(logic.connect("Bad filename"))

    def test_connect2(self):
        ret = self.connect_to_sellar2()
        self.assertTrue(ret)

    def test_generic_create_fails(self):
        logic.connect(self.create_new_db())
        self.assertFalse(logic.generic_create(collections.DRIVER_ITERATIONS, {
                        'test': 1}))

    def test_generic_get(self):
        self.connect_to_sellar2()
        logic.generic_create(collections.DRIVER_ITERATIONS, {
                             'test': True}, 'False')
        driv_iter = json.loads(logic.generic_get(collections.DRIVER_ITERATIONS, False))
        self.assertTrue(driv_iter['test'])

    def test_generic_delete_fail(self):
        logic.connect(self.create_new_db())
        self.assertFalse(logic.generic_delete(
            collections.DRIVER_ITERATIONS))

    def test_empty_system_iteration_data(self):
        logic.connect(self.create_new_db())
        self.assertEqual(logic.get_system_iteration_data('test'), '[]')

    def test_empty_get_variables(self):
        pass
        # logic.connect(self.create_new_db())
        # self.assertEqual(logic.get_variables(), '[]')

    def test_empty_get_driver_iteration(self):
        logic.connect(self.create_new_db())
        self.assertEqual(logic.get_driver_iteration_data('test'), '[]')

    def test_empty_get_allvars(self):
        logic.connect(self.create_new_db())
        self.assertEqual(logic.get_all_driver_vars(), '[]')

    def test_get_system_iteration_data(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # logic.generic_create(collections.SYSTEM_ITERATIONS,
        #                      self.create_system_iteration(),
        #                      new_case['case_id'], token, False)
        # sys_data1 = json.loads(
        #     logic.get_system_iteration_data(new_case['case_id'], 'var1'))
        # sys_data2 = json.loads(
        #     logic.get_system_iteration_data(new_case['case_id'], 'var2'))
        # sys_data3 = json.loads(
        #     logic.get_system_iteration_data(new_case['case_id'], 'var3'))
        # got_input = False
        # got_output = False
        # got_resid = False
        # for i in sys_data1:
        #     if i['type'] == 'input':
        #         got_input = True
        # for i in sys_data2:
        #     if i['type'] == 'output':
        #         got_output = True
        # for i in sys_data3:
        #     if i['type'] == 'residual':
        #         got_resid = True

        # self.assertTrue(got_input)
        # self.assertTrue(got_output)
        # self.assertTrue(got_resid)
        # self.assertEqual(sys_data1[0]['name'], 'var1')
        # self.assertEqual(sys_data2[0]['name'], 'var2')
        # self.assertEqual(sys_data3[0]['name'], 'var3')

    def test_get_driver_iteration_data(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      self.create_driver_iteration(),
        #                      new_case['case_id'], token, False)
        # sys_data1 = json.loads(
        #     logic.get_driver_iteration_data(new_case['case_id'], 'var1'))
        # sys_data2 = json.loads(
        #     logic.get_driver_iteration_data(new_case['case_id'], 'var2'))
        # sys_data3 = json.loads(
        #     logic.get_driver_iteration_data(new_case['case_id'], 'var3'))
        # sys_data4 = json.loads(
        #     logic.get_driver_iteration_data(new_case['case_id'], 'var4'))
        # got_desvars = False
        # got_objectives = False
        # got_constraints = False
        # got_sysinclude = False
        # for i in sys_data1:
        #     if i['type'] == 'desvar':
        #         got_desvars = True
        # for i in sys_data2:
        #     if i['type'] == 'objective':
        #         got_objectives = True
        # for i in sys_data3:
        #     if i['type'] == 'constraint':
        #         got_constraints = True
        # for i in sys_data4:
        #     if i['type'] == 'sysinclude':
        #         got_sysinclude = True
        # self.assertTrue(got_desvars)
        # self.assertTrue(got_objectives)
        # self.assertTrue(got_constraints)
        # self.assertTrue(got_sysinclude)
        # self.assertEqual(sys_data1[0]['name'], 'var1')
        # self.assertEqual(sys_data2[0]['name'], 'var2')
        # self.assertEqual(sys_data3[0]['name'], 'var3')
        # self.assertEqual(sys_data4[0]['name'], 'var4')

    def test_get_variables(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # logic.generic_create(collections.SYSTEM_ITERATIONS,
        #                      self.create_system_iteration(),
        #                      new_case['case_id'], token, False)
        # variables = json.loads(logic.get_variables(new_case['case_id']))
        # got_var1 = False
        # got_var2 = False
        # for i in variables:
        #     if i == 'var1':
        #         got_var1 = True
        #     elif i == 'var2':
        #         got_var2 = True
        # self.assertTrue(got_var1)
        # self.assertTrue(got_var2)

    def test_get_allvars(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      self.create_driver_iteration(),
        #                      new_case['case_id'], token, False)
        # variables = json.loads(logic.get_allvars(new_case['case_id']))
        # got_var1 = False
        # got_var2 = False
        # got_var3 = False
        # for i in variables:
        #     if i['name'] == 'var1':
        #         got_var1 = True
        #     elif i['name'] == 'var2':
        #         got_var2 = True
        #     elif i['name'] == 'var3':
        #         got_var3 = True
        # self.assertTrue(got_var1)
        # self.assertTrue(got_var2)
        # self.assertTrue(got_var3)

    def test_get_driver_iteration_based_on_count(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # di1 = self.create_driver_iteration()
        # di2 = self.create_driver_iteration()
        # di2['counter'] = 2
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      di1, new_case['case_id'], token, False)
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      di2, new_case['case_id'], token, False)
        # self.assertEqual(logic.get_driver_iteration_based_on_count(
        #     new_case['case_id'], 'var1', 2), '[]')

    def test_get_driver_iteration_based_on_count2(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # di1 = self.create_driver_iteration()
        # di2 = self.create_driver_iteration()
        # di2['counter'] = 2
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      di1, new_case['case_id'], token, False)
        # logic.generic_create(collections.DRIVER_ITERATIONS,
        #                      di2, new_case['case_id'], token, False)
        # dat = json.loads(logic.get_driver_iteration_based_on_count(
        #     new_case['case_id'], 'var1', 0))
        # self.assertEqual(len(dat), 2)

    def test_update_layout(self):
        pass
        # new_case = self.logic_create_case({'case_name': 'test'}, token)
        # logic.update_layout({'test': True}, new_case['case_id'])
        # layout_data = json.loads(logic.generic_get(
        #     collections.LAYOUTS, new_case['case_id'],
        #     logic.data._GLOBALLY_ACCEPTED_TOKEN, False))
        # self.assertTrue(layout_data['test'])

    def test_create_metadata_empty(self):
        pass
        # new_case = self.logic_create_case({}, token)
        # self.assertTrue(logic.metadata_create({}, new_case['case_id'], token))

    def test_create_metadata_standard(self):
        pass
        # new_case = self.logic_create_case({}, token)

        # metadata = {
        #     'abs2prom': {
        #         'input': {
        #             'px.x': ['x']
        #         },
        #         'output': {
        #             'py.y': ['y']
        #         }
        #     },
        #     'prom2abs': {
        #         'input': {
        #             'x': ['px.x']
        #         },
        #         'output': {
        #             'y': ['py.y']
        #         }
        #     }
        # }

        # self.assertTrue(logic.metadata_create(
        #     metadata, new_case['case_id'], token))

    def test_read_metadata_empty(self):
        logic.connect(self.create_new_db())
        self.assertEqual(logic.metadata_get(), 'null')

    def test_read_metadata_standard(self):
        pass
        # new_case = self.logic_create_case({}, token)

        # metadata = {
        #     'abs2prom': {
        #         'input': {
        #             'px.x': ['x']
        #         },
        #         'output': {
        #             'py.y': ['y']
        #         }
        #     },
        #     'prom2abs': {
        #         'input': {
        #             'x': ['px.x']
        #         },
        #         'output': {
        #             'y': ['py.y']
        #         }
        #     }
        # }

        # logic.metadata_create(metadata, new_case['case_id'], token)
        # ret = logic.metadata_get(new_case['case_id'], token)

        # self.assertEqual(ret['abs2prom']['input']['px.x'][0], 'x')
        # self.assertEqual(ret['abs2prom']['output']['py.y'][0], 'y')
        # self.assertEqual(ret['prom2abs']['input']['x'][0], 'px.x')
        # self.assertEqual(ret['prom2abs']['output']['y'][0], 'py.y')


if __name__ == "__main__":
    try:
        unittest.main()
    except Exception as e:
        print("Error: " + str(e))
