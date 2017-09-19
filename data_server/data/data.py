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

user_exists : Checks if a user exists

get_new_token : generates a new token

token_exists : returns True if the token is used in the User collection
"""
import os
import json
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
_GLOBALLY_ACCEPTED_TOKEN = 'squavy'

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

def get_all_cases(token):
    """ get_all_cases method

    Returns all case documents from the cases collection for which
    the given token has access.

    Args:
        token (string): the token to query against
    Returns:
        JSON array of case documents
    """
    cases_coll = _MDB[collections.CASES]
    ret = cases_coll.find({'users': token}, {'_id': False})
    return dumps(ret)

def get_case_with_id(case_id, token):
    """ get_case_with_id method

    Returns the case document with the associated ID or
    null if it does not exis in the DB.

    Args:
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        JSON document corresponding to that case_id
    """
    case = json.loads(_get(_MDB[collections.CASES], case_id, token, False))
    if case and token in case['users']:
        return _get(_MDB[collections.CASES], case_id, token, False)
    else:
        return {}

def delete_case_with_id(case_id, token):
    """ delete_case_with_id method

    Deletes an entire case with the given case_id from *all* collections.
    This means anything associated with the case_id from any collection
    will be deleted.

    Args:
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        True if anything was deleted, False otherwise.
    """
    #delete in all collections except 'cases'
    generic_delete('driver_iterations', case_id, token)
    generic_delete('driver_metadata', case_id, token)
    generic_delete('global_iterations', case_id, token)
    generic_delete('metadata', case_id, token)
    generic_delete('solver_iterations', case_id, token)
    generic_delete('solver_metadata', case_id, token)
    generic_delete('system_iterations', case_id, token)
    generic_delete('system_metadata', case_id, token)

    #delete the case in the 'cases' collection
    cases_coll = _MDB[collections.CASES]
    queried = cases_coll.find({'$and': [{'case_id': int(case_id)}, {'users': token}]})
    if queried.count() == 0:
        return False

    cases_coll.delete_one({'case_id': int(case_id)})
    return True

def create_case(body, token):
    """ create_case method

    Creates a unique integer case_id, adds it to the given body,
    and stores it in the cases collection in the DB. Returns the
    new case_id. Returns -1 if the case was not successfully created.

    Args:
        case_id (string || int): ID to be used for querying
        token (string): the token to be associated with this case
    Returns:
        Integer case_id. -1 if no case_id could be created.
    """
    if not user_exists(token=token):
        return -1

    case_id = _get_case_id()
    if case_id == -1:
        return case_id

    body['case_id'] = case_id
    body['date'] = str(datetime.datetime.utcnow())
    body['users'] = [token]
    cases_coll = _MDB[collections.CASES]
    cases_coll.insert_one(body)
    return case_id

def generic_get(collection_name, case_id, token):
    """ generic_get method

    Performs a generic 'get' request, which attempts to query and return
    all documents with the given case_id from the given collection.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        JSON array of documents returned from the query
    """
    return _get(_MDB[collection_name], case_id, token)

def generic_create(collection_name, body, case_id, token, update):
    """ generic_create method

    Performs a generic 'post' request, which takes the body,
    adds a timestamp and the case_id, and inserts it into the collection.
    Returns True if it succeeded, False otherwise.

    Args:
        collection_name (string): the collection to query
        body (json): the document to be added to the collection
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    return _create(_MDB[collection_name], body, case_id, token, update)

