""" data.py
Base class for data classes that connect to DBs and perform queries.
"""


class BaseData(object):
    """ BaseData class

    Abstract base class of all implementations of the Data layer.
    """

    def __init__(self):
        """
        Initialize.
        """
        self._GLOBALLY_ACCEPTED_TOKEN = 'squavy'
        self.connected = False

    def connect(self):
        """ connect method

        Connect to the DB.
        """
        raise NotImplementedError()

    def get_all_cases(self, token):
        """ get_all_cases method

        Returns all case documents from the cases collection for which
        the given token has access.

        Args:
            token (string): the token to query against
        Returns:
            JSON array of case documents
        """
        raise NotImplementedError()

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
        raise NotImplementedError()

    def update_case_name(self, name, case_id):
        """ update_case_name method

        Updates a given case to have a specific name

        Args:
            name (string): the new name of the case
            case_id (string): the case to be updated
        Returns:
            True if success, False otherwise
        """
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

    def update_layout(self, body, case_id):
        """ update_layout method

        Updates the layout for a given case. Creates new layout if
        one does not already exist.abs

        Args:
            body (JSON): the body of the POST request
            case_id (string): the case to be updated
        Returns:
            True if success, False otherwies

        TODO: handle users and don't create if case doesn't exist
        """
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

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
        raise NotImplementedError()

    def user_exists(self, email=None, token=None):
        """ user_exists method

        Checks to see if a user is in the DB. If so, returns true. False
        otherwise. Can use email or token to check user

        Args:
            email (string): the email to check agianst (optional)
            token (string): the token to check against (optional)
        """
        raise NotImplementedError()

    def get_user(self, token):
        """ get_user method

        Returns a user represented as a dictionary or an empty dictionary if
        user doesn't exist

        Args:
            token (string): the token associated with the user
        """
        raise NotImplementedError()

    def user_active(self, token):
        """ user_active method

        Checks if a user is active. If so, returns true. False otherwise.

        Args:
            token(string): the token to be checked
        """
        raise NotImplementedError()

    def get_new_token(self, name, email):
        """ get_new_token method

        Creates a new token and creates a new user with the token and username.

        Args:
            name (string): the user's name
            email (string): the user's email
        Returns:
            token (string): the token to be used by the user for recording
        """
        raise NotImplementedError()

    def delete_token(self, token):
        """ delete_token method

        Deletes a token and everything associated with that token

        Args:
            token (string): the token to be deleted
        """
        raise NotImplementedError()

    def token_exists(self, token):
        """ token_exists method

        Checks to see if a token exists in the database

        Args:
            token (string): the token to be checked
        Returns:
            True if exists, False otherwise
        """
        raise NotImplementedError()

    def get_system_iteration_data(self, case_id):
        """ get_system_iteration_data method

        Grabs all data for all system iterations for a given case

        Args:
            case_id (string): the case to use for querying
        Returns:
            Array of data
        """
        raise NotImplementedError()

    def get_driver_iteration_data(self, case_id):
        """ get_driver_iteration_data method

        Grabs all data for all driver iterations for a given case

        Args:
            case_id (string): the case to use for querying
        Returns:
            Array of data
        """
        raise NotImplementedError()

    def activate_account(self, token):
        """ activate_account method

        Activates the account associated with a given token
        """
        raise NotImplementedError()
