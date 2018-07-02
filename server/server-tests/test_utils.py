import sqlite3
import os

def create_new_db(id):
    """ create_new_db private method

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
                    "success INT, msg TEXT, inputs BLOB, outputs BLOB)")
        c.execute("CREATE INDEX driv_iter_ind on driver_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE system_iterations(id INTEGER PRIMARY KEY, "
                    "counter INT, iteration_coordinate TEXT, timestamp REAL, "
                    "success INT, msg TEXT, inputs BLOB, outputs BLOB, residuals BLOB)")
        c.execute("CREATE INDEX sys_iter_ind on system_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE solver_iterations(id INTEGER PRIMARY KEY, "
                    "counter INT, iteration_coordinate TEXT, timestamp REAL, "
                    "success INT, msg TEXT, abs_err REAL, rel_err REAL, "
                    "solver_inputs BLOB, solver_output BLOB, solver_residuals BLOB)")
        c.execute("CREATE INDEX solv_iter_ind on solver_iterations(iteration_coordinate)")
        c.execute("CREATE TABLE driver_metadata(id TEXT PRIMARY KEY, "
                    "model_viewer_data BLOB)")
        c.execute("CREATE TABLE system_metadata(id TEXT PRIMARY KEY, "
                    "scaling_factors BLOB, component_metadata BLOB)")
        c.execute("CREATE TABLE solver_metadata(id TEXT PRIMARY KEY, "
                    "solver_options BLOB, solver_class TEXT)")
    con.close()
    return f_name