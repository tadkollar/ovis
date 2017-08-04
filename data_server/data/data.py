""" data.py
Handles any and all connections with databases and contains methods
to retrieve, delete and alter data. Represents the bottom layer ('data' layer)
in the 3-tier architecture used in this project.

Public Methods
--------------
get_model_data : Returns the JSON blob containing the variables and
    connections

get_all_cases : Returns the list of all available cases

get_case_with_id : Returns the information on the stored case
    with the given ID

delete_case_with_id : Deletes all documents associated with a given
    case ID from the DB

create_case : Creates a new case with the given name and returns a unique
    ID to identify the case

generic_get : Gets all documents with the given ID from the given collection

generic_create : Adds the given document to the given collection

generic_delete : Deletes all documents with the given ID from the given
    collection

"""
import os
import string
import pickle
import random
import sqlite3
import datetime
from pymongo import MongoClient
from bson.json_util import dumps
import data_server.shared.collections as collections

_LOCATION = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
_SQLTIEDB_FILE = os.path.join(_LOCATION, 'sqlite_test')
_DB_CON = sqlite3.connect(_SQLTIEDB_FILE, detect_types=sqlite3.PARSE_DECLTYPES)
_CURSOR = _DB_CON.cursor()

_MCLIENT = MongoClient('localhost', 27017)
_MDB = _MCLIENT.openmdao_blue
_MAX_ID_ATTEMPTS = 1000 #maximum number of attempts to try to create an ID

def get_model_data():
    """ get_model_data method

    Grabs the example model/connection data from the SQLITE DB.
    NOTE: this should be replaced in its entirety with the driver metadata
        collection, as we don't use SQLITE as the main DB here.

    Args:
        None
    Returns:
        JSON model/connection data for the example
    """
    _CURSOR.execute("SELECT model_viewer_data FROM driver_metadata;")
    model_pickle = _CURSOR.fetchone()
    return pickle.loads(model_pickle[0])

def get_all_cases():
    """ get_all_cases method

    Returns all case documents from the cases collection.

    Args:
        None
    Returns:
        JSON array of case documents
    """
    cases_coll = _MDB[collections.CASES]
    ret = cases_coll.find({}, {'_id': False})
    return dumps(ret)

def get_case_with_id(case_id):
    """ get_case_with_id method

    Returns the case document with the associated ID or 
    null if it does not exis in the DB.

    Args:
        case_id (string || int): ID to be used for querying
    Returns:
        JSON document corresponding to that case_id
    """
    return _get(_MDB[collections.CASES], case_id, False)

def delete_case_with_id(case_id):
    """ delete_case_with_id method

    Deletes an entire case with the given case_id from *all* collections.
    This means anything associated with the case_id from any collection
    will be deleted.

    Args:
        case_id (string || int): ID to be used for querying
    Returns:
        True if anything was deleted, False otherwise.
    """
    #delete in all collections except 'cases'
    generic_delete('driver_iterations', case_id)
    generic_delete('driver_metadata', case_id)
    generic_delete('global_iterations', case_id)
    generic_delete('metadata', case_id)
    generic_delete('solver_iterations', case_id)
    generic_delete('solver_metadata', case_id)
    generic_delete('system_iterations', case_id)
    generic_delete('system_metadata', case_id)

    #delete the case in the 'cases' collection
    cases_coll = _MDB[collections.CASES]
    queried = cases_coll.find({'case_id': int(case_id)})
    if queried.count() == 0:
        return False
    cases_coll.delete_one({'case_id': int(case_id)})
    return True

def create_case(body):
    """ create_case method

    Creates a unique integer case_id, adds it to the given body,
    and stores it in the cases collection in the DB. Returns the 
    new case_id. Returns -1 if the case was not successfully created.

    Args:
        case_id (string || int): ID to be used for querying
    Returns:
        Integer case_id. -1 if no case_id could be created.
    """
    case_id = _get_case_id()
    if case_id == -1:
        return case_id

    body['case_id'] = case_id
    body['date'] = datetime.datetime.utcnow()
    cases_coll = _MDB[collections.CASES]
    cases_coll.insert_one(body)
    return case_id

def generic_get(collection_name, case_id):
    """ generic_get method

    Performs a generic 'get' request, which attempts to query and return
    all documents with the given case_id from the given collection.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
    Returns:
        JSON array of documents returned from the query
    """
    return _get(_MDB[collection_name], case_id)

def generic_create(collection_name, body, case_id):
    """ generic_create method

    Performs a generic 'post' request, which takes the body,
    adds a timestamp and the case_id, and inserts it into the collection.
    Returns True if it succeeded, False otherwise.

    Args:
        collection_name (string): the collection to query
        body (json): the document to be added to the collection
        case_id (string || int): ID to be used for querying
    Returns:
        True if successfull, False otherwise
    """
    return _create(_MDB[collection_name], body, case_id)

