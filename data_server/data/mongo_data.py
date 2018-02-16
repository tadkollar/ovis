""" mongo_data.py
Handles the connections with the Mongo DB and contains methods
to retrieve, delete and alter data. Represents the bottom layer ('data' layer)
in the 3-tier architecture used in this project.
"""
import os
import json
import string
import pickle
import random
import sqlite3
import datetime
from six import PY2, PY3
from pymongo import MongoClient
from bson.json_util import dumps
import data_server.shared.collection_names as collections
from data_server.data.data import BaseData


class MongoData(BaseData):
    """ MongoData class

    Class that manages the MongoDB connection. Can query, insert and delete in any collection.
    """

    def __init__(self):
        """ init method

        Initializes, connecting to the DB and creating the collections.
        """
        super(MongoData, self).__init__()
        self._MAX_ID_ATTEMPTS = 1000

    def connect(self):
        """ connect method

        Creates the connection to the MongoDB.
        """
        self._MCLIENT = MongoClient('localhost', 27017)
        self._MDB = self._MCLIENT.openmdao_blue
        self._create_collections()

    def get_all_cases(self, token):
        """ get_all_cases method

        Returns all case documents from the cases collection for which
        the given token has access.

        Args:
            token (string): the token to query against
        Returns:
            JSON array of case documents
        """
        cases_coll = self._MDB[collections.CASES]
        ret = cases_coll.find({'users': token}, {'_id': False})
        return dumps(ret)

    def get_case_with_id(self, case_id, token):
        """ get_case_with_id method

        Returns the case document with the associated ID or
        null if it does not exis in the DB.

        Args:
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
        Returns:
            JSON document corresponding to that case_id
        """
        case = json.loads(
            self._get(self._MDB[collections.CASES], case_id, token, False))
        if case and token in case['users']:
            return self._get(self._MDB[collections.CASES], case_id, token,
                             False)
        else:
            return {}

    def update_case_name(self, name, case_id):
        """ update_case_name method

        Updates a given case to have a specific name

        Args:
            name (string): the new name of the case
            case_id (string): the case to be updated
        Returns:
            True if success, False otherwise
        """
        case_id = int(case_id)
        cases_coll = self._MDB[collections.CASES]
        case = json.loads(self._get(self._MDB[collections.CASES],
                          case_id, self._GLOBALLY_ACCEPTED_TOKEN, False))
        if case:
            cases_coll.update_one({'case_id': case_id}, {
                '$set': {'case_name': name}})
            return True
        return False

    def delete_case_with_id(self, case_id, token):
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
        # delete in all collections except 'cases'
        self.generic_delete('driver_iterations', case_id, token)
        self.generic_delete('driver_metadata', case_id, token)
        self.generic_delete('global_iterations', case_id, token)
        self.generic_delete('metadata', case_id, token)
        self.generic_delete('solver_iterations', case_id, token)
        self.generic_delete('solver_metadata', case_id, token)
        self.generic_delete('system_iterations', case_id, token)
        self.generic_delete('system_metadata', case_id, token)

        # delete the case in the 'cases' collection
        cases_coll = self._MDB[collections.CASES]
        queried = cases_coll.find(
            {'$and': [{'case_id': int(case_id)}, {'users': token}]})
        if queried.count() == 0:
            return False

        cases_coll.delete_one({'case_id': int(case_id)})
        return True

    def create_case(self, body, token):
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
        if not user_exists(token=token) or not user_active(token):
            return -1

        case_id = self._get_case_id()
        if case_id == -1:
            return case_id

        body['case_id'] = case_id
        body['date'] = str(datetime.datetime.utcnow())
        body['users'] = [token]
        cases_coll = self._MDB[collections.CASES]
        cases_coll.insert_one(body)
        return case_id

    def update_layout(self, body, case_id):
        """ update_layout method

        Updates the layout for a given case. Creates new layout if
        one does not already exist.

        Args:
            body (JSON): the body of the POST request
            case_id (string): the case to be updated
        Returns:
            True if success, False otherwies

        TODO: handle users and don't create if case doesn't exist
        """
        if self._get(self._MDB[collections.CASES], case_id,
                     self._GLOBALLY_ACCEPTED_TOKEN) == '[]':
            return False

        layout_coll = self._MDB[collections.LAYOUTS]
        layout_coll.delete_many({'case_id': int(case_id)})
        body['case_id'] = int(case_id)
        body['date'] = str(datetime.datetime.utcnow())
        layout_coll.insert_one(body)
        return True

    def generic_get(self, collection_name, case_id, token, get_many=True):
        """ generic_get method

        Performs a generic 'get' request, which attempts to query and return
        all documents with the given case_id from the given collection.

        Args:
            collection_name (string): the collection to query
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
            get_many (bool): whether you should query to get one or all
                             instances
        Returns:
            JSON array of documents returned from the query
        """
        return self._get(self._MDB[collection_name], case_id, token, get_many)

    def generic_create(self, collection_name, body, case_id, token, update):
        """ generic_create method

        Performs a generic 'post' request, which takes the body,
        adds a timestamp and the case_id, and inserts it into the collection.
        Returns True if it succeeded, False otherwise.

        Args:
            collection_name (string): the collection to query
            body (json): the document to be added to the collection
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
            update (bool): if we're updating the data or simply adding new data
        Returns:
            True if successfull, False otherwise
        """
        return self._create(self._MDB[collection_name], body, case_id,
                            token, update)

    def generic_delete(self, collection_name, case_id, token):
        """ generic_delete method

        Performs a generic 'delete' request, which attempts to delete all
        documents with the given case_id from the given collection.
        Returns True if anything was deleted, False otherwise.

        Args:
            collection_name (string): the collection to query
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
        Returns:
            True if successfull, False otherwise
        """
        return self._delete(self._MDB[collection_name], case_id, token)

    def user_exists(self, email=None, token=None):
        """ user_exists method

        Checks to see if a user is in the DB. If so, returns true.
        False otherwise. Can use email or token to check user

        Args:
            email (string): the email to check agianst (optional)
            token (string): the token to check against (optional)
        """
        users_coll = self._MDB[collections.USERS]

        if token is None:
            return users_coll.find({'email': email}).count() > 0
        else:
            return users_coll.find({'token': token}).count() > 0

    def get_user(self, token):
        """ get_user method

        Returns a user represented as a dictionary or an empty dictionary
        if user doesn't exist

        Args:
            token (string): the token associated with the user
        """
        if not user_exists(token=token):
            return {}

        users_coll = self._MDB[collections.USERS]

        return users_coll.find_one({'token': token})

    def user_active(self, token):
        """ user_active method

        Checks if a user is active. If so, returns true. False otherwise.

        Args:
            token(string): the token to be checked
        """
        users_coll = self._MDB[collections.USERS]
        user = users_coll.find_one({'token': token})
        if user is not None:
            if 'active' in user:
                return user['active']

        return False

    def get_new_token(self, name, email):
        """ get_new_token method

        Creates a new token and creates a new user with the token and username.

        Args:
            name (string): the user's name
            email (string): the user's email
        Returns:
            token (string): the token to be used by the user for recording
        """
        token = self._create_token()
        users_coll = self._MDB[collections.USERS]
        users_coll.insert_one({'name': name, 'token': token,
                               'email': email, 'active': False})
        return token

    def delete_token(self, token):
        """ delete_token method

        Deletes a token and everything associated with that token

        Args:
            token (string): the token to be deleted
        """
        if token_exists(token):
            all_cases = json.loads(get_all_cases(token))
            for c in all_cases:
                delete_case_with_id(c['case_id'], token)

            users_coll = self._MDB[collections.USERS]
            users_coll.delete_many({'token': token})

    def token_exists(self, token):
        """ token_exists method

        Checks to see if a token exists in the database

        Args:
            token (string): the token to be checked
        Returns:
            True if exists, False otherwise
        """
        users_coll = self._MDB[collections.USERS]
        return users_coll.find({'token': token}).count() > 0

    def get_system_iteration_data(self, case_id):
        """ get_system_iteration_data method

        Grabs all data for all system iterations for a given case

        Args:
            case_id (string): the case to use for querying
        Returns:
            Array of data
        """
        collection = self._MDB[collections.SYSTEM_ITERATIONS]
        return collection.find({'case_id': int(case_id)})

    def get_driver_iteration_data(self, case_id):
        """ get_driver_iteration_data method

        Grabs all data for all driver iterations for a given case

        Args:
            case_id (string): the case to use for querying
        Returns:
            Array of data
        """
        collection = self._MDB[collections.DRIVER_ITERATIONS]
        return collection.find({'case_id': int(case_id)})

    def activate_account(self, token):
        """ activate_account method

        Activates the account associated with a given token
        """
        collection = self._MDB[collections.USERS]
        collection.update_one({'token': token}, {'$set': {'active': True}})

    # region private

    def _create_token(self):
        """ _create_token method

        Attempts to create a unique token. Tries self._MAX_ID_ATTEMPTS
        before giving up

        Args:
            None
        Returns:
            Token if a unique one is found, otherwise -1
        """
        attempts = 0
        while True:
            token = ''.join(random.choice(string.ascii_uppercase +
                                          string.digits) for _ in range(10))
            attempts += 1
            if self._MDB.users.find({'token': token}).count() == 0:
                return token
            elif attempts >= self._MAX_ID_ATTEMPTS:
                return -1

    def _get_case_id(self):
        """ _get_case_id method

        Attempts to create an integer that does not already exist in the DB
        as a case_id. Attempts self._MAX_ID_ATTEMPTS times before giving up and
        returning -1.

        Args:
            None
        Returns:
            Returns -1 if failed or a non-negative integer if success
        """
        attempts = 0
        while True:
            attempts += 1
            case_id = random.randint(0, 2147483647)
            if self._MDB.cases.find({'case_id': case_id}).count() == 0:
                return case_id
            elif attempts >= self._MAX_ID_ATTEMPTS:  # max attempts
                return -1

    def _create_collections(self):
        """ _create_collections method

        Creates all collections if they have not been created in the local DB.
        Should be called before querying begins.

        Args:
            None
        Returns:
            None
        """
        if 'cases' not in self._MDB.collection_names():
            self._MDB.create_collection('cases')
        if 'driver_iterations' not in self._MDB.collection_names():
            self._MDB.create_collection('driver_iterations')
        if 'driver_metadata' not in self._MDB.collection_names():
            self._MDB.create_collection('driver_metadata')
        if 'global_iterations' not in self._MDB.collection_names():
            self._MDB.create_collection('global_iterations')
        if 'metadata' not in self._MDB.collection_names():
            self._MDB.create_collection('metadata')
        if 'solver_iterations' not in self._MDB.collection_names():
            self._MDB.create_collection('solver_iterations')
        if 'solver_metadata' not in self._MDB.collection_names():
            self._MDB.create_collection('solver_metadata')
        if 'system_iterations' not in self._MDB.collection_names():
            self._MDB.create_collection('system_iterations')
        if 'system_metadata' not in self._MDB.collection_names():
            self._MDB.create_collection('system_metadata')
        if 'users' not in self._MDB.collection_names():
            self._MDB.create_collection('users')
        if 'layouts' not in self._MDB.collection_names():
            self._MDB.create_collection('layouts')

    def _get(self, collection, case_id, token, get_many=True):
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
            if token == self._GLOBALLY_ACCEPTED_TOKEN:
                return dumps(collection.find({'case_id': int(case_id)},
                                             {'_id': False}))
            else:
                return dumps(collection.find({'$and': [{'case_id': int(case_id)},
                                                       {'users': token}]},
                                             {'_id': False}))
        else:
            if token == self._GLOBALLY_ACCEPTED_TOKEN:
                return dumps(collection.find_one({'case_id': int(case_id)},
                                                 {'_id': False}))
            else:
                return dumps(collection.find_one({'$and':
                                                  [{'case_id': int(case_id)},
                                                   {'users': token}]},
                                                 {'_id': False}))

    def _create(self, collection, body, case_id, token, update):
        """ _create method

        Performs a generic 'post' request, which takes the body,
        adds a timestamp and the case_id, and inserts it into the collection.
        Returns True if it succeeded, False otherwise.

        Args:
            collection_name (string): the collection to query
            body (json): the document to be added to the collection
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
            update (bool): whether or not we're just updating an existing
                           recording
        Returns:
            True if successfull, False otherwise
        """
        if not user_exists(token=token):
            print("User does not exist, not storing data")
            return False

        if update:
            if _get(self._MDB[collections.CASES], case_id, token) == '[]':
                return False
            if 'iteration_coordinate' in body:
                collection.delete_many({'$and': [{'case_id': int(case_id)},
                                                 {'iteration_coordinate':
                                                  body['iteration_coordinate']}]})
            elif 'counter' in body:
                collection.delete_many({'$and': [{'case_id': int(case_id)},
                                                 {'counter': body['counter']}]})
            elif 'solver_class' in body:
                collection.delete_many({'$and': [{'case_id': int(case_id)},
                                                 {'solver_class':
                                                  body['solver_class']}]})
            else:
                collection.delete_many({'case_id': int(case_id)})

        body['case_id'] = int(case_id)
        body['date'] = str(datetime.datetime.utcnow())
        body['users'] = [token]
        collection.insert_one(body)
        return True

    def _delete(self, collection, case_id, token):
        """ _delete method

        Performs a generic 'delete' request, which attempts to delete
        all documents with the given case_id from the given collection.
        Returns True if anything was deleted, False otherwise.

        Args:
            collection_name (string): the collection to query
            case_id (string || int): ID to be used for querying
            token (string): the token to be used for authentication
        Returns:
            True if successfull, False otherwise
        """
        queried = collection.find(
            {'$and': [{'case_id': int(case_id)}, {'users': token}]})
        if queried.count() == 0:
            return False
        collection.delete_many(
            {'$and': [{'case_id': int(case_id)}, {'users': token}]})
        return True

    # endregion
