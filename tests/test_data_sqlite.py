import unittest
import sys
import os.path
import json
from bson.json_util import dumps

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), os.path.pardir)))

from data_server.data.sqlite_data import SqliteData

data = SqliteData()




if __name__ == "__main__":
    try:
        unittest.main()