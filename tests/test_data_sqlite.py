import sys
import json
import os.path
import sqlite3
import unittest
import numpy as np
from bson.json_util import dumps

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), os.path.pardir)))

from data_server.data.sqlite_data import SqliteData
from data_server.shared import collection_names as collections

_data = SqliteData()


class TestSqliteData(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(TestSqliteData, self).__init__(*args, **kwargs)
        self._sellar_grouped_location = os.path.join(os.path.dirname(__file__),
                                                     'sellar_grouped.db')
        self._temp_filepath = 'temp'
        self._generated_dbs = []

    def tearDown(self):
        _data.disconnect()
        for p in self._generated_dbs:
            try:
                if os.path.isfile(p):
                    os.remove(p)
            except OSError as e:
                print(e)
        self._generated_dbs.clear()

    def test_connect_sellar(self):
        self._use_sellar_grouped()
        self.assertEqual(_data.filename, self._sellar_grouped_location)

    def test_connect_bad_db(self):
        self.assertFalse(_data.connect('not a real file'))

    def test_generate_layout_table(self):
        f_name = self._create_new_db()

        con = sqlite3.connect(f_name)
        with con:
            self.cursor = con.cursor()
            self.cursor.execute("SELECT name FROM sqlite_master WHERE "
                                "type='table' AND name='layouts'")
            res = self.cursor.fetchone()
        con.close()
        self.assertIsNone(res)

        _data.connect(f_name)
        con = sqlite3.connect(f_name)
        with con:
            self.cursor = con.cursor()
            self.cursor.execute("SELECT name FROM sqlite_master WHERE "
                                "type='table' AND name='layouts'")
            res = self.cursor.fetchone()
        con.close()
        self.assertIsNotNone(res)

    def test_generic_get_empty_driver_iteration(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        iteration = _data.generic_get(collections.DRIVER_ITERATIONS)

        self.assertEqual(iteration, [])

    def test_generic_get_empty_driver_metadata(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        metadata = _data.generic_get(collections.DRIVER_METADATA)

        self.assertEqual(metadata, [])

    def test_generic_get_empty_layout(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        layout = _data.generic_get(collections.LAYOUTS)

        self.assertEqual(layout, [])

    def test_generic_get_unsupported_collection(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        sys_metadata = _data.generic_get(collections.SYSTEM_METADATA)

        self.assertEqual(sys_metadata, [])

    def test_get_driver_iteration(self):
        self._use_sellar_grouped()
        iterations = _data.generic_get(collections.DRIVER_ITERATIONS)

        self.assertEqual(len(iterations), 6)
        t_iter = iterations[0]
        desvars = [
            {'name': 'p1.x', 'values': [[50.0]]},
            {'name': 'p2.y', 'values': [[50.0]]}
        ]
        objectives = [
            {'name': 'comp.f_xy', 'values': [[7622.0]]}
        ]
        sysincludes = [
            {'name': 'p3.z', 'values': [[50.0]]}
        ]

        self.assertEqual(t_iter['constraints'], [])
        for d in desvars:
            self._assert_array_close(d, t_iter['desvars'])
        for o in objectives:
            self._assert_array_close(o, t_iter['objectives'])
        for s in sysincludes:
            self._assert_array_close(s, t_iter['sysincludes'])

    def test_get_driver_iteration2(self):
        self._use_sellar_grouped()
        iterations = _data.get_driver_iteration_data('')

        self.assertEqual(len(iterations), 6)
        t_iter = iterations[0]
        desvars = [
            {'name': 'p1.x', 'values': [[50.0]]},
            {'name': 'p2.y', 'values': [[50.0]]}
        ]
        objectives = [
            {'name': 'comp.f_xy', 'values': [[7622.0]]}
        ]
        sysincludes = [
            {'name': 'p3.z', 'values': [[50.0]]}
        ]

        self.assertEqual(t_iter['constraints'], [])
        for d in desvars:
            self._assert_array_close(d, t_iter['desvars'])
        for o in objectives:
            self._assert_array_close(o, t_iter['objectives'])
        for s in sysincludes:
            self._assert_array_close(s, t_iter['sysincludes'])

    def test_get_driver_metadata(self):
        self._use_sellar_grouped()
        metadata_s = _data.generic_get(collections.DRIVER_METADATA)
        metadata = json.loads(metadata_s)[0]
        self.assertIsNotNone(metadata['model_viewer_data'])
        self.assertIsNotNone(metadata['model_viewer_data']['tree'])
        self.assertIsNotNone(metadata['model_viewer_data']['connections_list'])
        self.assertEqual(
            len(metadata['model_viewer_data']['connections_list']), 4)

    def test_get_layout(self):
        self._use_sellar_grouped()
        layout_s = _data.generic_get(collections.LAYOUTS)
        layout = json.loads(json.loads(layout_s)[0]['layout'])
        self.assertIsNotNone(layout['settings'])
        self.assertIsNotNone(layout['dimensions'])
        self.assertIsNotNone(layout['labels'])
        self.assertIsNotNone(layout['content'])

    def test_update_layout(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        layout_s = _data.generic_get(collections.LAYOUTS)
        self.assertEqual(layout_s, [])

        new_layout = {'test': True}
        _data.update_layout(new_layout, '')
        layout_s = _data.generic_get(collections.LAYOUTS)
        layout = json.loads(layout_s)[0]
        self.assertTrue(layout['test'])

    def test_get_driver_iteration_without_connection(self):
        _data.disconnect()
        self.assertEqual(_data.get_driver_iteration_data(''), [])

    def test_is_no_new_data(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        self.assertFalse(_data.is_new_data('', 0))

    def test_is_no_new_data2(self):
        self._use_sellar_grouped()
        self.assertFalse(_data.is_new_data('', 300))

    def test_is_new_data(self):
        f_name = self._create_new_db()
        _data.connect(f_name)
        self.assertFalse(_data.is_new_data('', 0))
        _data.disconnect()

        con = sqlite3.connect(f_name)
        with con:
            self.cursor = con.cursor()
            self.cursor.execute("INSERT INTO driver_iterations(counter, "
                                "iteration_coordinate, timestamp, success,"
                                " msg, desvars , responses , objectives , "
                                "constraints, sysincludes ) "
                                "VALUES(?,?,?,?,?,?,?,?,?,?)",
                                (1, '', 0, 1, '', None, None, None,
                                 None, None))

        con.close()
        _data.connect(f_name)
        self.assertTrue(_data.is_new_data('', 0))

    def test_is_new_data2(self):
        self._use_sellar_grouped()
        self.assertFalse(_data.is_new_data('', 42))
        self.assertTrue(_data.is_new_data('', 41))

    # Helper methods

    def _assert_array_close(self, test_val, comp_set, dec_places=4):
        """ assert_array_close private method

        Compares a test value to its value in the comparison set within
        dec_places decimal places. Runs the numpy assert_almost_equal

        Args:
            test_val (set): the test value with name and values to be compared
            comp_set (array): the comparison set to be tested against
            dec_places (int): the number of decimal places to test against
        """
        values_arr = [t for t in comp_set if t['name'] == test_val['name']]
        if len(values_arr) != 1:
            self.assertTrue(False, 'Expected to find a value with a unique name in the comp_set,\
             but found 0 or more than 1 instead')
            return
        np.testing.assert_almost_equal(test_val['values'],
                                       values_arr[0]['values'],
                                       decimal=dec_places)

    def _use_sellar_grouped(self):
        """ use_sellar_grouped private method

        Connects _data to the sellar grouped DB
        """
        _data.connect(self._sellar_grouped_location)

    def _create_new_db(self):
        """ create_new_db private method

        Generates a new SQLite DB with the appropriate schema and returns
        the path to that DB.

        Returns:
            Filepath as string
        """
        f_name = os.path.join(os.path.dirname(__file__),
                              self._temp_filepath +
                              str(len(self._generated_dbs)) +
                              '.db')
        con = sqlite3.connect(f_name)
        self._generated_dbs.append(f_name)

        with con:
            self.cursor = con.cursor()
            self.cursor.execute("CREATE TABLE metadata( format_version INT, "
                                "abs2prom BLOB, prom2abs BLOB)")
            self.cursor.execute("INSERT INTO metadata(format_version, "
                                "abs2prom, prom2abs) VALUES(?,?,?)",
                                (1, None, None))

            # used to keep track of the order of the case records across all
            # three tables
            self.cursor.execute("CREATE TABLE global_iterations(id INTEGER "
                                "PRIMARY KEY, record_type TEXT, rowid INT)")
            self.cursor.execute("CREATE TABLE driver_iterations(id INTEGER "
                                "PRIMARY KEY, counter INT,"
                                "iteration_coordinate TEXT, timestamp REAL, "
                                "success INT, msg TEXT, desvars BLOB, "
                                "responses BLOB, objectives BLOB, constraints "
                                "BLOB, sysincludes BLOB)")
            self.cursor.execute("CREATE TABLE system_iterations(id INTEGER "
                                "PRIMARY KEY, counter INT, "
                                "iteration_coordinate TEXT,  timestamp REAL, "
                                "success INT, msg TEXT, inputs BLOB, "
                                "outputs BLOB, residuals BLOB)")
            self.cursor.execute("CREATE TABLE solver_iterations(id INTEGER "
                                "PRIMARY KEY, counter INT, "
                                "iteration_coordinate TEXT, timestamp REAL, "
                                "success INT, msg TEXT, abs_err REAL, "
                                "rel_err REAL, solver_output BLOB, "
                                "solver_residuals BLOB)")

            self.cursor.execute("CREATE TABLE driver_metadata(id TEXT "
                                "PRIMARY KEY, model_viewer_data BLOB)")
            self.cursor.execute("CREATE TABLE system_metadata(id TEXT "
                                "PRIMARY KEY, scaling_factors BLOB)")
            self.cursor.execute("CREATE TABLE solver_metadata(id TEXT "
                                "PRIMARY KEY, solver_options BLOB, "
                                "solver_class TEXT)")
        con.close()
        return f_name


if __name__ == "__main__":
    unittest.main()
