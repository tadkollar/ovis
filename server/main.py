""" main module

This module contains all of the logic to start up the Tornado server.
Details which endpoints correspond to which objects in the presentation layer
within data_server/

Start with:
    python main.py
"""
import os
import tornado.ioloop
import tornado.options
import tornado.web as web
import tornado.httpserver
import tornado.httpclient
import data_server.presentation.presentation as presentation

from tornado.options import define, options
define("port", default=18403)

# define endpoints
def get_app():
    app = tornado.web.Application(handlers=[
        (r"/connect", presentation.ConnectHandler),
        (r"/driver_iterations", presentation.DriverIterationsHandler),
        (r"/driver_iterations/([a-zA-Z0-9_.:]+)", presentation.DriverIterationVariableHandler),
        (r"/layout", presentation.LayoutHandler),
        (r"/driver_metadata", presentation.DriverMetadataHandler),
        (r"/global_iterations", presentation.GlobalIterationsHandler),
        (r"/metadata", presentation.MetadataHandler),
        (r"/solver_iterations", presentation.SolverIterationsHandler),
        (r"/solver_metadata", presentation.SolverMetadataHandler),
        (r"/system_iterations", presentation.SystemIterationsHandler),
        (r"/system_metadata", presentation.SystemMetadataHandler),
        (r"/allvars", presentation.AllVarsHandler),
    ])
    return app


if __name__ == "__main__":
    tornado.options.parse_command_line()
    # Set up endpoints
    app = get_app()

    print("Starting up OpenMDAO server on port: " + str(options.port))
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)

    # Make code exitable
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()
