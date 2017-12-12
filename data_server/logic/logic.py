""" logic.py

This module contains all methods to perform any business logic required
between the presentation and data layers. This is the middle layer in the
3-tier architecture used in this project.

This layer is primarily used to do any data conversion between the expectation
at the presentation layer and the expectation at the data layer.
"""
import os
import json
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dateutil import tz
from datetime import datetime
import data_server.data.data as data
import data_server.shared.collections as collections


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
        case['date'] = case['date'].replace(
            tzinfo=from_zone).astimezone(to_zone)
        case['datestring'] = case['date'].strftime('%b %d, %Y at %I:%M %p')

    # sort by date
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
        body (JSON): the body of the original POST request to be put in the
            collection
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


def update_case_name(name, case_id):
    """ update_case_name method

    Updates a given case to have a specific name

    Args:
        name (string): the new name of the case
        case_id (string): the case to be updated
    Returns:
        True if success, False otherwise
    """
    return data.update_case_name(name, case_id)


def update_layout(body, case_id):
    """ update_layout method

    Updates the layout for a given case.

    Args:
        body (JSON): the body of the POST request
        case_id (string): the case to be updated
    Returns:
        True if success, False otherwies
    """
    return data.update_layout(body, case_id)


def metadata_create(body, case_id, token):
    """ metadata_create method

    Creates/updates the metadata for a given case

    Args:
        body (JSON): the body containing abs2prom and prom2abs
        token (string): the token for verification
    Returns:
        True if success, False otherwise
    """
    n_abs2prom = {'input': {}, 'output': {}}
    n_prom2abs = {'input': {}, 'output': {}}

    if 'abs2prom' in body:
        # replace all '.' with '___' in abs2prom and prom2abs
        for io in ['input', 'output']:
            for k in body['abs2prom'][io]:
                n_k = k.replace('.', '___')
                n_abs2prom[io][n_k] = body['abs2prom'][io][k]

            for k in body['prom2abs'][io]:
                n_k = k.replace('.', '___')
                n_prom2abs[io][n_k] = body['prom2abs'][io][k]

        n_body = {
            'abs2prom': n_abs2prom,
            'prom2abs': n_prom2abs
        }
        data.generic_create(collections.METADATA, n_body, case_id, token, False)
    else:
        data.generic_create(collections.METADATA, body, case_id, token, False)


def metadata_get(case_id, token):
    """ metadata_get method

    Grabs and returns the metadata for a given case

    Args:
        case_id (string): the case whose metadata needs to be grabbed
        token (string): the token for verification
    """
    n_abs2prom = {'input': {}, 'output': {}}
    n_prom2abs = {'input': {}, 'output': {}}

    res = json.loads(data.generic_get(collections.METADATA, case_id, token,\
                     False))

    if 'abs2prom' in res:
        for io in ['input', 'output']:
            for k in res['abs2prom'][io]:
                n_k = k.replace('___', '.')
                n_abs2prom[io][n_k] = res['abs2prom'][io][k]

            for k in res['prom2abs'][io]:
                n_k = k.replace('___', '.')
                n_prom2abs[io][n_k] = res['prom2abs'][io][k]

        res['abs2prom'] = n_abs2prom
        res['prom2abs'] = n_prom2abs

        return res
    else:
        print("No metadata stored")
        return data.generic_get(collections.METADATA, case_id, token, False)


def generic_get(collection_name, case_id, token, get_many=True):
    """ generic_get method

    Performs the typical 'get' request, passing the case_id to the data layer
    and returning the list of documents in the given collection with that
    case_id.

    Args:
        collection_name (string): the collection to be queried
        case_id (string || int): the case_id for querying
        token (string): the token to be used for authentication
        get_many (bool): true if you want to get all, false if you only want
        one
    Returns:
        Array of documents with the given case_id from the given collection
    """
    return data.generic_get(collection_name, case_id, token, get_many)


def generic_create(collection_name, body, case_id, token, update):
    """ generic_create method

    Performs the typical 'post' request. Takes the body and case_id, passes
    them to the data layer to be added to the collection. Returns True if it
    was successfully added and False otherwise.

    Args:
        collection_name (string): the collection to be queried
        body (json): document to be added to the collection
        case_id (string || int): the case_id for querying
        token (string): the token to be used for authentication
        update (string): whether or not we're simply updating an existing
            recording
    Returns:
        True if successfull, False otherwise
    """
    converted_update = False
    if update == 'True':
        converted_update = True
    return data.generic_create(collection_name, body, case_id, token,
                               converted_update)


