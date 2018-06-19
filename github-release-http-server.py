""" github-release-http-server.py

The server which allows OVis to perform automatic updates.

This file contains a very basic HTTP server that denies the '/' GET request (for security)
while serving all other GET requests. Additional logic includes automatically
pulling the most recent GitHub release of the Zune project every hour.

NOTE: this has only the most basic security and should be updated to only accept requests
related to OVis.

This file should be running independently on its own server.
"""
import json
import requests
import os
import SimpleHTTPServer
import SocketServer
import threading
import re

def remove_files(pattern):
    """ remove_old_files function

    Remove any files in the CWD that match the given pattern.

    Args:
        pattern (string): regular expression for pattern matching
    """
    for f in os.listdir('.'):
        if re.search(pattern, f):
            os.remove(f)

def update_release():
    """ update_release

    Update the files being hosted by pulling down the latest GH Zune release.

    NOTE: uses threading to run every hour
    """
    threading.Timer(3600, update_release).start()
    if 'GHTOKEN' not in os.environ:
        print("ERROR: could not find GHTOKEN in environment variables for GitHub authentication")
        return

    if 'GHNAME' not in os.environ:
        print("ERROR: could not find GHNAME in environment variables for GitHub authentication")
        return

    print("Deleting old files")
    remove_files('.*yml')
    remove_files('.*json')
    remove_files('.*zip')
    remove_files('.*AppImage')
    remove_files('.*exe*')
    remove_files('.*dmg*')

    print("Updating release files")
    ghname = os.environ['GHNAME']
    ghtoken = os.environ['GHTOKEN']
    requests_url = 'https://api.github.com/repos/openmdao/zune/releases'
    assets_url = 'https://api.github.com/repos/openmdao/zune/releases/assets/'
    asset_header = {'Accept': 'application/octet-stream'}

    release_req = requests.get(requests_url, auth=(ghname, ghtoken))
    release_req.raise_for_status()
    releases = release_req.json()
    if len(releases) is 0:
        print("WARNING: no releases found")
        return

    if 'GHNAME' not in os.environ:
        print("ERROR: could not find GHNAME in environment variables for GitHub authentication")
        return

    ghname = os.environ['GHNAME']
    ghtoken = os.environ['GHTOKEN']
    requests_url = 'https://api.github.com/repos/openmdao/zune/releases'
    assets_url = 'https://api.github.com/repos/openmdao/zune/releases/assets/'
    asset_header = {'Accept': 'application/octet-stream'}

    release_req = requests.get(requests_url, auth=(ghname, ghtoken))
    release_req.raise_for_status()
    releases = release_req.json()
    if len(releases) is 0:
        print("WARNING: no releases found")
        return

    latest_release = releases[0]
    for asset in latest_release['assets']:
        print("Downloading asset: " + asset['name'])
        full_asset_url = assets_url + str(asset['id'])
        asset_data = requests.get(full_asset_url, auth=(ghname, ghtoken), headers=asset_header, stream=True)
        with open(asset['name'], 'wb') as handle:
            for block in asset_data.iter_content(1024):
                handle.write(block)
    print("Finished downloading assets")

class BasicRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    """ BasicRequestHandler class

    A simple request handler that hosts files at the CWD and below.
    Currently gives 404 if user tries to get '/'
    """
    def do_GET(self):
        if self.path == '/':
            return self.send_error(404)
        return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)


if __name__ == '__main__':
    update_release()
    handler = BasicRequestHandler
    print("Starting HTTP server on port 18403")
    server = SocketServer.TCPServer(('0.0.0.0', 18403), handler)
    server.serve_forever()
