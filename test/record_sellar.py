from openmdao.api import Problem, SqliteRecorder
from openmdao.test_suite.components.sellar import SellarProblem, SellarDerivativesGrouped
from openmdao.drivers.pyoptsparse_driver import pyOptSparseDriver

recorder = SqliteRecorder("sellar_grouped.db")

prob = SellarProblem(SellarDerivativesGrouped)
driver = prob.driver = pyOptSparseDriver(optimizer='SLSQP')

prob.model.add_recorder(recorder, True)
driver.add_recorder(recorder)

prob.setup()
prob.run_driver()
prob.cleanup()