def generic_delete(collection_name, case_id):
    """ generic_delete method

    Performs a generic 'delete' request, which attempts to delete all documents
    with the given case_id from the given collection. Returns True if anything
    was deleted, False otherwise.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
    Returns:
        True if successfull, False otherwise
    """
    return _delete(_MDB[collection_name], case_id)

def user_exists(name):
    """ user_exists method

    Checks to see if a user is in the DB. If so, returns true. False otherwise
    """
    users_coll = _MDB[collections.USERS]
    return users_coll.find({'name': name}).count() > 0

def get_new_token(name):
    """ get_new_token method

    Creates a new token and creates a new user with the token and username.

    Args:
        name (string): the user's name
    Returns:
        token (string): the token to be used by the user for recording
    """
    token = _create_token()
    users_coll = _MDB[collections.USERS]
    users_coll.insert({'name': name, 'token': token})
    return token

#region private

def _create_token():
    """ _create_token method

    Attempts to create a unique token. Tries _MAX_ID_ATTEMPTS before giving up

    Args:
        None
    Returns:
        Token if a unique one is found, otherwise -1
    """
    attempts = 0
    while True:
        token = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))
        attempts += 1
        if _MDB.users.find({'token': token}).count() == 0:
            return token
        elif attempts >= _MAX_ID_ATTEMPTS:
            return -1

def _get_case_id():
    """ _get_case_id method

    Attempts to create an integer that does not already exist in the DB
    as a case_id. Attempts _MAX_ID_ATTEMPTS times before giving up and returning
    -1.

    Args:
        None
    Returns:
        Returns -1 if failed or a non-negative integer if success
    """
    attempts = 0
    while True:
        attempts += 1
        case_id = random.randint(0, 2147483647)
        if _MDB.cases.find({'case_id': case_id}).count() == 0:
            return case_id
        elif attempts >= _MAX_ID_ATTEMPTS: #max attempts
            return -1

def _create_collections():
    """ _create_collections method

    Creates all collections if they have not been created in the local DB.
    Should be called before querying begins.

    Args:
        None
    Returns:
        None
    """
    if not 'cases' in _MDB.collection_names():
        _MDB.create_collection('cases')
    if not 'driver_iterations' in _MDB.collection_names():
        _MDB.create_collection('driver_iterations')
    if not 'driver_metadata' in _MDB.collection_names():
        _MDB.create_collection('driver_metadata')
    if not 'global_iterations' in _MDB.collection_names():
        _MDB.create_collection('global_iterations')
    if not 'metadata' in _MDB.collection_names():
        _MDB.create_collection('metadata')
    if not 'solver_iterations' in _MDB.collection_names():
        _MDB.create_collection('solver_iterations')
    if not 'solver_metadata' in _MDB.collection_names():
        _MDB.create_collection('solver_metadata')
    if not 'system_iterations' in _MDB.collection_names():
        _MDB.create_collection('system_iterations')
    if not 'system_metadata' in _MDB.collection_names():
        _MDB.create_collection('system_metadata')
    if not 'users' in _MDB.collection_names():
        _MDB.create_collection('users')

def _get(collection, case_id, get_many=True):
    """ _get method

    Performs a generic 'get' request, which attempts to query and return
    all documents with the given case_id from the given collection.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
    Returns:
        JSON array of documents returned from the query
    """
    if get_many:
        return dumps(collection.find({'case_id': int(case_id)}, {'_id': False}))
    else:
        return dumps(collection.find_one({'case_id': int(case_id)}, {'_id': False}))

def _create(collection, body, case_id):
    """ _create method

    Performs a generic 'post' request, which takes the body,
    adds a timestamp and the case_id, and inserts it into the collection.
    Returns True if it succeeded, False otherwise.

    Args:
        collection_name (string): the collection to query
        body (json): the document to be added to the collection
        case_id (string || int): ID to be used for querying
    Returns:
        True if successfull, False otherwise
    """
    body['case_id'] = int(case_id)
    body['date'] = datetime.datetime.utcnow()
    collection.insert_one(body)
    return True

def _delete(collection, case_id):
    """ _delete method

    Performs a generic 'delete' request, which attempts to delete all documents
    with the given case_id from the given collection. Returns True if anything
    was deleted, False otherwise.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
    Returns:
        True if successfull, False otherwise
    """
    queried = collection.find({'case_id': int(case_id)})
    if queried.count() == 0:
        return False
    collection.delete_many({'case_id': int(case_id)})
    return True

#endregion

_create_collections()
