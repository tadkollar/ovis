""" presentation.py

This module contains all classes that are used by Main.py to handle
HTTP requests based on the URLs given. These classes ought not be used
outside of main.py. In the 3-tier architecture being used, this is the top
(presentation) layer.
"""
import json
import tornado.web as web
import data_server.logic.logic as logic
import data_server.shared.collection_names as collections


class ConnectHandler(web.RequestHandler):
    """ ConnectHandler class

    Contains logic to tell Logic/Data layers to connect to the given
    DB.
    """

    def post(self):
        db_location = json.loads(self.request.body)['location']
        if logic.connect(db_location):
            self.write({"Success": True})
        else:
            self.write({"Success": False})


class LayoutHandler(web.RequestHandler):
    """ LayoutHandler class

    Handles all get/post/delete for /case/case_id/layout, which is used
    to store and grab layouts for a given case
    """

    def get(self, *params):
        _generic_get(collections.LAYOUTS, self)

    def post(self, *params):
        ret = logic.update_layout(json.loads(self.request.body))
        write = {}
        write['status'] = 'Success' if ret else 'Failed'
        self.write(write)


class DriverIterationsHandler(web.RequestHandler):
    """ DriverIterationsHandler class

    Contains logic to get/post/delete data in the driver_iterations
    collection.
    """

    def get(self, *params):
        _generic_get(collections.DRIVER_ITERATIONS, self)

    def post(self, *params):
        _generic_post(collections.DRIVER_ITERATIONS, self)

    def delete(self, *params):
        _generic_delete(collections.DRIVER_ITERATIONS, self)


class DriverMetadataHandler(web.RequestHandler):
    """ DriverMetadata class

    Contians logic to get/post/delete data in the driver_metadata
    collection.
    """

    def get(self, *params):
        _generic_get(collections.DRIVER_METADATA, self)

    def post(self, *params):
        _generic_post(collections.DRIVER_METADATA, self)

    def delete(self, *params):
        _generic_delete(collections.DRIVER_METADATA, self)


class GlobalIterationsHandler(web.RequestHandler):
    """ GlobalIterationsHandler class

    Containslogic to get/post/delete data in the driver_metadata
    collection.
    """

    def get(self, *params):
        _generic_get(collections.GLOBAL_ITERATIONS, self)

    def post(self, *params):
        _generic_post(collections.GLOBAL_ITERATIONS, self)

    def delete(self, *params):
        _generic_delete(collections.GLOBAL_ITERATIONS, self)


class MetadataHandler(web.RequestHandler):
    """ MetadataHandler class

    Contains logic to get/post/delete data in the metadata
    collection.
    """

    def get(self, *params):
        ret = logic.metadata_get()
        self.write(ret)

    def delete(self, *params):
        _generic_delete(collections.METADATA, self)

    def post(self, *params):
        _generic_post(collections.METADATA, self)


class SolverIterationsHandler(web.RequestHandler):
    """ SolverIterationsHandler class

    Contains logic to get/post/delete data in the solver_iterations
    collection.
    """

    def get(self, *params):
        _generic_get(collections.SOLVER_ITERATIONS, self)

    def post(self, *params):
        _generic_post(collections.SOLVER_ITERATIONS, self)

    def delete(self, *params):
        _generic_delete(collections.SOLVER_ITERATIONS, self)


class SolverMetadataHandler(web.RequestHandler):
    """ SolverMetadataHandler class

    Contains logic to get/post/delete data in the solver_metadata
    collection.
    """

    def get(self, *params):
        _generic_get(collections.SOLVER_METADATA, self)

    def post(self, *params):
        _generic_post(collections.SOLVER_METADATA, self)

    def delete(self, *params):
        _generic_delete(collections.SOLVER_METADATA, self)


class SystemIterationsHandler(web.RequestHandler):
    """ SystemIterationsHandler class

    Contains logic to get/post/delete data in the system_iterations
    collection.
    """

    def get(self, *params):
        _generic_get(collections.SYSTEM_ITERATIONS, self)

    def post(self, *params):
        _generic_post(collections.SYSTEM_ITERATIONS, self)

    def delete(self, *params):
        _generic_delete(collections.SYSTEM_ITERATIONS, self)


class SystemMetadataHandler(web.RequestHandler):
    """ SystemMetadata class

    Contains logic to get/post/delete data in the system_metadata
    collection.
    """

    def get(self, *params):
        _generic_get(collections.SYSTEM_METADATA, self)

    def post(self, *params):
        _generic_post(collections.SYSTEM_METADATA, self)

    def delete(self, *params):
        _generic_delete(collections.SYSTEM_METADATA, self)


class DriverIterationVariableHandler(web.RequestHandler):
    """ Driver Iteration Variable Handler class

    Contains logic to grab the driver iteration data for
    a specific variable
    """

    def get(self, *params):
        if 'cur_max_count' in self.request.headers:
            data=logic.get_driver_iteration_based_on_count(params[0],
                                                          self.request.headers.
                                                          get('cur_max_count'))
        else:
            data=logic.get_driver_iteration_data(params[0])

        self.write(data)


class AllVarsHandler(web.RequestHandler):
    """ Desvars handler class

    Contains logic to get Desvars for a given case
    """

    def get(self, *params):
        variables=logic.get_all_driver_vars()

        self.write(variables)


def _get_ret():
    """ _get_ret private method

    Returns an initialized hashmap DS with 'status' set to 'Success'
    by default.

    Args:
        None
    Returns:
        hashmap: 'status' set to 'Success'
    """

    ret={}
    ret['status']='Success'
    return ret


def _generic_get(collection_name, request_handler):
    """ _generic_get private method

    Performs a typical 'get' request which accesses the collection given
    and returns a JSON array of all documents in that collection with
    the given case_id.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
    Returns:
        None
    """

    dat=logic.generic_get(collection_name)
    request_handler.write(dat)


def _generic_post(collection_name, request_handler):
    """ _generic_post private method

    Performs a typical 'post' request which adds the body of the
    POST request as a document to the given collection and responds
    with a status JSON object.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
    Returns:
        None
    """

    ret=_get_ret()
    body=json.loads(request_handler.request.body)
    ret['status']='Failed'
    request_handler.write(ret)


def _generic_delete(collection_name, request_handler):
    """ _generic_delete private method

    Performs a typical 'delete' request which removes all instances
    of documents in the given collection with the given case_id.
    Responds with a status JSON object.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
    Returns:
        None
    """

    ret=_get_ret()
    ret['status']='Failed'
    request_handler.write(ret)
