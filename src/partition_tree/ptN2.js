//NOTE: the N^2 and associated scripts were originally written
//  to work directly in OpenMDAO as one file. Despite lots of
//  refactoring, there's still so much work to be done to make
//  this more maintainable. Associated scripts are:
//
//  * constants.js
//  * modal.js
//  * svg.js
//  * search.js
//  * legend.js
//  * draw.js
//  * ptN2.js

function PtN2Diagram(parentDiv, modelData) {
    let root = modelData.tree;
    let conns = modelData.connections_list;
    let abs2prom = modelData.hasOwnProperty('abs2prom') ? modelData.abs2prom : undefined;

    let FONT_SIZE_PX = 11;
    let svgStyleElement = document.createElement('style');
    let outputNamingType = 'Absolute';
    let showPath = false; //default off

    let DEFAULT_TRANSITION_START_DELAY = 100;
    let transitionStartDelay = DEFAULT_TRANSITION_START_DELAY;
    let idCounter = 0;
    let maxDepth = 1;
    let RIGHT_TEXT_MARGIN_PX = 8; // How much space in px (left and) right of text in partition tree

    //N^2 lets
    let backButtonHistory = [],
        forwardButtonHistory = [];
    let chosenCollapseDepth = -1;
    let updateRecomputesAutoComplete = true; //default

    let katexInputDivElement = document.getElementById('katexInputDiv');
    let katexInputElement = document.getElementById('katexInput');

    let tooltip = d3.select('body').append('div').attr('class', 'tool-tip')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    mouseOverOnDiagN2 = MouseoverOnDiagN2;
    mouseOverOffDiagN2 = MouseoverOffDiagN2;
    mouseClickN2 = MouseClickN2;
    mouseOutN2 = MouseoutN2;

    CreateDomLayout();
    CreateToolbar();

    setD3ContentDiv();

    $('#svgId')[0].appendChild(svgStyleElement);
    UpdateSvgCss(svgStyleElement, FONT_SIZE_PX);

    arrowMarker = svg.append('svg:defs').append('svg:marker');

    arrowMarker
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 1)
        .attr('markerHeight', 1)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('class', 'arrowHead');

    setN2Group();
    let pTreeGroup = svg.append('g');

    function updateRootTypes() {
        if (!search.showParams) return;

        let stack = [];
        for (let i = 0; i < root.children.length; ++i) {
            stack.push(root.children[i]);
        }

        while (stack.length > 0) {
            let cur_ele = stack.pop();
            if (cur_ele.type === 'param') {
                if (
                    !hasInputConnection(cur_ele.absPathName) &&
                    !hasOutputConnection(cur_ele.absPathName)
                ) {
                    cur_ele.type = 'unconnected_param';
                }
            }

            if (cur_ele.hasOwnProperty('children')) {
                for (let j = 0; j < cur_ele.children.length; ++j) {
                    stack.push(cur_ele.children[j]);
                }
            }
        }
    }

    function hasInputConnection(target) {
        for (i = 0; i < conns.length; ++i) {
            if (conns[i].tgt === target) {
                return true;
            }
        }

        return false;
    }

    function hasOutputConnection(target) {
        for (i = 0; i < conns.length; ++i) {
            if (conns[i].src === target) {
                return true;
            }
        }
    }
    hasInputConn = hasInputConnection;

    let n2BackgroundRectR0 = -1,
        n2BackgroundRectC0 = -1;
    let newConnsDict = {};
    function PrintConnects() {
        let text = 'Connections:';
        for (let key in newConnsDict) {
            let d = newConnsDict[key];
            let param = d3RightTextNodesArrayZoomed[d.c],
                unknown = d3RightTextNodesArrayZoomed[d.r];
            let paramName =
                zoomedElement.promotions &&
                zoomedElement.promotions[param.absPathName] !== undefined
                    ? '<b>' +
                      zoomedElement.promotions[param.absPathName] +
                      '</b>'
                    : zoomedElement === root
                        ? param.absPathName
                        : param.absPathName.slice(
                              zoomedElement.absPathName.length + 1
                          );
            let unknownName =
                zoomedElement.promotions &&
                zoomedElement.promotions[unknown.absPathName] !== undefined
                    ? '<b>' +
                      zoomedElement.promotions[unknown.absPathName] +
                      '</b>'
                    : zoomedElement === root
                        ? unknown.absPathName
                        : unknown.absPathName.slice(
                              zoomedElement.absPathName.length + 1
                          );

            text +=
                '<br />self.connect("' +
                unknownName +
                '", "' +
                paramName +
                '")';
        }
        $('#connectionId')[0].innerHTML = text;
    }
    let n2BackgroundRect = n2Group
        .append('rect')
        .attr('class', 'background')
        .attr('width', ptn2.WIDTH_N2_PX)
        .attr('height', ptn2.HEIGHT_PX)
        .on('click', function() {
            if (!search.showParams) return;
            let coords = d3.mouse(this);
            let c = Math.floor(
                (coords[0] * d3RightTextNodesArrayZoomed.length) /
                    ptn2.WIDTH_N2_PX
            );
            let r = Math.floor(
                (coords[1] * d3RightTextNodesArrayZoomed.length) /
                    ptn2.HEIGHT_PX
            );
            if (
                r == c ||
                r < 0 ||
                c < 0 ||
                r >= d3RightTextNodesArrayZoomed.length ||
                c >= d3RightTextNodesArrayZoomed.length
            )
                return;
            if (matrix[r + '_' + c] !== undefined) return;

            let param = d3RightTextNodesArrayZoomed[c],
                unknown = d3RightTextNodesArrayZoomed[r];
            if (param.type !== 'param' && unknown.type !== 'unknown') return;

            let newClassName = 'n2_hover_elements_' + r + '_' + c;
            let selection = n2Group.selectAll('.' + newClassName);
            if (selection.size() > 0) {
                delete newConnsDict[r + '_' + c];
                selection.remove();
            } else {
                newConnsDict[r + '_' + c] = { r: r, c: c };
                n2Group
                    .selectAll(
                        'path.n2_hover_elements, circle.n2_hover_elements'
                    )
                    .attr('class', newClassName);
            }
            PrintConnects();
        })
        .on('mouseover', function() {
            n2BackgroundRectR0 = -1;
            n2BackgroundRectC0 = -1;
            n2Group.selectAll('.n2_hover_elements').remove();
            PrintConnects();
        })
        .on('mouseleave', function() {
            n2BackgroundRectR0 = -1;
            n2BackgroundRectC0 = -1;
            n2Group.selectAll('.n2_hover_elements').remove();
            PrintConnects();
        })
        .on('mousemove', function() {
            if (!search.showParams) return;
            let coords = d3.mouse(this);
            let c = Math.floor(
                (coords[0] * d3RightTextNodesArrayZoomed.length) /
                    ptn2.WIDTH_N2_PX
            );
            let r = Math.floor(
                (coords[1] * d3RightTextNodesArrayZoomed.length) /
                    ptn2.HEIGHT_PX
            );
            if (
                r == c ||
                r < 0 ||
                c < 0 ||
                r >= d3RightTextNodesArrayZoomed.length ||
                c >= d3RightTextNodesArrayZoomed.length
            )
                return;
            if (matrix[r + '_' + c] !== undefined) return;
            if (n2BackgroundRectR0 == r && n2BackgroundRectC0 == c) return;
            //n2Group.selectAll(".n2_hover_elements_" + n2BackgroundRectR0 + "_" + n2BackgroundRectC0).remove();
            n2Group.selectAll('.n2_hover_elements').remove();
            n2BackgroundRectR0 = r;
            n2BackgroundRectC0 = c;

            let lineWidth = Math.min(5, n2Dx * 0.5, n2Dy * 0.5);
            arrowMarker
                .attr('markerWidth', lineWidth * 0.4)
                .attr('markerHeight', lineWidth * 0.4);

            let param = d3RightTextNodesArrayZoomed[c],
                unknown = d3RightTextNodesArrayZoomed[r];
            if (param.type !== 'param' && unknown.type !== 'unknown') return;
            if (r > c) {
                //bottom left
                DrawPathTwoLines(
                    n2Dx * r, //x1
                    n2Dy * r + n2Dy * 0.5, //y1
                    n2Dx * c + n2Dx * 0.5, //left x2
                    n2Dy * r + n2Dy * 0.5, //left y2
                    n2Dx * c + n2Dx * 0.5, //up x3
                    n2Dy * c + n2Dy - 1e-2, //up y3
                    'blue',
                    lineWidth,
                    true
                );
            } else if (r < c) {
                //top right
                DrawPathTwoLines(
                    n2Dx * r + n2Dx, //x1
                    n2Dy * r + n2Dy * 0.5, //y1
                    n2Dx * c + n2Dx * 0.5, //right x2
                    n2Dy * r + n2Dy * 0.5, //right y2
                    n2Dx * c + n2Dx * 0.5, //down x3
                    n2Dy * c + 1e-2, //down y3
                    'blue',
                    lineWidth,
                    true
                );
            }
            let leftTextWidthR = d3RightTextNodesArrayZoomed[r].nameWidthPx,
                leftTextWidthC = d3RightTextNodesArrayZoomed[c].nameWidthPx;
            DrawRect(
                -leftTextWidthR - PTREE_N2_GAP_PX,
                n2Dy * r,
                leftTextWidthR,
                n2Dy,
                'blue'
            ); //highlight var name
            DrawRect(
                -leftTextWidthC - PTREE_N2_GAP_PX,
                n2Dy * c,
                leftTextWidthC,
                n2Dy,
                'blue'
            ); //highlight var name

            PrintConnects();

            if (newConnsDict[r + '_' + c] === undefined) {
                let paramName =
                    zoomedElement.promotions &&
                    zoomedElement.promotions[param.absPathName] !== undefined
                        ? '<b>' +
                          zoomedElement.promotions[param.absPathName] +
                          '</b>'
                        : zoomedElement === root
                            ? param.absPathName
                            : param.absPathName.slice(
                                  zoomedElement.absPathName.length + 1
                              );
                let unknownName =
                    zoomedElement.promotions &&
                    zoomedElement.promotions[unknown.absPathName] !== undefined
                        ? '<b>' +
                          zoomedElement.promotions[unknown.absPathName] +
                          '</b>'
                        : zoomedElement === root
                            ? unknown.absPathName
                            : unknown.absPathName.slice(
                                  zoomedElement.absPathName.length + 1
                              );

                $('#connectionId')[0].innerHTML +=
                    '<br /><i style="color:red;">self.connect("' +
                    unknownName +
                    '", "' +
                    paramName +
                    '")</i>';
            }
        });

    setN2ElementsGroup();
    let zoomedElement0 = root;
    let lastRightClickedElement = root;

    ExpandColonVars(root);
    FlattenColonGroups(root);
    InitTree(root, null, 1);
    updateRootTypes();
    ComputeLayout();
    ComputeConnections();
    ComputeMatrixN2();

    let collapseDepthElement = $('#idCollapseDepthDiv')[0];
    while (collapseDepthElement.children.length > 0) {
        collapseDepthElement.removeChild(collapseDepthElement.children[0]);
    }
    for (let i = 2; i <= maxDepth; ++i) {
        let option = document.createElement('span');
        option.className = 'fakeLink';
        option.id = 'idCollapseDepthOption' + i + '';
        option.innerHTML = '' + i + '';
        let f = (function(idx) {
            return function() {
                CollapseToDepthSelectChange(idx);
            };
        })(i);
        option.onclick = f;
        collapseDepthElement.appendChild(option);
    }

    Update();
    SetupLegend(d3, d3ContentDiv);

    function Update() {
        $('#currentPathId')[0].innerHTML =
            'PATH: root' +
            (zoomedElement.parent ? '.' : '') +
            zoomedElement.absPathName;

        $('#backButtonId')[0].disabled =
            backButtonHistory.length == 0 ? 'disabled' : false;
        $('#forwardButtonId')[0].disabled =
            forwardButtonHistory.length == 0 ? 'disabled' : false;
        $('#upOneLevelButtonId')[0].disabled =
            zoomedElement === root ? 'disabled' : false;
        $('#returnToRootButtonId')[0].disabled =
            zoomedElement === root ? 'disabled' : false;

        // Compute the new tree layout.
        ComputeLayout(); //updates d3NodesArray
        ComputeMatrixN2();

        for (let i = 2; i <= maxDepth; ++i) {
            $('#idCollapseDepthOption' + i + '')[0].style.display =
                i <= zoomedElement.depth ? 'none' : 'block';
        }

        if (ptn2.xScalerPTree0 != null) {
            //not first run.. store previous
            ptn2.kx0 = ptn2.kx;
            ptn2.ky0 = ptn2.ky;
            ptn2.xScalerPTree0 = ptn2.xScalerPTree.copy();
            ptn2.yScalerPTree0 = ptn2.yScalerPTree.copy();
        }

        ptn2.kx =
            (zoomedElement.x
                ? ptn2.widthPTreePx - ptn2.PARENT_NODE_WIDTH_PX
                : ptn2.widthPTreePx) /
            (1 - zoomedElement.x);
        ptn2.ky = ptn2.HEIGHT_PX / zoomedElement.height;
        ptn2.xScalerPTree
            .domain([zoomedElement.x, 1])
            .range([
                zoomedElement.x ? ptn2.PARENT_NODE_WIDTH_PX : 0,
                ptn2.widthPTreePx
            ]);
        ptn2.yScalerPTree
            .domain([zoomedElement.y, zoomedElement.y + zoomedElement.height])
            .range([0, ptn2.HEIGHT_PX]);

        if (ptn2.xScalerPTree0 == null) {
            //first run.. duplicate
            ptn2.kx0 = ptn2.kx;
            ptn2.ky0 = ptn2.ky;
            ptn2.xScalerPTree0 = ptn2.xScalerPTree.copy();
            ptn2.yScalerPTree0 = ptn2.yScalerPTree.copy();

            //Update svg dimensions before ComputeLayout() changes ptn2.widthPTreePx
            svgDiv
                .style(
                    'width',
                    ptn2.widthPTreePx +
                        PTREE_N2_GAP_PX +
                        ptn2.WIDTH_N2_PX +
                        2 * ptn2.SVG_MARGIN +
                        'px'
                )
                .style('height', ptn2.HEIGHT_PX + 2 * ptn2.SVG_MARGIN + 'px');
            svg.attr(
                'width',
                ptn2.widthPTreePx +
                    PTREE_N2_GAP_PX +
                    ptn2.WIDTH_N2_PX +
                    2 * ptn2.SVG_MARGIN
            ).attr('height', ptn2.HEIGHT_PX + 2 * ptn2.SVG_MARGIN);
            n2Group.attr(
                'transform',
                'translate(' +
                    (ptn2.widthPTreePx + PTREE_N2_GAP_PX + ptn2.SVG_MARGIN) +
                    ',' +
                    ptn2.SVG_MARGIN +
                    ')'
            );
            pTreeGroup.attr(
                'transform',
                'translate(' + ptn2.SVG_MARGIN + ',' + ptn2.SVG_MARGIN + ')'
            );
        }

        sharedTransition = d3
            .transition()
            .duration(ptn2.TRANSITION_DURATION)
            .delay(transitionStartDelay); //do this after intense computation
        transitionStartDelay = DEFAULT_TRANSITION_START_DELAY;

        //Update svg dimensions with transition after ComputeLayout() changes ptn2.widthPTreePx
        svgDiv
            .transition(sharedTransition)
            .style(
                'width',
                ptn2.widthPTreePx +
                    PTREE_N2_GAP_PX +
                    ptn2.WIDTH_N2_PX +
                    2 * ptn2.SVG_MARGIN +
                    'px'
            )
            .style('height', ptn2.HEIGHT_PX + 2 * ptn2.SVG_MARGIN + 'px');
        svg.transition(sharedTransition)
            .attr(
                'width',
                ptn2.widthPTreePx +
                    PTREE_N2_GAP_PX +
                    ptn2.WIDTH_N2_PX +
                    2 * ptn2.SVG_MARGIN
            )
            .attr('height', ptn2.HEIGHT_PX + 2 * ptn2.SVG_MARGIN);
        n2Group
            .transition(sharedTransition)
            .attr(
                'transform',
                'translate(' +
                    (ptn2.widthPTreePx + PTREE_N2_GAP_PX + ptn2.SVG_MARGIN) +
                    ',' +
                    ptn2.SVG_MARGIN +
                    ')'
            );
        pTreeGroup
            .transition(sharedTransition)
            .attr(
                'transform',
                'translate(' + ptn2.SVG_MARGIN + ',' + ptn2.SVG_MARGIN + ')'
            );
        n2BackgroundRect
            .transition(sharedTransition)
            .attr('width', ptn2.WIDTH_N2_PX)
            .attr('height', ptn2.HEIGHT_PX);

        let sel = pTreeGroup
            .selectAll('.partition_group')
            .data(d3NodesArray, function(d) {
                return d.id;
            });

        let nodeEnter = sel
            .enter()
            .append('svg:g')
            .attr('class', function(d) {
                return 'partition_group ' + GetClass(d);
            })
            .attr('transform', function(d) {
                return (
                    'translate(' +
                    ptn2.xScalerPTree0(d.x0) +
                    ',' +
                    ptn2.yScalerPTree0(d.y0) +
                    ')'
                );
            })
            .on('click', function(d) {
                LeftClick(d, this);
            })
            .on('contextmenu', function(d) {
                RightClick(d, this);
            })
            .on('mouseover', function (d) {
                if (abs2prom != undefined) {
                    if (d.type == "param" || d.type == "unconnected_param") {
                        return tooltip.text(abs2prom.input[d.absPathName])
                                      .style('visibility', 'visible');
                    }
                    if (d.type == 'unknown') {
                        return tooltip.text(abs2prom.output[d.absPathName])
                                      .style('visibility', 'visible');
                    }
                }
            })
            .on('mouseleave', function (d) {
                if (abs2prom != undefined) {
                    return tooltip.style('visibility', 'hidden');
                }
            })
            .on('mousemove', function(){
                if (abs2prom != undefined) {
                    return tooltip.style('top', (d3.event.pageY-30)+'px')
                                  .style('left',(d3.event.pageX+5)+'px');
                }
            });

        nodeEnter
            .append('svg:rect')
            .attr('width', function(d) {
                return d.width0 * ptn2.kx0; //0;//
            })
            .attr('height', function(d) {
                return d.height0 * ptn2.ky0;
            });

        nodeEnter
            .append('svg:text')
            .attr('dy', '.35em')
            //.attr("text-anchor", "end")
            .attr('transform', function(d) {
                let anchorX = d.width0 * ptn2.kx0 - RIGHT_TEXT_MARGIN_PX;
                //let anchorX = -RIGHT_TEXT_MARGIN_PX;
                return (
                    'translate(' +
                    anchorX +
                    ',' +
                    (d.height0 * ptn2.ky0) / 2 +
                    ')'
                );
            })
            .style('opacity', function(d) {
                if (d.depth < zoomedElement.depth) return 0;
                return d.textOpacity0;
            })
            .text(GetText);

        let nodeUpdate = nodeEnter
            .merge(sel)
            .transition(sharedTransition)
            .attr('class', function(d) {
                return 'partition_group ' + GetClass(d);
            })
            .attr('transform', function(d) {
                return (
                    'translate(' +
                    ptn2.xScalerPTree(d.x) +
                    ',' +
                    ptn2.yScalerPTree(d.y) +
                    ')'
                );
            });

        nodeUpdate
            .select('rect')
            .attr('width', function(d) {
                return d.width * ptn2.kx;
            })
            .attr('height', function(d) {
                return d.height * ptn2.ky;
            });

        nodeUpdate
            .select('text')
            .attr('transform', function(d) {
                let anchorX = d.width * ptn2.kx - RIGHT_TEXT_MARGIN_PX;
                return (
                    'translate(' +
                    anchorX +
                    ',' +
                    (d.height * ptn2.ky) / 2 +
                    ')'
                );
            })
            .style('opacity', function(d) {
                if (d.depth < zoomedElement.depth) return 0;
                return d.textOpacity;
            })
            .text(GetText);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = sel
            .exit()
            .transition(sharedTransition)
            .attr('transform', function(d) {
                return (
                    'translate(' +
                    ptn2.xScalerPTree(d.x) +
                    ',' +
                    ptn2.yScalerPTree(d.y) +
                    ')'
                );
            })
            .remove();

        nodeExit
            .select('rect')
            .attr('width', function(d) {
                return d.width * ptn2.kx; //0;//
            })
            .attr('height', function(d) {
                return d.height * ptn2.ky;
            });

        nodeExit
            .select('text')
            .attr('transform', function(d) {
                let anchorX = d.width * ptn2.kx - RIGHT_TEXT_MARGIN_PX;
                return (
                    'translate(' +
                    anchorX +
                    ',' +
                    (d.height * ptn2.ky) / 2 +
                    ')'
                );
                //return "translate(8," + d.height * ptn2.ky / 2 + ")";
            })
            .style('opacity', 0);

        ClearArrowsAndConnects();
        DrawMatrix();
    }

    updateFunc = Update;

    function ClearArrows() {
        n2Group.selectAll('[class^=n2_hover_elements]').remove();
    }

    function ClearArrowsAndConnects() {
        ClearArrows();
        newConnsDict = {};
        PrintConnects();
    }

    function ExpandColonVars(d) {
        function findNameInIndex(arr, name) {
            for (let i = 0; i < arr.length; ++i) {
                if (arr[i].name === name) return i;
            }
            return -1;
        }

        function addChildren(
            originalParent,
            parent,
            arrayOfNames,
            arrayOfNamesIndex,
            type
        ) {
            if (arrayOfNames.length == arrayOfNamesIndex) return;

            let name = arrayOfNames[arrayOfNamesIndex];

            if (!parent.hasOwnProperty('children')) {
                parent.children = [];
            }

            let parentI = findNameInIndex(parent.children, name);
            if (parentI == -1) {
                //new name not found in parent, create new
                let newObj = {
                    name: name,
                    type: type,
                    splitByColon: true,
                    originalParent: originalParent
                };
                if (type === 'param' && type === 'unconnected_param') {
                    parent.children.splice(0, 0, newObj);
                } else {
                    parent.children.push(newObj);
                }
                addChildren(
                    originalParent,
                    newObj,
                    arrayOfNames,
                    arrayOfNamesIndex + 1,
                    type
                );
            } else {
                //new name already found in parent, keep traversing
                addChildren(
                    originalParent,
                    parent.children[parentI],
                    arrayOfNames,
                    arrayOfNamesIndex + 1,
                    type
                );
            }
        }

        if (!d.children) return;
        for (let i = 0; i < d.children.length; ++i) {
            let splitArray = d.children[i].name.split(':');
            if (splitArray.length > 1) {
                if (
                    !d.hasOwnProperty('subsystem_type') ||
                    d.subsystem_type !== 'component'
                ) {
                    alert(
                        'error: there is a colon named object whose parent is not a component'
                    );
                    return;
                }
                let type = d.children[i].type;
                d.children.splice(i--, 1);
                addChildren(d, d, splitArray, 0, type);
            }
        }
        for (let i = 0; i < d.children.length; ++i) {
            ExpandColonVars(d.children[i]);
        }
    }

    function FlattenColonGroups(d) {
        if (!d.children) return;
        while (
            d.splitByColon &&
            d.children &&
            d.children.length == 1 &&
            d.children[0].splitByColon
        ) {
            //alert("combine " + d.name + " " + d.children[0].name);
            let child = d.children[0];
            d.name += ':' + child.name;
            d.children =
                child.hasOwnProperty('children') && child.children.length >= 1
                    ? child.children
                    : null; //absorb childs children
            if (d.children == null) delete d.children;
        }
        if (!d.children) return;
        for (let i = 0; i < d.children.length; ++i) {
            FlattenColonGroups(d.children[i]);
        }
    }

    function GetText(d) {
        let retVal = d.name;
        if (
            outputNamingType === 'Promoted' &&
            (d.type === 'unknown' ||
                d.type === 'param' ||
                d.type === 'unconnected_param') &&
            zoomedElement.promotions &&
            zoomedElement.promotions[d.absPathName] !== undefined
        ) {
            retVal = zoomedElement.promotions[d.absPathName];
        }
        if (d.splitByColon && d.children && d.children.length > 0)
            retVal += ':';
        return retVal;
    }

    //Sets parents, depth, and nameWidthPx of all nodes.  Also finds and sets maxDepth.
    function InitTree(d, parent, depth) {
        d.numLeaves = 0; //for nested params
        d.depth = depth;
        d.parent = parent;
        d.id = ++idCounter; //id starts at 1 for if comparision
        d.absPathName = '';
        if (d.parent) {
            //not root node? d.parent.absPathName : "";
            if (d.parent.absPathName !== '') {
                d.absPathName += d.parent.absPathName;
                d.absPathName += d.parent.splitByColon ? ':' : '.';
            }
            d.absPathName += d.name;
        }
        if (
            d.type === 'unknown' ||
            d.type === 'param' ||
            d.type === 'unconnected_param'
        ) {
            let parentComponent = d.originalParent
                ? d.originalParent
                : d.parent;
            if (
                parentComponent.type === 'subsystem' &&
                parentComponent.subsystem_type === 'component'
            ) {
                d.parentComponent = parentComponent;
            } else {
                alert(
                    'error: there is a param or unknown without a parent component!'
                );
            }
        }
        if (d.splitByColon) {
            d.colonName = d.name;
            for (let obj = d.parent; obj.splitByColon; obj = obj.parent) {
                d.colonName = obj.name + ':' + d.colonName;
            }
        }
        maxDepth = Math.max(depth, maxDepth);
        if (d.children) {
            for (let i = 0; i < d.children.length; ++i) {
                let implicit = InitTree(d.children[i], d, depth + 1);
                if (implicit) {
                    d.implicit = true;
                }
            }
        }
        return d.implicit ? true : false;
    }

    function ComputeLayout() {
        let columnWidthsPx = new Array(maxDepth + 1).fill(0.0), // since depth is one based
            columnLocationsPx = new Array(maxDepth + 1).fill(0.0);

        let textWidthGroup = svg
            .append('svg:g')
            .attr('class', 'partition_group');
        let textWidthText = textWidthGroup
            .append('svg:text')
            .text('')
            .attr('x', -50); // Put text off screen
        let textWidthTextNode = textWidthText.node();

        let autoCompleteSetNames = {},
            autoCompleteSetPathNames = {};

        function PopulateAutoCompleteList(d) {
            if (d.children && !d.isMinimized) {
                //depth first, dont go into minimized children
                for (let i = 0; i < d.children.length; ++i) {
                    PopulateAutoCompleteList(d.children[i]);
                }
            }
            if (d === zoomedElement) return;
            if (
                !search.showParams &&
                (d.type === 'param' || d.type === 'unconnected_param')
            )
                return;

            let n = d.name;
            if (d.splitByColon && d.children && d.children.length > 0) n += ':';
            if (
                d.type !== 'param' &&
                d.type !== 'unconnected_param' &&
                d.type !== 'unknown'
            )
                n += '.';
            let namesToAdd = [n];

            if (d.splitByColon)
                namesToAdd.push(
                    d.colonName +
                        (d.children && d.children.length > 0 ? ':' : '')
                );

            namesToAdd.forEach(function(name) {
                if (!autoCompleteSetNames.hasOwnProperty(name)) {
                    autoCompleteSetNames[name] = true;
                    search.autoCompleteListNames.push(name);
                }
            });

            let localPathName =
                zoomedElement === root
                    ? d.absPathName
                    : d.absPathName.slice(zoomedElement.absPathName.length + 1);
            if (!autoCompleteSetPathNames.hasOwnProperty(localPathName)) {
                autoCompleteSetPathNames[localPathName] = true;
                search.autoCompleteListPathNames.push(localPathName);
            }
        }

        function GetTextWidth(s) {
            textWidthText.text(s);
            return textWidthTextNode.getBoundingClientRect().width;
        }

        function UpdateTextWidths(d) {
            if (
                (!search.showParams &&
                    (d.type === 'param' || d.type === 'unconnected_param')) ||
                d.varIsHidden
            )
                return;
            d.nameWidthPx = GetTextWidth(GetText(d)) + 2 * RIGHT_TEXT_MARGIN_PX;
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    UpdateTextWidths(d.children[i]);
                }
            }
        }

        function ComputeColumnWidths(d) {
            let greatestDepth = 0;
            let leafWidthsPx = new Array(maxDepth + 1).fill(0.0);

            function DoComputeColumnWidths(d) {
                if (
                    (!search.showParams &&
                        (d.type === 'param' ||
                            d.type === 'unconnected_param')) ||
                    d.varIsHidden
                )
                    return;

                let heightPx =
                    (ptn2.HEIGHT_PX * d.numLeaves) / zoomedElement.numLeaves;
                d.textOpacity0 = d.hasOwnProperty('textOpacity')
                    ? d.textOpacity
                    : 0;
                d.textOpacity = heightPx > FONT_SIZE_PX ? 1 : 0;
                let hasVisibleDetail = heightPx >= 2.0;
                let widthPx = 1e-3;
                if (hasVisibleDetail) widthPx = ptn2.MIN_COLUMN_WIDTH_PX;
                if (d.textOpacity > 0.5) widthPx = d.nameWidthPx;

                greatestDepth = Math.max(greatestDepth, d.depth);

                if (d.children && !d.isMinimized) {
                    //not leaf
                    columnWidthsPx[d.depth] = Math.max(
                        columnWidthsPx[d.depth],
                        widthPx
                    );
                    for (let i = 0; i < d.children.length; ++i) {
                        DoComputeColumnWidths(d.children[i]);
                    }
                } else {
                    //leaf
                    leafWidthsPx[d.depth] = Math.max(
                        leafWidthsPx[d.depth],
                        widthPx
                    );
                }
            }

            DoComputeColumnWidths(d);

            let sum = 0;
            let lastColumnWidth = 0;
            for (
                let i = leafWidthsPx.length - 1;
                i >= zoomedElement.depth;
                --i
            ) {
                sum += columnWidthsPx[i];
                let lastWidthNeeded = leafWidthsPx[i] - sum;
                lastColumnWidth = Math.max(lastWidthNeeded, lastColumnWidth);
            }
            columnWidthsPx[zoomedElement.depth - 1] = ptn2.PARENT_NODE_WIDTH_PX;
            columnWidthsPx[greatestDepth] = lastColumnWidth;
        }

        function ComputeLeaves(d) {
            if (
                (!search.showParams &&
                    (d.type === 'param' || d.type === 'unconnected_params')) ||
                d.varIsHidden
            ) {
                d.numLeaves = 0;
                return;
            }
            let doRecurse = d.children && !d.isMinimized;
            d.numLeaves = doRecurse ? 0 : 1; //no children: init to 0 because will be added later
            if (!doRecurse) return;

            for (let i = 0; i < d.children.length; ++i) {
                ComputeLeaves(d.children[i]);
                d.numLeaves += d.children[i].numLeaves;
            }
        }

        function ComputeNormalizedPositions(
            d,
            leafCounter,
            isChildOfZoomed,
            earliestMinimizedParent
        ) {
            isChildOfZoomed = isChildOfZoomed ? true : d === zoomedElement;
            if (earliestMinimizedParent == null && isChildOfZoomed) {
                if (
                    (search.showParams ||
                        (d.type !== 'param' &&
                            d.type !== 'unconnected_param')) &&
                    !d.varIsHidden
                )
                    d3NodesArray.push(d);
                if (!d.children || d.isMinimized) {
                    //at a "leaf" node
                    if (
                        (search.showParams ||
                            (d.type !== 'param' &&
                                d.type !== 'unconnected_param')) &&
                        !d.varIsHidden
                    )
                        d3RightTextNodesArrayZoomed.push(d);
                    earliestMinimizedParent = d;
                }
            }
            let node = earliestMinimizedParent ? earliestMinimizedParent : d;
            d.rootIndex0 = d.hasOwnProperty('rootIndex')
                ? d.rootIndex
                : leafCounter;
            d.rootIndex = leafCounter;
            d.x0 = d.hasOwnProperty('x') ? d.x : 1e-6;
            d.y0 = d.hasOwnProperty('y') ? d.y : 1e-6;
            d.width0 = d.hasOwnProperty('width') ? d.width : 1e-6;
            d.height0 = d.hasOwnProperty('height') ? d.height : 1e-6;
            d.x = columnLocationsPx[node.depth] / ptn2.widthPTreePx;
            d.y = leafCounter / root.numLeaves;
            d.width =
                d.children && !d.isMinimized
                    ? columnWidthsPx[node.depth] / ptn2.widthPTreePx
                    : 1 - node.x; //1-d.x;
            d.height = node.numLeaves / root.numLeaves;
            if (
                (!search.showParams &&
                    (d.type === 'param' || d.type === 'unconnected_param')) ||
                d.varIsHidden
            ) {
                //param or hidden leaf leaving
                d.x =
                    columnLocationsPx[d.parentComponent.depth + 1] /
                    ptn2.widthPTreePx;
                d.y = d.parentComponent.y;
                d.width = 1e-6;
                d.height = 1e-6;
            }

            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    ComputeNormalizedPositions(
                        d.children[i],
                        leafCounter,
                        isChildOfZoomed,
                        earliestMinimizedParent
                    );
                    if (earliestMinimizedParent == null) {
                        //numleaves is only valid passed nonminimized nodes
                        leafCounter += d.children[i].numLeaves;
                    }
                }
            }
        }

        UpdateTextWidths(zoomedElement);
        ComputeLeaves(root);
        d3NodesArray = [];
        d3RightTextNodesArrayZoomed = [];

        //COLUMN WIDTH COMPUTATION
        ComputeColumnWidths(zoomedElement);
        // Now the column_width array is relative to the zoomedElement
        //    and the computation of the widths only includes visible items after the zoom
        ptn2.widthPTreePx = 0;
        for (let depth = 1; depth <= maxDepth; ++depth) {
            columnLocationsPx[depth] = ptn2.widthPTreePx;
            ptn2.widthPTreePx += columnWidthsPx[depth];
        }

        ComputeNormalizedPositions(root, 0, false, null);
        if (zoomedElement.parent) {
            d3NodesArray.push(zoomedElement.parent);
        }

        if (updateRecomputesAutoComplete) {
            search.autoCompleteListNames = [];
            search.autoCompleteListPathNames = [];
            PopulateAutoCompleteList(zoomedElement);
        }
        updateRecomputesAutoComplete = true; //default

        enterIndex = exitIndex = 0;
        if (lastClickWasLeft) {
            //left click
            if (leftClickIsForward) {
                exitIndex =
                    lastLeftClickedElement.rootIndex - zoomedElement0.rootIndex;
            } else {
                enterIndex =
                    zoomedElement0.rootIndex - lastLeftClickedElement.rootIndex;
            }
        }

        textWidthGroup.remove();
    }

    let lastLeftClickedEle;
    let lastRightClickedEle;
    let lastRightClickedObj;

    //right click => collapse
    function RightClick(d, ele) {
        let e = d3.event;
        lastLeftClickedEle = d;
        lastRightClickedObj = d;
        lastRightClickedEle = ele;
        e.preventDefault();
        collapse();
    }

    let menu = document.querySelector('#context-menu');
    let menuState = 0;
    let contextMenuActive = 'context-menu--active';

    function collapse() {
        let d = lastLeftClickedEle;
        if (!d.children) return;
        if (d.depth > zoomedElement.depth) {
            //dont allow minimizing on root node
            lastRightClickedElement = d;
            FindRootOfChangeFunction = FindRootOfChangeForRightClick;
            ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_FAST;
            lastClickWasLeft = false;
            Toggle(d);
            Update(d);
        }
    }

    function SetupLeftClick(d) {
        lastLeftClickedElement = d;
        lastClickWasLeft = true;
        if (lastLeftClickedElement.depth > zoomedElement.depth) {
            leftClickIsForward = true; //forward
        } else if (lastLeftClickedElement.depth < zoomedElement.depth) {
            leftClickIsForward = false; //backwards
        }
        zoomedElement0 = zoomedElement;
        zoomedElement = d;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_FAST;
    }

    //left click => navigate
    function LeftClick(d, ele) {
        if (!d.children) return;
        if (d3.event.button != 0) return;
        backButtonHistory.push({ el: zoomedElement });
        forwardButtonHistory = [];
        SetupLeftClick(d);
        Update();
        d3.event.preventDefault();
        d3.event.stopPropagation();
    }

    function BackButtonPressed() {
        if (backButtonHistory.length == 0) return;
        let d = backButtonHistory.pop().el;
        $('#backButtonId')[0].disabled =
            backButtonHistory.length == 0 ? 'disabled' : false;
        for (let obj = d; obj != null; obj = obj.parent) {
            //make sure history item is not minimized
            if (obj.isMinimized) return;
        }
        forwardButtonHistory.push({ el: zoomedElement });
        SetupLeftClick(d);
        Update();
    }

    function ForwardButtonPressed() {
        if (forwardButtonHistory.length == 0) return;
        let d = forwardButtonHistory.pop().el;
        $('#forwardButtonId')[0].disabled =
            forwardButtonHistory.length == 0 ? 'disabled' : false;
        for (let obj = d; obj != null; obj = obj.parent) {
            //make sure history item is not minimized
            if (obj.isMinimized) return;
        }
        backButtonHistory.push({ el: zoomedElement });
        SetupLeftClick(d);
        Update();
    }

    function GetClass(d) {
        if (d.isMinimized) return 'minimized';
        if (d.type === 'param') {
            if (d.children && d.children.length > 0) return 'param_group';
            return 'param';
        }
        if (d.type === 'unconnected_param') {
            if (d.children && d.children.length > 0) return 'param_group';
            return 'unconnected_param';
        }
        if (d.type === 'unknown') {
            if (d.children && d.children.length > 0) return 'unknown_group';
            if (d.implicit) return 'unknown_implicit';
            return 'unknown';
        }
        if (d.type === 'root') return 'subsystem';
        if (d.type === 'subsystem') {
            if (d.subsystem_type === 'component') return 'component';
            return 'subsystem';
        }
        alert('class not found');
    }

    function Toggle(d) {
        if (d.isMinimized) d.isMinimized = false;
        else d.isMinimized = true;
    }

    function ComputeConnections() {
        function GetObjectInTree(d, nameArray, nameIndex) {
            if (nameArray.length == nameIndex) {
                return d;
            }
            if (!d.children) {
                return null;
            }

            for (let i = 0; i < d.children.length; ++i) {
                if (d.children[i].name === nameArray[nameIndex]) {
                    return GetObjectInTree(
                        d.children[i],
                        nameArray,
                        nameIndex + 1
                    );
                } else {
                    let numNames = d.children[i].name.split(':').length;
                    if (
                        numNames >= 2 &&
                        nameIndex + numNames <= nameArray.length
                    ) {
                        let mergedName = nameArray[nameIndex];
                        for (let j = 1; j < numNames; ++j) {
                            mergedName += ':' + nameArray[nameIndex + j];
                        }
                        if (d.children[i].name === mergedName) {
                            return GetObjectInTree(
                                d.children[i],
                                nameArray,
                                nameIndex + numNames
                            );
                        }
                    }
                }
            }
            return null;
        }

        function RemoveDuplicates(d) {
            //remove redundant elements in every objects' sources and targets arrays
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    RemoveDuplicates(d.children[i]);
                }
            }

            function unique(elem, pos, arr) {
                return arr.indexOf(elem) == pos;
            }

            if (d.targetsParamView) {
                //numElementsBefore += d.targetsParamView.length;
                let uniqueArray = d.targetsParamView.filter(unique);
                d.targetsParamView = uniqueArray;
                //numElementsAfter += d.targetsParamView.length;
            }
            if (d.targetsHideParams) {
                //numElementsBefore += d.targetsHideParams.length;
                let uniqueArray = d.targetsHideParams.filter(unique);
                d.targetsHideParams = uniqueArray;
                //numElementsAfter += d.targetsHideParams.length;
            }
        }

        function AddLeaves(d, objArray) {
            if (d.type !== 'param' && d.type !== 'unconnected_param') {
                objArray.push(d);
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    AddLeaves(d.children[i], objArray);
                }
            }
        }

        function ClearConnections(d) {
            d.targetsParamView = [];
            d.targetsHideParams = [];
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    ClearConnections(d.children[i]);
                }
            }
        }

        ClearConnections(root);

        for (let i = 0; i < conns.length; ++i) {
            let srcSplitArray = conns[i].src.split(/\.|:/);
            let srcObj = GetObjectInTree(root, srcSplitArray, 0);
            if (srcObj == null) {
                alert('error: cannot find connection source ' + conns[i].src);
                return;
            }
            let srcObjArray = [srcObj];
            if (srcObj.type !== 'unknown') {
                //source obj must be unknown
                alert('error: there is a source that is not an unknown.');
                return;
            }
            if (srcObj.children) {
                //source obj must be unknown
                alert('error: there is a source that has children.');
                return;
            }
            for (let obj = srcObj.parent; obj != null; obj = obj.parent) {
                srcObjArray.push(obj);
            }

            let tgtSplitArray = conns[i].tgt.split(/\.|:/);
            let tgtObj = GetObjectInTree(root, tgtSplitArray, 0);
            if (tgtObj == null) {
                alert('error: cannot find connection target ' + conns[i].tgt);
                return;
            }
            let tgtObjArrayParamView = [tgtObj];
            let tgtObjArrayHideParams = [tgtObj];
            if (
                tgtObj.type !== 'param' &&
                tgtObj.type !== 'unconnected_param'
            ) {
                //target obj must be a param
                alert('error: there is a target that is NOT a param.');
                return;
            }
            if (tgtObj.children) {
                alert('error: there is a target that has children.');
                return;
            }
            AddLeaves(tgtObj.parentComponent, tgtObjArrayHideParams); //contaminate
            for (let obj = tgtObj.parent; obj != null; obj = obj.parent) {
                tgtObjArrayParamView.push(obj);
                tgtObjArrayHideParams.push(obj);
            }

            for (let j = 0; j < srcObjArray.length; ++j) {
                if (!srcObjArray[j].hasOwnProperty('targetsParamView'))
                    srcObjArray[j].targetsParamView = [];
                if (!srcObjArray[j].hasOwnProperty('targetsHideParams'))
                    srcObjArray[j].targetsHideParams = [];
                srcObjArray[j].targetsParamView = srcObjArray[
                    j
                ].targetsParamView.concat(tgtObjArrayParamView);
                srcObjArray[j].targetsHideParams = srcObjArray[
                    j
                ].targetsHideParams.concat(tgtObjArrayHideParams);
            }

            let cycleArrowsArray = [];
            if (conns[i].cycle_arrows && conns[i].cycle_arrows.length > 0) {
                let cycleArrows = conns[i].cycle_arrows;
                for (let j = 0; j < cycleArrows.length; ++j) {
                    let cycleArrowsSplitArray = cycleArrows[j].split(' ');
                    if (cycleArrowsSplitArray.length != 2) {
                        alert(
                            'error: cycleArrowsSplitArray length not 2: got ' +
                                cycleArrowsSplitArray.length
                        );
                        return;
                    }
                    let splitArray = cycleArrowsSplitArray[0].split(/\.|:/);
                    let arrowBeginObj = GetObjectInTree(root, splitArray, 0);
                    if (arrowBeginObj == null) {
                        alert(
                            'error: cannot find cycle arrows begin object ' +
                                cycleArrowsSplitArray[0]
                        );
                        return;
                    }
                    splitArray = cycleArrowsSplitArray[1].split(/\.|:/);
                    let arrowEndObj = GetObjectInTree(root, splitArray, 0);
                    if (arrowEndObj == null) {
                        alert(
                            'error: cannot find cycle arrows end object ' +
                                cycleArrowsSplitArray[1]
                        );
                        return;
                    }
                    cycleArrowsArray.push({
                        begin: arrowBeginObj,
                        end: arrowEndObj
                    });
                }
            }
            if (cycleArrowsArray.length > 0) {
                if (!tgtObj.parent.hasOwnProperty('cycleArrows')) {
                    tgtObj.parent.cycleArrows = [];
                }
                tgtObj.parent.cycleArrows.push({
                    src: srcObj,
                    arrows: cycleArrowsArray
                });
            }
        }
        RemoveDuplicates(root);
    }

    function ComputeMatrixN2() {
        matrix = {};
        if (
            d3RightTextNodesArrayZoomed.length < ptn2.LEVEL_OF_DETAIL_THRESHOLD
        ) {
            for (let si = 0; si < d3RightTextNodesArrayZoomed.length; ++si) {
                let srcObj = d3RightTextNodesArrayZoomed[si];
                matrix[si + '_' + si] = {
                    r: si,
                    c: si,
                    obj: srcObj,
                    id: srcObj.id + '_' + srcObj.id
                };
                let targets = search.showParams
                    ? srcObj.targetsParamView
                    : srcObj.targetsHideParams;
                for (let j = 0; j < targets.length; ++j) {
                    let tgtObj = targets[j];
                    let ti = d3RightTextNodesArrayZoomed.indexOf(tgtObj);
                    if (ti != -1) {
                        matrix[si + '_' + ti] = {
                            r: si,
                            c: ti,
                            obj: srcObj,
                            id: srcObj.id + '_' + tgtObj.id
                        }; //matrix[si][ti].z = 1;
                    }
                }
                if (
                    search.showParams &&
                    (srcObj.type === 'param' ||
                        srcObj.type === 'unconnected_param')
                ) {
                    for (
                        let j = si + 1;
                        j < d3RightTextNodesArrayZoomed.length;
                        ++j
                    ) {
                        let tgtObj = d3RightTextNodesArrayZoomed[j];
                        if (srcObj.parentComponent !== tgtObj.parentComponent)
                            break;
                        if (tgtObj.type === 'unknown') {
                            let ti = j;
                            matrix[si + '_' + ti] = {
                                r: si,
                                c: ti,
                                obj: srcObj,
                                id: srcObj.id + '_' + tgtObj.id
                            };
                        }
                    }
                }
            }
        }
        n2Dx0 = n2Dx;
        n2Dy0 = n2Dy;

        n2Dx = ptn2.WIDTH_N2_PX / d3RightTextNodesArrayZoomed.length;
        n2Dy = ptn2.HEIGHT_PX / d3RightTextNodesArrayZoomed.length;

        symbols_scalar = [];
        symbols_vector = [];
        symbols_group = [];
        symbols_scalarScalar = [];
        symbols_scalarVector = [];
        symbols_vectorScalar = [];
        symbols_vectorVector = [];
        symbols_scalarGroup = [];
        symbols_groupScalar = [];
        symbols_vectorGroup = [];
        symbols_groupVector = [];
        symbols_groupGroup = [];

        for (let key in matrix) {
            let d = matrix[key];
            let tgtObj = d3RightTextNodesArrayZoomed[d.c],
                srcObj = d3RightTextNodesArrayZoomed[d.r];
            //alert(tgtObj.name + " " + srcObj.name);
            if (d.c == d.r) {
                //on diagonal
                if (srcObj.type === 'subsystem') {
                    //group
                    symbols_group.push(d);
                } else if (
                    srcObj.type === 'unknown' ||
                    (search.showParams &&
                        (srcObj.type === 'param' ||
                            srcObj.type === 'unconnected_param'))
                ) {
                    if (srcObj.dtype === 'ndarray') {
                        //vector
                        symbols_vector.push(d);
                    } else {
                        //scalar
                        symbols_scalar.push(d);
                    }
                }
            } else if (srcObj.type === 'subsystem') {
                if (tgtObj.type === 'subsystem') {
                    //groupGroup
                    symbols_groupGroup.push(d);
                } else if (
                    tgtObj.type === 'unknown' ||
                    (search.showParams &&
                        (tgtObj.type === 'param' ||
                            tgtObj.type === 'unconnected_param'))
                ) {
                    if (tgtObj.dtype === 'ndarray') {
                        //groupVector
                        symbols_groupVector.push(d);
                    } else {
                        //groupScalar
                        symbols_groupScalar.push(d);
                    }
                }
            } else if (
                srcObj.type === 'unknown' ||
                (search.showParams &&
                    (srcObj.type === 'param' ||
                        srcObj.type === 'unconnected_param'))
            ) {
                if (srcObj.dtype === 'ndarray') {
                    if (
                        tgtObj.type === 'unknown' ||
                        (search.showParams &&
                            (tgtObj.type === 'param' ||
                                tgtObj.type === 'unconnected_param'))
                    ) {
                        if (
                            tgtObj.dtype === 'ndarray' ||
                            (search.showParams &&
                                (tgtObj.type === 'param' ||
                                    tgtObj.type === 'unconnected_param'))
                        ) {
                            //vectorVector
                            symbols_vectorVector.push(d);
                        } else {
                            //vectorScalar
                            symbols_vectorScalar.push(d);
                        }
                    } else if (tgtObj.type === 'subsystem') {
                        //vectorGroup
                        symbols_vectorGroup.push(d);
                    }
                } else {
                    //if (srcObj.dtype !== "ndarray"){
                    if (
                        tgtObj.type === 'unknown' ||
                        (search.showParams &&
                            (tgtObj.type === 'param' ||
                                tgtObj.type === 'unconnected_param'))
                    ) {
                        if (tgtObj.dtype === 'ndarray') {
                            //scalarVector
                            symbols_scalarVector.push(d);
                        } else {
                            //scalarScalar
                            symbols_scalarScalar.push(d);
                        }
                    } else if (tgtObj.type === 'subsystem') {
                        //scalarGroup
                        symbols_scalarGroup.push(d);
                    }
                }
            }
        }

        let currentBox = { startI: 0, stopI: 0 };
        d3RightTextNodesArrayZoomedBoxInfo = [currentBox];
        for (let ri = 1; ri < d3RightTextNodesArrayZoomed.length; ++ri) {
            //boxes
            let el = d3RightTextNodesArrayZoomed[ri];
            let startINode = d3RightTextNodesArrayZoomed[currentBox.startI];
            if (
                startINode.parentComponent &&
                el.parentComponent &&
                startINode.parentComponent === el.parentComponent
            ) {
                ++currentBox.stopI;
            } else {
                currentBox = { startI: ri, stopI: ri };
            }
            d3RightTextNodesArrayZoomedBoxInfo.push(currentBox);
        }

        drawableN2ComponentBoxes = [];
        for (let i = 0; i < d3RightTextNodesArrayZoomedBoxInfo.length; ++i) {
            //draw grid lines last so that they will always be visible
            let box = d3RightTextNodesArrayZoomedBoxInfo[i];
            if (box.startI == box.stopI) continue;
            let el = d3RightTextNodesArrayZoomed[box.startI];
            if (!el.parentComponent) alert('parent component not found in box'); //continue;
            box.obj = el.parentComponent;
            i = box.stopI;
            drawableN2ComponentBoxes.push(box);
        }

        //do this so you save old index for the exit()
        gridLines = [];
        if (
            d3RightTextNodesArrayZoomed.length < ptn2.LEVEL_OF_DETAIL_THRESHOLD
        ) {
            for (let i = 0; i < d3RightTextNodesArrayZoomed.length; ++i) {
                let obj = d3RightTextNodesArrayZoomed[i];
                let gl = { i: i, obj: obj };
                gridLines.push(gl);
            }
        }
    }

    function FindRootOfChangeForShowParams(d) {
        return d.hasOwnProperty('parentComponent') ? d.parentComponent : d;
    }

    function FindRootOfChangeForRightClick(d) {
        return lastRightClickedElement;
    }

    function FindRootOfChangeForCollapseDepth(d) {
        for (let obj = d; obj != null; obj = obj.parent) {
            //make sure history item is not minimized
            if (obj.depth == chosenCollapseDepth) return obj;
        }
        return d;
    }

    function FindRootOfChangeForCollapseUncollapseOutputs(d) {
        return d.hasOwnProperty('parentComponent') ? d.parentComponent : d;
    }

    function MouseoverOffDiagN2(d) {
        function GetObjectsInChildrenWithCycleArrows(d, arr) {
            if (d.cycleArrows) {
                arr.push(d);
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    GetObjectsInChildrenWithCycleArrows(d.children[i], arr);
                }
            }
        }
        function GetObjectsWithCycleArrows(d, arr) {
            for (let obj = d.parent; obj != null; obj = obj.parent) {
                //start with parent.. the children will get the current object to avoid duplicates
                if (obj.cycleArrows) {
                    arr.push(obj);
                }
            }
            GetObjectsInChildrenWithCycleArrows(d, arr);
        }

        function HasObjectInChildren(d, toMatchObj) {
            if (d === toMatchObj) {
                return true;
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    if (HasObjectInChildren(d.children[i], toMatchObj)) {
                        return true;
                    }
                }
            }
            return false;
        }
        function HasObject(d, toMatchObj) {
            for (let obj = d; obj != null; obj = obj.parent) {
                if (obj === toMatchObj) {
                    return true;
                }
            }
            return HasObjectInChildren(d, toMatchObj);
        }

        let lineWidth = Math.min(5, n2Dx * 0.5, n2Dy * 0.5);
        arrowMarker
            .attr('markerWidth', lineWidth * 0.4)
            .attr('markerHeight', lineWidth * 0.4);
        let src = d3RightTextNodesArrayZoomed[d.r];
        let tgt = d3RightTextNodesArrayZoomed[d.c];
        let boxEnd = d3RightTextNodesArrayZoomedBoxInfo[d.c];
        if (d.r > d.c) {
            //bottom left
            DrawPathTwoLines(
                n2Dx * d.r, //x1
                n2Dy * d.r + n2Dy * 0.5, //y1
                n2Dx * d.c + n2Dx * 0.5, //left x2
                n2Dy * d.r + n2Dy * 0.5, //left y2
                n2Dx * d.c + n2Dx * 0.5, //up x3
                search.showParams
                    ? n2Dy * d.c + n2Dy - 1e-2
                    : n2Dy * boxEnd.stopI + n2Dy - 1e-2, //up y3
                ptn2.RED_ARROW_COLOR,
                lineWidth,
                true
            );

            let targetsWithCycleArrows = [];
            GetObjectsWithCycleArrows(tgt, targetsWithCycleArrows);
            for (let ti = 0; ti < targetsWithCycleArrows.length; ++ti) {
                let arrows = targetsWithCycleArrows[ti].cycleArrows;
                for (let ai = 0; ai < arrows.length; ++ai) {
                    if (HasObject(src, arrows[ai].src)) {
                        let correspondingSrcArrows = arrows[ai].arrows;
                        for (
                            let si = 0;
                            si < correspondingSrcArrows.length;
                            ++si
                        ) {
                            let beginObj = correspondingSrcArrows[si].begin;
                            let endObj = correspondingSrcArrows[si].end;
                            //alert(beginObj.name + "->" + endObj.name);
                            let firstBeginIndex = -1,
                                firstEndIndex = -1;

                            //find first begin index
                            for (
                                let mi = 0;
                                mi < d3RightTextNodesArrayZoomed.length;
                                ++mi
                            ) {
                                let rtNode = d3RightTextNodesArrayZoomed[mi];
                                if (HasObject(rtNode, beginObj)) {
                                    firstBeginIndex = mi;
                                    break;
                                }
                            }
                            if (firstBeginIndex == -1) {
                                alert('error: first begin index not found');
                                return;
                            }

                            //find first end index
                            for (
                                let mi = 0;
                                mi < d3RightTextNodesArrayZoomed.length;
                                ++mi
                            ) {
                                let rtNode = d3RightTextNodesArrayZoomed[mi];
                                if (HasObject(rtNode, endObj)) {
                                    firstEndIndex = mi;
                                    break;
                                }
                            }
                            if (firstEndIndex == -1) {
                                alert('error: first end index not found');
                                return;
                            }

                            if (firstBeginIndex != firstEndIndex) {
                                if (search.showParams) {
                                    DrawArrowsParamView(
                                        firstBeginIndex,
                                        firstEndIndex
                                    );
                                } else {
                                    DrawArrows(firstBeginIndex, firstEndIndex);
                                }
                            }
                        }
                    }
                }
            }
        } else if (d.r < d.c) {
            //top right
            DrawPathTwoLines(
                n2Dx * d.r + n2Dx, //x1
                n2Dy * d.r + n2Dy * 0.5, //y1
                n2Dx * d.c + n2Dx * 0.5, //right x2
                n2Dy * d.r + n2Dy * 0.5, //right y2
                n2Dx * d.c + n2Dx * 0.5, //down x3
                search.showParams
                    ? n2Dy * d.c + 1e-2
                    : n2Dy * boxEnd.startI + 1e-2, //down y3
                ptn2.RED_ARROW_COLOR,
                lineWidth,
                true
            );
        }
        let leftTextWidthR = d3RightTextNodesArrayZoomed[d.r].nameWidthPx,
            leftTextWidthC = d3RightTextNodesArrayZoomed[d.c].nameWidthPx;
        DrawRect(
            -leftTextWidthR - PTREE_N2_GAP_PX,
            n2Dy * d.r,
            leftTextWidthR,
            n2Dy,
            ptn2.RED_ARROW_COLOR
        ); //highlight var name
        DrawRect(
            -leftTextWidthC - PTREE_N2_GAP_PX,
            n2Dy * d.c,
            leftTextWidthC,
            n2Dy,
            ptn2.GREEN_ARROW_COLOR
        ); //highlight var name
    }

    function MouseoverOnDiagN2(d) {
        //d=hovered element
        let hoveredIndexRC = d.c; //d.x == d.y == row == col
        let leftTextWidthHovered =
            d3RightTextNodesArrayZoomed[hoveredIndexRC].nameWidthPx;

        // Loop over all elements in the matrix looking for other cells in the same column as
        let lineWidth = Math.min(5, n2Dx * 0.5, n2Dy * 0.5);
        arrowMarker
            .attr('markerWidth', lineWidth * 0.4)
            .attr('markerHeight', lineWidth * 0.4);
        DrawRect(
            -leftTextWidthHovered - PTREE_N2_GAP_PX,
            n2Dy * hoveredIndexRC,
            leftTextWidthHovered,
            n2Dy,
            ptn2.HIGHLIGHT_HOVERED_COLOR
        ); //highlight hovered
        for (let i = 0; i < d3RightTextNodesArrayZoomed.length; ++i) {
            let leftTextWidthDependency =
                d3RightTextNodesArrayZoomed[i].nameWidthPx;
            let box = d3RightTextNodesArrayZoomedBoxInfo[i];
            if (matrix[hoveredIndexRC + '_' + i] !== undefined) {
                //if (matrix[hoveredIndexRC][i].z > 0) { //i is column here
                if (i < hoveredIndexRC) {
                    //column less than hovered
                    if (search.showParams) {
                        DrawPathTwoLines(
                            n2Dx * hoveredIndexRC, //x1
                            n2Dy * (hoveredIndexRC + 0.5), //y1
                            (i + 0.5) * n2Dx, //left x2
                            n2Dy * (hoveredIndexRC + 0.5), //left y2
                            (i + 0.5) * n2Dx, //up x3
                            (i + 1) * n2Dy, //up y3
                            ptn2.GREEN_ARROW_COLOR,
                            lineWidth,
                            true
                        );
                    } else if (i == box.startI) {
                        DrawPathTwoLines(
                            n2Dx * hoveredIndexRC, //x1
                            n2Dy * hoveredIndexRC + n2Dy * 0.5, //y1
                            (box.startI + (box.stopI - box.startI) * 0.5) *
                                n2Dx +
                                n2Dx * 0.5, //left x2
                            n2Dy * hoveredIndexRC + n2Dy * 0.5, //left y2
                            (box.startI + (box.stopI - box.startI) * 0.5) *
                                n2Dx +
                                n2Dx * 0.5, //up x3
                            n2Dy * box.stopI + n2Dy, //up y3
                            ptn2.GREEN_ARROW_COLOR,
                            lineWidth,
                            true
                        );
                    }
                    DrawRect(
                        -leftTextWidthDependency - PTREE_N2_GAP_PX,
                        n2Dy * i,
                        leftTextWidthDependency,
                        n2Dy,
                        ptn2.GREEN_ARROW_COLOR
                    ); //highlight var name
                } else if (i > hoveredIndexRC) {
                    //column greater than hovered
                    if (search.showParams) {
                        DrawPathTwoLines(
                            n2Dx * hoveredIndexRC + n2Dx, //x1
                            n2Dy * (hoveredIndexRC + 0.5), //y1
                            (i + 0.5) * n2Dx, //right x2
                            n2Dy * (hoveredIndexRC + 0.5), //right y2
                            (i + 0.5) * n2Dx, //down x3
                            n2Dy * i, //down y3
                            ptn2.GREEN_ARROW_COLOR,
                            lineWidth,
                            true
                        ); //v  ertical down
                    } else if (i == box.startI) {
                        DrawPathTwoLines(
                            n2Dx * hoveredIndexRC + n2Dx, //x1
                            n2Dy * hoveredIndexRC + n2Dy * 0.5, //y1
                            (box.startI + (box.stopI - box.startI) * 0.5) *
                                n2Dx +
                                n2Dx * 0.5, //right x2
                            n2Dy * hoveredIndexRC + n2Dy * 0.5, //right y2
                            (box.startI + (box.stopI - box.startI) * 0.5) *
                                n2Dx +
                                n2Dx * 0.5, //down x3
                            n2Dy * box.startI, //down y3
                            ptn2.GREEN_ARROW_COLOR,
                            lineWidth,
                            true
                        ); //vertical down
                    }
                    DrawRect(
                        -leftTextWidthDependency - PTREE_N2_GAP_PX,
                        n2Dy * i,
                        leftTextWidthDependency,
                        n2Dy,
                        ptn2.GREEN_ARROW_COLOR
                    ); //highlight var name
                }
            }

            if (matrix[i + '_' + hoveredIndexRC] !== undefined) {
                //if (matrix[i][hoveredIndexRC].z > 0) { //i is row here
                if (i < hoveredIndexRC) {
                    //row less than hovered
                    DrawPathTwoLines(
                        n2Dx * i + n2Dx, //x1
                        n2Dy * i + n2Dy * 0.5, //y1
                        n2Dx * hoveredIndexRC + n2Dx * 0.5, //right x2
                        n2Dy * i + n2Dy * 0.5, //right y2
                        n2Dx * hoveredIndexRC + n2Dx * 0.5, //down x3
                        n2Dy * hoveredIndexRC, //down y3
                        ptn2.RED_ARROW_COLOR,
                        lineWidth,
                        true
                    ); //vertical down
                    DrawRect(
                        -leftTextWidthDependency - PTREE_N2_GAP_PX,
                        n2Dy * i,
                        leftTextWidthDependency,
                        n2Dy,
                        ptn2.RED_ARROW_COLOR
                    ); //highlight var name
                } else if (i > hoveredIndexRC) {
                    //row greater than hovered
                    DrawPathTwoLines(
                        n2Dx * i, //x1
                        n2Dy * i + n2Dy * 0.5, //y1
                        n2Dx * hoveredIndexRC + n2Dx * 0.5, //left x2
                        n2Dy * i + n2Dy * 0.5, //left y2
                        n2Dx * hoveredIndexRC + n2Dx * 0.5, //up x3
                        n2Dy * hoveredIndexRC + n2Dy, //up y3
                        ptn2.RED_ARROW_COLOR,
                        lineWidth,
                        true
                    );
                    DrawRect(
                        -leftTextWidthDependency - PTREE_N2_GAP_PX,
                        n2Dy * i,
                        leftTextWidthDependency,
                        n2Dy,
                        ptn2.RED_ARROW_COLOR
                    ); //highlight var name
                }
            }
        }
    }

    function MouseoutN2() {
        n2Group.selectAll('.n2_hover_elements').remove();
    }

    function MouseClickN2(d) {
        let newClassName = 'n2_hover_elements_' + d.r + '_' + d.c;
        let selection = n2Group.selectAll('.' + newClassName);
        if (selection.size() > 0) {
            selection.remove();
        } else {
            n2Group
                .selectAll('path.n2_hover_elements, circle.n2_hover_elements')
                .attr('class', newClassName);
        }
    }

    function ReturnToRootButtonClick() {
        backButtonHistory.push({ el: zoomedElement });
        forwardButtonHistory = [];
        SetupLeftClick(root);
        Update();
    }

    function UpOneLevelButtonClick() {
        if (zoomedElement === root) return;
        backButtonHistory.push({ el: zoomedElement });
        forwardButtonHistory = [];
        SetupLeftClick(zoomedElement.parent);
        Update();
    }

    function CollapseOutputsButtonClick(startNode) {
        function CollapseOutputs(d) {
            if (d.subsystem_type && d.subsystem_type === 'component') {
                d.isMinimized = true;
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    CollapseOutputs(d.children[i]);
                }
            }
        }
        FindRootOfChangeFunction = FindRootOfChangeForCollapseUncollapseOutputs;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_SLOW;
        lastClickWasLeft = false;
        CollapseOutputs(startNode);
        Update();
    }

    function UncollapseButtonClick(startNode) {
        function Uncollapse(d) {
            if (d.type !== 'param' && d.type !== 'unconnected_param') {
                d.isMinimized = false;
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    Uncollapse(d.children[i]);
                }
            }
        }
        FindRootOfChangeFunction = FindRootOfChangeForCollapseUncollapseOutputs;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_SLOW;
        lastClickWasLeft = false;
        Uncollapse(startNode);
        Update();
    }

    function CollapseToDepthSelectChange(newChosenCollapseDepth) {
        function CollapseToDepth(d, depth) {
            if (
                d.type === 'param' ||
                d.type === 'unknown' ||
                d.type === 'unconnected_param'
            ) {
                return;
            }
            if (d.depth < depth) {
                d.isMinimized = false;
            } else {
                d.isMinimized = true;
            }
            if (d.children) {
                for (let i = 0; i < d.children.length; ++i) {
                    CollapseToDepth(d.children[i], depth);
                }
            }
        }

        chosenCollapseDepth = newChosenCollapseDepth;
        if (chosenCollapseDepth > zoomedElement.depth) {
            CollapseToDepth(root, chosenCollapseDepth);
        }
        FindRootOfChangeFunction = FindRootOfChangeForCollapseDepth;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_SLOW;
        lastClickWasLeft = false;
        Update();
    }

    function FontSizeSelectChange(fontSize) {
        for (let i = 8; i <= 14; ++i) {
            let newText = i == fontSize ? '<b>' + i + 'px</b>' : i + 'px';
            $('#idFontSize' + i + 'px')[0].innerHTML = newText;
        }
        FONT_SIZE_PX = fontSize;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_FAST;
        UpdateSvgCss(svgStyleElement, FONT_SIZE_PX);
        Update();
    }

    function VerticalResize(height) {
        for (let i = 600; i <= 1000; i += 50) {
            let newText = i == height ? '<b>' + i + 'px</b>' : i + 'px';
            $('#idVerticalResize' + i + 'px')[0].innerHTML = newText;
        }
        for (let i = 2000; i <= 4000; i += 1000) {
            let newText = i == height ? '<b>' + i + 'px</b>' : i + 'px';
            $('#idVerticalResize' + i + 'px')[0].innerHTML = newText;
        }
        ClearArrowsAndConnects();
        ptn2.HEIGHT_PX = height;
        ptn2.LEVEL_OF_DETAIL_THRESHOLD = ptn2.HEIGHT_PX / 3;
        ptn2.WIDTH_N2_PX = ptn2.HEIGHT_PX;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_FAST;
        UpdateSvgCss(svgStyleElement, FONT_SIZE_PX);
        Update();
    }

    function ShowParamsCheckboxChange() {
        if (
            zoomedElement.type === 'param' ||
            zoomedElement.type === 'unconnected_param'
        )
            return;
        search.showParams = !search.showParams;
        $('#showParamsButtonId')[0].className = search.showParams
            ? 'myButton myButtonToggledOn'
            : 'myButton';

        FindRootOfChangeFunction = FindRootOfChangeForShowParams;
        lastClickWasLeft = false;
        ptn2.TRANSITION_DURATION = ptn2.TRANSITION_DURATION_SLOW;
        transitionStartDelay = 500;
        SetupLegend(d3, d3ContentDiv);
        Update();
    }

    function ShowPathCheckboxChange() {
        showPath = !showPath;
        $('#currentPathId')[0].style.display = showPath ? 'block' : 'none';
        $('#showCurrentPathButtonId')[0].className = showPath
            ? 'myButton myButtonToggledOn'
            : 'myButton';
    }

    function ToggleLegend() {
        showLegend = !showLegend;
        $('#showLegendButtonId')[0].className = showLegend
            ? 'myButton myButtonToggledOn'
            : 'myButton';
        SetupLegend(d3, d3ContentDiv);
    }

    function CreateDomLayout() {
        document.getElementById('searchButtonId').onclick =
            search.SearchButtonClicked;
    }

    function CreateToolbar() {
        let div = document.getElementById('toolbarDiv');
        $('#returnToRootButtonId')[0].onclick = ReturnToRootButtonClick;
        $('#backButtonId')[0].onclick = BackButtonPressed;
        $('#forwardButtonId')[0].onclick = ForwardButtonPressed;
        $('#upOneLevelButtonId')[0].onclick = UpOneLevelButtonClick;
        $('#uncollapseInViewButtonId')[0].onclick = function() {
            UncollapseButtonClick(zoomedElement);
        };
        $('#uncollapseAllButtonId')[0].onclick = function() {
            UncollapseButtonClick(root);
        };
        $('#collapseInViewButtonId')[0].onclick = function() {
            CollapseOutputsButtonClick(zoomedElement);
        };
        $('#collapseAllButtonId')[0].onclick = function() {
            CollapseOutputsButtonClick(root);
        };
        $(
            '#clearArrowsAndConnectsButtonId'
        )[0].onclick = ClearArrowsAndConnects;
        $('#showCurrentPathButtonId')[0].onclick = ShowPathCheckboxChange;
        $('#showLegendButtonId')[0].onclick = ToggleLegend;
        $('#showParamsButtonId')[0].onclick = ShowParamsCheckboxChange;

        for (let i = 8; i <= 14; ++i) {
            let f = (function(idx) {
                return function() {
                    FontSizeSelectChange(idx);
                };
            })(i);
            $('#idFontSize' + i + 'px')[0].onclick = f;
        }

        for (let i = 600; i <= 1000; i += 50) {
            let f = (function(idx) {
                return function() {
                    VerticalResize(idx);
                };
            })(i);
            $('#idVerticalResize' + i + 'px')[0].onclick = f;
        }
        for (let i = 2000; i <= 4000; i += 1000) {
            let f = (function(idx) {
                return function() {
                    VerticalResize(idx);
                };
            })(i);
            $('#idVerticalResize' + i + 'px')[0].onclick = f;
        }

        $('#saveSvgButtonId')[0].onclick = function() {
            SaveSvg(parentDiv);
        };
        $('#helpButtonId')[0].onclick = modal.DisplayModal;
    }

    return {
        GetFontSize: function() {
            return FONT_SIZE_PX;
        },
        ResizeHeight: function(h) {
            VerticalResize(h);
        },
        Redraw: function() {
            Update();
        }
    };
}

