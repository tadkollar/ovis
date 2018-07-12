import sqlite3
import os
import io
import numpy as np
import json
from six import PY2, PY3, iteritems

if PY2:
    import cPickle as pickle
if PY3:
    import pickle

def create_basic_db(id):
    """ create_basic_db

    Creates a DB with one desvar (x) and one driver iteration.

    Args:
        id (int): unique integer ID which will be appended to filename
    Returns:
        Filepath as string
    """
    f_name = create_new_db(id)

    abs2prom = {'input': {'y': ['y']}, 'output': {'x': ['x']}}
    prom2abs = {'input': {'y': ['y']}, 'output': {'x': ['x']}}
    abs2meta = {'x': {'type': ['output', 'desvar'], 'explicit': True},
                'y': {'type': ['input'], 'explicit': True}}

    record_metadata(f_name, abs2meta, abs2prom, prom2abs)

    inputs = {'y': [0.0]}
    outputs = {'x': [1.0]}
    record_driver_iteration(f_name, inputs, outputs, 1, 1, 'rank0:SLSQP|0')

    return f_name

def create_new_db(id):
    """ create_new_db function

    Generates a new SQLite DB with the appropriate schema and returns
    the path to that DB.

    Args:
        id (int): unique integer ID which will be appended to filename.

    Returns:
        Filepath as string
    """
    _temp_filepath = 'temp'
    f_name = os.path.join(os.path.dirname(__file__), _temp_filepath + str(id) +'.db')
    con = sqlite3.connect(f_name)

    with con:
        c = con.cursor()
        c.execute("CREATE TABLE metadata( format_version INT, "
                  "abs2prom BLOB, prom2abs BLOB, abs2meta BLOB)")
        c.execute("INSERT INTO metadata(format_version, abs2prom, prom2abs) "
                  "VALUES(?,?,?)", (1, None, None))

        # used to keep track of the order of the case records across all three tables
        c.execute("CREATE TABLE global_iterations(id INTEGER PRIMARY KEY, "
                    "record_type TEXT, rowid INT)")
        c.execute("CREATE TABLE driver_iterations(id INTEGER PRIMARY KEY, "
                    "counter INT,iteration_coordinate TEXT, timestamp REAL, "
                    "success INT, msg TEXT, inputs TEXT, outputs TEXT)")
        c.execute("CREATE INDEX driv_iter_ind on driver_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE system_iterations(id INTEGER PRIMARY KEY, "
                    "counter INT, iteration_coordinate TEXT, timestamp REAL, "
                    "success INT, msg TEXT, inputs TEXT, outputs TEXT, residuals TEXT)")
        c.execute("CREATE INDEX sys_iter_ind on system_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE solver_iterations(id INTEGER PRIMARY KEY, "
                    "counter INT, iteration_coordinate TEXT, timestamp REAL, "
                    "success INT, msg TEXT, abs_err REAL, rel_err REAL, "
                    "solver_inputs TEXT, solver_output TEXT, solver_residuals TEXT)")
        c.execute("CREATE INDEX solv_iter_ind on solver_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE driver_metadata(id TEXT PRIMARY KEY, "
                    "model_viewer_data BLOB)")
        c.execute("CREATE TABLE system_metadata(id TEXT PRIMARY KEY, "
                    "scaling_factors BLOB, component_metadata BLOB)")
        c.execute("CREATE TABLE solver_metadata(id TEXT PRIMARY KEY, "
                    "solver_options BLOB, solver_class TEXT)")
    con.close()
    return f_name

def record_driver_iteration(f_name, inputs, outputs, id, counter, iteration_coordinate, timestamp=0, success=1, msg=''):
    """ add_driver_iteration function

    Adds the given data as a row in the driver_iteration table of the database.
    NOTE: inputs and outputs will be pickled.

    Args:
        f_name (string): DB filename
        inputs (dict): input variables and values
        outputs (dict): output variables and values
        id (int): unique row ID
        counter (int): iteration counter
        iteration_coordinate (string): iteration coordinate
        timestamp (number): time of recording
        success (int): 1 if success, 0 otherwise
        msg (string): msg to be included
    """
    for vals in (inputs, outputs):
        for v in vals:
            vals[v] = np.array(vals[v])

    for in_out in (inputs, outputs):
        if in_out is None:
            continue
        for var in in_out:
            in_out[var] = _convert_to_list(in_out[var])

    outputs_text = json.dumps(outputs)
    inputs_text = json.dumps(inputs)

    con = sqlite3.connect(f_name)
    with con:
        c = con.cursor()
        c.execute("INSERT INTO driver_iterations(counter, iteration_coordinate, "
                  "timestamp, success, msg, inputs, outputs) VALUES(?,?,?,?,?,?,?)",
                  (counter, iteration_coordinate, timestamp, success, msg, inputs_text,
                   outputs_text))

def record_metadata(f_name, abs2meta, abs2prom, prom2abs):
    """ record_metadata function

    Record the given metadata to the given database.

    Args:
        f_name (string): the db filename
        abs2meta (dict): dictionary mapping absolute var name to metadata
        abs2prom (dict): dictionary mapping absolute var name to promoted var name
        prom2abs (dict): dictionary mapping promoted var name to absolute var name
    """
    abs2meta = pickle.dumps(abs2meta)
    abs2prom = json.dumps(abs2prom)
    prom2abs = json.dumps(prom2abs)

    con = sqlite3.connect(f_name)
    with con:
        c = con.cursor()
        c.execute("UPDATE metadata SET abs2prom=?, prom2abs=?, abs2meta=?",
                  (abs2prom, prom2abs, abs2meta))

def _convert_to_list(vals):
    """
    Convert values to list (so that it may be sent as JSON).

    Parameters
    ----------
    vals : numpy.array or list or tuple
        the object to be converted to a list

    Returns
    -------
    list :
        The converted list.
    """
    if isinstance(vals, np.ndarray):
        return _convert_to_list(vals.tolist())
    elif isinstance(vals, (list, tuple)):
        return [_convert_to_list(item) for item in vals]
    elif vals is None:
        return []
    else:
        return vals

def _values_to_array(values):
    """ _values_to_array private function

    Convert a dict of variable names and values into a numpy named array.

    Args:
        values (dict): dict of variable names and values

    Returns:
        named array containing the same names and values as the input values dict.
    """
    if values:
        dtype_tuples = []
        for name, value in iteritems(values):
            tple = (name, '{}f8'.format(value.shape))
            dtype_tuples.append(tple)

        array = np.zeros((1,), dtype=dtype_tuples)

        for name, value in iteritems(values):
            array[name] = value
    else:
        array = None

    return array

def _array_to_blob(array):
    """ _array_to_blob private function

    Convert a numpy array to something that can be written
    to a BLOB field in sqlite.

    Args:
    array (Array): The array that will be converted to a blob.

    Returns:
        The blob created from the array.

    """
    out = io.BytesIO()
    np.save(out, array)
    out.seek(0)
    return sqlite3.Binary(out.read())