def generic_delete(collection_name, case_id, token):
    """ generic_delete method

    Performs the typical 'delete'. Passes the collection name and ID to the
        data layer.
    This should delete all documents in the collection with the given case_id.
    Returns True if anything was deleted, False otherwise.

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


def delete_token(token):
    """ delete_token method

    deletes a given token

    Args:
        token (string): the token to be deleted
    Returns:
        None
    """
    data.delete_token(token)


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
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'input'
                ret.append(v)

        for v in i['outputs']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'output'
                ret.append(v)

        for v in i['residuals']:
            if v['name'] == variable:
                v['iteration'] = _extract_iteration_coordinate(
                    i['iteration_coordinate'])
                v['counter'] = i['counter']
                v['type'] = 'residual'
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


def get_driver_iteration_data(case_id, variable):
    """ get_driver_iteration_data method

    Grabs and returns all data for a given variable over each iteration
    in the driver_iteration collection

    Args:
        case_id (string): the case whose data will be checked
        variable (string): the variable whose data is to be used for querying
    Returns:
        Array of data
    """
    dat = data.get_driver_iteration_data(case_id)
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

    return json.dumps(ret)


def get_desvars(case_id):
    """ get_desvars method

    Grabs all desvars in driver_iterations for a given case_id

    Args:
        case_id (string): the case to be queried
    Returns:
        Array of string variable names
    """
    dat = data.get_driver_iteration_data(case_id)
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

    return json.dumps(ret)


def get_driver_iteration_based_on_count(case_id, variable, count):
    """ get_highest_driver_iteartion_count method

    Returns data if new data is available (checked by count)

    Args:
        case_id (string): the case to be queried
        variable (string): the variable to be checked
        count (int): the max count up to this point
    Returns:
        JSON string of '[]' if no update necessary or the data
    """
    s_data = get_driver_iteration_data(case_id, variable)
    data = json.loads(s_data)
    for d in data:
        if int(d['counter']) > int(count):
            return s_data

    return "[]"


def send_activated_email(token):
    """ send_activated_email

    Sends an email to the given user indicating that their
    token has been activated

    Args:
        token (string): the token associated with the user
    """
    user = data.get_user(token)
    if 'active' in user and user['active']:
        subject = 'OpenMDAO Visualization Token Activated'
        recipient = user['email']
        message = 'Hey ' + user['name'] + ',\r\n\r\n'
        message += 'Your OpenMDAO Visualization token has been activated.\
                    \r\n\r\n'
        message += 'Token: ' + user['token'] + '\r\n\r\n'
        message += 'Sincerely,\r\nThe OpenMDAO Team'
        _send_email(recipient, subject, message)


def send_activation_email(token, name, email):
    """ send_activation_email method

    Sends an email over SMTP to request that an account be activated

    Args:
        token (string): the token that needs activating
        name (string): the person's name
        email (string): the person's email
    """
    recipient = os.environ['OPENMDAO_EMAIL']
    message = 'Activate new user: ' + name + ' with the email: ' + \
        email + '\r\nhttp://openmdao.org/visualization/activate/' + token
    subject = 'Activate OpenMDAO Visualization User'
    _send_email(recipient, subject, message)


def activate_account(token):
    """ activate_account method

    Activates the account associated with a given token

    Args:
        token(string): the token that needs activating
    """
    data.activate_account(token)


def _send_email(recipient, subject, message):
    """ _send_email private method

    Sends an email to the recipient with the given subject and message.

    Args:
        recipient (string): the email address to receive the message
        subject (string): the email subject
        message (string): the email body
    """
    gmail_user = os.environ['VISUALIZATION_EMAIL']
    gmail_password = os.environ['VISUALIZATION_EMAIL_PASSWORD']

    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(message))

    mail_server = smtplib.SMTP('smtp.gmail.com', 587)
    mail_server.ehlo()
    mail_server.starttls()
    mail_server.ehlo()
    mail_server.login(gmail_user, gmail_password)
    mail_server.sendmail(gmail_user, recipient, msg.as_string())
    mail_server.close()


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
