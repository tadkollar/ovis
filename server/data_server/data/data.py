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
        self.connected = False

    def connect(self, location):
        """ connect method

        Connect to the DB.
        """
        raise NotImplementedError()

    def update_layout(self, body):
        """ update_layout method

        Updates the layout for a given case. Creates new layout if
        one does not already exist.abs

        Args:
            body (JSON): the body of the POST request
        Returns:
            True if success, False otherwies

        TODO: handle users and don't create if case doesn't exist
        """
        raise NotImplementedError()

    def generic_get(self, collection_name, get_many=True):
        """ generic_get method

        Performs a generic 'get' request, which attempts to query and return
        all documents from the given collection.

        Args:
            collection_name (string): the collection to query
            get_many (bool): whether you should query to get one or all
                instances
        Returns:
            JSON array of documents returned from the query
        """
        raise NotImplementedError()

    def generic_create(self, collection_name, body, update):
        """ generic_create method

        Performs a generic 'post' request, which takes the body,
        adds a timestamp, and inserts it into the collection.
        Returns True if it succeeded, False otherwise.

        Args:
            collection_name (string): the collection to query
            body (json): the document to be added to the collection
            update (bool): if we're updating the data or simply adding new data
        Returns:
            True if successfull, False otherwise
        """
        raise NotImplementedError()

    def generic_delete(self, collection_name):
        """ generic_delete method

        Performs a generic 'delete' request, which attempts to delete all
        documents from the given collection.
        Returns True if anything was deleted, False otherwise.

        Args:
            collection_name (string): the collection to query
        Returns:
            True if successfull, False otherwise
        """
        raise NotImplementedError()

    def get_system_iteration_data(self):
        """ get_system_iteration_data method

        Grabs all data for all system iterations for a given case

        Returns:
            Array of data
        """
        raise NotImplementedError()

    def get_driver_iteration_data(self):
        """ get_driver_iteration_data method

        Grabs all data for all driver iterations for a given case

        Returns:
            Array of data
        """
        raise NotImplementedError()

    def is_new_data(self, count):
        """ is_new_data method

        Determines if there's new data based on the count

        Args:
            count (int): the current max counter value
        Returns:
            True if new data is available, False otherwise
        """
        raise NotImplementedError()
