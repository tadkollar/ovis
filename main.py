""" main module

This module contains all of the logic to start up the Tornado server.
Details which endpoints correspond to which objects in the presentation layer
within data_server/

Start with:
    python main.py
"""
import data_server.presentation.presentation as presentation
import tornado.httpserver
import os
import tornado.ioloop
import tornado.options
import tornado.web as web
import tornado.httpclient

from tornado.options import define, options
define("port", default=18403)

public_root = os.path.join(os.path.dirname(__file__), 'public')

if __name__ == "__main__":
    tornado.options.parse_command_line()
    #Set up endpoints
    app = tornado.web.Application(handlers=[
        (r"/", presentation.IndexHandler),
        (r"/model-data", presentation.ModelDataHandler),
        (r"/case", presentation.CaseHandler),
        (r"/case/([a-zA-Z]+)/(.*)", web.StaticFileHandler, {'path': public_root}),
        (r"/case/(\d+)", presentation.CaseHandler),
        (r"/case/(\d+)/driver_iterations", presentation.DriverIterationsHandler),
        (r"/case/(\d+)/driver_metadata", presentation.DriverMetadataHandler),
        (r"/case/(\d+)/global_iterations", presentation.GlobalIterationsHandler),
        (r"/case/(\d+)/metadata", presentation.MetadataHandler),
        (r"/case/(\d+)/solver_iterations", presentation.SolverIterationsHandler),
        (r"/case/(\d+)/solver_metadata", presentation.SolverMetadataHandler),
        (r"/case/(\d+)/system_iterations", presentation.SystemIterationsHandler),
        (r"/case/(\d+)/system_metadata", presentation.SystemMetadataHandler),
        (r"/(.*)", web.StaticFileHandler, {'path': public_root})
        ])

    options.port = 18403
    print("Starting up OpenMDAO server on port: " + str(18403))
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(18403)

    #Make code exitable
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()
