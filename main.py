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

public_root = os.path.join(os.path.dirname(__file__), 'public')

if __name__ == "__main__":
    tornado.options.parse_command_line()
    #Set up endpoints
    app = tornado.web.Application(handlers=[
        (r"/", presentation.IndexHandler),
        (r"/case", presentation.CaseHandler),
        (r"/case/([a-zA-Z]+)/(.*)", web.StaticFileHandler, {'path': public_root}),
        (r"/case/(\d+)", presentation.CaseHandler),
        (r"/case/(\d+)/driver_iterations", presentation.DriverIterationsHandler),
        (r"/case/(\d+)/driver_iterations/([a-zA-Z0-9_.:]+)", presentation.DriverIterationVariableHandler),
        (r"/case/(\d+)/layout", presentation.LayoutHandler),
        (r"/case/(\d+)/driver_metadata", presentation.DriverMetadataHandler),
        (r"/case/(\d+)/global_iterations", presentation.GlobalIterationsHandler),
        (r"/case/(\d+)/metadata", presentation.MetadataHandler),
        (r"/case/(\d+)/solver_iterations", presentation.SolverIterationsHandler),
        (r"/case/(\d+)/solver_metadata", presentation.SolverMetadataHandler),
        (r"/case/(\d+)/system_iterations", presentation.SystemIterationsHandler),
        (r"/case/(\d+)/system_iterations/([a-zA-Z0-9_.:]+)", presentation.SystemIterationVariableHandler),
        (r"/case/(\d+)/system_metadata", presentation.SystemMetadataHandler),
        (r"/token", presentation.TokenHandler),
        (r"/login", presentation.LoginHandler),
        (r"/login", presentation.LoginHandler),
        (r"/activate/([a-zA-Z0-9]+)", presentation.ActivationHandler),
        (r"/case/(\d+)/variables", presentation.VariablesHandler),
        (r"/case/(\d+)/desvars", presentation.DesvarsHandler),
        (r"/(.*)", web.StaticFileHandler, {'path': public_root})
        ], cookie_secret="tklskdjfsdv8982fj4kj3ookr0")

    print("Starting up OpenMDAO server on port: " + str(options.port))
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)

    #Make code exitable
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()
