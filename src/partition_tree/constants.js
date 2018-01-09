//Initialize ptn2 as namespace
ptn2 = {};

//color constants
ptn2.CONNECTION_COLOR = "black";
ptn2.UNKNOWN_IMPLICIT_COLOR = "orange";
ptn2.UNKNOWN_EXPLICIT_COLOR = "#AAA";
ptn2.RED_ARROW_COLOR = "salmon";
ptn2.GREEN_ARROW_COLOR = "seagreen";
ptn2.PARAM_COLOR = "Plum";
ptn2.GROUP_COLOR = "steelblue";
ptn2.COMPONENT_COLOR = "DeepSkyBlue";
ptn2.UNCONNECTED_PARAM_COLOR = "#F42E0C";
ptn2.COLLAPSED_COLOR = "#555";
ptn2.HIGHLIGHT_HOVERED_COLOR = "blue";

ptn2.N2_COMPONENT_BOX_COLOR = "#555";
ptn2.N2_BACKGROUND_COLOR = "#eee";
ptn2.N2_GRIDLINE_COLOR = "white";
ptn2.PT_STROKE_COLOR = "#eee";
ptn2.UNKNOWN_GROUP_COLOR = "#888";
ptn2.PARAM_GROUP_COLOR = "Orchid";

ptn2.widthPTreePx = 1;
ptn2.kx = 0; 
ptn2.ky = 0; 
ptn2.kx0 = 0; 
ptn2.ky0 = 0;
ptn2.HEIGHT_PX = 600;
ptn2.PARENT_NODE_WIDTH_PX = 40;
ptn2.MIN_COLUMN_WIDTH_PX = 5;
ptn2.SVG_MARGIN = 1;
ptn2.TRANSITION_DURATION_FAST = 1000;
ptn2.TRANSITION_DURATION_SLOW = 1500;
ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_FAST;
ptn2.xScalerPTree = d3.scaleLinear().range([0, ptn2.widthPTreePx]);
ptn2.yScalerPTree = d3.scaleLinear().range([0, ptn2.HEIGHT_PX]);
ptn2.xScalerPTree0 = null;
ptn2.yScalerPTree0 = null;
ptn2.LEVEL_OF_DETAIL_THRESHOLD = ptn2.HEIGHT_PX / 3; //3 pixels