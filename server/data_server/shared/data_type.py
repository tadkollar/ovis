""" data_type.py

Stores the type of data storage being used. Currently MongoDB
and SQLite supported.
"""

DB_TYPE = 'SQLite'


def is_sqlite():
    """ is_sqlite method

    Tells if the DB type is SQLite

    Returns:
        True if DB Type is SQLite, False otherwise
    """
    return DB_TYPE == 'SQLite'


def is_mongodb():
    """ is_mongodb method

    Tells if the DB type is MongODB

    Returns:
        True if DB Type is MongoDB, False otherwise
    """
    return DB_TYPE == 'MongoDB'
