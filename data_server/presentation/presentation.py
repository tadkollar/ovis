""" presentation.py

This module contains all classes that are used by Main.py to handle
HTTP requests based on the URLs given. These classes ought not be used
outside of main.py. In the 3-tier architecture being used, this is the top
(presentation) layer.
"""
import tornado.web as web
import json
import data_server.logic.logic as logic
import data_server.shared.collections as collections

class IndexHandler(web.RequestHandler):
    """ IndexHandler class

    Contains logic for getting the main page from the server.abs
    TODO: create and render a new main page to allow sign in and
        view existing cases.
    """
    def get(self):
        self.render("../../public/index.html")

class ModelDataHandler(web.RequestHandler):
    """ ModelDataHandler

    Contains logic for getting the stored model/connections data.
    NOTE: this is completely temporary and should be replaced
        by getting the driver metadata.
    """
    def get(self):
        self.write(logic.get_model_data())

class CaseHandler(web.RequestHandler):
    """ CaseHandler class

    Handles all get/post/delete for /case and /case/[0-9]+, which includes
    rendering the N^2 diagram if it is given a case ID, responding with
    all cases if it isn't, posting a new case (responding with an ID),
    and deleting everything associated with a given case ID.
    """
    def get(self, *params):
        if len(params) == 0:
            #NOTE: should only get cases available to user
            self.write(logic.get_all_cases())
        else:
            self.render("../../public/index.html")

    def post(self):
        body = json.loads(self.request.body)
        ret = logic.create_case(body)
        self.write(ret)

    def delete(self, *params):
        ret = _get_ret()
        if logic.delete_case_with_id(params[0]):
            self.write(ret)
        else:
            ret['status'] = 'Failed'
            self.write(ret)

class DriverIterationsHandler(web.RequestHandler):
    """ DriverIterationsHandler class

    Contains logic to get/post/delete data in the driver_iterations
    collection.
    """
    def get(self, *params):
        _generic_get(collections.DRIVER_ITERATIONS, self, params[0])

    def post(self, *params):
        _generic_post(collections.DRIVER_ITERATIONS, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.DRIVER_ITERATIONS, self, params[0])

class DriverMetadataHandler(web.RequestHandler):
    """ DriverMetadata

    Contians logic to get/post/delete data in the driver_metadata
    collection.
    """
    def get(self, *params):
        _generic_get(collections.DRIVER_METADATA, self, params[0])

    def post(self, *params):
        _generic_post(collections.DRIVER_METADATA, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.DRIVER_METADATA, self, params[0])

class GlobalIterationsHandler(web.RequestHandler):
    """ GlobalIterationsHandler class

    Containslogic to get/post/delete data in the driver_metadata
    collection.
    """    
    def get(self, *params):
        _generic_get(collections.GLOBAL_ITERATIONS, self, params[0])

    def post(self, *params):
        _generic_post(collections.GLOBAL_ITERATIONS, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.GLOBAL_ITERATIONS, self, params[0])

class MetadataHandler(web.RequestHandler):
    """ MetadataHandler class

    Contains logic to get/post/delete data in the metadata
    collection.
    """
    def get(self, *params):
        _generic_get(collections.METADATA, self, params[0])

    def post(self, *params):
        _generic_post(collections.METADATA, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.METADATA, self, params[0])

class SolverIterationsHandler(web.RequestHandler):
    """ SolverIterationsHandler class

    Contains logic to get/post/delete data in the solver_iterations
    collection.
    """
    def get(self, *params):
        _generic_get(collections.SOLVER_ITERATIONS, self, params[0])

    def post(self, *params):
        _generic_post(collections.SOLVER_ITERATIONS, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.SOLVER_ITERATIONS, self, params[0])

class SolverMetadataHandler(web.RequestHandler):
    """ SolverMetadataHandler class

    Contains logic to get/post/delete data in the solver_metadata
    collection.
    """
    def get(self, *params):
        _generic_get(collections.SOLVER_METADATA, self, params[0])

    def post(self, *params):
        _generic_post(collections.SOLVER_METADATA, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.SOLVER_METADATA, self, params[0])

class SystemIterationsHandler(web.RequestHandler):
    """ SystemIterationsHandler class

    Contains logic to get/post/delete data in the system_iterations
    collection.
    """
    def get(self, *params):
        _generic_get(collections.SYSTEM_ITERATIONS, self, params[0])

    def post(self, *params):
        _generic_post(collections.SYSTEM_ITERATIONS, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.SYSTEM_ITERATIONS, self, params[0])

class SystemMetadataHandler(web.RequestHandler):
    """ SystemMetadata class

    Contains logic to get/post/delete data in the system_metadata
    collection.
    """
    def get(self, *params):
        _generic_get(collections.SYSTEM_METADATA, self, params[0])

    def post(self, *params):
        _generic_post(collections.SYSTEM_METADATA, self, params[0])

    def delete(self, *params):
        _generic_delete(collections.SYSTEM_METADATA, self, params[0])

#region private_methods

def _get_ret():
    """ _get_ret private method

    Returns an initialized hashmap DS with 'status' set to 'Success'
    by default.

    Args:
        None
    Returns:
        hashmap: 'status' set to 'Success'
    """
    ret = {}
    ret['status'] = 'Success'
    return ret

def _generic_get(collection_name, request_handler, case_id):
    """ _generic_get private method

    Performs a typical 'get' request which accesses the collection given
    and returns a JSON array of all documents in that collection with
    the given case_id.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
        case_id (string || int): the associated case_id for querying
    Returns:
        None
    """
    request_handler.write(logic.generic_get(collection_name, case_id))

def _generic_post(collection_name, request_handler, case_id):
    """ _generic_post private method

    Performs a typical 'post' request which adds the body of the 
    POST request as a document to the given collection and responds
    with a status JSON object.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
        case_id (string || int): the associated case_id for querying
    Returns:
        None
    """
    ret = _get_ret()
    body = json.loads(request_handler.request.body)
    if logic.generic_create(collection_name, body, case_id):
        request_handler.write(ret)
    else:
        ret['status'] = 'Failed'
        request_handler.write(ret)

def _generic_delete(collection_name, request_handler, case_id):
    """ _generic_delete private method

    Performs a typical 'delete' request which removes all instances
    of documents in the given collection with the given case_id.
    Responds with a status JSON object.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
        case_id (string || int): the associated case_id for querying
    Returns:
        None
    """
    ret = _get_ret()
    if logic.generic_delete(collection_name, case_id):
        request_handler.write(ret)
    else:
        ret['status'] = 'Failed'
        request_handler.write(ret)

#endregion
