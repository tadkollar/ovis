""" presentation.py

This module contains all classes that are used by Main.py to handle
HTTP requests based on the URLs given. These classes ought not be used
outside of main.py. In the 3-tier architecture being used, this is the top
(presentation) layer.
"""
import tornado.web as web
import json
import data_server.logic.logic as logic
import data_server.shared.collection_names as collections

_TOKEN = 'squavy'


class IndexHandler(web.RequestHandler):
    """ IndexHandler class

    Contains logic for getting the main page from the server.
    """

    def get(self):
        token = str(self.get_secure_cookie("token"))
        token = token.replace("b'", '')
        token = token.replace("'", '')
        if self.get_secure_cookie("token"):
            cases = logic.get_all_cases(token)
            self.render("../../public/list_cases.html",
                        cases=cases, token=token)
        else:
            self.render("../../public/login.html")


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


class LogoutHandler(web.RequestHandler):
    """ LogoutHandler class

    Contains logic for logging out a user
    """

    def get(self):
        self.clear_cookie("token")


class CaseHandler(web.RequestHandler):
    """ CaseHandler class

    Handles all get/post/delete for /case and /case/[0-9]+, which includes
    rendering the dashboard if it is given a case ID, responding with
    all cases if it isn't, posting a new case (responding with an ID),
    and deleting everything associated with a given case ID.
    """

    def get(self, *params):
        if len(params) == 0:
            self.write(logic.get_all_cases(self.request.headers.get('token')))
        else:
            self.render("../../public/dashboard.html")

    def post(self):
        body = json.loads(self.request.body)
        ret = logic.create_case(body, self.request.headers.get('token'))
        self.write(ret)

    def delete(self, *params):
        ret = _get_ret()
        if logic.delete_case_with_id(params[0],
                                     self.request.headers.get('token')):
            self.write(ret)
        else:
            ret['status'] = 'Failed'
            self.write(ret)

    def patch(self, *params):
        ret = _get_ret()
        body = json.loads(self.request.body)
        if logic.update_case_name(body['name'], params[0]):
            self.write(ret)
        else:
            ret['status'] = 'Failed'
            self.write(ret)


class LayoutHandler(web.RequestHandler):
    """ LayoutHandler class

    Handles all get/post/delete for /case/case_id/layout, which is used
    to store and grab layouts for a given case
    """

    def get(self, *params):
        _generic_get(collections.LAYOUTS, self, params[0], _TOKEN)

    def post(self, *params):
        ret = logic.update_layout(json.loads(self.request.body), params[0])
        write = {}
        write['status'] = 'Success' if ret else 'Failed'
        self.write(write)


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
    """ DriverMetadata class

    Contians logic to get/post/delete data in the driver_metadata
    collection.
    """

    def get(self, *params):
        _generic_get(collections.DRIVER_METADATA, self, params[0], _TOKEN)

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
        ret = logic.metadata_get(params[0], _TOKEN)
        self.write(ret)

    def post(self, *params):
        body = json.loads(self.request.body)
        if(logic.metadata_create(body, params[0],
                                 self.request.headers.get('token'))):
            self.write({'status': 'Success'})
        else:
            self.write({'status': 'Failed'})

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


class TokenHandler(web.RequestHandler):
    """ Token Handler class

    Contains logic to create a new token if passed a username
    """

    def post(self, *params):
        body = json.loads(self.request.body)
        token = logic.create_token(body['name'], body['email'])
        ret = _get_ret()
        if token == -1:
            ret['status'] = 'Failed'
            ret['reasoning'] = 'Name already exists'
        else:
            logic.send_activation_email(token, body['name'], body['email'])
            ret['token'] = token
        self.write(ret)


class LoginHandler(web.RequestHandler):
    """ Login Handler class

    Contains logic to determine if login is successfull
    """

    def post(self, *params):
        body = json.loads(self.request.body)
        ret = _get_ret()
        if logic.token_exists(body['token']):
            self.set_secure_cookie("token", body['token'])
            self.write(ret)
        else:
            ret['status'] = 'Failed'
            ret['reasoning'] = 'Bad key'
            self.write(ret)

    def get(self, *params):
        token = str(self.get_secure_cookie("token"))
        token = token.replace("b'", '')
        token = token.replace("'", '')
        if self.get_secure_cookie("token"):
            cases = logic.get_all_cases(token)
            self.render("../../public/list_cases.html",
                        cases=cases, token=token)
        else:
            self.render("../../public/login.html")


class ActivationHandler(web.RequestHandler):
    """ Activation Handler class

    Contains logic for activating an account
    """

    def get(self, *params):
        self.write("<html>Account Activated</html>")
        logic.activate_account(params[0])
        logic.send_activated_email(params[0])


class SystemIterationVariableHandler(web.RequestHandler):
    """ System Iteration Variable Handler class

    Contains logic to grab the system iteration data for
    a specific variable
    """

    def get(self, *params):
        data = logic.get_system_iteration_data(params[0], params[1])

        self.write(data)


class VariablesHandler(web.RequestHandler):
    """ Variables handler class

    Contains logic to get variables for a given case
    """

    def get(self, *params):
        variables = logic.get_variables(params[0])

        self.write(variables)


class DriverIterationVariableHandler(web.RequestHandler):
    """ Driver Iteration Variable Handler class

    Contains logic to grab the driver iteration data for
    a specific variable
    """

    def get(self, *params):
        if 'cur_max_count' in self.request.headers:
            data =\
                logic.get_driver_iteration_based_on_count(params[0], params[1],
                                                          self.request.headers.
                                                          get('cur_max_count'))
        else:
            data = logic.get_driver_iteration_data(params[0], params[1])

        self.write(data)


class DesvarsHandler(web.RequestHandler):
    """ Desvars handler class

    Contains logic to get Desvars for a given case
    """

    def get(self, *params):
        variables = logic.get_desvars(params[0])

        self.write(variables)

# region private_methods


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


def _generic_get(collection_name, request_handler, case_id, token=None):
    """ _generic_get private method

    Performs a typical 'get' request which accesses the collection given
    and returns a JSON array of all documents in that collection with
    the given case_id.

    Args:
        collection_name (string): name of collection to access
        request_handler (Object): object used for responding with data
        case_id (string || int): the associated case_id for querying
        token (string): token to be used. If set to None (default)
            will automaticlaly grab from header
    Returns:
        None
    """

    if token is None:
        token = request_handler.request.headers.get('token')
    request_handler.write(logic.generic_get(collection_name, case_id,
                                            token))


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
    if logic.generic_create(collection_name, body, case_id,
                            request_handler.request.headers.get('token'),
                            request_handler.request.headers.get('update')):
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
    if logic.generic_delete(collection_name, case_id,
                            request_handler.request.headers.get('token')):
        request_handler.write(ret)
    else:
        ret['status'] = 'Failed'
        request_handler.write(ret)

# endregion
