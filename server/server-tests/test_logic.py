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
from test_utils import create_basic_db, create_new_db


class TestLogic(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TestLogic, self).__init__(*args, **kwargs)
        self._sellar_grouped_location_py3 = os.path.join(os.path.dirname(__file__),
                                                         'sellar_grouped_py3.db')
        self._sellar_grouped_location_py2 = os.path.join(os.path.dirname(__file__),
                                                         'sellar_grouped_py2.db')
        self._generated_dbs = []

    def tearDown(self):
        logic.disconnect()
        for p in self._generated_dbs:
            try:
                if os.path.isfile(p):
                    os.remove(p)
            except OSError as e:
                print(e)
        self._generated_dbs = []

    def connect_basic_db(self):
        """ use_basic_db

        Generate a basic SQLite DB with one driver iteration

        Returns:
            True if connection successful, False otherwise
        """
        db_id = len(self._generated_dbs)
        fname = create_basic_db(db_id)
        self._generated_dbs.append(fname)
        return logic.connect(fname)

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
        conn = self.connect_basic_db()
        self.assertTrue(conn)

    def test_connect_fail(self):
        self.assertFalse(logic.connect("Bad filename"))

    def test_connect2(self):
        conn = self.connect_to_sellar2()
        self.assertTrue(conn)

    def test_disconnect_no_connection(self):
        self.assertIsNone(logic._data.connection)
        logic.disconnect()
        self.assertIsNone(logic._data.connection)

    def test_disconnect_sellar(self):
        self.assertIsNone(logic._data.connection)
        self.connect_to_sellar2()
        self.assertIsNotNone(logic._data.connection)
        logic.disconnect()
        self.assertIsNone(logic._data.connection)

    def test_empty_get_all_driver_vars(self):
        self.assertEqual(logic.get_all_driver_vars(), '[]')

    def test_read_metadata_empty(self):
        self.assertEqual(logic.metadata_get(), '{}')

    def test_get_all_driver_vars_sellar(self):
        self.connect_to_sellar2()
        vs = json.loads(logic.get_all_driver_vars())
        self.assertEqual(len(vs), 18)
        expected_vars = ['pz.z', 'px.x', 'obj_cmp.obj', 'con_cmp1.con1', 'con_cmp2.con2',
                         'mda.d2.y2', 'mda.d1.y1', 'mda.d2.y1', 'con_cmp2.y2', 'mda.d1.x',
                         'mda.d1.z', 'obj_cmp.x', 'obj_cmp.z', 'obj_cmp.y1', 'obj_cmp.y2',
                         'mda.d2.z', 'con_cmp1.y1', 'mda.d1.y2']

        for v in vs:
            name = v['name']
            self.assertTrue(name in expected_vars)
            expected_vars.remove(name)

        self.assertEqual(len(expected_vars), 0)

    def test_get_layout_empty(self):
        self.assertEqual(logic.generic_get(collections.LAYOUTS), '[]')

    def test_get_layout_basic(self):
        self.connect_basic_db()
        self.assertEqual(logic.generic_get(collections.LAYOUTS), '[]')

    def test_get_layout_sellar(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.generic_get(collections.LAYOUTS))[0]
        self.assertTrue('layout' in ret)

    def test_empty_update_layout(self):
        self.assertEqual(logic.generic_get(collections.LAYOUTS), '[]')
        self.assertFalse(logic.update_layout({'test': 1}))

    def test_update_layout_basic(self):
        self.connect_basic_db()
        self.assertEqual(logic.generic_get(collections.LAYOUTS), '[]')
        new_layout = {'test': True}
        self.assertTrue(logic.update_layout(new_layout))
        ret_layout = json.loads(logic.generic_get(collections.LAYOUTS))[0]
        self.assertTrue(ret_layout['test'])

    def test_bad_update_layout(self):
        self.assertFalse(logic.update_layout({'test': 1}))

    def test_empty_get_metadata(self):
        self.assertEqual(logic.metadata_get(), '{}')

    def test_basic_get_metadata(self):
        self.connect_basic_db()
        ret = json.loads(logic.metadata_get())
        self.assertTrue('abs2prom' in ret)
        self.assertTrue('prom2abs' in ret)
        self.assertEqual(ret['prom2abs']['output']['x'][0], 'x')
        self.assertEqual(ret['abs2prom']['input']['y'][0], 'y')

    def test_sellar_get_metadata(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.metadata_get())
        self.assertTrue('abs2prom' in ret)
        self.assertTrue('prom2abs' in ret)
        self.assertEqual(ret['abs2prom']['input']['mda.d2.y1'], 'y1')
        self.assertTrue('mda.d2.y1' in ret['prom2abs']['input']['y1'])

    def test_get_driver_iteration(self):
        self.connect_basic_db()
        res = json.loads(logic.generic_get(collections.DRIVER_ITERATIONS))[0]
        x = self._extract_value(res, 'x', 'desvars')
        y = self._extract_value(res, 'y', 'inputs')
        self.assertEqual(x, [1.0])
        self.assertEqual(y, [0.0])

    def test_empty_get_driver_iteration(self):
        self.connect_basic_db()
        self.assertEqual(logic.get_driver_iteration_data('test'), '[]')

    def test_get_driver_iteration_data_desvar(self):
        self.connect_to_sellar2()
        pz_z = json.loads(logic.get_driver_iteration_data('pz.z'))
        self.assertEqual(len(pz_z), 7)
        for it in pz_z:
            self.assertEqual(it['name'], 'pz.z')

    def test_get_driver_iteration_data_objective(self):
        self.connect_to_sellar2()
        o_cmp = json.loads(logic.get_driver_iteration_data('obj_cmp.obj'))
        self.assertEqual(len(o_cmp), 7)
        for it in o_cmp:
            self.assertEqual(it['name'], 'obj_cmp.obj')

    def test_get_driver_iteration_data_constraint(self):
        self.connect_to_sellar2()
        con1 = json.loads(logic.get_driver_iteration_data('con_cmp1.con1'))
        self.assertEqual(len(con1), 7)
        for it in con1:
            self.assertEqual(it['name'], 'con_cmp1.con1')

    def test_get_driver_iteration_data_sysinclude(self):
        self.connect_to_sellar2()
        mda_y2 = json.loads(logic.get_driver_iteration_data('mda.d2.y2'))
        self.assertEqual(len(mda_y2), 7)
        for it in mda_y2:
            self.assertEqual(it['name'], 'mda.d2.y2')

    def test_sellar_get_driver_iteration(self):
        self.connect_to_sellar2()
        res = json.loads(logic.generic_get(collections.DRIVER_ITERATIONS))
        self.assertEqual(len(res), 7)

        # basic test to make sure it's grabbing the cases we expect in the order we expect
        self.assertEqual(res[0]['iteration_coordinate'], 'rank0:SLSQP|0')
        self.assertEqual(res[1]['iteration_coordinate'], 'rank0:SLSQP|1')
        self.assertEqual(res[2]['iteration_coordinate'], 'rank0:SLSQP|2')
        self.assertEqual(res[3]['iteration_coordinate'], 'rank0:SLSQP|3')
        self.assertEqual(res[4]['iteration_coordinate'], 'rank0:SLSQP|4')
        self.assertEqual(res[5]['iteration_coordinate'], 'rank0:SLSQP|5')
        self.assertEqual(res[6]['iteration_coordinate'], 'rank0:SLSQP|6')

        self.assertEqual(len(res[0]['desvars']), 2)
        self.assertEqual(len(res[0]['objectives']), 1)
        self.assertEqual(len(res[0]['constraints']), 2)
        self.assertEqual(len(res[0]['sysincludes']), 2)

    def test_bad_collection_generic_get(self):
        self.assertEqual(logic.generic_get('bad collection'), '[]')

    def test_get_one_generic_get(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.generic_get(collections.DRIVER_ITERATIONS, False))
        self.assertEqual(len(ret), 1)

    def test_get_many_generic_get(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.generic_get(collections.DRIVER_ITERATIONS, True))
        self.assertEqual(len(ret), 7)

    def test_get_driver_iteration_based_on_count_empty(self):
        self.assertEqual(logic.get_driver_iteration_based_on_count('test', 0), '[]')

    def test_get_driver_iteration_based_on_count_basic_need_update(self):
        self.connect_basic_db()
        ret = json.loads(logic.get_driver_iteration_based_on_count('x', -1))
        self.assertIsNotNone(ret)
        self.assertEqual(len(ret), 1)

    def test_get_driver_iteration_based_on_count_no_update(self):
        self.connect_basic_db()
        ret = json.loads(logic.get_driver_iteration_based_on_count('x', 1))
        self.assertEqual(len(ret), 0)

    def test_get_driver_iteration_based_on_count_no_update2(self):
        self.connect_basic_db()
        ret = json.loads(logic.get_driver_iteration_based_on_count('x', 100))
        self.assertEqual(len(ret), 0)

    def get_driver_iteration_based_on_count_sellar_no_update1(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.get_driver_iteration_based_on_count('mda.d2.y1', 1000))
        self.assertEqual(len(ret), 0)

    def get_driver_iteration_based_on_count_sellar_no_update2(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.get_driver_iteration_based_on_count('mda.d2.y1', 7))
        self.assertEqual(len(ret), 0)

    def get_driver_iteration_based_on_count_sellar_update1(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.get_driver_iteration_based_on_count('mda.d2.y1', -1))
        self.assertEqual(len(ret), 7)

    def get_driver_iteration_based_on_count_sellar_update2(self):
        self.connect_to_sellar2()
        ret = json.loads(logic.get_driver_iteration_based_on_count('mda.d2.y1', -2))
        self.assertEqual(len(ret), 7)

    def _extract_value(self, driver_iteration, name, d_type):
        """ _extract_value private method

        Extract the data with the given name from the given driver iteration.

        Args:
            driver_iteration (dict): the JSON driver iteration
            name (string): name of the variable
            d_type (string): 'desvars', 'objectives', constraints', 'sysincludes', or 'inputs'

        Returns:
            Value as array if found, None otherwise
        """
        ret = None
        if d_type in driver_iteration:
            for v in driver_iteration[d_type]:
                if v['name'] is name:
                    ret = v['values']
        return ret


if __name__ == "__main__":
    try:
        unittest.main()
    except Exception as e:
        print("Error: " + str(e))