def generic_delete(collection_name, case_id, token):
    """ generic_delete method

    Performs a generic 'delete' request, which attempts to delete all documents
    with the given case_id from the given collection. Returns True if anything
    was deleted, False otherwise.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    return _delete(_MDB[collection_name], case_id, token)

def user_exists(email=None, token=None):
    """ user_exists method

    Checks to see if a user is in the DB. If so, returns true. False otherwise.
    Can use email or token to check user

    Args:
        email (string): the email to check agianst (optional)
        token (string): the token to check against (optional)
    """
    users_coll = _MDB[collections.USERS]

    if token is None:
        return users_coll.find({'email': email}).count() > 0
    else:
        return users_coll.find({'token': token}).count() > 0

def get_new_token(name, email):
    """ get_new_token method

    Creates a new token and creates a new user with the token and username.

    Args:
        name (string): the user's name
        email (string): the user's email
    Returns:
        token (string): the token to be used by the user for recording
    """
    token = _create_token()
    users_coll = _MDB[collections.USERS]
    users_coll.insert_one({'name': name, 'token': token, 'email': email})
    return token

def delete_token(token):
    """ delete_token method

    Deletes a token and everything associated with that token

    Args:
        token (string): the token to be deleted
    """
    if(token_exists(token)):
        all_cases = json.loads(get_all_cases(token))
        for c in all_cases:
            delete_case_with_id(c['case_id'], token)

        users_coll = _MDB[collections.USERS]
        users_coll.delete_many({'token': token})

def token_exists(token):
    """ token_exists method

    Checks to see if a token exists in the database

    Args:
        token (string): the token to be checked
    Returns:
        True if exists, False otherwise
    """
    users_coll = _MDB[collections.USERS]
    return users_coll.find({'token': token}).count() > 0

def get_system_iteration_data(case_id):
    """ get_system_iteration_data method

    Grabs all data for all system iterations for a given case

    Args:
        case_id (string): the case to use for querying
    Returns:
        Array of data
    """
    collection = _MDB[collections.SYSTEM_ITERATIONS]
    return collection.find({'case_id': int(case_id)})

def get_driver_iteration_data(case_id):
    """ get_driver_iteration_data method

    Grabs all data for all driver iterations for a given case

    Args:
        case_id (string): the case to use for querying
    Returns:
        Array of data
    """
    collection = _MDB[collections.DRIVER_ITERATIONS]
    return collection.find({'case_id': int(case_id)})

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

def _get(collection, case_id, token, get_many=True):
    """ _get method

    Performs a generic 'get' request, which attempts to query and return
    all documents with the given case_id from the given collection.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
        get_many (bool): if true, finds all results. False finds only one.
            Default true
    Returns:
        JSON array of documents returned from the query
    """
    if get_many:
        if token == _GLOBALLY_ACCEPTED_TOKEN:
            return dumps(collection.find({'case_id': int(case_id)}, {'_id': False}))
        else:
            return dumps(collection.find({'$and': [{'case_id': int(case_id)},
                                         {'users': token}]}, {'_id': False}))
    else:
        if token == _GLOBALLY_ACCEPTED_TOKEN:
            return dumps(collection.find_one({'case_id': int(case_id)},
                                             {'_id': False}))
        else:
            return dumps(collection.find_one({'$and': [{'case_id': int(case_id)},
                                             {'users': token}]}, {'_id': False}))

def _create(collection, body, case_id, token, update):
    """ _create method

    Performs a generic 'post' request, which takes the body,
    adds a timestamp and the case_id, and inserts it into the collection.
    Returns True if it succeeded, False otherwise.

    Args:
        collection_name (string): the collection to query
        body (json): the document to be added to the collection
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
        update (bool): whether or not we're just updating an existing recording
    Returns:
        True if successfull, False otherwise
    """
    if not user_exists(token=token):
        return False

    if update:
        if _get(_MDB[collections.CASES], case_id, token) is None:
            return False
        if 'iteration_coordinate' in body:
            collection.delete_many({'$and': [{'case_id': int(case_id)},
                                   {'iteration_coordinate': body['iteration_coordinate']}]})
        elif 'counter' in body:
            collection.delete_many({'$and': [{'case_id': int(case_id)},
                                   {'counter': body['counter']}]})
        elif 'solver_class' in body:
            collection.delete_many({'$and': [{'case_id': int(case_id)},
                                   {'solver_class': body['solver_class']}]})
        else:
            collection.delete_many({'case_id': int(case_id)})

    body['case_id'] = int(case_id)
    body['date'] = str(datetime.datetime.utcnow())
    body['users'] = [token]
    collection.insert_one(body)
    return True

def _delete(collection, case_id, token):
    """ _delete method

    Performs a generic 'delete' request, which attempts to delete all documents
    with the given case_id from the given collection. Returns True if anything
    was deleted, False otherwise.

    Args:
        collection_name (string): the collection to query
        case_id (string || int): ID to be used for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    queried = collection.find({'$and': [{'case_id': int(case_id)}, {'users': token}]})
    if queried.count() == 0:
        return False
    collection.delete_many({'$and': [{'case_id': int(case_id)}, {'users': token}]})
    return True

#endregion

_create_collections()