let zoomedElement;
let updateFunc;
let mouseOverOffDiagN2;
let mouseOverOnDiagN2;
let mouseOutN2;
let mouseClickN2;
let hasInputConn;
let treeData = null;
let connectionList;
let url = window.location.href;
let url_split = url.split('/');
let modal;
let search;

ptn2.resize = function() {
    let container = ptn2.container;
    ptn2.HEIGHT_PX =
        container.width < container.height
            ? container.width * 0.75
            : container.height;
    if (ptn2.HEIGHT_PX > 900) {
        ptn2.HEIGHT_PX *= 0.75;
    }
    ptn2.WIDTH_N2_PX = ptn2.HEIGHT_PX;
    ptn2.PARENT_NODE_WIDTH_PX = 40 * (ptn2.HEIGHT_PX / 600);
    ptn2.xScalerPTree = d3.scaleLinear().range([0, ptn2.widthPTreePx]);
    ptn2.yScalerPTree = d3.scaleLinear().range([0, ptn2.HEIGHT_PX]);
    ptn2.xScalerPTree0 = null;
    ptn2.yScalerPTree0 = null;
    ptn2.LEVEL_OF_DETAIL_THRESHOLD = ptn2.HEIGHT_PX / 3; //3 pixels

    //Remove all other N^2 diagrams
    let n2s = document.getElementsByClassName('ptN2ChartClass');
    while (n2s[0]) {
        n2s[0].parentNode.removeChild(n2s[0]);
    }

    if (treeData !== null) {
        PtN2Diagram(lastLeftClickedElement, treeData);
    }
};

/**
 * Initialize the tree
 */
ptn2.initializeTree = function(container) {
    ptn2.container = container;
    ptn2.container.on('resize', ptn2.resize);

    container._contentElement[0].onclick = () => {
        document.getElementById('n2Controls').style.display = 'block';
        document.getElementById('plotControls').style.display = 'none';
    };

    server.getDriverMetadata().then(data => {
        treeData = data['model_viewer_data'];
        if (typeof data['model_viewer_data'] === 'string') {
            treeData = JSON.parse(data['model_viewer_data']);
        }
        treeData.tree.name = 'model'; //Change 'root' to 'model'
        zoomedElement = treeData['tree'];
        lastLeftClickedElement = document.getElementById('ptN2ContentDivId');
        parentDiv = lastLeftClickedElement;
        modal = new newModal();
        search = newSearchObj();
        ptn2.resize();
    });
};
