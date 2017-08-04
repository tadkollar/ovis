""" logic.py

This module contains all methods to perform any business logic required
between the presentation and data layers. This is the middle layer in the
3-tier architecture used in this project.

This layer is primarily used to do any data conversion between the expectation
at the presentation layer and the expectation at the data layer.
"""
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

def get_all_cases():
    """ get_all_cases method

    Grabs all case documents from the data layer.
    NOTE: this should be altered to only grab case documents for a given user

    Args:
        None
    Returns:
        JSON array of all case documents
    """
    return data.get_all_cases()

def get_case_with_id(c_id):
    """ get_case_with_id method

    Uses the data layer to query and return a case with the given
    case ID.

    Args:
        case_id (string || int): the associated case_id for querying
    Returns:
        JSON document of the case
    """
    return data.get_case_with_id(c_id)

def delete_case_with_id(c_id):
    """ delete_case_with_id method

    Deletes a case with the given ID. Returns true if it deleted anything
    or false if it did not.

    Args:
        case_id (string || int): the associated case_id for querying
    Returns:
        True if successfull, False otherwise
    """
    return data.delete_case_with_id(c_id)

def create_case(body):
    """ create_case method

    Adds the given case to the cases collection through the data layer
    and responds with a unique integer ID that is the new case_id to be
    used for all other queries.

    Args:
        body (JSON): the body of the original POST request to be put in the collection
    Returns:
        Integer case_id to be used in all other HTTP requests
    """
    c_id = data.create_case(body)
    ret = {}
    ret['case_id'] = c_id
    ret['status'] = 'Success'
    if c_id == -1:
        ret['status'] = 'Failed to create ID'
    return ret

def generic_get(collection_name, case_id):
    """ generic_get method

    Performs the typical 'get' request, passing the case_id to the data layer
    and returning the list of documents in the given collection with that case_id.

    Args:
        collection_name (string): the collection to be queried
        case_id (string || int): the case_id for querying
    Returns:
        Array of documents with the given case_id from the given collection
    """
    return data.generic_get(collection_name, case_id)

def generic_create(collection_name, body, case_id):
    """ generic_create method

    Performs the typical 'post' request. Takes the body and case_id, passes
    them to the data layer to be added to the collection. Returns True if it
    was successfully added and False otherwise.

    Args:
        collection_name (string): the collection to be queried
        body (json): document to be added to the collection
        case_id (string || int): the case_id for querying
    Returns:
        True if successfull, False otherwise
    """
    return data.generic_create(collection_name, body, case_id)

def generic_delete(collection_name, case_id):
    """ generic_delete method

    Performs the typical 'delete'. Passes the collection name and ID to the data layer.
    This should delete all documents in the collection with the given case_id. Returns
    True if anything was deleted, False otherwise.

    Args:
        collection_name (string): the collection to be queried
        case_id (string || int): the case_id for querying
    Returns:
        True if successfull, False otherwise
    """
    return data.generic_delete(collection_name, case_id)

def create_token(name):
    """ create_token method

    Checks to see if a user already exists. If not, sends a new token.

    Args:
        name (string): the user name
    Returns: 
        token if successful or -1 otherwise
    """
    if data.user_exists(name):
        return -1

    return data.get_new_token(name)