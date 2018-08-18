
import numpy as np

from openmdao.api import Group, IndepVarComp, ExecComp, SqliteRecorder
from openmdao.test_suite.components.sellar import SellarProblem, \
    SellarDis1withDerivatives, SellarDis2withDerivatives, StateConnection
from openmdao.drivers.scipy_optimizer import ScipyOptimizeDriver


class SellarStateConnection(Group):
    """
    Group containing the Sellar MDA.

    A connection has been commented out for testing purposes (an 'unconnected_param')
    """

    def setup(self):
        self.add_subsystem('px', IndepVarComp('x', 1.0), promotes=['x'])
        self.add_subsystem('pz', IndepVarComp('z', np.array([5.0, 2.0])), promotes=['z'])

        sub = self.add_subsystem('sub', Group(),
                                 promotes=['x', 'z', 'y1',
                                           'state_eq.y2_actual', 'state_eq.y2_command',
                                           'd1.y2', 'd2.y2'])

        subgrp = sub.add_subsystem('state_eq_group', Group(),
                                   promotes=['state_eq.y2_actual', 'state_eq.y2_command'])
        subgrp.add_subsystem('state_eq', StateConnection())

        sub.add_subsystem('d1', SellarDis1withDerivatives(), promotes=['x', 'z', 'y1'])
        sub.add_subsystem('d2', SellarDis2withDerivatives(), promotes=['z', 'y1'])

        self.connect('state_eq.y2_command', 'd1.y2')
        self.connect('d2.y2', 'state_eq.y2_actual')

        self.add_subsystem('obj_cmp', ExecComp('obj = x**2 + z[1] + y1 + exp(-y2)',
                                               z=np.array([0.0, 0.0]), x=0.0, y1=0.0, y2=0.0),
                           promotes=['x', 'z', 'y1', 'obj'])
        self.connect('d2.y2', 'obj_cmp.y2')

        self.add_subsystem('con_cmp1', ExecComp('con1 = 3.16 - y1'), promotes=['con1', 'y1'])
        self.add_subsystem('con_cmp2', ExecComp('con2 = y2 - 24.0'), promotes=['con2'])
        # self.connect('d2.y2', 'con_cmp2.y2')


recorder = SqliteRecorder("sellar_state.db")

prob = SellarProblem(SellarStateConnection)
driver = prob.driver = ScipyOptimizeDriver(optimizer='SLSQP')

prob.model.add_recorder(recorder, True)
driver.add_recorder(recorder)

prob.setup()
prob.run_driver()
prob.cleanup()
