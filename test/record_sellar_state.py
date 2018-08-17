from openmdao.api import SqliteRecorder
from openmdao.test_suite.components.sellar import SellarProblem, SellarStateConnection
from openmdao.drivers.scipy_optimizer import ScipyOptimizeDriver


recorder = SqliteRecorder("sellar_state.db")

prob = SellarProblem(SellarStateConnection)
driver = prob.driver = ScipyOptimizeDriver(optimizer='SLSQP')

prob.model.add_recorder(recorder, True)
driver.add_recorder(recorder)

prob.setup()
prob.run_driver()
prob.cleanup()
