""" logic.py

This module contains all methods to perform any business logic required
between the presentation and data layers. This is the middle layer in the
3-tier architecture used in this project.

This layer is primarily used to do any data conversion between the expectation
at the presentation layer and the expectation at the data layer.
"""
import os
import json
import warnings
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dateutil import tz
from datetime import datetime
from six import PY2, PY3
import data_server.shared.collection_names as collections
from data_server.data.sqlite_data import SqliteData

_data = SqliteData()


def connect(location):
    """ connect method

    Attempts to create a connection with the given DB at the given
    location for SQLite files

    Returns:
        bool: True if connection established, False otherwise
    """
    return _data.connect(location)

def disconnect():
    """ disconnect method

    Disconnect the data layer.

    Returns:
        bool: True if disconnected, False otherwise. Defaults to True
    """
    if _data is not None:
        return _data.disconnect()
    return True


def update_layout(body):
    """ update_layout method

    Updates the layout for a given case.

    Args:
        body (JSON): the new layout
    Returns:
        True if success, False otherwies
    """
    return _data.update_layout(json.dumps(body))


def metadata_get():
    """ metadata_get method

    Grabs and returns the metadata for a given case
    """
    n_abs2prom = {'input': {}, 'output': {}}
    n_prom2abs = {'input': {}, 'output': {}}

    res = _data.generic_get(collections.METADATA, False)

    if res is not None and 'abs2prom' in res:
        for io in ['input', 'output']:
            for k in res['abs2prom'][io]:
                n_k = k.replace('___', '.')
                n_abs2prom[io][n_k] = res['abs2prom'][io][k]

            for k in res['prom2abs'][io]:
                n_k = k.replace('___', '.')
                n_prom2abs[io][n_k] = res['prom2abs'][io][k]

        res['abs2prom'] = n_abs2prom
        res['prom2abs'] = n_prom2abs

        return json.dumps(res)
    else:
        print("No metadata stored")
        return "{}"


def generic_get(collection_name, get_many=True):
    """ generic_get method

    Performs the typical 'get' request, returning the list of documents in the given collection.

    Args:
        collection_name (string): the collection to be queried
        get_many (bool): true if you want to get all, false if you only want
        one
    Returns:
        Array of documents
    """
    return json.dumps(_data.generic_get(collection_name, get_many))


def get_driver_iteration_data(variable):
    """ get_driver_iteration_data method

    Grabs and returns all data for a given variable over each iteration
    in the driver_iteration collection

    Args:
        variable (string): the variable whose data is to be used for querying
    Returns:
        Array of data
    """
    dat = _data.get_driver_iteration_data()
    ret = []
    for i in dat:
        for v in i['desvars']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'desvar'
                ret.append(v)
        for v in i['objectives']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'objective'
                ret.append(v)
        for v in i['constraints']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'constraint'
                ret.append(v)

        if 'sysincludes' in i:
            for v in i['sysincludes']:
                if v['name'] == variable:
                    v['iteration'] = _extract_iteration_coordinate(
                        i['iteration_coordinate'])
                    v['counter'] = i['counter']
                    v['type'] = 'sysinclude'
                    ret.append(v)

        if 'inputs' in i:
            for v in i['inputs']:
                if v['name'] == variable:
                    v['iteration'] = _extract_iteration_coordinate(
                        i['iteration_coordinate'])
                    v['counter'] = i['counter']
                    v['type'] = 'constraint'
                    ret.append(v)

    return json.dumps(ret)


def get_all_driver_vars():
    """ get_all_driver_vars method

    Grabs all variables in driver_iterations

    Returns:
        Array of string variable names
    """
    dat = _data.get_driver_iteration_data()
    ret = []
    cache = []
    for i in dat:
        for v in i['desvars']:
            if v['name'] not in cache:
                ret.append({
                    'name': v['name'],
                    'type': 'desvar'
                })
                cache.append(v['name'])
        for v in i['objectives']:
            if v['name'] not in cache:
                ret.append({
                    'name': v['name'],
                    'type': 'objective'
                })
                cache.append(v['name'])
        for v in i['constraints']:
            if v['name'] not in cache:
                ret.append({
                    'name': v['name'],
                    'type': 'constraint'
                })
                cache.append(v['name'])

        if 'sysincludes' in i:
            for v in i['sysincludes']:
                if v['name'] not in cache:
                    ret.append({
                        'name': v['name'],
                        'type': 'sysinclude'
                    })
                    cache.append(v['name'])

        if 'inputs' in i:
            for v in i['inputs']:
                if v['name'] not in cache:
                    ret.append({
                        'name': v['name'],
                        'type': 'constraint'
                    })
                    cache.append(v['name'])

    return json.dumps(ret)


def get_driver_iteration_based_on_count(variable, count):
    """ get_highest_driver_iteartion_count method

    Returns data if new data is available (checked by count)

    Args:
        variable (string): the variable to be checked
        count (int): the max count up to this point
    Returns:
        JSON string of the data or of '[]' if no update necessary
    """
    if _data.is_new_data(count):
        s_data = get_driver_iteration_data(variable)
        return s_data

    return "[]"


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
        node['iteration'] = split_coord[i + 1]
        ret.append(node)
        i += 2

    return ret
