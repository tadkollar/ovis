""" logic.py

This module contains all methods to perform any business logic required
between the presentation and data layers. This is the middle layer in the
3-tier architecture used in this project.

This layer is primarily used to do any data conversion between the expectation
at the presentation layer and the expectation at the data layer.
"""
import json
import time
from dateutil import tz
from datetime import datetime
import data_server.data.data as data

def get_model_data():
    """ get_model_data method

    Grabs and returns the model/connection information for the example case.
    NOTE: this is completely temporary and will be replaced entirely with
        the logic for getting driver metadata.

    Args:
        None
    Returns:
        JSON representing the model/connections of the example
    """
    return data.get_model_data()

def get_all_cases(token):
    """ get_all_cases method

    Grabs all case documents from the data layer.
    NOTE: this should be altered to only grab case documents for a given user

    Args:
        token (string): the token to be used for authentication
    Returns:
        JSON array of all case documents
    """
    cases = json.loads(data.get_all_cases(token))
    for case in cases:
        ind = case['date'].find('.')
        if ind > -1:
            case['date'] = case['date'][:ind]
        from_zone = tz.tzutc()
        to_zone = tz.tzlocal()
        case['date'] = datetime.strptime(case['date'], '%Y-%m-%d %H:%M:%S')
        case['date'] = case['date'].replace(tzinfo=from_zone).astimezone(to_zone)
        case['datestring'] = case['date'].strftime('%b %d, %Y at %I:%M %p')

    #sort by date
    cases.sort(key=lambda x: x['date'])
    cases = list(reversed(cases))

    return cases

def get_case_with_id(c_id, token):
    """ get_case_with_id method

    Uses the data layer to query and return a case with the given
    case ID.

    Args:
        case_id (string || int): the associated case_id for querying
        token (string): the token to be used for authentication
    Returns:
        JSON document of the case
    """
    return data.get_case_with_id(c_id, token)

def delete_case_with_id(c_id, token):
    """ delete_case_with_id method

    Deletes a case with the given ID. Returns true if it deleted anything
    or false if it did not.

    Args:
        case_id (string || int): the associated case_id for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    return data.delete_case_with_id(c_id, token)

def create_case(body, token):
    """ create_case method

    Adds the given case to the cases collection through the data layer
    and responds with a unique integer ID that is the new case_id to be
    used for all other queries.

    Args:
        body (JSON): the body of the original POST request to be put in the collection
        token (string): the token to be used for authentication
    Returns:
        Integer case_id to be used in all other HTTP requests
    """
    c_id = data.create_case(body, token)
    ret = {}
    ret['case_id'] = c_id
    ret['status'] = 'Success'
    if c_id == -1:
        ret['status'] = 'Failed to create ID'
    return ret

def generic_get(collection_name, case_id, token):
    """ generic_get method

    Performs the typical 'get' request, passing the case_id to the data layer
    and returning the list of documents in the given collection with that case_id.

    Args:
        collection_name (string): the collection to be queried
        case_id (string || int): the case_id for querying
        token (string): the token to be used for authentication
    Returns:
        Array of documents with the given case_id from the given collection
    """
    return data.generic_get(collection_name, case_id, token)

def generic_create(collection_name, body, case_id, token):
    """ generic_create method

    Performs the typical 'post' request. Takes the body and case_id, passes
    them to the data layer to be added to the collection. Returns True if it
    was successfully added and False otherwise.

    Args:
        collection_name (string): the collection to be queried
        body (json): document to be added to the collection
        case_id (string || int): the case_id for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    return data.generic_create(collection_name, body, case_id, token)

def generic_delete(collection_name, case_id, token):
    """ generic_delete method

    Performs the typical 'delete'. Passes the collection name and ID to the data layer.
    This should delete all documents in the collection with the given case_id. Returns
    True if anything was deleted, False otherwise.

    Args:
        collection_name (string): the collection to be queried
        case_id (string || int): the case_id for querying
        token (string): the token to be used for authentication
    Returns:
        True if successfull, False otherwise
    """
    return data.generic_delete(collection_name, case_id, token)

def create_token(name, email):
    """ create_token method

    Checks to see if a user already exists. If not, sends a new token.

    Args:
        name (string): the user name
        email (string): the user's email
    Returns:
        token if successful or -1 otherwise
    """
    if data.user_exists(email):
        return -1

    return data.get_new_token(name, email)

def token_exists(token):
    """ token_exists method

    Checks to see if a token exists in the database

    Args:
        token (string): the token to be checked
    Returns:
        True if exists, False otherwise
    """
    return data.token_exists(token)

def get_system_iteration_data(case_id, variable):
    """ get_system_iteration_data method

    Grabs and returns all data for a given variable over each iteration
    in the system_iteration collection

    Args:
        case_id (string): the case whose data will be checked
        variable (string): the variable whose data is to be used for querying
    Returns:
        Array of data
    """
    dat = data.get_system_iteration_data(case_id)
    ret = []
    for i in dat:
        for v in i['inputs']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(i['iteration_coordinate'])
                v['counter'] = i['counter']
                ret.append(v)

        for v in i['outputs']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(i['iteration_coordinate'])
                v['counter'] = i['counter']
                ret.append(v)

    return json.dumps(ret)

def get_variables(case_id):
    """ get_variables method

    Grabs all variables in system_iterations for a given case_id

    Args:
        case_id (string): the case to be queried
    Returns:
        Array of string variable names
    """
    dat = data.get_system_iteration_data(case_id)
    ret = []
    for i in dat:
        for v in i['inputs']:
            if v['name'] not in ret:
                ret.append(v['name'])
        for v in i['outputs']:
            if v['name'] not in ret:
                ret.append(v['name'])

    return json.dumps(ret)

def _extract_iteration_coordinate(coord):
    """ private extract_iteration_coordinate method

    Splits up the iteration coordinate string and returns it as a JSON array

    Args:
        coord (string): the coordinate to be split up
    Returns:
        Array of JSON of the object
    """
    delimiter = '|'
    ret = []

    split_coord = coord.split(delimiter)
    i = 0
    while i < len(split_coord):
        node = {}
        node['name'] = split_coord[i]
        node['iteration'] = split_coord[i+1]
        ret.append(node)
        i += 2

    return ret
