/**
 * Define Whiteboard API:
 *
 * initWhitegboard(document); // initialze whiteboard and prepare for new use
 * updateWhiteboard(cmdArray); // write to the whiteboard, sending command and
 * JSON whiteboardOut(data); // changes to whiteboard and published here.
 * saveWhiteboard(); // called when user/system requests persisting whitebroard
 * data.
 *
 * NOTE: detachWhiteboard not needed.
 */
if (typeof console == "undefined") {
    console = {
        log: function (x) {
            // empty
        }
    };
};
var console_log = function (txt) {
    console.log(txt)
}
var transMode = 'move';
var dragBoxPluginInited=false;
var Whiteboard = function (cont, isStatic, _opts) {
    var wb = this;
    var adjustToolbar;
    var contDiv = cont;
    var canvas, context, pencil_btn, rect_btn, width, height, x, y, clickX, clickY, penDown = false;
    var buffercanvas, buffercontext, currentTool = 'pencil';
    var gr2D, nL, graphMode, gr2D_xp, gr2D_yp, nL_xp, nL_yp;
    var offX, offY, x0, y0, w0, h0, drawingLayer, drawcolor, rendering;
    var graphicData, tool_id;
    var scope = wb;
    var isTouchEnabled = false;
    var screen_width;
    var screen_height;
    var mq_holder = new Image();
    var lastTxt = null;
    var scrollInt = null;
    var swipe_mx, swipe_my, swipe_nx, swipe_ny, swipe_ox, swipe_oy, swipe_dx, swipe_dy, swipe_sx, swipe_sy;
    swipe_ox = swipe_oy = 0;
    var swipe_action = 'off';
    var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
    var IS_IE8 = navigator.userAgent.match(/MSIE 8.0/i) != null;
    var IS_IE9 = navigator.userAgent.match(/MSIE 9.0/i) != null;
    var IS_IE = IS_IE8 || IS_IE9;
    var IS_ANDROID = navigator.userAgent.match(/Android/i) != null;
    var IS_KINDLE = navigator.userAgent.match(/Kindle/i) != null || navigator.userAgent.match(/Silk/i) != null;
    var IS_IPHONE = navigator.userAgent.match(/iPhone/i) != null;
    var IS_OPERA = navigator.userAgent.match(/Opera/i) != null;
    var IS_TOUCH_ONLY = IS_IPAD || IS_ANDROID || IS_KINDLE || IS_IPHONE;
    var IS_IOS = IS_IPAD || IS_IPHONE;
        //boolean whether calculator is enabled for this whiteboard
    var enable_calc = true;
    var isReadOnly = isStatic ? isStatic : false;
    var lastGesture = null;

    //
    var clickR = 0;
    var selectionMode = false;
    var selectionDragMode = false;
    var graphicDataStore = [];
    var selectedObj = null;
    var selectedObjIndex = -1;
    var selectedObjID = null;
    var lineBound = {};
    var useMQ = false;
    var selectionDragged = false;
    var scrollPosition = {
        x: 0,
        y: 0
    };
    //
    var cwi = 8000;
    var cht = 8000;
    var scroll_window = {
        width: cwi,
        height: cht
    };
    var canvas_drawing_width = 0,
        canvas_drawing_height = 0;
    var uidSeed = 0;
    var gidSeed = 0;
    var objectActions = {};
    var startSelection = false;
    var selectedObjects = [];
    var multiSelection = false;
    var mSelRect = null;
    var hitW = IS_TOUCH_ONLY ? 10 : 5;
    var hitH = IS_TOUCH_ONLY ? 10 : 5;
    var loadedImgTemps = {};
    var loadedTemps = 0;
    var totalTempsloaded = 0;
    var graphEditMode = false;
    var editGR;
    var deleteGR;
    var rotateGR;
    var scaleGR;
    var textEditMode = false;
    var cTMaxWidth = null;
    var objOnSel = null;
    var textAreaW = null;
    var shapeHitCanvas, shapeHitCtx;
    var eraseObjStore = {};
    var objsErased = {};
    var checkForErase = {};
    // --- /gwt-resources/images/whiteboard/
    var imgPath = 'assets/gwt-resources/images/whiteboard/'
        //imgPath = './'
    var opts = {
        "templates": [{
            "type": "img",
            "path": imgPath,
            "icon": "tn-",
            "list": ["nL.png", "gr2D.png"]
        }, {
            "type": "system",
            "path": imgPath,
            "icon": "tn-",
            "opts": [{
                "scope": "whiteboard",
                "function": "saveAsTemplate"
            }],
            "list": ["Save"]
        }, {
            "type": "system",
            "path": imgPath,
            "icon": "tn-",
            "opts": [{
                "scope": "whiteboard",
                "function": "manageTemplates"
            }],
            "list": ["Manage"]
        }]
    }
    wb.options = opts;
    wb.options.showTemplates = true;
    if (_opts) {
        $.extend(wb.options, _opts);
    }
    //
    var toolArr = [{
            name: 'button_text',
            title: 'Text',
            classes: 'big_tool_button button_text',
            text: ""
        }, {
            name: 'button_pencil',
            title: 'Draw or Write',
            classes: 'big_tool_button button_pencil',
            text: ""
        }, {
            name: 'button_line',
            title: 'Lines',
            classes: 'big_tool_button button_line',
            text: ""
        }, {
            name: 'button_rect',
            title: 'Rectangles',
            classes: 'big_tool_button button_rect',
            text: ""
        }, {
            name: 'button_oval',
            title: 'Circles/Ellipses',
            classes: 'big_tool_button button_oval',
            text: ""
        }, {
            name: 'button_eraser',
            title: 'Erase',
            classes: 'big_tool_button button_eraser',
            text: ""
        }, {
            name: 'button_gr2D',
            title: '2D Graph',
            classes: 'big_tool_button button_gr2D',
            text: ""
        }, {
            name: 'button_nL',
            title: 'Number line',
            classes: 'big_tool_button button_nL',
            text: ""
        }, {
            name: 'button_clear',
            title: 'Clear Whiteboard',
            classes: 'big_tool_button button_clear',
            text: "Clear"
        }, {
            name: 'button_move',
            title: 'Select/Move',
            classes: 'big_tool_button button_move',
            text: ""
        },
        /* {
            name: 'button_delete',
            title: 'Delete',
            classes: 'big_tool_button button_delete',
            text: "Delete"
        },*/
        {
            name: 'button_undo',
            title: 'Undo',
            classes: 'big_tool_button button_undo',
            text: "Undo"
        }
        /**, {
        name: 'button_nav',
        title: 'Navigator',
        classes: 'big_tool_button button_nav',
        text: ""
    }*/
        , {
            name: 'button_temp',
            title: 'Figures',
            classes: 'big_tool_button button_temp',
            text: "Figure"
        }
    ];
    if(IS_TOUCH_ONLY){
    toolArr = [
        {
            name: 'button_pencil',
            title: 'Draw or Write',
            classes: 'big_tool_button button_pencil',
            text: ""
        },
        {
            name: 'button_eraser',
            title: 'Erase',
            classes: 'big_tool_button button_eraser',
            text: ""
        }, {
            name: 'button_clear',
            title: 'Clear Whiteboard',
            classes: 'big_tool_button button_clear',
            text: "Clear"
        }
    ];
    }
    function getNextObjectID() {
        //var l=uidSeed?uidSeed+1:wb.getUIDSeed();
        return uidSeed++;
    }

    function getNextGroupID() {
            //var l=uidSeed?uidSeed+1:wb.getUIDSeed();
            return gidSeed++;
        }
        //
        /**
         * methods to create whiteboard gui
         */

    function createToolBtn(obj) {
        var btn = $('<button/>', {
            title: obj.title,
            name: obj.name,
            text: obj.text
        }).addClass(obj.classes);
        return btn;
    }

    function buildGUI() {
        var parentDiv = $("#" + contDiv);

        // only create if HTML structure not already exists
        if (parentDiv.children().length > 0) {
            console.log('this whitebaord already created: ' + contDiv);
            return;
        }

        var wbc = $('<div style="display:inline-block"><h1 class="wb-title">Use your finger as a pencil.</h1></div>').attr('name', 'wb-container').addClass("wb-container").appendTo(parentDiv);
        var toolCont;
        if(IS_TOUCH_ONLY){
            toolCont = buildTools([]).appendTo(wbc);
            /** 
             *   let's control this through css (tutor_wrapper_cm.css)
             *   parentDiv.find(".wb-title").css("left","80px");
             *   
             */
        }else{
            toolCont = buildTools([{
                name: 'toggleMenu',
                title: 'Show/Hide Tools (right mouse click for context menu)',
                classes: 'big_tool_button',
                text: "Tools"
            }]).appendTo(wbc);
        }
        
        var canvasCont = buildCanvasLayers().appendTo(wbc);
        //buildInputTextBox().appendTo(canvasCont);
        var vScroll = buildScrollBar('v').appendTo(wbc);
        var hScroll = buildScrollBar('h').appendTo(wbc);
        var toolMenu = buildToolMenu(toolArr).appendTo(wbc);
        var tempMenu = buildTempMenu().appendTo(wbc);        
        
        if(!IS_TOUCH_ONLY){
        $get_jqElement("#toggleMenu").on("click", function (e) {
            hideTemplates()
            if (graphEditMode) {
                //showHideGraphModuleEditor(false)
            }
            positionToolMenu('t', e.originalEvent);
            $get_jqElement("#wb_menu").toggle();
        });
        $get_jqElement("#toggleMenu").on("mouseover", function (e) {
            hideTemplates()
            if (graphEditMode) {
                //showHideGraphModuleEditor(false)
            }
            // positionToolMenu('t', e.originalEvent);
            //$get_jqElement("#wb_menu").show()
        });
        $get_jqElement("#wb_menu").on("mouseleave", function (e) {
            //$get_jqElement("#wb_menu").hide()
        });
        $get_jqElement('#canvas').on("contextmenu", function (e) {
            hideTemplates()
            if (!isReadOnly) {
                e.preventDefault();
                positionToolMenu('mouse', e.originalEvent);
                $get_jqElement("#wb_menu").show();
                return false;
            }
        });
        }else{
        $get_jqElement("#tools").prepend($get_Element("#wb_menu"));
        $get_jqElement("#wb_menu").show();
        $get_jqElement("#button_pencil").hide();
        }
    }

    function buildTools(arr) {
        var divObj = $("<div/>", {
            name: 'tools'
        }).addClass('tools');
        var tool
        for (var k = 0; k < arr.length; k++) {

            tool = createToolBtn(arr[k])
            tool.appendTo(divObj);
        }
        return divObj
    }

    function buildToolMenu(arr) {
        var st="position:absolute;width:215px;top:36px;left:5px;background-color:#eeeeee;padding:5px;-webkit-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);  -moz-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);display:none;";
        if(IS_TOUCH_ONLY){
            st="";
        }
        var divObj = $("<div name='wb_menu' class='wb_menu' style='"+st+"'></div>");
        var tool;
        for (var k = 0; k < arr.length; k++) {
            if (arr[k].text == 'Temp' && !wb.options.showTemplates) {
                continue;
            }
            tool = createToolBtn(arr[k]);
            var _st=IS_TOUCH_ONLY?"0px 4px":"4px";
            tool.appendTo(divObj).css("margin", _st);
        }
        return divObj;
    }

    function positionToolMenu(flag, _event) {
        var isTouchEnabled = _event.type.indexOf('touch') > -1
        if (flag == 'mouse' && !isTouchEnabled) {
            var l, t;
            var event = _event ? _event : window.event;
            var off = getoffset();
            var dx, dy
            if (event.pageX != undefined) {
                dx = event.pageX - off.left;
                dy = event.pageY - off.top + $get_jqElement("#tools").outerHeight();
            } else {
                dx = event.clientX - off.left;
                dy = event.clientY - off.top + $get_jqElement("#tools").outerHeight();
            }
            var wlim = $get_jqElement("#drawsection").width();
            var hlim = $get_jqElement("#drawsection").height() + $get_jqElement("#tools").outerHeight();
            var wd = $get_jqElement("#wb_menu").outerWidth();
            var ht = $get_jqElement("#wb_menu").outerHeight();
            l = dx + wd > wlim ? wlim - wd : dx
            t = dy + ht > hlim ? hlim - ht : dy
            $get_jqElement("#wb_menu").css({
                "left": l + 'px',
                "top": t + "px"
            })
        } else {
            $get_jqElement("#wb_menu").css({
                "left": '5px',
                "top": $get_jqElement("#tools").outerHeight() + "px"
            })
        }
    }

    function resizeToolMenu(cl) {
        var w, t, rcl, acl
        if (cl == 'small_tool_button') {
            acl = cl;
            rcl = 'big_tool_button';
            w = '135px';
            t = '31px';
        } else {
            acl = cl;
            rcl = 'small_tool_button';
            w = '215px';
            t = '36px';
        }
        $get_jqElement("#toggleMenu").removeClass(rcl).addClass(acl);
        if(!IS_TOUCH_ONLY){
        $get_jqElement("#wb_menu").css({
            "width": w,
            "top": t
        })
        }
        if (cl == 'small_tool_button') {
            $get_jqElement("#toggleMenu").width(45);
        }
    }
    var event_rightclick = false

    function isRightClick(e) {
        e = e || window.event;
        if (!e.which && e.button !== undefined) {
            e.which = (e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0)));
        }
        event_rightclick = e.which === 3
        return event_rightclick;
    }

    function buildCanvasLayers() {
        var divObj = $("<div/>", {
            name: 'drawsection'
        }).addClass('drawsection');
        var canvasCont = $("<div/>", {
            name: 'canvas-container',
            width: 800,
            height: 600
        }).addClass('canvas-container');
        $("<canvas/>", {
            name: 'canvas',
            text: "(Your browser doesn't support canvas)"
        }).addClass('canvas').appendTo(canvasCont);

        var itxt = $("<div/>", {
            name: 'inputBox'
        }).addClass('inputBox');
        var mqbox = $('<div><span class="mathquill-editable" id="editable-math"></span></div>');
        var dbtn = $("<button/>", {
            name: 'done_btn',
            text: 'DONE'

        }).addClass('done_btn');
        mqbox.appendTo(itxt);
        dbtn.appendTo(itxt);
        itxt.appendTo(canvasCont);
        canvasCont.appendTo(divObj);
        if (buffercontext) {
            buffercanvas.width = buffercanvas.height = 0;
            shapeHitcanvas.width = shapeHitcanvas.height = 0;
        } else {
            buffercanvas = document.createElement('canvas');
            shapeHitcanvas = document.createElement('canvas');
            if (typeof G_vmlCanvasManager != "undefined") {
                $(buffercanvas).appendTo(canvasCont)
                G_vmlCanvasManager.initElement(buffercanvas);
                $(shapeHitcanvas).appendTo(canvasCont)
                G_vmlCanvasManager.initElement(shapeHitcanvas);
            }
            buffercontext = buffercanvas.getContext('2d');
            shapeHitCtx = shapeHitcanvas.getContext('2d');
        }
        return divObj
    }

    function buildInputTextBox() {
        var divObj
        return divObj
    }

    function buildScrollBar(dir) {
        var divObj
        if (dir == 'v') {
            divObj = $("<div name='vscroller' class='vscroller'><div name='vscroll_track' class='scroll_track vscroll_track'></div><div name='vscroll_thumb' class='scroll_thumb vscroll_thumb'></div></div>");
        } else {
            divObj = $("<div name='hscroller' class='hscroller'><div name='hscroll_track' class='scroll_track hscroll_track'></div><div name='hscroll_thumb' class='scroll_thumb hscroll_thumb'></div></div>");
        }
        return divObj
    }

    function createEditableGraph(type, w, h) {
        var egraph = $get_Element("#egraph");
        if (egraph) {
            $(egraph).remove();
        }
        var board_hold = $get_Element("#canvas-container");
        var board = $("<div name='egraph' class='egraph' style='max-width:400px;width:400px;position:absolute;top:0px;display:none;'/>")
        board.appendTo($(board_hold));
        if (!wb.graphModules) {
            wb.graphModules = {}
            wb.plotModules = {}
        }
        var gtype = type ? type : 'xy'
        var graph = new Graph(document, board.get(0), gtype, -5, 5, -5, 5, 1, 1, undefined, true, true, w ? w : 300, h ? h : (gtype == 'xy' ? 300 : 150), true, true, false);
        wb.graphModule = new Plotter(graph, 'point', {
            data: "['interactive']"
        }, 'GridToGrid', true, false, false, false);
        var cntrlCont = createToolBtn({
            name: 'toggleGraphEdit',
            title: 'Show/Hide Graph Edit',
            classes: 'big_tool_button',
            text: "Edit Graph"
        }).appendTo($get_jqElement("#tools")).css({
            "position": "absolute",
            "right": "5px",
            "font-size": "0.9em",
            "display": "none"
        }).click(function () {
            var egraph = $get_jqElement("#egraph")
            var visib = egraph.is(":visible");
            showHideGraphModuleEditor(!visib);
        });
        $(graph.createGTool("done")).click(function () {
            //var egraph = $get_jqElement("#egraph")
            //var visib = egraph.is(":visible");
            transMode = 'move'
            showHideGraphModuleEditor(false);
        });
    }

    function getGraphModuleConfig() {
        var p = wb.graphModule;
        var g = p.graphObj;
        p.setAxisDatas();
        var obj = p.getGraphData()
        obj.plot_data = eval(p.plot_datas);
        return (obj);
    }

    function plotFunctionToGraphModule(config) {
        if (config) {
            var plot = wb.graphModule
            var graph = plot.graphObj
            graph.setAxis(config.xaxis, config.yaxis);
            graph.scaleGraph(config.xscale, config.yscale);
            if (config.plot_data) {
                plot.setAxisDatas()
                plot.renderData({
                    data: convertObjToString(config.plot_data)
                }, config.labelPlot, config.node_data, false, config.actions);
            }
        }
    }

    function updateGraphModule(uid, config, rerender, data, boo) {
        //var config=eval(data.config)
        showHideGraphToggler(false)
        if (!rerender) {
            if (!config || (wb.graphModule && (config.gtype != wb.graphModule.graph_type))) {
                createEditableGraph(config.gtype, config.width, config.height)
            }

            if (config) {
                var plot = wb.graphModule
                var graph = plot.graphObj
                graph.setAxis(config.xaxis, config.yaxis);
                graph.scaleGraph(config.xscale, config.yscale);
                if (config.plot_data) {
                    plot.setAxisDatas()
                    plot.renderData({
                        data: convertObjToString(config.plot_data)
                    }, config.labelPlot, config.node_data, false, config.actions);
                }
            }
        }
        //graphicData.config=getGraphModuleConfig()
        var plot = wb.graphModule
        var graph = plot.graphObj
        var gData = graph.canvas.toDataURL();
        var pData = graph.canvas.toDataURL();
        var gImage, pImage;
        if (!wb.graphModules[uid]) {
            wb.graphModules[uid] = new Image();
            wb.plotModules[uid] = new Image();
        }
        gImage = wb.graphModules[uid]
        pImage = wb.plotModules[uid]
        gImage.src = gData;
        pImage.src = pData;
        wb.graphModules[uid] = gImage;
        wb.plotModules[uid] = pImage;
        //var bound = plot.selObjBound.brect
        //context.drawImage(gImage, bound.xmin, bound.ymin);
        //context.drawImage(pImage, bound.xmin, bound.ymin);
        var tdata = getGraphModuleConfig();
        if (!objectActions[uid]['edit']) {
            objectActions[uid]['edit'] = [{}];
        }
        var li = objectActions[uid]['edit'].length - 1;
        objectActions[uid]['edit'][li] = tdata;
        if (!boo) {
            var mobj = {
                id: data.id,
                uid: data.uid,
                type: 'cmd',
                config: tdata,
                cmd: {
                    name: 'edit',
                    data: tdata
                },
                dataArr: []
            }
            updateDataToSERVER(null, mobj);

        } else {
            updateCanvas();
        }

    }

    function showHideGraphToggler(boo) {
        var togg = $get_jqElement("#toggleGraphEdit");
        boo ? togg.show() : togg.hide()

    }

    function showHideGraphModuleEditor(boo, noupdate) {
        var plot
        var graph
        var config = selectedObj ? eval(selectedObj.config) : null;
        var gedit = $get_jqElement("#egraph");
        var togg = $get_jqElement("#toggleGraphEdit");
        if (boo) {
            togg.text("Edit Done")
        } else {
            togg.text("Edit Graph")
        }
        if (boo) {
            if ((wb.graphModule && (config.gtype != wb.graphModule.graph_type))) {
                createEditableGraph(config.gtype, config.width, config.height)
            }
            plot = wb.graphModule
            graph = plot.graphObj
            var uid = selectedObj.uid
            var li = objectActions[selectedObj.uid]['edit'] ? objectActions[selectedObj.uid]['edit'].length - 1 : -1;
            if (li > -1) {
                config = objectActions[uid]['edit'][li]
            }
            if (config) {
                graph.setAxis(config.xaxis, config.yaxis);
                graph.scaleGraph(config.xscale, config.yscale);
            }
            graphEditMode = true;
            var bound = getWhiteboardObjBound('sel');
            if (selectedObj) {
                plot.currentUID = selectedObj.uid;
                plot.objIndex = selectedObjIndex;
                plot.selObjBound = bound;
            } else {
                config = plot.objIndex !== undefined ? eval(graphicDataStore[plot.objIndex].config) : null;
            }

            var pos = bound.brect;
            /*var off = {
                left: 0.5,
                top: $get_jqElement("#tools").outerHeight() + 0.5
            };*/
            var off = {
                left: 0.5,
                top: 0.5
            };
            removeBoundRect();
            updateCanvas();
            gedit.css({
                    'left': pos.xmin + off.left + 'px',
                    'top': pos.ymin + off.top + 'px',
                    'display': 'block'
                })
                //gedit.show();
        } else {
            graphEditMode = !true;
            if (wb.graphModule) {
                plot = wb.graphModule
                graph = plot.graphObj
                config = plot.objIndex !== undefined ? eval(graphicDataStore[plot.objIndex].config) : null;
                if (config) {
                    var nconfig = getGraphModuleConfig()
                    if (config.xaxis != nconfig.xaxis || config.yaxis != nconfig.yaxis || config.xscale != nconfig.xscale || config.yscale != nconfig.yscale) {
                        updateGraphModule(plot.currentUID, nconfig, true, graphicDataStore[plot.objIndex])
                    }

                    if (!noupdate) {
                        updateCanvas();
                        setObjSelected(graphicDataStore[plot.objIndex]);
                    }
                    gedit.hide();
                }
            }

        }
    }
    wb.addGraphModule = function (t, x, y, boo, data) {
            //alert("ADD "+temp.name+" from "+temp.path)
            if (selectedObj && selectionMode && selectedObj.id == 'graph') {
                //showHideGraphModuleEditor(true)
                return
            }
            var config = {
                gtype: t ? t : 'xy',
                xmin: -5,
                ymin: -5,
                xmax: 5,
                ymax: 5,
                xinc: 1,
                yinc: 1
            }
            if (!boo) {
                graphicData.dataArr = [];
                graphicData.id = 'graph';
                graphicData.uid = data ? (data.uid ? data.uid : getNextObjectID()) : getNextObjectID();
                objectActions[graphicData.uid] = {};
            } else {
                graphicData = data
                config = graphicData.config
            }
            var uid = graphicData.uid
            if (!data || !wb.graphModule || (wb.graphModule && (config.gtype != wb.graphModule.graph_type))) {
                createEditableGraph(config.gtype, config.width, config.height)
            }
            var plot = wb.graphModule
            var graph = plot.graphObj
            if (boo && config) {
                graph.setAxis(config.xaxis, config.yaxis);
                graph.scaleGraph(config.xscale, config.yscale);
            }

            var w = graph.width;
            var h = graph.height;
            graphicData.config = getGraphModuleConfig()
            var gr, xp, yp, xs, ys
            var cposX = parseInt($get_Element("#canvas-container").style.left);
            var cposY = parseInt($get_Element("#canvas-container").style.top);
            cposX = cposX ? cposX : 0;
            cposY = cposY ? cposY : 0;
            var sw = (screen_width - w) / 2
            var sh = (screen_height - h) / 2
            xp = x ? x - w / 2 : sw - cposX
            yp = y ? y - h / 2 : sh - cposY
            xs = x ? x - w / 2 : sw - cposX
            ys = y ? y - h / 2 : sh - cposY
            var buf = 30
            xp = xs = xp - scrollPosition.x < buf ? buf : xp;
            yp = ys = yp - scrollPosition.y < buf ? buf : yp;
            xp = xs = xp - scrollPosition.x + 300 > scroll_window.width - buf ? scroll_window.width - buf - 300 + scrollPosition.x : xp;
            yp = ys = yp - scrollPosition.y + 300 > scroll_window.height - buf ? scroll_window.height - buf - 300 + scrollPosition.y : yp;
            var gData = graph.canvas.toDataURL();
            var pData = graph.canvas.toDataURL();
            var gImage, pImage;
            if (!wb.graphModules[uid]) {
                wb.graphModules[uid] = new Image();
                wb.plotModules[uid] = new Image();
            }
            gImage = wb.graphModules[uid]
            pImage = wb.plotModules[uid]
            gImage.src = gData;
            pImage.src = pData;
            wb.graphModules[uid] = gImage;
            wb.plotModules[uid] = pImage;
            context.drawImage(gImage, xp, yp);
            context.drawImage(pImage, xp, yp);
            //graphcontext.drawImage(gr, xp, yp);




            if (!boo) {
                graphicData.dataArr.push({
                    x: xs - scrollPosition.x,
                    y: ys - scrollPosition.y,
                    w: w,
                    h: h
                });
                graphicData.brect = getBoundRect(xs - scrollPosition.x, ys - scrollPosition.y, w, h);
                sendData();
                if (!selectionMode) {
                    selectionMode = true;
                }
                buttonHighlite('move');
                updateCanvas();
                setObjSelected(graphicDataStore[graphicDataStore.length - 1]);
                //alert("GRAPH")
            } else {

                var isDeleted = isObjDeleted(uid);
                var isMoved = isObjTransformed(uid, 'move');
                var isScaled = isObjTransformed(uid, 'scale');
                var isRotated = isObjTransformed(uid, 'rotate');
                var isModified = isMoved || isScaled || isRotated || isDeleted; //isObjTransformed(uid);
                if (isModified) {
                    updateCanvas();
                }

            }
        }
        //

    function drawBoundRect(obj, boo) {
        var dx = x - clickX
        var dy = y - clickY
        var hitC = 15;
        var hitR = hitC / 2;
        context.save();
        context.lineWidth = 4;
        context.strokeStyle = "rgba(0, 0, 255, 0.5)";
        context.translate(scrollPosition.x, scrollPosition.y);
        var isMoved = isObjTransformed(selectedObj.uid, 'move');
        var isScaled = isObjTransformed(selectedObj.uid, 'scale');
        var isRotated = isObjTransformed(selectedObj.uid, 'rotate');
        var isEdited = isObjTransformed(selectedObj.uid, 'edit');
        var x0, y0, w0, h0, sx, sy;
        var sbrect = cloneObject(selectedObj.brect)
        if (selectedObj && selectedObj.id == 2 && isEdited) {
            sbrect.w = isEdited.brect.w;
            sbrect.h = isEdited.brect.h;
            sbrect.xmin = selectedObj.brect.xmin + isEdited.brect.xmin;
            sbrect.ymin = selectedObj.brect.ymin + isEdited.brect.ymin;
            sbrect.xmax = sbrect.xmin + sbrect.w;
            sbrect.ymax = sbrect.ymin + sbrect.h;

        }
        if (transMode == 'move') {
            if (boo) {
                obj = isMoved ? isMoved : {
                    tx: 0,
                    ty: 0
                }
            }
            x0 = selectedObj.brect.xmin + obj.tx;
            y0 = selectedObj.brect.ymin + obj.ty;
            w0 = sbrect.w;
            h0 = sbrect.h;
            if (isEdited && selectedObj.id == 2) {
                x0 = sbrect.xmin + obj.tx;
                y0 = sbrect.ymin + obj.ty;
                //x0 = x0 - (selectedObj.brect.xmin - (isEdited.brect.xmin - obj.tx))
                //y0 = y0 - (selectedObj.brect.ymin - (isEdited.brect.ymin - obj.ty))
                w0 = sbrect.w;
                h0 = sbrect.h;
            }
            if (isScaled) {

                sx = isScaled.tx;
                sy = isScaled.ty;
                if (isRotated) {
                    /*var nr0=getScaleRatio(sx,sy,isRotated.tr)
            sx=nr0.w
            sy=nr0.h*/
                }
                x0 = x0 - sx
                y0 = y0 - sy
                w0 = sbrect.w + (sx * 2)
                h0 = sbrect.h + (sy * 2)
            }
            if (isRotated) {
                x0 = x0 ? x0 : selectedObj.brect.xmin
                y0 = y0 ? y0 : selectedObj.brect.ymin
                w0 = w0 ? w0 : sbrect.w
                h0 = h0 ? h0 : sbrect.h
                var cx = x0 + (w0 / 2)
                var cy = y0 + (h0 / 2)
                context.translate(cx, cy);
                context.rotate(isRotated.tr);
                context.translate(-cx, -cy);
            }
            context.beginPath();
            context.strokeRect(x0, y0, w0, h0)
        } else if (transMode == 'scale') {
            if (boo) {
                obj = isScaled ? isScaled : {
                    tx: 0,
                    ty: 0
                }
            }
            sx = obj.tx;
            sy = obj.ty;
            if (isRotated) {
                /*var nr0=getScaleRatio(sx,sy,isRotated.tr)
            sx=nr0.w
            sy=nr0.h*/
            }
            x0 = selectedObj.brect.xmin - sx;
            y0 = selectedObj.brect.ymin - sy;


            w0 = sbrect.w + (sx * 2);
            h0 = sbrect.h + (sy * 2);
            if (isMoved) {
                x0 = x0 + isMoved.tx
                y0 = y0 + isMoved.ty
                    //w0=obj.brect.w+(isScaled.tx*2)
                    //h0=obj.brect.h+(isScaled.ty*2)
            }
            if (isRotated) {
                x0 = x0 ? x0 : selectedObj.brect.xmin
                y0 = y0 ? y0 : selectedObj.brect.ymin
                w0 = w0 ? w0 : sbrect.w
                h0 = h0 ? h0 : sbrect.h
                var cx = x0 + (w0 / 2)
                var cy = y0 + (h0 / 2)
                context.translate(cx, cy);
                context.rotate(isRotated.tr);
                context.translate(-cx, -cy);
            }
            context.beginPath();
            context.strokeRect(x0, y0, w0, h0)
        } else if (transMode == 'rotate') {
            if (boo) {
                obj = isRotated ? isRotated : {
                    tx: 0,
                    tr: 0
                }
            }
            console.log("ROTATION:::" + obj.tr);
            x0 = selectedObj.brect.xmin;
            y0 = selectedObj.brect.ymin;
            w0 = sbrect.w;
            h0 = sbrect.h;
            if (isMoved) {
                x0 = x0 + isMoved.tx
                y0 = y0 + isMoved.ty
                    //w0=obj.brect.w+(isScaled.tx*2)
                    //h0=obj.brect.h+(isScaled.ty*2)
            }
            if (isScaled) {
                x0 = x0 - isScaled.tx
                y0 = y0 - isScaled.ty
                w0 = sbrect.w + (isScaled.tx * 2)
                h0 = sbrect.h + (isScaled.ty * 2)
            }
            x0 = x0 ? x0 : selectedObj.brect.xmin
            y0 = y0 ? y0 : selectedObj.brect.ymin
            w0 = w0 ? w0 : sbrect.w
            h0 = h0 ? h0 : sbrect.h
            var cx = x0 + (w0 / 2)
            var cy = y0 + (h0 / 2)
            context.translate(cx, cy);
            context.rotate(obj.tr);
            context.translate(-cx, -cy);
            context.beginPath();
            context.strokeRect(x0, y0, w0, h0)
        }

        context.beginPath();
        context.fillStyle = 'blue';
        var xLT = x0 - hitR;
        var yLT = y0 - hitR;
        var xLB = x0 - hitR;
        var yLB = y0 + h0 + hitR;
        var xRT = x0 + w0 + hitR;
        var yRT = y0 - hitR;
        var xRB = x0 + w0 + hitR;
        var yRB = y0 + h0 + hitR;
        context.save()
        context.lineWidth = 1;
        context.strokeStyle = "rgba(0, 0, 255, 1)";
       // context.strokeRect(x0 - hitR, y0 - hitR, w0 + hitC, h0 + hitC);
        context.restore();
        if (selectedObj.id == 'graph' || selectedObj.id == 2) {
            /*context.fillRect(x0 + w0 - 40, y0, 40, 40);
            context.font = "bold 14px Arial";
            context.fillStyle = 'white';
            context.fillText("edit", x0 + w0 - 33, y0 + 25);*/
            //showHideGraphToggler(true)
           //context.arc(xLB, yLB, hitR, 0, 2 * Math.PI, false);
            context.fillRect(xLB - hitR, yLB - hitR, hitC,  hitC);
            //context.drawImage(editGR,x0-10,y0+h0-10,20,20)
            //context.drawImage(editGR,x0,y0+h0,20,20)
        } else {
            if (selectedObj.id == 2) {
                //context.arc(x0, y0+h0, hitR, 0, 2 * Math.PI, false);
                //context.fill()
                //context.beginPath();
            }
            //context.arc(xLT, yLT, hitR, 0, 2 * Math.PI, false);
           // context.fill()
           context.fillRect(xLT - hitR, yLT - hitR, hitC, hitC);
            context.fillRect(xRB - hitR, yRB - hitR, hitC, hitC);
            context.beginPath();
            context.drawImage(rotateGR, xLT - (hitR), yLT - (hitR), hitC, hitC)
            context.drawImage(scaleGR, xRB - (hitR), yRB - (hitR), hitC, hitC)
                //context.arc(x0 + w0+hitR, y0-hitR, hitR, 0, 2 * Math.PI, false);
        }
        //context.arc(x0-hitR, y0-hitR, hitR, 0, 2 * Math.PI, false);
        context.save()
        context.lineWidth = 0;
       // context.arc(xRT, yRT, hitR, 0, 2 * Math.PI, false);
       context.fillRect(xRT - hitR, yRT - hitR, hitC, hitC);
        context.restore();
       context.fill()
            /* context.font = "bold 14px Arial";
        context.fillStyle = "rgba(255, 255, 255, 0.75)";
        context.textBaseline = 'center';
        var mw = context.measureText('X').width;
        var nx = xRT - (mw / 2);
        var ny = yRT + 5

        context.fillText("X", nx, ny);
        context.beginPath()
        context.strokeStyle = "rgba(255, 255, 255, 0.75)";
        context.lineWidth = 3;
        context.arc(xRT, yRT, hitR - 5, 0, 2 * Math.PI, false);
        context.stroke();*/
        context.drawImage(deleteGR, xRT - (hitR), yRT - (hitR), hitC, hitC)
        if (selectedObj.id == 'graph' || selectedObj.id == 2) {

            context.drawImage(editGR, x0 - (hitC), y0 + h0 + (0), hitC, hitC)
        }

        context.restore()
    }

    function drawSelectionRect(obj, w, col) {
        context.save();
        context.lineWidth = w ? w : 1;
        context.strokeStyle = col ? col : "rgba(0, 0, 0, 0.75)";
        //context.translate(scrollPosition.x,scrollPosition.y);
        context.strokeRect(obj.tx, obj.ty, obj.brect.w, obj.brect.h)
        context.restore()
    }

    function drawMultiSelectionRect() {

        if (mSelRect) {
            multiSelection = true;
            drawSelectionRect({
                tx: mSelRect.xmin,
                ty: mSelRect.ymin,
                brect: {
                    w: mSelRect.xmax - mSelRect.xmin,
                    h: mSelRect.ymax - mSelRect.ymin
                }
            }, 4, "rgba(0, 0, 255, 0.5)");
        }
    }

    function removeBoundRect() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        reRenderCanvas();
    }

    function getScaleRatio(w, h, radians, boo) {
        var a = (Math.cos(radians)),
            b = (Math.sin(radians));
        if (boo) {
            a = Math.abs(a)
            b = Math.abs(b)
        }
        console.log("scaleRatio:" + w + ":" + h + "||" + a + ":" + b)
        return {
            h: (h * a - w * b),
            w: h * b + w * a
        }
    }

    function getRPoint(cx, cy, px, py, rad) {

        var x, y, ds, dx, dy;
        dx = px - cx;
        dy = py - cy;
        ds = Math.sqrt(dx * dx + dy * dy);
        rad += Math.atan2(dy, dx);
        x = cx + ds * Math.cos(rad);
        y = cy + ds * Math.sin(rad);

        return {
            x: x,
            y: y
        };
    }

    function getObjCenter(obj) {
        var rect = [obj.xmin, obj.ymin, obj.w, obj.h];
        return {
            x: rect[0] + rect[2] / 2,
            y: rect[1] + rect[3] / 2
        }
    }

    function getBoundingBox(obj, tr, _cx, _cy) {
        var c1, c2, c3, c4,
            bx1, by1, bx2, by2;

        var rect = [obj.xmin, obj.ymin, obj.w, obj.h];
        var rad = tr;
        var cx = _cx ? _cx : rect[0] + rect[2] / 2;
        var cy = _cy ? _cy : rect[1] + rect[3] / 2;
        c1 = getRPoint(cx, cy, rect[0], rect[1], rad);
        c2 = getRPoint(cx, cy, rect[0] + rect[2], rect[1], rad);
        c3 = getRPoint(cx, cy, rect[0] + rect[2], rect[1] + rect[3], rad);
        c4 = getRPoint(cx, cy, rect[0], rect[1] + rect[3], rad);
        bx1 = Math.min(c1.x, c2.x, c3.x, c4.x);
        by1 = Math.min(c1.y, c2.y, c3.y, c4.y);
        bx2 = Math.max(c1.x, c2.x, c3.x, c4.x);
        by2 = Math.max(c1.y, c2.y, c3.y, c4.y);
        var bounds = [bx1, by1, bx2 - bx1, by2 - by1];
        return {
            x: bx1,
            y: by1,
            xmin: bx1,
            ymin: by1,
            xmax: bx2,
            ymax: by2,
            w: bounds[2],
            h: bounds[3]
        }
    }

    function drawTempObj(selectedObj, dx, dy) {
        //console.log("DRAW_TEMP_OBJ")
        //console.log(selectedObj)
        // context.clearRect(0, 0, canvas.width, canvas.height);
        if (selectedObj.id === 2 && useMQ) {
            //context.drawImage(selectedObj.imageData, selectedObj.brect.xmin + dx, selectedObj.brect.ymin + dy)
        } else {
            try {
                // context.putImageData(selectedObj.imageData, selectedObj.brect.xmin + dx, selectedObj.brect.ymin + dy)
                renderObj(selectedObj, true);
                renderToBuffer(selectedObj);
            } catch (ex) {
                alert(ex)
            }
        }
    }

    function applyAllTrans(obj) {
        var isMoved = isObjTransformed(selectedObj.uid, 'move');
        var isScaled = isObjTransformed(selectedObj.uid, 'scale');
        var isRotated = isObjTransformed(selectedObj.uid, 'rotate');
        if (isMoved) {
            translateObj(obj, isMoved.tx, isMoved.ty)
        }
        if (isScaled) {
            scaleObj(obj, isScaled.tx, isScaled.ty)
        }
        if (isRotated) {
            rotateObj(obj, isRotated.trect.rot)
        }
    }

    function transformObj(obj, dx, dy, multi) {

        // var isMoved =  isObjTransformed(selectedObj.uid, 'move');        
        // var isScaled =  isObjTransformed(selectedObj.uid, 'scale');
        // var isRotated =  isObjTransformed(selectedObj.uid, 'rotate')
        if (transMode == 'move') {

            translateObj(obj, dx, dy, multi)

        }
        if (transMode == 'scale') {

            scaleObj(obj, dx, dy, multi)

        }
        if (transMode == 'rotate') {

            rotateObj(obj, dx, dy, multi)

        }
        return obj

    }

    function translateObj(obj, dx, dy, multi) {
        var da = obj.dataArr
        var _selectedObj = multi ? multi : selectedObj
        var sa = _selectedObj.dataArr[0]
        var sobj = da[0]
        sobj.x = sa.x + dx;
        sobj.y = sa.y + dy;

        obj.dataArr[0] = sobj;
        da = _selectedObj.brect;
        for (var m in da) {
            if (m == 'x' || m == 'xmin' || m == 'xmax') {
                obj.brect[m] = _selectedObj.brect[m] + dx
            }
            if (m == 'y' || m == 'ymin' || m == 'ymax') {
                obj.brect[m] = _selectedObj.brect[m] + dy
            }
        }
        return obj

    }

    function checkforBoundry(obj, dx, dy, multi) {
        var _selectedObj = multi ? multi : selectedObj
        var sa = _selectedObj.dataArr[0];
        var buf = 30
        if (obj.id == 'graph' || obj.id == 11 || obj.id == 12) {
            var xp = sa.x + dx;
            var yp = sa.y + dy
            if (xp < buf) {
                dx = -sa.x + buf;
            }
            if (yp < buf) {
                dy = -sa.y + buf;

            }
            if (xp > scroll_window.width - buf - 300) {
                dx = -sa.x + scroll_window.width - buf - 300;
            }
            if (yp > scroll_window.height - buf - 300) {
                dy = -sa.y + scroll_window.height - buf - 300;
            }
        }
        return {
            dx: dx,
            dy: dy
        }
    }

    function scaleObj(obj, dx, dy, multi) {
        var da = obj.dataArr
        var _selectedObj = multi ? multi : selectedObj
        var sa = _selectedObj.dataArr[0]
        var sobj = da[0]
        sobj.x = sa.x + dx
        sobj.y = sa.y + dy
        obj.dataArr[0] = sobj;
        da = _selectedObj.brect;
        for (var m in da) {
            if (m == 'x' || m == 'xmin') {
                obj.brect[m] = _selectedObj.brect[m] - dx
            }
            if (m == 'y' || m == 'ymin') {
                obj.brect[m] = _selectedObj.brect[m] - dy
            }
            if (m == 'xmax') {
                obj.brect[m] = _selectedObj.brect[m] + dx
            }
            if (m == 'ymax') {
                obj.brect[m] = _selectedObj.brect[m] + dy
            }
            if (m == 'w') {
                obj.brect[m] = _selectedObj.brect[m] + (dx * 2)
            }
            if (m == 'h') {
                obj.brect[m] = _selectedObj.brect[m] + (dy * 2)
            }
        }
        return obj

    }

    function rotateObj(obj, rot) {
        obj.tr = obj.tr ? obj.tr + rot : rot;
        obj.brect.tr = obj.tr;
        return obj
    }

    function transformRect(obj, dx, dy, mode, pa) {
        var _selectedObj = selectedObj;
        if (!mode) {
            //mode=transMode;

        }
        if (mode == 'rotate') {
            var c = pa ? getObjCenter(pa) : {}
            var _obj = getBoundingBox(obj, dx, c.x, c.y)
            for (var m in obj) {
                obj[m] = _obj[m] ? _obj[m] : obj[m];
            }
            return obj
        }
        for (var m in obj) {
            if (mode == 'scale') {
                if (m == 'x' || m == 'xmin') {
                    obj[m] = obj[m] - dx
                }
                if (m == 'y' || m == 'ymin') {
                    obj[m] = obj[m] - dy
                }
                if (m == 'xmax') {
                    obj[m] = obj[m] + dx
                }
                if (m == 'ymax') {
                    obj[m] = obj[m] + dy
                }
                if (m == 'w') {
                    obj[m] = obj[m] + (dx * 2)
                }
                if (m == 'h') {
                    obj[m] = obj[m] + (dy * 2)
                }
            } else {



                if (m == 'x' || m == 'xmin' || m == 'xmax') {
                    obj[m] = obj[m] + dx
                }
                if (m == 'y' || m == 'ymin' || m == 'ymax') {
                    obj[m] = obj[m] + dy
                }
            }
        }
        return obj

    }

    function getMoveNode(r) {
        var c = 26
        var obj = {}
        obj.x = r.xmax;
        obj.y = r.ymax;
        obj.xmin = r.xmax;
        obj.ymin = r.ymax;
        obj.xmax = r.xmax + c;
        obj.ymax = r.ymax + c;
        obj.w = c;
        obj.h = c;
        return obj
    }

    function getRotateNode(r) {
        var c = 26
        var obj = {}
        obj.x = r.xmin - c;
        obj.y = r.ymin - c;
        obj.xmin = r.xmin - c;
        obj.ymin = r.ymin - c;
        obj.xmax = r.xmin;
        obj.ymax = r.ymin;
        obj.w = c;
        obj.h = c;
        return obj
    }

    function getEditNode(r) {
        var c = 26
        var obj = {}
        obj.x = r.xmin - c;
        obj.y = r.ymax;
        obj.xmin = r.xmin - c;
        obj.ymin = r.ymax;
        obj.xmax = r.xmin;
        obj.ymax = r.ymax + c;
        obj.w = c;
        obj.h = c;
        return obj
    }

    function getDeleteNode(r) {
        var c = 26
        var obj = {}
        obj.x = r.xmax;
        obj.y = r.ymin - c;
        obj.xmin = r.xmax;
        obj.ymin = r.ymin - c;
        obj.xmax = r.xmax + c;
        obj.ymax = r.ymin;
        obj.w = c;
        obj.h = c;
        /*if (selectedObj && selectedObj.id == 'graph') {
            obj.x = r.xmax - 40;
            obj.y = r.ymin - 0;
            obj.xmin = r.xmax - 40;
            obj.ymin = r.ymin - 0;
            obj.xmax = r.xmax;
            obj.ymax = r.ymin + 40;
            obj.w = 40;
            obj.h = 40;
        }*/
        return obj
    }

    function findObjIndex(obj, boo) {
        var l = graphicDataStore.length
        for (var i = l - 1; i >= 0; i--) {
            var __obj = graphicDataStore[i];
            if (!boo && __obj.type == 'cmd') {
                continue
            }
            if (__obj.uid == obj.uid) {
                return i;
            }
        }
        return -1;
    }

    function findUIDIndex(uid) {
        var l = graphicDataStore.length
        for (var i = l - 1; i >= 0; i--) {
            var __obj = graphicDataStore[i];
            if (__obj.type == 'cmd') {
                continue
            }
            if (__obj.uid == uid) {
                return i;
            }
        }
        return -1;
    }

    function selectionOnNode(obj, xp, yp) {
        var rect = cloneObject(obj.brect);
        var rectM = getMoveNode(rect);
        var rectR = getRotateNode(rect);
        var rectD = getDeleteNode(rect);
        var rectE = getEditNode(rect);
        var isMoved = isObjTransformed(obj.uid, 'move');
        var isScaled = isObjTransformed(obj.uid, 'scale');
        var isRotated = isObjTransformed(obj.uid, 'rotate');
        var isTransformed = isMoved || isScaled || isRotated; //isObjTransformed(graphicDataStore[i].uid)
        if (isTransformed) {
            if (isMoved) {
                rect = cloneObject(isMoved.trect);
                rectM = getMoveNode(rect);
                rectR = getRotateNode(rect);
                rectD = getDeleteNode(rect);
                rectE = getEditNode(rect);
            }
            if (isScaled) {
                transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                transformRect(rectM, isScaled.tx, isScaled.ty, 'move')
                transformRect(rectR, -isScaled.tx, isScaled.ty, 'move')
                transformRect(rectE, isScaled.tx, isScaled.ty, 'move')
                transformRect(rectD, isScaled.tx, -isScaled.ty, 'move')
            }
            if (isRotated) {
                transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                transformRect(rectM, isRotated.tx, isRotated.ty, 'rotate', rect)
                transformRect(rectR, isRotated.tx, isRotated.ty, 'rotate', rect)
                transformRect(rectD, isRotated.tx, isRotated.ty, 'rotate', rect)
                transformRect(rectE, isRotated.tx, isRotated.ty, 'rotate', rect)

            }


        }
        transformRect(rect, scrollPosition.x, scrollPosition.y)
        transformRect(rectR, scrollPosition.x, scrollPosition.y)
        transformRect(rectM, scrollPosition.x, scrollPosition.y)
        transformRect(rectD, scrollPosition.x, scrollPosition.y)
        transformRect(rectE, scrollPosition.x, scrollPosition.y)

        var sel = contains(rect, xp, yp)
        var selR = contains(rectR, xp, yp)
        var selM = contains(rectM, xp, yp)
        var selD = contains(rectD, xp, yp)
        if (selD) {
            return 'delete'
        }
        if (selR || selM) {
            if (selectedObj && selectedObj.id == 'graph' && selR) {
                return 'move';
            }
            if (selectedObj && selectedObj.id == 'graph' && selM) {
                transMode = 'move'
                return 'move';
            }
            return selM ? 'scale' : 'rotate'
        }
        if (selectedObj && (selectedObj.id == 'graph' || selectedObj.id == 2)) {
            var selE = contains(rectE, xp, yp)
            if (selE) {
                transMode = 'edit'
                return 'edit';
            }
        }
        return null;
    }

    function findSelectedObjIndex(xp, yp) {
        var l = graphicDataStore.length
        var figs = []
        for (var i = l - 1; i >= 0; i--) {
            var __obj = graphicDataStore[i];
            if (graphicDataStore[i].type == 'cmd') {
                continue
            }
            var _objid = graphicDataStore[i].id
            var _uid = graphicDataStore[i].uid
            var __uid = selectedObj ? selectedObj.uid : -1
            var inSel = __uid === _uid;
            var isGraph = _objid == 11 || _objid == 12
            if (isObjDeleted(graphicDataStore[i].uid) || isGraph) {
                continue
            }
            if (_objid == 'template') {
                figs.push({
                    ind: i,
                    data: __obj
                })
                continue;
            }
            var rect = cloneObject(graphicDataStore[i].brect);
            var rectM = getMoveNode(rect);
            var rectR = getRotateNode(rect);
            var rectD = getDeleteNode(rect);
            var rectE = getEditNode(rect);
            var isMoved = isObjTransformed(graphicDataStore[i].uid, 'move');
            var isScaled = isObjTransformed(graphicDataStore[i].uid, 'scale');
            var isRotated = isObjTransformed(graphicDataStore[i].uid, 'rotate');
            var isEdited = isObjTransformed(graphicDataStore[i].uid, 'edit');
            var isTransformed = isMoved || isScaled || isRotated || isEdited; //isObjTransformed(graphicDataStore[i].uid)
            if (isTransformed) {
                if (isMoved) {
                    rect = cloneObject(isMoved.trect);
                    rectM = getMoveNode(rect);
                    rectR = getRotateNode(rect);
                    rectD = getDeleteNode(rect);
                    rectE = getEditNode(rect);
                }
                if (isEdited) {

                    if (__obj.id == '2') {
                        rect.w = isEdited.brect.w
                        rect.h = isEdited.brect.h
                            /*if (isMoved) {
                            rect.xmin = rect.xmin - (__obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                            rect.ymin = rect.ymin - (__obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                        } else {
                            rect.xmin = rect.xmin - (__obj.brect.xmin - isEdited.brect.xmin)
                            rect.ymin = rect.ymin - (__obj.brect.ymin - isEdited.brect.ymin)
                        }*/
                        rect.xmin = rect.xmin + (isEdited.brect.xmin)
                        rect.ymin = rect.ymin + (isEdited.brect.ymin)
                        rect.xmax = rect.xmin + rect.w
                        rect.ymax = rect.ymin + rect.h
                        rectM = getMoveNode(rect);
                        rectR = getRotateNode(rect);
                        rectD = getDeleteNode(rect);
                        rectE = getEditNode(rect);
                    }
                }
                if (isScaled) {
                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                    transformRect(rectM, isScaled.tx, isScaled.ty, 'move')
                    transformRect(rectR, -isScaled.tx, -isScaled.ty, 'move')
                    transformRect(rectE, isScaled.tx, isScaled.ty, 'move')
                    transformRect(rectD, isScaled.tx, isScaled.ty, 'move')
                }
                if (isRotated) {
                    transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                    transformRect(rectM, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectR, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectD, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectE, isRotated.tx, isRotated.ty, 'rotate', rect)
                    console.log(rect);
                }


            }
            transformRect(rect, scrollPosition.x, scrollPosition.y)
            transformRect(rectR, scrollPosition.x, scrollPosition.y)
            transformRect(rectM, scrollPosition.x, scrollPosition.y)
            transformRect(rectD, scrollPosition.x, scrollPosition.y)
            transformRect(rectE, scrollPosition.x, scrollPosition.y)
                //selectedObj = null
            if (!rect) {
                selectedObj = null
                return -1
            }
            var sel = contains(rect, xp, yp)
            var selR = contains(rectR, xp, yp)
            var selM = contains(rectM, xp, yp)
            var selD = contains(rectD, xp, yp)
            console.log(selR)
            console.log(selM)
            if (inSel) {
                if (selD) {
                    return 'delete'
                }
                if (selR || selM) {
                    i = selectedObjIndex
                    transMode = selM ? 'scale' : 'rotate'
                    if (selectedObj && selectedObj.id == 'graph' && selR) {
                        transMode = 'move'
                        return 'move';
                    }
                    if (selectedObj && selectedObj.id == 'graph' && selM) {
                        transMode = 'move'
                        return 'move';
                    }
                    return i;
                }
                if (selectedObj && (selectedObj.id == 'graph' || selectedObj.id == 2)) {
                    var selE = contains(rectE, xp, yp)
                    if (selE) {
                        transMode = 'edit'
                        return 'edit';
                    }
                }
            }
            console.log(rect);
            console.log(sel)
            var hasShape = false
            if (sel) {
                hasShape = getShapeHit(__obj, {
                    xmin: xp - hitW,
                    ymin: yp - hitW,
                    xmax: xp + hitH,
                    ymax: yp + hitH
                })
            }
            if (sel && hasShape) {
                selectedObj = graphicDataStore[i];
                //updateBuffer()
                return i;
            }
        }
        if (figs.length) {
            return findSelectedObjIndex_fig(xp, yp, figs)
        }
        selectedObj = null
            //updateBuffer()
        return -1
    }

    function findSelectedObjIndex_fig(xp, yp, arr) {
        var l = arr.length

        for (var i = l - 1; i >= 0; i--) {
            var __obj = arr[i].data;
            var index = arr[i].ind;
            if (__obj.type == 'cmd') {
                continue
            }
            var _objid = __obj.id
            var _uid = __obj.uid
            var __uid = selectedObj ? selectedObj.uid : -1
            var inSel = __uid === _uid;
            var isGraph = _objid == 11 || _objid == 12
            if (isObjDeleted(__obj.uid) || isGraph) {
                continue
            }

            var rect = cloneObject(__obj.brect);
            var rectM = getMoveNode(rect);
            var rectR = getRotateNode(rect);
            var rectD = getDeleteNode(rect);
            var rectE = getEditNode(rect);
            var isMoved = isObjTransformed(__obj.uid, 'move');
            var isScaled = isObjTransformed(__obj.uid, 'scale');
            var isRotated = isObjTransformed(__obj.uid, 'rotate');
            var isEdited = isObjTransformed(__obj.uid, 'edit');
            var isTransformed = isMoved || isScaled || isRotated || isEdited; //isObjTransformed(graphicDataStore[i].uid)
            if (isTransformed) {
                if (isMoved) {
                    rect = cloneObject(isMoved.trect);
                    rectM = getMoveNode(rect);
                    rectR = getRotateNode(rect);
                    rectD = getDeleteNode(rect);
                    rectE = getEditNode(rect);
                }
                if (isEdited) {


                }
                if (isScaled) {
                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                    transformRect(rectM, isScaled.tx, isScaled.ty, 'move')
                    transformRect(rectR, -isScaled.tx, -isScaled.ty, 'move')
                    transformRect(rectE, isScaled.tx, isScaled.ty, 'move')
                    transformRect(rectD, isScaled.tx, isScaled.ty, 'move')
                }
                if (isRotated) {
                    transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                    transformRect(rectM, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectR, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectD, isRotated.tx, isRotated.ty, 'rotate', rect)
                    transformRect(rectE, isRotated.tx, isRotated.ty, 'rotate', rect)
                    console.log(rect);
                }


            }
            transformRect(rect, scrollPosition.x, scrollPosition.y)
            transformRect(rectR, scrollPosition.x, scrollPosition.y)
            transformRect(rectM, scrollPosition.x, scrollPosition.y)
            transformRect(rectD, scrollPosition.x, scrollPosition.y)
            transformRect(rectE, scrollPosition.x, scrollPosition.y)
                //selectedObj = null
            if (!rect) {
                selectedObj = null
                return -1
            }
            var sel = contains(rect, xp, yp)
            var selR = contains(rectR, xp, yp)
            var selM = contains(rectM, xp, yp)
            var selD = contains(rectD, xp, yp)
            console.log(selR)
            console.log(selM)
            if (inSel) {
                if (selD) {
                    return 'delete'
                }
                if (selR || selM) {
                    i = selectedObjIndex
                    transMode = selM ? 'scale' : 'rotate'
                    if (selectedObj && selectedObj.id == 'graph' && selR) {
                        transMode = 'move'
                        return 'move';
                    }
                    if (selectedObj && selectedObj.id == 'graph' && selM) {
                        transMode = 'move'
                        return 'move';
                    }
                    return i;
                }

            }

            var hasShape = false
            if (sel) {
                hasShape = getShapeHit(__obj, {
                    xmin: xp - hitW,
                    ymin: yp - hitW,
                    xmax: xp + hitH,
                    ymax: yp + hitH
                })
            }
            if (sel && hasShape) {
                selectedObj = __obj;
                //updateBuffer()
                return index;
            }
        }
        selectedObj = null
            //updateBuffer()
        return -1
    }

    function findObjUnder(xp, yp) {
        var l = graphicDataStore.length
        for (var i = l - 1; i >= 0; i--) {
            var __obj = graphicDataStore[i];
            if (graphicDataStore[i].type == 'cmd') {
                continue
            }
            var _objid = graphicDataStore[i].id
            var _uid = graphicDataStore[i].uid
            var __uid = selectedObj ? selectedObj.uid : -1
            var inSel = __uid === _uid;
            var isGraph = _objid == 11 || _objid == 12
            if (isObjDeleted(graphicDataStore[i].uid) || isGraph) {
                continue
            }
            var rect = cloneObject(graphicDataStore[i].brect);

            var isMoved = isObjTransformed(graphicDataStore[i].uid, 'move');
            var isScaled = isObjTransformed(graphicDataStore[i].uid, 'scale');
            var isRotated = isObjTransformed(graphicDataStore[i].uid, 'rotate');
            var isEdited = isObjTransformed(graphicDataStore[i].uid, 'edit');
            var isTransformed = isMoved || isScaled || isRotated || isEdited; //isObjTransformed(graphicDataStore[i].uid)
            if (isTransformed) {

                if (isMoved) {
                    rect = cloneObject(isMoved.trect);
                }
                if (isEdited) {

                    if (__obj.id == '2') {
                        rect.w = isEdited.brect.w
                        rect.h = isEdited.brect.h

                        /*if (isMoved) {
                            rect.xmin = rect.xmin - (__obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                            rect.ymin = rect.ymin - (__obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                        } else {
                            rect.xmin = rect.xmin - (__obj.brect.xmin - isEdited.brect.xmin)
                            rect.ymin = rect.ymin - (__obj.brect.ymin - isEdited.brect.ymin)
                        }*/
                        rect.xmin = rect.xmin + (isEdited.brect.xmin)
                        rect.ymin = rect.ymin + (isEdited.brect.ymin)
                        rect.xmax = rect.xmin + rect.w
                        rect.ymax = rect.ymin + rect.h
                    }
                }
                if (isScaled) {
                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                }
                if (isRotated) {
                    transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                }


            }
            transformRect(rect, scrollPosition.x, scrollPosition.y)
                //selectedObj = null
            if (!rect) {
                return null
            }
            var sel = contains(rect, xp, yp)

            //console.log(rect);
            //console.log(sel)
            var hasShape = false
            if (sel) {
                hasShape = getShapeHit(__obj, {
                        xmin: xp - hitW,
                        ymin: yp - hitW,
                        xmax: xp + hitH,
                        ymax: yp + hitH
                    })
                    // updateBuffer()
            }
            if (sel && hasShape) {
                //selectedObj = graphicDataStore[i];

                return graphicDataStore[i];
            }
        }
        //selectedObj = null
        //updateBuffer()
        return null
    }

    function showObjSelection(obj) {
        var index = findObjIndex(obj);
        var el = $get_Element("#tempSelection")

        if (index > -1) {
            if (!el) {
                var p = $get_jqElement("#canvas-container");
                var _obj = $("<div name='tempSelection' class='tempSelection' style='position:absolute;border:4px solid rgba(0, 0, 255, 0.5);'></div>");
                p.prepend(_obj)
                el = _obj[0]
            }
            var bound = getWhiteboardObjBound('custom', obj)
            var _dim = {
                tx: bound.brect.xmin + scrollPosition.x - 4,
                ty: bound.brect.ymin + scrollPosition.y - 4,

                w: bound.brect.xmax - bound.brect.xmin,
                h: bound.brect.ymax - bound.brect.ymin

            };
            $(el).css({
                'width': _dim.w + 'px',
                'height': _dim.h + 'px',
                'left': _dim.tx + 'px',
                'top': _dim.ty + 'px',
                'display': 'block'
            })
        }
    }

    function removeObjSelection() {
            var obj = $get_Element("#tempSelection")
            if (obj) {
                $(obj).hide();
            }
        }
        //

    function checkForMultiSelect() {
        var l = graphicDataStore.length;
        var _arr = [];
        mSelRect = null;
        for (var i = 0; i < l; i++) {
            var obj = graphicDataStore[i]
            if (obj.type == 'cmd') {
                continue
            }
            var _objid = obj.id
            var isGraph = _objid == 11 || _objid == 12

            if (isObjDeleted(obj.uid) || isGraph || _objid === 0) {
                continue
            }
            if (!wb.isErased(obj)) {
                var r1 = obj.brect;
                var rect = cloneObject(r1);
                var isMoved = isObjTransformed(graphicDataStore[i].uid, 'move');
                var isScaled = isObjTransformed(graphicDataStore[i].uid, 'scale');
                var isRotated = isObjTransformed(graphicDataStore[i].uid, 'rotate');
                var isTransformed = isMoved || isScaled || isRotated; //isObjTransformed(obj.uid)
                var isEdited = isObjTransformed(graphicDataStore[i].uid, 'edit');
                /* if (isTransformed) {
                        rect = cloneObject(isTransformed.trect);
                    }*/
                if (isTransformed) {
                    if (isMoved) {
                        rect = cloneObject(isMoved.trect);

                    }
                    if (isEdited) {

                        if (obj.id == '2') {
                            rect.w = isEdited.brect.w
                            rect.h = isEdited.brect.h

                            /*if (isMoved) {
                                rect.xmin = rect.xmin - (obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                                rect.ymin = rect.ymin - (obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                            } else {
                                rect.xmin = rect.xmin - (obj.brect.xmin - isEdited.brect.xmin)
                                rect.ymin = rect.ymin - (obj.brect.ymin - isEdited.brect.ymin)
                            }*/
                            rect.xmin = rect.xmin - (-isEdited.brect.xmin)
                            rect.ymin = rect.ymin - (-isEdited.brect.ymin)
                            rect.xmax = rect.xmin + rect.w
                            rect.ymax = rect.ymin + rect.h
                        }
                    }
                    if (isScaled) {
                        var dw = isScaled.tx
                        var dh = isScaled.ty
                        if (isRotated) {
                            /*var nr0=getScaleRatio(isScaled.tx,isScaled.ty,isRotated.tr)
            dw=nr0.w
            dh=nr0.h*/
                        }
                        transformRect(rect, dw, dh, 'scale')
                            //transformRect(rect, isScaled.tx, isScaled.ty,'scale') 

                    }
                    if (isRotated) {
                        transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')

                    }


                } else if (isEdited) {
                    if (obj.id == '2') {
                        rect.w = isEdited.brect.w
                        rect.h = isEdited.brect.h

                        /*if (isMoved) {
                                rect.xmin = rect.xmin - (obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                                rect.ymin = rect.ymin - (obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                            } else {
                                rect.xmin = rect.xmin - (obj.brect.xmin - isEdited.brect.xmin)
                                rect.ymin = rect.ymin - (obj.brect.ymin - isEdited.brect.ymin)
                            }*/
                        rect.xmin = rect.xmin - (-isEdited.brect.xmin)
                        rect.ymin = rect.ymin - (-isEdited.brect.ymin)
                        rect.xmax = rect.xmin + rect.w
                        rect.ymax = rect.ymin + rect.h
                    }
                }
                transformRect(rect, scrollPosition.x, scrollPosition.y)
                var sel = intersectRect(rect, selectionRect)
                var hasShape = false
                if (sel) {
                    hasShape = getShapeHit(obj, getIntRect(rect, selectionRect))
                }
                if (sel && hasShape) {
                    _arr.push(obj)
                    if (!mSelRect) {
                        mSelRect = {
                            xmin: rect.xmin,
                            ymin: rect.ymin,
                            xmax: rect.xmax,
                            ymax: rect.ymax
                        }
                    }
                    mSelRect.xmin = rect.xmin < mSelRect.xmin ? rect.xmin : mSelRect.xmin;
                    mSelRect.ymin = rect.ymin < mSelRect.ymin ? rect.ymin : mSelRect.ymin;
                    mSelRect.xmax = rect.xmax > mSelRect.xmax ? rect.xmax : mSelRect.xmax;
                    mSelRect.ymax = rect.ymax > mSelRect.ymax ? rect.ymax : mSelRect.ymax;
                }
            }
        }
        // updateBuffer()
        return _arr
    }


    function updateMultiSelectRect() {
        var l = selectedObjects.length;
        mSelRect = null
        for (var i = 0; i < l; i++) {
            var obj = selectedObjects[i]
            if (isObjDeleted(obj.uid)) {
                continue
            }
            if (!wb.isErased(obj)) {
                var r1 = obj.brect;
                var rect = cloneObject(r1);
                /* var isTransformed = isObjTransformed(obj.uid,transMode)
                    if (isTransformed) {
                        rect = cloneObject(isTransformed.trect);
                    }*/
                var isMoved = isObjTransformed(obj.uid, 'move');
                var isScaled = isObjTransformed(obj.uid, 'scale');
                var isRotated = isObjTransformed(obj.uid, 'rotate');
                var isTransformed = isMoved || isScaled || isRotated; //isObjTransformed(obj.uid)
                var isEdited = isObjTransformed(obj.uid, 'edit');
                /* if (isTransformed) {
                        rect = cloneObject(isTransformed.trect);
                    }*/

                if (isTransformed) {
                    if (isMoved) {
                        rect = cloneObject(isMoved.trect);

                    }
                    if (isEdited) {

                        if (obj.id == '2') {
                            rect.w = isEdited.brect.w
                            rect.h = isEdited.brect.h

                            /*if (isMoved) {
                                rect.xmin = rect.xmin - (obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                                rect.ymin = rect.ymin - (obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                            } else {
                                rect.xmin = rect.xmin - (obj.brect.xmin - isEdited.brect.xmin)
                                rect.ymin = rect.ymin - (obj.brect.ymin - isEdited.brect.ymin)
                            }*/
                            rect.xmin = rect.xmin - (-isEdited.brect.xmin)
                            rect.ymin = rect.ymin - (-isEdited.brect.ymin)
                            rect.xmax = rect.xmin + rect.w
                            rect.ymax = rect.ymin + rect.h
                        }
                    }
                    if (isScaled) {
                        var dw = isScaled.tx
                        var dh = isScaled.ty
                        if (isRotated) {
                            /*var nr0=getScaleRatio(isScaled.tx,isScaled.ty,isRotated.tr)
            dw=nr0.w
            dh=nr0.h*/
                        }
                        transformRect(rect, dw, dh, 'scale')

                    }
                    if (isRotated) {
                        transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')

                    }


                } else if (isEdited) {
                    if (obj.id == '2') {
                        rect.w = isEdited.brect.w
                        rect.h = isEdited.brect.h

                        /*if (isMoved) {
                                rect.xmin = rect.xmin - (obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                                rect.ymin = rect.ymin - (obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                            } else {
                                rect.xmin = rect.xmin - (obj.brect.xmin - isEdited.brect.xmin)
                                rect.ymin = rect.ymin - (obj.brect.ymin - isEdited.brect.ymin)
                            }*/
                        rect.xmin = rect.xmin - (-isEdited.brect.xmin)
                        rect.ymin = rect.ymin - (-isEdited.brect.ymin)
                        rect.xmax = rect.xmin + rect.w
                        rect.ymax = rect.ymin + rect.h
                    }
                }
                transformRect(rect, scrollPosition.x, scrollPosition.y);
                if (!mSelRect) {
                    mSelRect = {
                        xmin: rect.xmin,
                        ymin: rect.ymin,
                        xmax: rect.xmax,
                        ymax: rect.ymax
                    }
                }
                mSelRect.xmin = rect.xmin < mSelRect.xmin ? rect.xmin : mSelRect.xmin;
                mSelRect.ymin = rect.ymin < mSelRect.ymin ? rect.ymin : mSelRect.ymin;
                mSelRect.xmax = rect.xmax > mSelRect.xmax ? rect.xmax : mSelRect.xmax;
                mSelRect.ymax = rect.ymax > mSelRect.ymax ? rect.ymax : mSelRect.ymax;

            }
        }

    }

    function getWhiteboardObjBound(flag, _obj) {
        var objs = graphicDataStore;
        if (flag == 'msel') {
            objs = selectedObjects
        } else if (flag == 'sel') {
            objs = [selectedObj]
        } else if (flag == 'custom') {
            objs = [_obj]
        }
        var l = objs.length;
        var mSelRect = null;
        for (var i = 0; i < l; i++) {
            var obj = objs[i]
            var isCmd = obj.type === 'cmd'
            var isDeleted = isObjDeleted(obj.uid);
            if (isDeleted || isCmd || obj.id === 0) {
                continue
            }
            if (true) {
                var r1 = obj.brect;
                var rect = cloneObject(r1);
                var isMoved = isObjTransformed(obj.uid, 'move');
                var isScaled = isObjTransformed(obj.uid, 'scale');
                var isRotated = isObjTransformed(obj.uid, 'rotate');
                var isEdited = isObjTransformed(obj.uid, 'edit');
                var isTransformed = isMoved || isScaled || isRotated || isEdited; //isObjTransformed(obj.uid)
                if (isTransformed) {
                    if (isMoved) {
                        rect = cloneObject(isMoved.trect);

                    }
                    if (isEdited) {

                        if (obj.id == '2') {
                            rect.w = isEdited.brect.w
                            rect.h = isEdited.brect.h

                            /*if (isMoved) {
                                rect.xmin = rect.xmin - (obj.brect.xmin - (isEdited.brect.xmin - isMoved.tx))
                                rect.ymin = rect.ymin - (obj.brect.ymin - (isEdited.brect.ymin - isMoved.ty))
                            } else {
                                rect.xmin = rect.xmin - (obj.brect.xmin - isEdited.brect.xmin)
                                rect.ymin = rect.ymin - (obj.brect.ymin - isEdited.brect.ymin)
                            }*/
                            rect.xmin = rect.xmin - (-isEdited.brect.xmin)
                            rect.ymin = rect.ymin - (-isEdited.brect.ymin)
                            rect.xmax = rect.xmin + rect.w
                            rect.ymax = rect.ymin + rect.h
                        }
                    }
                    if (isScaled) {
                        var dw = isScaled.tx
                        var dh = isScaled.ty
                        transformRect(rect, dw, dh, 'scale')

                    }
                    if (isRotated) {
                        transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                    }


                }
                transformRect(rect, scrollPosition.x, scrollPosition.y);
                if (!mSelRect) {
                    mSelRect = {
                        xmin: rect.xmin,
                        ymin: rect.ymin,
                        xmax: rect.xmax,
                        ymax: rect.ymax
                    }
                }
                mSelRect.xmin = rect.xmin < mSelRect.xmin ? rect.xmin : mSelRect.xmin;
                mSelRect.ymin = rect.ymin < mSelRect.ymin ? rect.ymin : mSelRect.ymin;
                mSelRect.xmax = rect.xmax > mSelRect.xmax ? rect.xmax : mSelRect.xmax;
                mSelRect.ymax = rect.ymax > mSelRect.ymax ? rect.ymax : mSelRect.ymax;

            }
        }
        var bound = {
            tx: mSelRect.xmin,
            ty: mSelRect.ymin,
            brect: {
                xmin: mSelRect.xmin,
                ymin: mSelRect.ymin,
                xmax: mSelRect.xmax,
                ymax: mSelRect.ymax,
                w: mSelRect.xmax - mSelRect.xmin,
                h: mSelRect.ymax - mSelRect.ymin
            }
        }
        return bound

    }

    function contains(rect, xp, yp) {
        if (xp >= rect.xmin - 1 && xp <= rect.xmax + 1 && yp >= rect.ymin - 1 && yp <= rect.ymax + 1) {
            return true
        }
        return false
    }

    function intersectRect(r1, r2) {
        return !(r2.xmin > r1.xmax ||
            r2.xmax < r1.xmin ||
            r2.ymin > r1.ymax ||
            r2.ymax < r1.ymin);
    }

    function getIntRect(r1, r2) {
        var xmin = Math.max(r1.xmin, r2.xmin);
        var xmax = Math.min(r1.xmax, r2.xmax);
        var ymin = Math.max(r1.ymin, r2.ymin);
        var ymax = Math.min(r1.ymax, r2.ymax);
        return {
            xmin: xmin,
            ymin: ymin,
            xmax: xmax,
            ymax: ymax
        };
    }

    function getShapeHit(obj, rect) {
        shapeHitCtx.clearRect(0, 0, buffercanvas.width, buffercanvas.height);
        shapeHitcanvas.width = canvas.width;
        shapeHitcanvas.height = canvas.height;
        shapeHitCtx.save();
        shapeHitCtx.translate(scrollPosition.x, scrollPosition.y);
        renderToBuffer(obj, shapeHitCtx);
        var __w = rect.xmax - rect.xmin;
        var __h = rect.ymax - rect.ymin;
        __w = Math.max(__w, hitW * 2);
        __h = Math.max(__h, hitH * 2);
        var imgd = shapeHitCtx.getImageData(rect.xmin, rect.ymin, __w, __h);
        var pix = imgd.data;
        var hasColorData = false;
        for (var i = 0, n = pix.length; i < n; i += 4) {
            if (pix[i + 3] > 0) {
                hasColorData = true
                break
            }
        }
        shapeHitCtx.restore();
        return hasColorData
    }

    function checkForObjectErase(r, arr) {
        var _graphicDataStore = arr ? arr : graphicDataStore
        var l = _graphicDataStore.length
        var eobjs = []
        for (var i = 0; i < l; i++) {
            var obj = _graphicDataStore[i]
            var isGraph = obj.id == 11 || obj.id == 12 || obj.id == 'graph'
            if (obj.type == 'cmd' || isGraph || wb.isErased(obj) || obj.id === 0) {
                continue
            }
            if (isObjDeleted(obj.uid)) {
                continue
            }
            if (!wb.isErased(obj)) {
                var r1 = obj.brect;

                var rect = cloneObject(r1);
                var isMoved = isObjTransformed(obj.uid, 'move');
                var isScaled = isObjTransformed(obj.uid, 'scale');
                var isRotated = isObjTransformed(obj.uid, 'rotate');
                var isTransformed = isMoved || isScaled || isRotated; //isObjTransformed(graphicDataStore[i].uid)
                if (isTransformed) {
                    // rect = cloneObject(isTransformed.trect);
                }
                if (isTransformed) {
                    if (isMoved) {
                        rect = cloneObject(isMoved.trect);
                    }
                    if (isScaled) {
                        transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                    }
                    if (isRotated) {
                        transformRect(rect, isRotated.tx, isRotated.ty, 'rotate')
                    }


                }
                transformRect(rect, scrollPosition.x, scrollPosition.y)
                    // var isTransformed = isObjTransformed(obj.uid,transMode)

                // transformRect(rect, scrollPosition.x, scrollPosition.y,transMode)
                // obj.isErased() = intersectRect(rect, r)
                var sel = intersectRect(rect, r)
                var hasShape = false
                if (sel) {
                    hasShape = getShapeHit(obj, r)
                        //updateBuffer()
                }
                //obj.isErased() = hasShape
                objsErased[obj.uid] = hasShape;
                if (hasShape) {
                    eobjs.push(obj.uid);
                }
            }
        }
        //return -1
        return eobjs
    }

    //
    mq_holder.onload = function () {

            context.drawImage(this, holder_x, holder_y);
            // alert(this.width+":"+this.height+":"+holder_x+":"+holder_y);
            updateCanvas();
        }
        //

    function getInternetExplorerVersion()
        // Returns the version of Internet Explorer or a -1
        // (indicating the use of another browser).
        {
            var rv = -1; // Return value assumes failure.
            if (navigator.appName == 'Microsoft Internet Explorer') {
                var ua = navigator.userAgent;
                var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
                if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
            }
            return rv;
        }
        //
        /**
         *internal methods to: disable,enable calculator and show or hide them
         */

    function showCalc() {
        console_log("SHOW_CALC")
        if ($('#calc_hold').html() || !enable_calc) {} else {
            var calc_x = screen_width - 325
            var calc_y = $get_Element("#tools").offsetTop + $get_Element("#tools").offsetHeight;
            var ch = '<div id="calc_hold" style="width:325px;position:absolute;left:' + calc_x + 'px;top:' + calc_y + 'px"></div>'
            var calc_hold = $('#main-content').append($(ch))
            console_log("SHOW_HIDE_CALC-s2")
            $('#calc_hold').calculator({
                layout: $.calculator.scientificLayout
            });
            $get_Element("#button_calc").style.border = '2px solid #ff0000';
        }
    }

    function hideCalc() {
        if ($('#calc_hold').html()) {
            console_log("HIDE_CALC")
            $('#calc_hold').remove();
            $get_Element("#button_calc").style.border = '1px solid #000000';
        }
    }

    function _enableCalc() {
        $get_jqElement('#button_calc').css('background-image', 'url(' + _imageBaseDir + 'calculator.png)');
    }

    function _disableCalc() {
        hideCalc()
        $get_jqElement('#button_calc').css('background-image', 'url(' + _imageBaseDir + 'calculator_no.png)');
        console_log($get_jqElement('#button_calc').css('backgroundImage'))
    }

    function showHideCalc() {
        console_log("SHOW_HIDE_CALC")
        if ($('#calc_hold').html()) {
            console_log("SHOW_HIDE_CALC-s0")
            hideCalc()
        } else {
            console_log("SHOW_HIDE_CALC-s1")
            showCalc()
        }
    }

    function mouseOverCalc(event) {
            if (!$('#calc_hold').html()) {
                return false;
            }
            getCanvasPos();
            var mx = event.layerX ? event.layerX : event.pageX - offX;
            var my = event.layerY ? event.layerY : event.pageY - offY;
            var box = $get_jqElement('#canvas-container').position();
            var xp, yp, wi, hi
            xp = screen_width - 325 - box.left
            yp = 0 - box.top
            wi = 325
            hi = $get_jqElement('#calc_hold').height()
                //console_log(xp + ":" + yp + ":" + wi + ":" + hi + ":" + mx + ":" + my + ":" + event.layerX + ":" + event.pageX)
            if ((mx >= xp && mx <= xp + wi) && (my >= yp && my <= yp + hi)) {
                return true;
            }
            return false;
        }
        //end of calc internal methods
        //
    var determineFontHeight = function (fontStyle) {
        var body = document.getElementsByTagName("body")[0];
        var dummy = document.createElement("div");
        var dummyText = document.createTextNode("M");
        dummy.appendChild(dummyText);
        dummy.setAttribute("style", fontStyle);
        body.appendChild(dummy);
        var result = dummy.offsetHeight + 4;
        body.removeChild(dummy);
        return result;
    };

    function wrapTextX(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';
        var w = maxWidth;
        var h = 0;
        //var lines=text.split('\r\n').join("\n").split("\n");
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                w = Math.max(w, context.measureText(line).width);
                line = words[n] + ' ';
                h += lineHeight + lineHeight / 3;
                y += lineHeight + lineHeight / 3;
                //w=Math.max(w,testWidth);
            } else {
                line = testLine;
                w = Math.max(w, context.measureText(line).width);
            }
        }
        context.fillText(line, x, y);
        //if(line.length){
        h += lineHeight + lineHeight / 3;
        w = Math.max(w, context.measureText(line).width);
        //}
        return {
            w: w,
            h: Math.max(40, h)
        }
    }
    function wrapText(context, text, x, y, maxWidth, lineHeight){
    var lines = text.split("\n");
var w = maxWidth;
        var h = 0;
    for (var i = 0; i < lines.length; i++) {

        var words = lines[i].split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                h += lineHeight
            }
            else {
                line = testLine;
                w = Math.max(w, context.measureText(line).width);
            }
        }

        context.fillText(line, x, y);
        y += lineHeight;
        h += lineHeight;
        w = Math.max(w, context.measureText(line).width);
        //}
        
        }
        return {
            w: w,
            h: Math.max(40, h)
        }
    }

    function getTextBoxDim(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';
        var w = 0;
        var h = 0;
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                //context.fillText(line, x, y);
                w = Math.max(w, context.measureText(line).width);
                h += lineHeight + lineHeight / 3;
                line = words[n] + ' ';
                y += lineHeight + lineHeight / 3;

            } else {
                line = testLine;
                w = Math.max(w, context.measureText(line).width);
            }
        }
        //context.fillText(line, x, y);

        h += lineHeight + lineHeight / 3;;
        w = Math.max(w, context.measureText(line).width);
        return {
            w: w,
            h: Math.max(40, h)
        }
    }

    var _textToolFont = "12pt Arial";

    function renderText_html(xt, xp, yp, col, ctx, notEdit) {
        var boo = false;
        var txt = xt ? xt : $get_Element("#content").value;
        // alert(txt);
        var cntxt = ctx ? ctx : context;
        var str = txt.split("\n")
        var _xp = parseFloat($get_jqElement("#inputBox").css("left")) + parseFloat($get_jqElement("#input_box").css("left"))
        var _yp = parseFloat($get_jqElement("#inputBox").css("top")) + parseFloat($get_jqElement("#input_box").css("top"))
        if (!notEdit && transMode == 'edit' && selectionMode && selectedObj) {
            xp = _xp
            yp = _yp
            boo = true;
            col = selectedObj.dataArr[0].color;
        }
        var x0 = xp ? xp : _xp
        var y0 = yp ? yp : _yp
        var ht = determineFontHeight(str[0]);
        var sy = y0
        cntxt.font = _textToolFont;
        cntxt.textBaseline = 'top';
        var colr = col ? col : wb.globalStrokeColor;
        cntxt.fillStyle = colr;
        var maxWidth = xt ? cTMaxWidth : $get_jqElement("#content").outerWidth();
        /*for (var i = 0; i < str.length; i++) {
            cntxt.fillText(str[i], x0, y0)
            y0 += ht + ht / 3
        }*/
        var dim = wrapText(cntxt, txt, x0, y0, maxWidth, ht)
        if (!xt) {
            var rect = {}
            rect.x = rect.xmin = x0 - scrollPosition.x
            rect.y = rect.ymin = sy - scrollPosition.y
            rect.w = dim.w; //cntxt.measureText(txt).width
            rect.h = dim.h; //(ht + ht / 3) * str.length
            rect.xmax = rect.x + rect.w;
            rect.ymax = rect.y + rect.h;
            //console.log('renderText')
            // console.log(this)


            //context.drawImage(this, holder_x, holder_y);
            // alert(this.width+":"+this.height+":"+holder_x+":"+holder_y);
            // gd.imageData = context.getImageData(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)
            //graphicDataStore[graphicDataStore.length - 1] = gd
            //updateCanvas();
            if (boo) {
                var uid = selectedObj.uid;
                var isMoved = isObjTransformed(uid, 'move');
                rect.x = rect.xmin = -(isMoved.tx ? selectedObj.brect.xmin + isMoved.tx - xp : selectedObj.brect.xmin - xp)
                rect.y = rect.ymin = -(isMoved.ty ? selectedObj.brect.ymin + isMoved.ty - yp : selectedObj.brect.ymin - yp)
                rect.w = dim.w; //cntxt.measureText(txt).width
                rect.h = dim.h; //(ht + ht / 3) * str.length
                rect.xmax = -rect.x + rect.w;
                rect.ymax = -rect.y + rect.h;
                var tdata = {
                    x: -(isMoved.tx ? selectedObj.brect.xmin + isMoved.tx - xp : selectedObj.brect.xmin - xp),
                    y: -(isMoved.ty ? selectedObj.brect.ymin + isMoved.ty - yp : selectedObj.brect.ymin - yp),
                    text: txt,
                    textBoxWidth: maxWidth,
                    brect: rect
                };
                if (!objectActions[uid]['edit']) {
                    objectActions[uid]['edit'] = [{}];
                }
                var li = objectActions[uid]['edit'].length - 1;
                objectActions[uid]['edit'][li] = tdata;
                var mobj = {
                    id: selectedObj.id,
                    uid: selectedObj.uid,

                    type: 'cmd',
                    cmd: {
                        name: 'edit',
                        data: tdata
                    },
                    textBoxWidth: maxWidth,
                    dataArr: []
                }

                updateDataToSERVER(null, mobj);
                transMode = 'move';
            } else {
                var gd = graphicData
                gd.brect = rect
                gd.textBoxWidth = maxWidth;
                updateText(txt, x0, sy, colorToNumber(colr));
                sendData();
            }
            updateCanvas();

            $get_Element("#content").value = "";
            $get_Element("#inputBox").style.display = 'none';
            textEditMode = !true;
            selectedObj = null;
            if (boo) {
                //setObjSelected(selectedObj);
            }
        }
        // alert($get_Element("#inputBox").style.display)
    }

    function renderText_mq(xt, xp, yp, col) {
        // var txt = xt ? xt : $get_Element("#editable-math").value;
        var txt = xt ? xt : $get_jqElement('#editable-math').mathquill('latex');

        // var str = txt.split("\n")
        var x0 = xp ? xp : clickX
        var y0 = yp ? yp : clickY
        var colr = col ? col : wb.globalStrokeColor
        var ht = 15;
        var holder_x = x0
        var holder_y = y0
            // mq_holder.src="http://latex.codecogs.com/png.latex?"+txt;

        if (false) {
            context.drawImage(mq_holder, holder_x, holder_y);
            // alert(this.width+":"+this.height+":"+holder_x+":"+holder_y);
            updateCanvas();
        } else {
            var _mq_holder = new Image();
            _mq_holder.onload = function () {
                    var rect = {}
                    rect.x = rect.xmin = x0
                    rect.y = rect.ymin = y0
                    rect.w = this.width
                    rect.h = this.height
                    rect.xmax = rect.x + rect.w;
                    rect.ymax = rect.y + rect.h;
                    console.log('renderText')
                    console.log(this)
                    var gd = graphicDataStore[graphicDataStore.length - 1];
                    gd.brect = rect

                    context.drawImage(this, holder_x, holder_y);
                    // alert(this.width+":"+this.height+":"+holder_x+":"+holder_y);
                    // gd.imageData = this;
                    // graphicDataStore[graphicDataStore.length - 1] = gd
                    //console.log(gd)
                    updateCanvas();
                    _mq_holder = null;
                    delete _mq_holder;
                }
                // _mq_holder.src = "http://chart.apis.google.com/chart?cht=tx&chf=bg,s,ffffff00&chl=" + encodeURIComponent("\\fontsize{18} " + txt);
            var txtCol = String(colr).substring(1)
            _mq_holder.src = "http://chart.apis.google.com/chart?cht=tx&chf=bg,s,ffffff00&chco=" + txtCol + "&chl=" + encodeURIComponent("\\fontsize{18} " + txt);
            lastTxt = txt
        }


        if (!xt) {
            updateText(txt, x0, y0, colorToNumber(colr));
            //console.log('AfterUpdateText')
            // console.log(graphicData)
            sendData();
            // $get_Element("#editable-math").value = "";

            $get_jqElement('#editable-math').mathquill('latex', "");
            $get_Element("#inputBox").style.display = 'none';
        }

        // alert($get_Element("#inputBox").style.display)
    }

    function renderText(xt, xp, yp, col, ctx, boo) {
        if (useMQ) {
            renderText_mq(xt, xp, yp, col, ctx, boo)
        } else {
            renderText_html(xt, xp, yp, col, ctx, boo)
        }
    }

    function onkeyupHandler() {
        //
    }

    function onkeydownHandler(_event) {
        var event = _event ? _event : window.event;
        var txtBox = $get_jqElement("#inputBox");
        var visib = txtBox.is(":visible");
        if (currentTool == 'text' && visib && event.keyCode == 13) {
            if (!event.shiftKey) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
                renderText();
            }
        }
    }

    function resetButtonHighlite() {
        $get_Element("#button_eraser").style.border = '1px solid #000000';
        $get_Element("#button_pencil").style.border = '1px solid #000000';
        if ($get_Element("#button_text")) {
        $get_Element("#button_text").style.border = '1px solid #000000';
        $get_Element("#button_line").style.border = '1px solid #000000';
        $get_Element("#button_rect").style.border = '1px solid #000000';
        $get_Element("#button_oval").style.border = '1px solid #000000';
        }
        if ($get_Element("#button_nav")) {
            $get_Element("#button_nav").style.border = '1px solid #000000';
        }
        if ($get_Element("#button_temp")) {
            $get_Element("#button_temp").style.border = '1px solid #000000';
        }
        if ($get_Element("#button_move")) {
            $get_Element("#button_move").style.border = '1px solid #000000';
        }
        if (currentTool != 'nav') {
            hideNavigator();
        }
        if (currentTool != 'temps') {
            hideTemplates();
        }
        if (graphEditMode) {
            showHideGraphModuleEditor(false)
        }
        //
        if(!IS_TOUCH_ONLY){
            $get_jqElement("#wb_menu").hide();
        }
    }

    function buttonHighlite(t) {
        resetButtonHighlite();
        var isOpen = $get_Element("#inputBox").style.display == 'block';
        if (isOpen) {
            renderText();
        }
        $get_Element("#button_" + t).style.border = '2px solid #ff9900';
        if (currentTool != 'text' && $get_Element("#inputBox").style.display == 'block') {
            textEditMode = !true;
            hideTextBox();
        }
        if (t !== 'move') {
            selectionMode = false;
            selectedObj = null;
            removeBoundRect()
        }
    }


    var _docWidth = 0;
    var _docHeight = 0;
    var _viewPort = null;
    wb.setWhiteboardViewPort = function (width, height, flag) {
        console_log("EXTERNAL CALL::setWhiteboardViewPort:: " + width + ":" + height)
        _viewPort = {
            width: width,
            height: height
        };
        if (flag && flag == 'fixed') {
            wb.setSizeOfWhiteboard(width, height)
        }
    }
    wb.resizeWhiteboard = function () {
        console_log("EXTERNAL CALL::resizeWhiteboard::");
        adjustToolbar();
    }

    function resizeWhiteboardTo(match, minW, minH) {
        var w, h;
        var pad = 5;
        if (match == 'content') {
            if (graphicDataStore && graphicDataStore.length) {
                var bound = getWhiteboardObjBound()
                canvas_drawing_width = bound.brect.xmax;
                canvas_drawing_height = bound.brect.ymax;
            }
            w = canvas_drawing_width
            h = canvas_drawing_height
        } else if (match == 'custom') {
            w = minW ? minW : 300;
            h = minH ? minH : 300;
        }
        var off_left = $get_Element("#tools").offsetLeft;
        var off_top = $get_Element("#tools").offsetTop;
        var off_ht = $get_Element("#tools").offsetHeight;
        var topOff = off_ht + off_top
        var leftOff = off_left;
        var margin = 5;
        var scroller = 15;
        if(IS_TOUCH_ONLY){
            scroller=0
        }
        w = w + leftOff + scroller + margin;
        h = h + topOff + scroller + margin;
        wb.setSizeOfWhiteboard(w, h);
        wb.setWhiteboardViewPort(w, h);
        wb.resizeWhiteboard();
    }

    function viewport_testpage() {
        var e = window,
            a = 'inner';

        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }

        return {
            width: e[a + 'Width'],
            height: e[a + 'Height']
        }
    }

    function viewport() {
        var e = window,
            a = 'inner';

        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }


        if (_viewPort == null) {
            alert('Whiteboard setup: _docWidth/_docHeight must be set by calling setWhiteboardViewPort(width, height)');
            _viewPort = viewport_testpage()
        }

        return _viewPort;

        // return {
        // width: e[a + 'Width'],
        // height: e[a + 'Height']
        // }
    }

    function getDocHeight() {
        var D = document;
        return Math.max(
            Math.max(D.body.scrollHeight, D.documentElement.scrollHeight), Math.max(D.body.offsetHeight, D.documentElement.offsetHeight), Math.max(D.body.clientHeight, D.documentElement.clientHeight));
    }



    /**
     * Define as functions to allow removing
     *
     * @param event
     */

    function isMultitouch_gesture(event) {
        var ev = event ? event : window.event;
        //console.log(event)
        //console.log(ev.type)
        isTouchEnabled = ev.type.indexOf('touch') > -1;
        var pinch_threshold = 0.01;
        if (isTouchEnabled) {
            var scal = Math.abs(1 - ev.scale);
            var isPinchZoom = scal > pinch_threshold;
            //console.log(ev.type+":"+ev.touches.length+":"+ev.scale+":"+scal+":"+isPinchZoom+"||"+ev.deltaTime+":"+ev.distance+":"+ev.timeStamp);

            if (isPinchZoom) {
                return true;
            }
        }
        return false;
    }

    function touchStartFunction(event) {


        var ev = event ? event : window.event;

        var boo = isMultitouch_gesture(event);
        //console.log('BOO:: '+boo)
        if (boo) {
            return true
        }

        if (ev.touches.length == 2) {} else {

            if (lastGesture && lastGesture.type == 'touchstart' && ev.touches.length === 1 && (ev.timeStamp - lastGesture.timeStamp) < 300) {
                lastGesture = null;
                //console.log("DOUBLE TAP")
                event.preventDefault();
            } else {
                if (ev.touches.length === 1) {} else {
                    event.preventDefault();
                }
            }
        }
        lastGesture = ev;
    }
    var touchMoveFunction = touchStartFunction;

    var _imageBaseDir = 'assets/gwt-resources/images/whiteboard/';

    /** main HTML document object */
    var mainDoc;

    /** Determine if the internal/native canvas will be
     *  be used or excanvas.  IE9 supports canvas native.
     */
    var ieVer = getInternetExplorerVersion();
    var isIE = ieVer != -1 && ieVer < 9;
    console.log('iIE: ' + isIE + ', version: ' + ieVer);

    function doRightScroll(dx) {
        var currPos = scrollPosition.x;
        currPos = currPos ? currPos : 0;
        currPos = dx;
        currPos = currPos > 0 ? 0 : currPos
        currPos = currPos < -(scroll_window.width - screen_width) ? -(scroll_window.width - screen_width) : currPos;
        var scrub = (scroll_window.width - screen_width) / (screen_width - 30)
        $get_Element('#hscroll_thumb').style.left = (-currPos / scrub) + "px";
        scrollPosition['x'] = currPos;

    }

    function doUpScroll(dy) {
            var currPos = scrollPosition.y;
            currPos = currPos ? currPos : 0;
            currPos = dy;
            currPos = currPos > 0 ? 0 : currPos
            currPos = currPos < -(scroll_window.height - screen_height) ? -(scroll_window.height - screen_height) : currPos;
            var scrub = (scroll_window.height - screen_height) / (screen_height - 30)
            $get_Element('#vscroll_thumb').style.top = (-currPos / scrub) + "px";
            scrollPosition['y'] = currPos;
        }
        //--Templates Code begin

    function showHideTemplates() {
        var cont = $get_jqElement("#temp_cont");
        if (cont.is(":visible")) {
            hideTemplates()
        } else {
            showTemplates()
        }
    }

    function hideTemplates() {
        hideTemplatesCont()
    }

    function showTemplates() {
        var wbm = $get_jqElement("#wb_menu")
        var x = wbm.css("left")
        var y = wbm.css("top")
        wbm.hide()
        showTemplatesCont()
        posTemplatesCont(x, y)
    }

    function posTemplatesCont(x, y) {
        var cont = $get_jqElement("#temp_cont");
        cont.css({
            'left': x,
            'top': y
        });
    }

    function showTemplatesCont() {
        var cont = $get_jqElement("#temp_cont");
        cont.show()
    }

    function hideTemplatesCont() {
        var cont = $get_jqElement("#temp_cont");
        cont.hide()
    }

    function prepareTemplatesMenu(jsn) {
        var opts = jsn ? eval(jsn) : eval(wb.options);
        var tempsD = jsn ? [opts] : opts["templates"]
        var temps = []
        var temp;
        for (var i = 0; i < tempsD.length; i++) {
            temp = tempsD[i]
            var type = temp.type ? temp.type : 'img'
            var list = temp.list
            var path = temp.path
            path = path ? path : "";
            var icon = temp.icon ? temp.icon : "-tn";
            if (icon.indexOf('-') == -1) {
                icon = "-" + icon;
            }
            var opts = temp.opts;
            var labels = temp.labels ? temp.labels : list
            var label;
            for (var j = 0; j < list.length; j++) {
                var obj = {}
                obj.type = type
                var ext = ""
                if (type != 'img') {
                    obj.opts = opts[j];
                    ext = ".png"
                }

                obj.icon = path + icon + list[j] + ext;
                if (icon && icon.charAt(0) == '-') {
                    var lab = list[j]
                    if (list[j].indexOf('.') > -1) {
                        var _lab = list[j].split(".");
                        lab = _lab[0];
                        ext = '.' + _lab[1];
                    }
                    obj.icon = path + lab + icon + ext;
                }
                label = labels[j];

                /** if image is not 'default' (has path)
                 *  then thumnail will be found relative
                 *  to file.
                 */
                if (list[j].indexOf("/") > -1) {
                    var ei = list[j].indexOf(".png");
                    if (ei > -1) {
                        obj.icon = list[j].substring(0, ei) + "-tn" + ".png";
                    }
                    label = label.split("/");
                    label = label[label.length - 1]
                }

                obj.url = path + list[j]
                obj.name = obj.title = label.split(".")[0]
                temps.push(obj);
            }
        }
        return temps
    }

    function buildTempMenu() {
        var arr = prepareTemplatesMenu()

        var divObj = $("<div name='temp_cont' class='temp_cont' style='position:absolute;width:235px;max-height:225px;top:36px;left:5px;background-color:#eeeeee;padding:5px;-webkit-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);  -moz-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);display:none;overflow:auto;'></div>");
        var temp
        for (var k = 0; k < arr.length; k++) {
            temp = createTempBtn(arr[k])
            temp.appendTo(divObj).css("margin", "4px");
        }
        return divObj

    }

    function updateTempMenu(json) {
        var arr = prepareTemplatesMenu(json)

        var divObj = $get_jqElement("#temp_cont");
        var saveBtn = divObj.find("[name='Save']")
        var temp
        for (var k = 0; k < arr.length; k++) {
            temp = createTempBtn(arr[k])
            if (saveBtn.length) {
                temp.insertBefore(saveBtn).css("margin", "4px");
            } else {
                temp.appendTo(divObj).css("margin", "4px");
            }

        }
        return divObj

    }

    function createTempBtn(obj) {
        var btn = $('<button/>', {
                title: obj.title ? obj.title : "Template",
                name: obj.name,
                path: obj.url,
                text: ""
            }).addClass('small_tool_button')
            .css({
                "background-image": "url(" + obj.icon + ")",
                "background-repeat": "no-repeat",
                "background-position": "center"
            }).on("click", function () {
                var temp = $(this)
                var name = temp.attr('name');
                var path = temp.attr('path');
                var type = temp.data('type');
                if (type == 'img') {
                    loadTemplate({
                        name: name,
                        path: path
                    });
                } else if (type == 'system') {
                    var opts = temp.data('opts');
                    var scope = opts['scope'];
                    //scope=scope=='whiteboard'?wb:scope;
                    var fname = opts['function'];
                    if (scope == 'global') {
                        fname()
                    } else if (scope == 'whiteboard') {
                        wb[fname]()
                    } else {
                        window[scope][fname]()
                    }
                }

            });
        btn.data('type', obj.type)
        if (obj.type != 'img') {
            btn.data('opts', obj.opts)
        }
        return btn;
    }

    function loadTemplate(obj, x, y, boo, data) {
        var img
        if (loadedImgTemps[obj.name]) {
            img = loadedImgTemps[obj.name]
            addTemplate(obj, x, y, img, boo, data)
        } else {
            loadedImgTemps[obj.name] = new Image()
            loadedImgTemps[obj.name].onload = function () {
                addTemplate(obj, x, y, this, boo, data);
            }
            loadedImgTemps[obj.name].src = obj.path;
        }
    }

    function addTemplate(temp, x, y, img, boo, data) {
        //alert("ADD "+temp.name+" from "+temp.path)
        if (!boo) {
            graphicData.dataArr = [];
            graphicData.id = 'template';
            graphicData.uid = getNextObjectID();
            objectActions[graphicData.uid] = {};
        } else {
            graphicData = data
        }
        var uid = graphicData.uid
        var w = img.width;
        var h = img.height;
        var gr, xp, yp, xs, ys
        var cposX = parseInt($get_Element("#canvas-container").style.left);
        var cposY = parseInt($get_Element("#canvas-container").style.top);
        cposX = cposX ? cposX : 0;
        cposY = cposY ? cposY : 0;
        var sw = (screen_width - w) / 2
        var sh = (screen_height - h) / 2
        xp = x ? x : sw - cposX
        yp = y ? y : sh - cposY
        xs = x ? x : sw - cposX
        ys = y ? y : sh - cposY
        var buf = 30
        xp = xs = xp - scrollPosition.x < buf ? buf : xp;
        yp = ys = yp - scrollPosition.y < buf ? buf : yp;
        xp = xs = xp - scrollPosition.x + w > scroll_window.width - buf ? scroll_window.width - buf - w + scrollPosition.x : xp;
        yp = ys = yp - scrollPosition.y + h > scroll_window.height - buf ? scroll_window.height - buf - h + scrollPosition.y : yp;
        //graphcontext.drawImage(gr, xp, yp);




        if (!boo) {
            context.drawImage(img, xp, yp);
            graphicData.dataArr.push({
                x: xs - scrollPosition.x,
                y: ys - scrollPosition.y,
                w: w,
                h: h,
                name: temp.name,
                url: temp.path
            });
            graphicData.brect = getBoundRect(xs - scrollPosition.x, ys - scrollPosition.y, w, h);
            sendData();
            if (!selectionMode) {
                selectionMode = true;
            }
            buttonHighlite('move');
            updateCanvas();
            setObjSelected(graphicDataStore[graphicDataStore.length - 1]);
        } else {
            loadedTemps++
            //if(loadedTemps>=totalTempsloaded){}

            var isDeleted = isObjDeleted(uid);
            var isMoved = isObjTransformed(uid, 'move');
            var isScaled = isObjTransformed(uid, 'scale');
            var isRotated = isObjTransformed(uid, 'rotate');
            var isModified = isMoved || isScaled || isRotated || isDeleted; //isObjTransformed(uid);
            if (isModified) {
                updateCanvas();
            }

        }
    }


    function setObjSelected(obj) {
        var index = findObjIndex(obj);
        if (index > -1) {
            selectedObj = obj;
            selectedObjIndex = index;
            drawBoundRect({
                tx: 0,
                ty: 0,
                tr: 0,
                brect: selectedObj.brect
            }, true);
        }
    }

    //--Templates Code end
    //--NAVIGATOR CODE BEGIN--
    var mpos
    var nav_width = 300;
    var nav_height = 300;
    var ipos
    var navClicked = false;

    function showNavigator(x, y) {
        var cont = $get_jqElement('#drawsection'); //$("[name='drawsection']")
        var wlim = cont.width() - 17
        var hlim = cont.height() - 17
        nav_width = Math.min(300, wlim);
        nav_height = Math.min(300, hlim);
        var navig = '<div name="navigator" class="navigator" style="width: 200px; height: 200px; border: 2px solid white; position: absolute; right: 0px;top: 0px;background-color: rgba(200,200,200,0.95);box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);  -webkit-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);  -moz-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);"><div class="navThumb_cont" name="navThumb_cont" style="border: 1px solid blue; left: 0px; top: 0px; position: absolute;"><div name="navThumb" style="border: 1px solid red; left: 0px; top: 0px; "></div><span style="font-size:10px;color:gray;display: block;cursor: default;" unselectable="on">Drag me</span></div></div>';
        cont.append(navig)
        $get_jqElement("#navigator").width(nav_width);
        $get_jqElement("#navigator").height(nav_height);
        var ratW = nav_width / scroll_window.width;
        var ratH = nav_height / scroll_window.height;
        var navTW = cont.width() * ratW;
        var navTH = cont.height() * ratH;
        $get_jqElement("#navThumb").width(navTW);
        $get_jqElement("#navThumb").height(navTH);
        //$(".navThumb").width(navTW);
        $get_jqElement("#navThumb_cont").height(navTH + 50);
        updateNavThumb(x, y);
        ipos = $get_jqElement("#navThumb_cont").position();
        $get_jqElement("#navThumb_cont").on('mousedown', initNavTBDrag);
        $get_jqElement("#navThumb_cont").on('touchstart', removeDrag);
        $get_jqElement("#navThumb_cont").on('touchstart', initNavTBDrag);
        $get_jqElement("#navigator").on('mousedown', registerNavClick);
        $get_jqElement("#navigator").on('mouseup', movetoNavClick);
        $get_jqElement("#navigator").on('touchstart', registerNavClick);
    }

    function hideNavigator() {
        $get_jqElement("#navigator").remove();
    }

    function showHideNavigator(arr, pos) {
        if ($get_jqElement("#navigator").length) {
            hideNavigator()
            return 'hide'
        } else {
            showNavigator(pos.x, pos.y)
            updateNavigator(arr, pos.x, pos.y)
            return 'show'
        }
    }

    function reloadNavigator() {

        if ($get_jqElement("#navigator").length) {
            hideNavigator()
            var pos = scrollPosition;
            var arr = graphicDataStore
            showNavigator(pos.x, pos.y)
            updateNavigator(arr, pos.x, pos.y)
        }
    }

    function addPix(x, y, boo) {
        var ratW = nav_width / scroll_window.width
        var ratH = nav_height / scroll_window.height
        var xp = x * ratW
        var yp = y * ratH
        if (boo) {
            $("<div/>", {
                "class": "inline"
            }).appendTo($get_jqElement("#navigator")).css({
                "position": "absolute",
                "left": xp + "px",
                "top": yp + "px",
                "background-color": "white",
                "width": "4px",
                "height": "4px"
            })
            return
        }
        $("<div/>", {
            "class": "inline"
        }).appendTo($get_jqElement("#navigator")).css({
            "position": "absolute",
            "left": xp + "px",
            "top": yp + "px",
            "background-color": "black",
            "width": "4px",
            "height": "4px"
        });
    }

    function updateNavigator(arr, x, y) {
        var l = arr.length;
        for (var i = 0; i < l; i++) {
            var obj = arr[i];
            if (obj.id == 11 || obj.id == 12 || obj.id === 0) {
                continue
            }
            var b = obj.brect
            addPix(b.xmin, b.ymin, wb.isErased(obj))
        }
        if ($get_jqElement("#graph_cont").length) {
            var el = $get_jqElement("#graph_cont");
            var pos = el.position()
            var ratW = nav_width / scroll_window.width
            var ratH = nav_height / scroll_window.height
            var xp = pos.left - x
            var yp = pos.top - y
            addPix(xp, yp)
        }
    }

    function updateNavThumb(x, y) {
        var ratW = nav_width / scroll_window.width
        var ratH = nav_height / scroll_window.height
        var nx = x * ratW
        var ny = y * ratH
        $get_jqElement("#navThumb_cont").css({
            "left": -nx + 'px',
            'top': -ny + 'px'
        })
    }

    function doNavTBDrag(_event) {
        navClicked = false;
        var event = _event ? _event.originalEvent : window.event;
        var isTouchEnabled = event.type.indexOf('touch') > -1
        event = isTouchEnabled ? event.changedTouches[0] : event;
        var pos = getMousePos(event)
        var dx = -ipos.left + mpos.x - pos.x;
        var dy = -ipos.top + mpos.y - pos.y;
        var nvt_cont = $get_jqElement("#navThumb_cont");
        var nvt = $get_jqElement("#navThumb")
        var parentOffset = nvt_cont.parent().offset();
        var limitW = nav_width;
        var limitH = nav_height;
        //console.log(ipos.left + ":" + dx)
        dx = -dx + nvt.width() > limitW ? -(limitW - nvt.width()) : dx;
        dy = -dy + nvt.height() > limitH ? -(limitH - nvt.height()) : dy;
        dx = dx > 0 ? 0 : dx
        dy = dy > 0 ? 0 : dy
        nvt_cont.css({
            "left": -dx + 'px',
            'top': -dy + 'px'
        })
        var ratW = scroll_window.width / nav_width;
        var ratH = scroll_window.height / nav_height;

        wb.scrollScreen(dx * ratW, dy * ratH);
        if (_event.preventDefault) {
            _event.preventDefault();
        } else {
            _event.returnValue = false;
        }
    }

    function getMousePos(event) {
        var dx, dy;

        if (event.pageX != undefined) {
            dx = event.pageX;
            dy = event.pageY;
        } else {
            dx = event.clientX
            dy = event.clientY
        }
        var parentOffset = $get_jqElement("#navThumb_cont").parent().offset();
        var relX = dx - parentOffset.left;
        var relY = dy - parentOffset.top;
        return {
            x: relX,
            y: relY
        }
    }

    function stopNavTBDrag() {
        $(document).off('mousemove', doNavTBDrag);
        $(document).off('mouseup', stopNavTBDrag);
        $(document).off('touchmove', doNavTBDrag);
        $(document).off('touchend', stopNavTBDrag);
        $get_jqElement("#navigator").off('touchend', movetoNavClick);
        $get_jqElement("#navigator").off('touchmove', removeDrag);
    }

    function initNavTBDrag(_event) {
        var event = _event ? _event.originalEvent : window.event;
        var isTouchEnabled = event.type.indexOf('touch') > -1;
        try {
            event = isTouchEnabled ? event.changedTouches[0] : event;
        } catch (e) {
            alert(e)
        }
        var nvt_cont = $get_jqElement("#navThumb_cont");
        var nvt = $get_jqElement("#navThumb")
        if (isTouchEnabled) {
            //
            nvt_cont.off('mousedown', initNavTBDrag)
            $get_jqElement("#navigator").off('touchend', movetoNavClick)
            $(document).on('touchmove', doNavTBDrag)
            $(document).on('touchend', stopNavTBDrag)
        } else {
            $(document).on('mousemove', doNavTBDrag)
            $(document).on('mouseup', stopNavTBDrag)
        }
        var cp = getMousePos(event)
        ipos = nvt_cont.position()
        var parentOffset = nvt_cont.parent().offset();
        mpos = cp
        navClicked = true;
        if (_event.preventDefault) {
            _event.preventDefault();
        } else {
            _event.returnValue = false;
        }
    }

    function movetoNavClick(_event) {

        if (!navClicked) {
            return
        }

        var event = _event ? _event.originalEvent : window.event;
        var isTouchEnabled = event.type.indexOf('touch') > -1
        event = isTouchEnabled ? event.changedTouches[0] : event;

        if (_event.preventDefault) {
            _event.preventDefault();
        } else {
            _event.returnValue = false;
        }
        var nvt_cont = $get_jqElement("#navThumb_cont");
        var nvt = $get_jqElement("#navThumb")
        var pos = getMousePos(event)
        var diffX = nvt.width() / 2
        var diffY = nvt.height() / 2
        var dx = -pos.x + diffX
        var dy = -pos.y + diffY
        var parentOffset = nvt_cont.parent().offset();
        var limitW = nav_width;
        var limitH = nav_height;
        console.log(ipos.left + ":" + dx)
        dx = -dx + nvt.width() > limitW ? -(limitW - nvt.width()) : dx
        dy = -dy + nvt.height() > limitH ? -(limitH - nvt.height()) : dy
        dx = dx > 0 ? 0 : dx
        dy = dy > 0 ? 0 : dy
        nvt_cont.css({
            "left": -dx + 'px',
            'top': -dy + 'px'
        })
        var ratW = scroll_window.width / nav_width;
        var ratH = scroll_window.height / nav_height;

        wb.scrollScreen(dx * ratW, dy * ratH)
        ipos = nvt_cont.position()
        stopNavTBDrag()
    }

    function getNavPos() {
        var box = $get_Element("#navigator").getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        offX = Math.round(left);
        offY = Math.round(top);
        return {
            top: offY,
            left: offX
        }
    }

    function removeDrag(_event) {
        if (_event.originalEvent.preventDefault) {
            _event.originalEvent.preventDefault();
        } else {
            _event.originalEvent.returnValue = false;
        }
    }

    function registerNavClick(_event) {
            navClicked = true;
            var event = _event ? _event.originalEvent : window.event;
            var isTouchEnabled = event.type.indexOf('touch') > -1
            if (_event.preventDefault) {
                _event.preventDefault();
            } else {
                _event.returnValue = false;
            }
            if (isTouchEnabled) {
                $get_jqElement("#navigator").off('mousedown', registerNavClick)
                $get_jqElement("#navigator").off('mouseup', movetoNavClick)
                $get_jqElement("#navigator").on('touchend', movetoNavClick)
                $get_jqElement("#navigator").on('touchmove', removeDrag)
            }
        }
        //--NAVIGATOR CODE END ---
        //

    function getoffset() {
            console_log("getCanvasPos processing!");
            var box = canvas.getBoundingClientRect();
            // console_log("canvas bound= top: " + box.top + " left:" + box.left);
            var body = document.body;
            var docElem = document.documentElement;
            var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
            var clientTop = docElem.clientTop || body.clientTop || 0;
            var clientLeft = docElem.clientLeft || body.clientLeft || 0;
            //console_log("offset_datas: scrollTop=" + scrollTop + " scrollLeft=" + scrollLeft + " clientTop=" + clientTop + " clientLeft=" + clientLeft);
            var top = box.top + scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;
            var offX = Math.round(left);
            var offY = Math.round(top);
            // console_log("OFFSET: top=" + offY + " left=" + offX);
            return {
                top: offY,
                left: offX
            }
        }
        //
    wb.initWhiteboard = function (mainDocIn) {
        console_log("WHITEBOARD_INITIATED! - document object:" + mainDocIn);
        canvas_drawing_width = 0;
        canvas_drawing_height = 0;
        if (context) {
            var _width = 0;
            buffercanvas.width = canvas.width = _width;
            buffercanvas.height = canvas.height = _width;
            //
            shapeHitcanvas.width = _width;
            shapeHitcanvas.height = _width;
            if (isIE) {
                $(canvas).css({
                    'width': '0px',
                    'height': '0px'
                })
                $(canvas).empty();
                $(buffercanvas).css({
                    'width': '0px',
                    'height': '0px'
                })
                $(buffercanvas).empty();
                $(shapeHitcanvas).css({
                    'width': '0px',
                    'height': '0px'
                })
                $(shapeHitcanvas).empty();

            } else {
                canvas = null;
                buffercanvas = null;

                context = null;
                buffercontext = null;

                shapeHitcanvas = null;
                shapeHitCtx = null;

            }
        }
        //setupMathQuill(); // defined in mathquill.js
        mainDoc = mainDocIn;
        buildGUI();
        //position calc button in toolbar
        if ($get_Element('#button_calc')) {
            $get_jqElement('#button_calc').css({
                'position': 'absolute',
                'right': '5px'
            });
        }
        /*
        if ($get_Element('#vscroller')) {
            if (IS_IOS) {
                $get_jqElement('#vscroller').css({
                    'display': 'none'

                });
                $get_jqElement('#hscroller').css({
                    'display': 'none'

                });
            }
        }*/
        //
        setTimeout(function () {

            canvas = $get_Element("#canvas");
            var siz = viewport()
            var docWidth = siz.width;
            var docHeight = siz.height;
            console_log("CANVAS_IN_IE: " + canvas + ":" + canvas.getContext);
            if (docWidth > 600) {
                // alert($get_jqElement('#tools button').css('width'));
                if (isReadOnly) {
                    $get_jqElement('#tools').css('height', '15px');
                } else {
                    //$get_jqElement('#tools').css('height', '35px');
                }
                //$("div#" + contDiv + " [name='tools'] button").removeClass('small_tool_button').addClass("big_tool_button");
                $("div#" + contDiv + " .wb_menu button").removeClass('small_tool_button').addClass("big_tool_button");
                $get_jqElement('#button_clear').css('width', '45px');
                $get_jqElement('#button_clear').css('height', '25px');
                $get_jqElement('#button_clear').text("Clear");
                $get_jqElement('#button_save').text("Save");
                $get_jqElement('#button_undo').text("Undo");
                $get_jqElement('#button_delete').text("Delete");
                //$get_jqElement('#button_nav').text("Navigator");
                // $get_jqElement('#button_clear').text("CL");
                resizeToolMenu('big_tool_button');
                reloadNavigator()
            } else {
                if (isReadOnly) {
                    $get_jqElement('#tools').css('height', '15px');
                } else {
                    //$get_jqElement('#tools').css('height', '28px');
                }
                //$("div#" + contDiv + " [name='tools'] button").removeClass('big_tool_button').addClass("small_tool_button");
                $("div#" + contDiv + " .wb_menu button").removeClass('big_tool_button').addClass("small_tool_button");
                //$get_jqElement('#button_clear').css('width', '25px');
                //$get_jqElement('#button_clear').css('height', '25px');
                //$get_jqElement('#button_clear').text("CL");
                $get_jqElement('#button_save').text("S");
                $get_jqElement('#button_undo').text("U");
                $get_jqElement('#button_delete').text("X");
                //$get_jqElement('#button_nav').text("N");
                resizeToolMenu('small_tool_button');
                reloadNavigator();
            }

            var off_left = $get_Element("#tools").offsetLeft;
            var off_top = $get_Element("#tools").offsetTop;
            var off_ht = $get_Element("#tools").offsetHeight;
            var topOff = off_ht + off_top + 15;
            var leftOff = off_left + 15;
            if(IS_TOUCH_ONLY){
                topOff=topOff-15;
                leftOff=leftOff-15;
            }
            // var topOff = $get_Element("#tools").offsetHeight +
            // $get_Element("#tools").offsetTop + 15
            // var leftOff = $get_Element("#tools").offsetLeft + 15;
            var vscrollObj = {}
            var hscrollObj = {}
            wb.globalStrokeColor = "#000000";
            wb.mode = 'student';

            var vWidth = docWidth - leftOff;
            var vHeight = docHeight - topOff;
            canvas.width = vWidth;
            canvas.height = vHeight;

            var ccnt = $get_Element("#canvas-container");
            $get_jqElement("#canvas-container").css('width', vWidth + 'px');
            $get_jqElement("#canvas-container").css('height', vHeight + 'px');

            console_log('off_ht_1: ' + $get_Element("#tools").offsetHeight + ":" + $get_Element("#tools").offsetLeft + ":" + $get_Element("#tools").offsetTop)
            var addScrollerH = scroll_window['width'] > docWidth
            var addScrollerV = scroll_window['height'] > docHeight
            var addScroller = addScrollerH || addScrollerV
                //
            if (IS_IPHONE || docWidth <= 600) {
                dox = IS_IPHONE ? 5 : 19
                doy = IS_IPHONE ? 5 : 19
            } else {
                dox = 19;
                doy = 19;
            }
            // dox=doy=0;
            if (IS_IOS) {
                dox = 15;
                doy = 15;
            }
            if (!addScrollerH) {
                dox = 0
            }
            if (!addScrollerV) {
                doy = 0
            }
            if(IS_TOUCH_ONLY){
            dox=doy=0;
            addScroller=false;
            }else{
            dox=doy=5;
            }
            
            try {
                if (typeof G_vmlCanvasManager != "undefined") {
                    var parent_cont = $get_Element("#canvas-container")
                    console_log("DEBUG_IE parent_cont: " + parent_cont);
                    console_log("DEBUG_IE: parent_cont.removeChild" + parent_cont.removeChild);
                    parent_cont.removeChild(canvas)
                    parent_cont.removeChild(buffercanvas)
                    parent_cont.removeChild(shapeHitcanvas)
                    canvas = null;
                    buffercanvas = null;

                    context = null;
                    buffercontext = null;

                    shapeHitcanvas = null
                    shapeHitCtx = null;

                    //
                    canvas = document.createElement('canvas')
                    canvas.width = vWidth;
                    canvas.height = vHeight;
                    $(canvas).attr('class', 'canvas')
                        //
                    buffercanvas = document.createElement('canvas');
                    shapeHitcanvas = document.createElement('canvas');
                    //
                    $(parent_cont).prepend(canvas);
                    $(parent_cont).prepend(buffercanvas);
                    $(parent_cont).prepend(shapeHitcanvas);
                    G_vmlCanvasManager.initElement(canvas);
                    G_vmlCanvasManager.initElement(buffercanvas);
                    G_vmlCanvasManager.initElement(shapeHitcanvas);
                }
            } catch (error) {
                console_log("DEBUG_IE:" + error);
            }
            screen_width = docWidth - leftOff - dox;
            screen_height = docHeight - topOff - doy;

            console_log('off_ht_2: ' + $get_Element("#tools").offsetHeight + ":" + $get_Element("#tools").style.height + ":" + $get_jqElement("#tools").height())
            $get_Element('#drawsection').style.width = (screen_width) + 'px';
            $get_Element('#drawsection').style.height = (screen_height) + 'px';
            
            if (addScroller) {
                $get_Element('#vscroll_track').style.height = (screen_height) + 'px';
                $get_Element('#vscroller').style.left = (screen_width + 3 + off_left) + 'px';
                $get_Element('#vscroller').style.top = (off_ht + off_top) + 'px';

                $get_Element('#hscroll_track').style.width = (screen_width) + 'px';
                $get_Element('#hscroller').style.left = (off_left) + 'px';
                $get_Element('#hscroller').style.top = (off_ht + off_top + screen_height + 3) + 'px';
                var posData = "";
                posData += "Screen-Width:" + docWidth + "\n";
                posData += "Screen-Height:" + docHeight + "\n";
                posData += "wb-Width:" + screen_width + "\n";
                posData += "wb-Height:" + screen_height + "\n";
                posData += "wb-off-top:" + $get_Element("#tools").offsetTop + "\n";
                posData += "wb-off-height:" + $get_Element("#tools").offsetHeight + ":" + off_ht + "\n";
                posData += "vscroller-off-top:" + $get_Element('#vscroller').style.top + "\n";
                posData += "vscroller-off-left:" + $get_Element('#vscroller').style.left + "\n";
                posData += "hscroller-off-top:" + $get_Element('#hscroller').style.top + "\n";
                posData += "hscroller-off-left:" + $get_Element('#hscroller').style.left + "\n";
                //console_log(posData);
            } else {
                $get_jqElement('#vscroller').css({
                    'display': 'none'

                });
                $get_jqElement('#hscroller').css({
                    'display': 'none'

                });
                if (isReadOnly) {
                    $get_jqElement("#tools").removeClass('tools');
                    $get_jqElement("#tools").css('height', '0px');
                }
            }
            var cmd_keys = {};
            var nav_keys = {};
            cmd_keys["frac"] = "/";
            cmd_keys["power"] = "^";
            cmd_keys["sqrt"] = "\\sqrt";
            cmd_keys["prod"] = "*";
            cmd_keys["div"] = "�";
            cmd_keys["neq"] = "\\ne";
            nav_keys["Up"] = "Up";
            nav_keys["Down"] = "Down";
            nav_keys["Right"] = "Right";
            nav_keys["Left"] = "Left";
            nav_keys["Backspace"] = "Backspace";
            if (!IS_TOUCH_ONLY) {

                // $(".keypad").hide();
                // alert($(".keypad").is(":visible"))
            } else {

            }
            // alert($("button").on)

            function mathquill_focus() {
                $(".mathquill-editable").focus();
            }

            function navigate(key) {
                // var event = _event ? _event : window.event;
                // var target=event.target?event.target:event.srcElement
                // var key=$(target).attr("value");
                var h = $(".mathquill-editable").data("[[mathquill internal data]]").block
                h.keydown({
                    which: key,
                    shiftKey: 0
                })

            }

            $(".keypad").on("click", "button", function (event) {
                var key = $(this).attr("value")
                var h = $(".mathquill-editable");
                if (cmd_keys[key]) {
                    h.mathquill('cmd', cmd_keys[key]);
                } else if (nav_keys[key]) {
                    navigate(nav_keys[key])
                } else {
                    h.mathquill('write', $(this).text())
                }

                setTimeout(function () {
                    mathquill_focus()
                }, 100)
            });
            if (true) {
                if (document.addEventListener) {
                    var thumb_h = $get_Element('#hscroll_thumb');
                    thumb_h.addEventListener("mousedown", initThumbDrag, false)
                    thumb_h.addEventListener('touchstart', touchStartFunction, false);
                    thumb_h.addEventListener('touchmove', touchMoveFunction, false);
                    // attach the touchstart, touchmove, touchend event listeners.
                    thumb_h.addEventListener('touchstart', initThumbDrag, false);
                    //
                    var thumb_v = $get_Element('#vscroll_thumb');
                    thumb_v.addEventListener("mousedown", initThumbDrag, false)
                    thumb_v.addEventListener('touchstart', touchStartFunction, false);
                    thumb_v.addEventListener('touchmove', touchMoveFunction, false);
                    // attach the touchstart, touchmove, touchend event listeners.
                    thumb_v.addEventListener('touchstart', initThumbDrag, false);
                } else {
                    $get_Element('#hscroll_thumb').onmousedown = initThumbDrag;
                    $get_Element('#vscroll_thumb').onmousedown = initThumbDrag;
                }
            }

            function getCanvasPos() {
                console_log("getCanvasPos processing!");
                var box = canvas.getBoundingClientRect();
                console_log("canvas bound= top: " + box.top + " left:" + box.left);
                var body = mainDoc.body;
                var docElem = mainDoc.documentElement;
                var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
                var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
                var clientTop = docElem.clientTop || body.clientTop || 0;
                var clientLeft = docElem.clientLeft || body.clientLeft || 0;
                console_log("offset_datas: scrollTop=" + scrollTop + " scrollLeft=" + scrollLeft + " clientTop=" + clientTop + " clientLeft=" + clientLeft);
                var top = box.top + scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;
                offX = Math.round(left);
                offY = Math.round(top);
                console_log("OFFSET: top=" + offY + " left=" + offX);
                return {
                    top: offY,
                    left: offX
                }
            }

            function resize_wb() {
                console_log("INTERNAL CALL::WINDOW_RESIZE::")
                adjustToolbar()
            }

            //window.onresize=resize_wb;
            $(window).resize(resize_wb);

            adjustToolbar = function (contDiv) {
                var siz = viewport()
                var docWidth = siz.width;
                var docHeight = siz.height;

                // if whiteboard is not active
                if ($get_Element('#tools') == null) {
                    return;
                }

                if (docWidth > 600) {
                    // alert($('#tools button').css('width'));
                    if (isReadOnly) {
                        $get_jqElement('#tools').css('height', '15px');
                    } else {
                        //$get_jqElement('#tools').css('height', '35px');
                    }
                    // $("div#" + contDiv + " [name='tools'] button").removeClass('small_tool_button').addClass("big_tool_button");
                    $("div#" + contDiv + " .wb_menu button").removeClass('small_tool_button').addClass("big_tool_button");
                    $get_jqElement('#button_clear').css('width', '45px');
                    $get_jqElement('#button_clear').css('height', '25px');
                    $get_jqElement('#button_clear').text("Clear");
                    if($get_Element('#button_undo')){
                    $get_jqElement('#button_save').text("Save");
                    $get_jqElement('#button_undo').text("Undo");
                    $get_jqElement('#button_delete').text("Delete");
                    //$get_jqElement('#button_nav').text("Navigator");
                    }
                    resizeToolMenu('big_tool_button');
                    reloadNavigator();
                } else {

                    if (isReadOnly) {
                        $get_jqElement('#tools').css('height', '15px');
                    } else {
                        //$get_jqElement('#tools').css('height', '25px');
                    }
                    //$("div#" + contDiv + " [name='tools'] button").removeClass('big_tool_button').addClass("small_tool_button");
                    $("div#" + contDiv + " .wb_menu button").removeClass('big_tool_button').addClass("small_tool_button");
                    /*$get_jqElement('#button_clear').css('width', '25px');
                    $get_jqElement('#button_clear').css('height', '25px');
                    $get_jqElement('#button_clear').text("CL");*/
                    if($get_Element('#button_undo')){
                    $get_jqElement('#button_save').text("S");
                    $get_jqElement('#button_undo').text("U");
                    $get_jqElement('#button_delete').text("X");
                    //$get_jqElement('#button_nav').text("N");
                    }
                    resizeToolMenu('small_tool_button');
                    reloadNavigator();
                }
                // setTimeout(function(){
                var off_left = $get_Element("#tools").offsetLeft;
                var off_top = $get_Element("#tools").offsetTop;
                var off_ht = $get_Element("#tools").offsetHeight;
                var topOff = off_ht + off_top + 15
                var leftOff = off_left + 15;
                if(IS_TOUCH_ONLY){
                    topOff=topOff-15;
                    leftOff=leftOff-15;
                }
                //
                var vWidth = docWidth - leftOff;
                var vHeight = docHeight - topOff;
                canvas.width = vWidth;
                canvas.height = vHeight;
                var ccnt = $get_Element("#canvas-container");
                $get_jqElement("#canvas-container").css('width', vWidth + 'px');
                $get_jqElement("#canvas-container").css('height', vHeight + 'px');
                var addScrollerH = scroll_window['width'] > docWidth
                var addScrollerV = scroll_window['height'] > docHeight
                var addScroller = addScrollerH || addScrollerV
                    //
                if (IS_IPHONE || docWidth <= 600) {
                    dox = IS_IPHONE ? 5 : 19
                    doy = IS_IPHONE ? 5 : 19
                } else {
                    dox = 19;
                    doy = 19;
                }
                // dox=doy=0;
                if (IS_IOS) {
                    dox = 15;
                    doy = 15;
                }
                if (!addScrollerH) {
                    dox = 0
                }
                if (!addScrollerV) {
                    doy = 0
                }
                if(IS_TOUCH_ONLY){
                    dox=doy=0;
                     addScroller=false;
                }else{
                dox=doy=5;
                }
                screen_width = docWidth - leftOff - dox;
                screen_height = docHeight - topOff - doy;
                console_log('off_ht_2: ' + $get_Element("#tools").offsetHeight + ":" + $get_Element("#tools").style.height + ":" + $get_jqElement("#tools").height())
                $get_Element('#drawsection').style.width = (screen_width) + 'px';
                $get_Element('#drawsection').style.height = (screen_height) + 'px';
                if (addScroller) {
                    $get_Element('#vscroll_track').style.height = (screen_height) + 'px';
                    $get_Element('#vscroller').style.left = (screen_width + 3 + off_left) + 'px';
                    $get_Element('#vscroller').style.top = (off_ht + off_top) + 'px';

                    $get_Element('#hscroll_track').style.width = (screen_width) + 'px';
                    $get_Element('#hscroller').style.left = (off_left) + 'px';
                    $get_Element('#hscroller').style.top = (off_ht + off_top + screen_height + 3) + 'px';
                    var posData = "";
                    posData += "Screen-Width:" + docWidth + "\n";
                    posData += "Screen-Height:" + docHeight + "\n";
                    posData += "wb-Width:" + screen_width + "\n";
                    posData += "wb-Height:" + screen_height + "\n";
                    posData += "wb-off-top:" + $get_Element("#tools").offsetTop + "\n";
                    posData += "wb-off-height:" + $get_Element("#tools").offsetHeight + ":" + off_ht + "\n";
                    posData += "vscroller-off-top:" + $get_Element('#vscroller').style.top + "\n";
                    posData += "vscroller-off-left:" + $get_Element('#vscroller').style.left + "\n";
                    posData += "hscroller-off-top:" + $get_Element('#hscroller').style.top + "\n";
                    posData += "hscroller-off-left:" + $get_Element('#hscroller').style.left + "\n";
                    //console_log(posData);
                    positionScroller();
                } else {
                    $get_jqElement('#vscroller').css({
                        'display': 'none'

                    });
                    $get_jqElement('#hscroller').css({
                        'display': 'none'

                    });
                    if (isReadOnly) {
                        $get_jqElement("#tools").removeClass('tools');
                        $get_jqElement("#tools").css('height', '0px');
                    }
                }
                var egraph = $get_jqElement("#egraph")
                var egvisib = egraph.is(":visible");
                var txtBox = $get_jqElement("#inputBox");
                var txtvisib = txtBox.is(":visible");
                var scX=scrollPosition.x
                var scY=scrollPosition.y
                scrollPosition = {
                    x: 0,
                    y: 0
                }
                
                updateCanvas()
                gr2D_xp = nL_xp = (screen_width - 300) / 2;
                gr2D_yp = (screen_height - 300) / 2;
                nL_yp = (screen_height - 100) / 2;
                if (selectedObj) {
                    //drawBoundRect(selectedObj);

                    if (transMode == 'edit') {
                        if (selectedObj.id == 2) {

                            showTextBox()


                        } else {
                            showHideGraphModuleEditor(true)
                        }
                    } else {
                        drawBoundRect({
                            tx: 0,
                            ty: 0,
                            tr: 0,
                            brect: selectedObj.brect
                        }, true);
                    }
                } else {

                    if (egvisib) {
                        showHideGraphModuleEditor(true);
                    }
                    if (txtvisib) {
                        var px = parseFloat($get_Element("#inputBox").style.left) - scX;
                        var py = parseFloat($get_Element("#inputBox").style.top) - scY;
                        clickX=px;
                        clickY=py;                
                        showTextBox()
                    }
                }
                // },100);
            }

            function initThumbDrag(_event) {
                // console.log("INIT_THUMB");
                var event = _event ? _event : window.event;
                isTouchEnabled = event.type.indexOf('touch') > -1
                if (isTouchEnabled) {
                    $get_Element('#hscroll_thumb').removeEventListener("mousedown", initThumbDrag, false);

                }

                event = isTouchEnabled ? _event.changedTouches[0] : event;
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
                getCanvasPos();
                var dx, dy;

                if (event.pageX != undefined) {
                    dx = event.pageX - offX;
                    dy = event.pageY - offY;
                } else {
                    dx = event.clientX - offX
                    dy = event.clientY - offY
                }
                var scroll = 'v';
                var pos = 'top';
                var scrollObj = vscrollObj;
                var mouse_pos = dy
                var dim = 'height';
                var sdim = screen_height;
                var coo = 'y'
                var target = event.target ? event.target : event.srcElement
                if (target == $get_Element('#hscroll_thumb')) {
                    scroll = 'h';
                    pos = 'left';
                    scrollObj = hscrollObj;
                    mouse_pos = dx;
                    dim = 'width';
                    sdim = screen_width;
                    coo = 'x'
                }
                var spos = $get_Element('#' + scroll + 'scroll_thumb').style[pos]
                spos = spos ? spos : 0
                    // var scpos = $get_Element('#canvas-container').style[pos]
                var scpos = scrollPosition[coo]
                scpos = scpos ? scpos : 0
                scrollObj.sy = parseInt(spos)
                scrollObj.screeny = parseInt(scpos)
                scrollObj.my = mouse_pos;
                scrollObj.dragged = true;
                scrollObj.scrub = (scroll_window[dim] - sdim) / (sdim - 30)
                    //console_log("INIT_SCROLL_SCRUB:" + scrollObj.sy + ":" + scrollObj.my + ":" + scrollObj.scrub + ":" + event.target);
                if (document.addEventListener) {
                    if (isTouchEnabled) {
                        document.addEventListener("touchend", stopThumbDrag, false);
                        document.addEventListener("touchmove", startThumbDrag, false);
                        $get_Element('#' + scroll + 'scroll_thumb').addEventListener("touchend", stopThumbDrag, false);
                    } else {
                        document.addEventListener("mouseup", stopThumbDrag, false);
                        document.addEventListener("mousemove", startThumbDrag, false);
                        $get_Element('#' + scroll + 'scroll_thumb').addEventListener("mouseup", stopThumbDrag, false);
                    }
                } else {
                    document.onmousemove = startThumbDrag;
                    $get_Element('#' + scroll + 'scroll_thumb').onmouseup = stopThumbDrag;
                    document.onmouseup = stopThumbDrag;
                }
            }

            function startThumbDrag(_event) {

                if (!vscrollObj.dragged && !hscrollObj.dragged) {
                    return
                }
                var event = _event ? _event : window.event;
                event = isTouchEnabled ? event.changedTouches[0] : event;
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
                // getCanvasPos();
                var dx, dy;
                if (event.pageX != undefined) {
                    dx = event.pageX - offX;
                    dy = event.pageY - offY;
                } else {
                    dx = event.clientX - offX
                    dy = event.clientY - offY
                }
                var scroll = 'v';
                var pos = 'top';
                var scrollObj = vscrollObj;
                var mouse_pos = dy
                var dim = 'height';
                var sdim = screen_height;
                var neg = -1;
                var coo = 'y'
                if (hscrollObj.dragged) {
                    scroll = 'h';
                    pos = 'left';
                    scrollObj = hscrollObj;
                    mouse_pos = dx;
                    dim = 'width';
                    sdim = screen_width;
                    neg = -1;
                    coo = 'x'
                }
                var change = mouse_pos - scrollObj.my
                var newpos = scrollObj.sy + change
                newpos = newpos < 0 ? 0 : newpos
                newpos = newpos > sdim - 30 ? sdim - 30 : newpos;
                if (newpos >= 0 && newpos <= sdim - 30) {
                    var currPos = scrollObj.screeny - (change * scrollObj.scrub);
                    currPos = currPos > 0 ? 0 : currPos
                    currPos = currPos < neg * (scroll_window[dim] - sdim) ? -(scroll_window[dim] - sdim) : currPos;
                    // console.log("ON_SCROLL_SCRUB:"+scrollObj.sy+":"+change+":"+currPos);
                    $get_Element('#' + scroll + 'scroll_thumb').style[pos] = newpos + "px";
                    //$get_Element('#canvas-container').style[pos] = currPos + "px";
                    var diffX=coo=='x'?currPos-scrollPosition[coo]:0
                    var diffY=coo=='y'?currPos-scrollPosition[coo]:0
                    scrollPosition[coo] = currPos;
                    updateNavThumb(scrollPosition['x'], scrollPosition['y'])
                    var egraph = $get_jqElement("#egraph")
                    var egvisib = egraph.is(":visible");
                    var txtBox = $get_jqElement("#inputBox");
                    var txtvisib = txtBox.is(":visible");
                    updateCanvas();
                    if (selectedObj) {
                    //drawBoundRect(selectedObj);

                    if (transMode == 'edit') {
                        if (selectedObj.id == 2) {

                            showTextBox()


                        } else {
                            showHideGraphModuleEditor(true)
                        }
                    } else {
                        drawBoundRect({
                            tx: 0,
                            ty: 0,
                            tr: 0,
                            brect: selectedObj.brect
                        }, true);
                    }
                } else {

                    if (egvisib) {
                        showHideGraphModuleEditor(true);
                    }
                    if (txtvisib) {

                        var px = parseFloat($get_Element("#inputBox").style.left) + diffX
                        var py = parseFloat($get_Element("#inputBox").style.top) + diffY
                            //$get_Element("#inputBox").style.top = py + "px";
                            //$get_Element("#inputBox").style.left = px + "px";
                        clickX = px;
                        clickY = py;
                        showTextBox()
                    }
                }
                }

            }

            function stopThumbDrag(_event) {
                    // console.log("STOP_SCROLL_SCRUB:");
                    if (!vscrollObj.dragged && !hscrollObj.dragged) {
                        return
                    }
                    var event = _event ? _event : window.event;
                    event = isTouchEnabled ? event.changedTouches[0] : event;
                    if (event.preventDefault) {
                        event.preventDefault();
                    } else {
                        event.returnValue = false;
                    }
                    // getCanvasPos();
                    var dx, dy;
                    if (event.pageX != undefined) {
                        dx = event.pageX - offX;
                        dy = event.pageY - offY;
                    } else {
                        dx = event.clientX - offX;
                        dy = event.clientY - offY;
                    }
                    var scroll = 'v';
                    var pos = 'top';
                    var scrollObj = vscrollObj;
                    var mouse_pos = dy
                    var dim = 'height';
                    var sdim = screen_height;
                    var neg = -1
                    var coo = 'y'
                    if (hscrollObj.dragged) {
                        scroll = 'h';
                        pos = 'left';
                        scrollObj = hscrollObj;
                        mouse_pos = dx;
                        dim = 'width';
                        sdim = screen_width;
                        neg = -1
                        coo = 'x'
                    }
                    var change = mouse_pos - scrollObj.my
                    var newpos = scrollObj.sy + change
                    newpos = newpos < 0 ? 0 : newpos
                    newpos = newpos > sdim - 30 ? sdim - 30 : newpos;
                    if (newpos >= 0 && newpos <= sdim - 30) {
                        var currPos = scrollObj.screeny - (change * scrollObj.scrub);
                        currPos = currPos > 0 ? 0 : currPos
                        currPos = currPos < neg * (scroll_window[dim] - sdim) ? -(scroll_window[dim] - sdim) : currPos;
                        $get_Element('#' + scroll + 'scroll_thumb').style[pos] = newpos + "px";
                        // $get_Element('#canvas-container').style[pos] = currPos + "px";
                        var diffX=coo=='x'?currPos-scrollPosition[coo]:0
                    var diffY=coo=='y'?currPos-scrollPosition[coo]:0
                        scrollPosition[coo] = currPos;
                        var egraph = $get_jqElement("#egraph")
                        var egvisib = egraph.is(":visible");
                        var txtBox = $get_jqElement("#inputBox");
                        var txtvisib = txtBox.is(":visible");
                        updateCanvas();
                        if (selectedObj) {
                        //drawBoundRect(selectedObj);

                        if (transMode == 'edit') {
                            if (selectedObj.id == 2) {

                                showTextBox()


                            } else {
                                showHideGraphModuleEditor(true)
                            }
                        } else {
                            drawBoundRect({
                                tx: 0,
                                ty: 0,
                                tr: 0,
                                brect: selectedObj.brect
                            }, true);
                        }
                    } else {

                        if (egvisib) {
                            showHideGraphModuleEditor(true);
                        }
                        if (txtvisib) {

                            var px = parseFloat($get_Element("#inputBox").style.left) + diffX
                            var py = parseFloat($get_Element("#inputBox").style.top) + diffY
                                //$get_Element("#inputBox").style.top = py + "px";
                                //$get_Element("#inputBox").style.left = px + "px";
                            clickX = px;
                            clickY = py;
                            showTextBox()
                        }
                    }
                    }
                    if (document.addEventListener) {
                        if (isTouchEnabled) {
                            document.removeEventListener("mousemove", startThumbDrag, false);
                            document.removeEventListener("touchmove", startThumbDrag, false);

                        } else {

                            document.removeEventListener("mousemove", startThumbDrag, false);

                        }
                    } else {
                        document.onmousemove = null;
                    }
                    scrollObj.dragged = false;
                    // console_log("END_SCROLL_SCRUB:" + newpos + ":" + currPos);
                }
                // canvas.width = origcanvas.width = graphcanvas.width = topcanvas.width
                // = docWidth - leftOff;
                // canvas.height = origcanvas.height = graphcanvas.height =
                // topcanvas.height = docHeight - topOff;
                // console.log("A " + canvas.width + ":" + canvas.height + ":" +
                // docWidth + ":" + docHeight + ":" + leftOff + ":" + topOff);
            context = canvas.getContext("2d");
            buffercontext = buffercanvas.getContext("2d");
            shapeHitCtx = shapeHitcanvas.getContext("2d");
            // canvas.width=origcanvas.width=graphcanvas.width=topcanvas.width=5000;
            // canvas.height=origcanvas.height=graphcanvas.height=topcanvas.height=5000;
            width = screen_width; // canvas.width;
            height = screen_height; // canvas.height;
            context.font = buffercontext.font = "12px sans-serif";
            /*
             * context.save(); context.fillStyle='white'
             * context.fillRect(0,0,width,height) context.restore();
             */
            gr2D = new Image();
            gr2D.src = _imageBaseDir + 'gr2D.png';
            nL = new Image();
            nL.src = _imageBaseDir + 'nL.png';
            graphMode = '';
            gr2D_xp = nL_xp = (screen_width - 300) / 2;
            gr2D_yp = (screen_height - 300) / 2;
            nL_yp = (screen_height - 100) / 2;
            gr2D_w = 300;
            gr2D_h = 300;
            nL_w = 300;
            nL_h = 100;
            //
            editGR = new Image();
            editGR.src = imgPath + 'edit.png';
            deleteGR = new Image();
            deleteGR.src = imgPath + 'delete.png';
            rotateGR = new Image();
            rotateGR.src = imgPath + 'rotate.png';
            scaleGR = new Image();
            scaleGR.src = imgPath + 'scale.png';
            //
            offX = $get_Element("#canvas-container").offsetLeft;
            offY = $get_Element("#canvas-container").offsetTop;


            function getCanvasPos() {
                console_log("getCanvasPos processing!");
                var box = canvas.getBoundingClientRect();
                console_log("canvas bound= top: " + box.top + " left:" + box.left);
                var body = mainDoc.body;
                var docElem = mainDoc.documentElement;
                var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
                var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
                var clientTop = docElem.clientTop || body.clientTop || 0;
                var clientLeft = docElem.clientLeft || body.clientLeft || 0;
                console_log("offset_datas: scrollTop=" + scrollTop + " scrollLeft=" + scrollLeft + " clientTop=" + clientTop + " clientLeft=" + clientLeft);
                var top = box.top + scrollTop - clientTop;
                var left = box.left + scrollLeft - clientLeft;
                offX = Math.round(left);
                offY = Math.round(top);
                console_log("OFFSET: top=" + offY + " left=" + offX);
                return {
                    top: offY,
                    left: offX
                }
            }
            console_log("getCanvasPos calling!");
            getCanvasPos();
            console_log("getCanvasPos CALL END!");
            graphicData = {}
            tool_id = {};
            tool_id['eraser'] = 0;
            tool_id['pencil'] = 1;
            tool_id['text'] = 2;
            tool_id['line'] = 3;
            tool_id['rect'] = 4;
            tool_id['oval'] = 5;
            // tool_id['ellipse']=5;
            tool_id['gr2D'] = 11;
            tool_id['nL'] = 12;
            drawingLayer = '1';
            if (currentTool != 'pencil') {
                if (currentTool == 'text' || $get_Element("#inputBox").style.display == 'block') {
                    textEditMode = !true;
                    hideTextBox();
                }
                resetButtonHighlite();
                currentTool = 'pencil';
            }
            $get_Element("#button_pencil").style.border = '2px solid #ff9900';

            // Events
            // drawRect(0,0,width,height,'#ff0000');
            if ($get_Element("#button_calc")) {
                $get_Element("#button_calc").onclick = function (event) {
                    // $get_Element("#drawsection").style.cursor='crosshair';
                    if (enable_calc) {
                        showHideCalc();
                    }
                };
            }
            //
            if ($get_Element("#button_text")) {
            $get_Element("#button_text").onclick = function (event) {
                $get_Element("#drawsection").style.cursor = 'text';
                currentTool = 'text';
                buttonHighlite(currentTool)
            };
            }
            if ($get_Element("#button_pencil")) {
            $get_Element("#button_pencil").onclick = function (event) {
                $get_Element("#drawsection").style.cursor = 'url("' + _imageBaseDir + 'pencil.png") 0 26,auto';
                currentTool = 'pencil';
                buttonHighlite(currentTool);
                if(IS_TOUCH_ONLY){
                togglePencil();
                }
            };
            }
            if ($get_Element("#button_rect")) {
            $get_Element("#button_rect").onclick = function (event) {
                $get_Element("#drawsection").style.cursor = 'crosshair';
                currentTool = 'rect';
                buttonHighlite(currentTool)
            };
            $get_Element("#button_line").onclick = function (event) {
                $get_Element("#drawsection").style.cursor = 'crosshair';
                currentTool = 'line';
                buttonHighlite(currentTool)
            };
            $get_Element("#button_oval").onclick = function (event) {
                $get_Element("#drawsection").style.cursor = 'crosshair';
                currentTool = 'oval';
                buttonHighlite(currentTool)
            };
            
            $get_Element("#button_gr2D").onclick = function (event) {
                // $get_Element("#drawsection").style.cursor='url("imgs/pencil.png"),auto';
                //currentTool = 'gr2D';
                //showHideGraph('gr2D')
                //buttonHighlite('pencil')
                if (wb.options.showTemplates) {
                    wb.addGraphModule('xy');
                } else {
                    currentTool = 'gr2D';
                    showHideGraph('gr2D')
                    buttonHighlite('pencil')
                }
            };
            $get_Element("#button_nL").onclick = function (event) {
                // $get_Element("#drawsection").style.cursor='url("imgs/pencil.png"),auto';
                //currentTool = 'nL';
                //showHideGraph('nL')
                //buttonHighlite('pencil')
                //wb.addGraphModule('x')
                if (wb.options.showTemplates) {
                    wb.addGraphModule('x');
                } else {
                    currentTool = 'nL';
                    showHideGraph('nL');
                    buttonHighlite('pencil')
                }
            };
            }
            $get_Element("#button_clear").onclick = function (event) {
                // $get_Element("#drawsection").style.cursor='url("imgs/pencil.png"),auto';
                // resetWhiteBoard();
                currentTool = 'pencil'
                buttonHighlite(currentTool)
                textEditMode = !true;
                hideTextBox();
                $get_Element("#drawsection").style.cursor = 'url("' + _imageBaseDir + 'pencil.png") 0 26,auto';
                // penDown=false;
                // graphMode='';
                // origcanvas.width=graphcanvas.width=topcanvas.width=canvas.width=width;
                resetWhiteBoard(true);
                if(IS_TOUCH_ONLY){
                resetPencil();
                }
            };
            $get_Element("#button_eraser").onclick = function (event) {
                // $get_Element("#drawsection").style.cursor='url("imgs/eraser.png"),auto';
                $get_Element("#drawsection").style.cursor = 'crosshair';
                // resetWhiteBoard();
                currentTool = 'eraser'
                buttonHighlite(currentTool);
                if(IS_TOUCH_ONLY){
                togglePencil();
                }
            };
            if ($get_Element("#button_move")) {
                $get_Element("#button_move").onclick = function (event) {
                    // $get_Element("#drawsection").style.cursor='url("imgs/eraser.png"),auto';
                    $get_Element("#drawsection").style.cursor = 'move';
                    // resetWhiteBoard();
                    wb.setSelectionMode()
                        //currentTool = 'move'
                    if (selectionMode) {
                        buttonHighlite('move');
                    } else {
                        wb.removeSelectionMode();
                    }
                };
            }
            //
            $get_Element("#done_btn").onclick = function (event) {
                renderText();
                // check()
            }
            $(document).on("keydown", onkeydownHandler)
            if ($get_Element("#button_undo")) {
                $get_Element("#button_undo").onclick = function (event) {
                    var l = graphicDataStore.length
                    var c = 1
                    if (l) {
                        var item = graphicDataStore[l - 1];
                        var gid = item.groupid;
                        if (gid !== undefined) {
                            for (var i = l - 2; i >= 0; i--) {
                                var _item = graphicDataStore[i]
                                if (_item.groupid !== undefined && gid === _item.groupid) {
                                    c++
                                } else {
                                    break
                                }
                            }
                        }
                    }
                    var callUndo = wb.options.callInternalUndo ? wb.whiteboardOut_local : wb.whiteboardOut
                    for (var j = 0; j < c; j++) {
                        callUndo('undo', true);
                    }
                };
            }
            if ($get_Element("#button_delete")) {
                $get_Element("#button_delete").onclick = function (event) {

                    wb.deleteSelectedObj();
                };
            }
            if ($get_Element("#button_nav")) {
                $get_Element("#button_nav").onclick = function (event) {


                    var a = showHideNavigator(graphicDataStore, scrollPosition)
                    if (a == 'show') {
                        currentTool = 'nav'
                        buttonHighlite(currentTool)
                    } else {
                        currentTool = 'pencil'
                        buttonHighlite(currentTool)
                    }
                };
            }
            if ($get_Element("#button_temp")) {
                $get_Element("#button_temp").onclick = function (event) {
                    /** Show the GWT supplied template manager */
                    if (!window['gwt_manageTemplates']) {
                        showHideTemplates()
                    } else {
                        wb.manageTemplates();
                    }
                };
            }
            if ($get_Element("#button_save")) {
                $get_Element("#button_save").onclick = function (event) {
                    wb.saveWhiteboard();
                };
            }



            //

            function killMouseListeners() {

                if (document.addEventListener) {
                    canvas.removeEventListener("mousedown", ev_onmousedown, false);
                    canvas.removeEventListener("mouseup", ev_onmouseup, false);
                    canvas.removeEventListener("mousemove", ev_onmousemove, false);

                } else {
                    canvas.detachEvent("onmousedown", ev_onmousedown);
                    canvas.detachEvent("onmouseup", ev_onmouseup);
                    canvas.detachEvent("onmousemove", ev_onmousemove);
                }
            }

            function killTouchListeners() {
                if (document.addEventListener) {


                    // touchscreen specific - to prevent web page being scrolled
                    // while drawing
                    canvas.removeEventListener('touchstart', touchStartFunction, false);
                    canvas.removeEventListener('touchmove', touchMoveFunction, false);

                    // attach the touchstart, touchmove, touchend event listeners.
                    canvas.removeEventListener('touchstart', ev_onmousedown, false);
                    canvas.removeEventListener('touchmove', ev_onmousemove, false);
                    canvas.removeEventListener('touchend', ev_onmouseup, false);

                } else {
                    // touchscreen specific - to prevent web page being scrolled
                    // while drawing
                    canvas.detachEvent('touchstart', touchStartFunction);
                    canvas.detachEvent('touchmove', touchMoveFunction);

                    // attach the touchstart, touchmove, touchend event listeners.
                    canvas.detachEvent('touchstart', ev_onmousedown);
                    canvas.detachEvent('touchmove', ev_onmousemove);
                    canvas.detachEvent('touchend', ev_onmouseup);
                }
            }

            function __killListeners() {
                    killMouseListeners();
                    killTouchListeners();
                }
                //

            function positionScroller() {
                var scrubH = (canvas.width - screen_width) / (screen_width - 30);
                var scrubV = (canvas.height - screen_height) / (screen_height - 30);
                var currPosH = parseInt($get_Element('#canvas-container').style.left);
                currPosH = currPosH ? currPosH : 0
                currPosH = currPosH > 0 ? 0 : currPosH
                currPosH = currPosH < -(canvas.width - screen_width) ? -(canvas.width - screen_width) : currPosH;
                $get_Element('#hscroll_thumb').style.left = (-currPosH / scrubH) + "px";
                $get_Element('#canvas-container').style.left = currPosH + "px";
                var currPosV = parseInt($get_Element('#canvas-container').style.top);
                currPosV = currPosV ? currPosV : 0
                currPosV = currPosV > 0 ? 0 : currPosV
                currPosV = currPosV < -(canvas.height - screen_height) ? -(canvas.height - screen_height) : currPosV;
                $get_Element('#vscroll_thumb').style.top = (-currPosV / scrubV) + "px";
                $get_Element('#canvas-container').style.top = currPosV + "px";
                // console_log("SCROLLER_THUMB_POS:" + scrubH + ":" + scrubV + ":" + (-currPosH) + ":" + (-currPosV))
            }

            function scrollTheCanvas(event) {
                checkForScroll(event);
                // setTimeout(function(){checkForScroll(event)},100)
            }

            function checkForScroll(_event) {
                // console.log("CHECK_FOR_SCROLL")
                var event = _event ? _event : window.event;
                isTouchEnabled = event.type.indexOf('touch') > -1;
                var dx, dy, dist;

                if (event.pageX != undefined) {
                    dx = event.pageX - offX;
                    dy = event.pageY - offY;
                } else {
                    dx = event.clientX - offX
                    dy = event.clientY - offY
                }
                if (penDown) {
                    return
                }

                var cposX = ($get_Element("#wb-container").style.left);
                var cposY = ($get_Element("#wb-container").style.top);

                cposX = cposX ? parseInt(cposX) : 0;
                cposY = cposY ? parseInt(cposY) : 0;
                // console.log((dx-cposX)+":"+screen_width+"||"+(dy-cposY)+":"+screen_height)
                if (dx - cposX >= screen_width) {
                    doRightScroll();
                    setTimeout(function () {
                        checkForScroll(_event)
                    }, 100)
                } else if (dy - cposY >= screen_height) {
                    doUpScroll();
                    setTimeout(function () {
                        checkForScroll(_event)
                    }, 100)
                } else {
                    // clearInterval(scrollInt);
                }
            }


            //
            function initMultiSelection() {
                var num = selectedObjects.length;
                if (!num) {
                    return
                }
                var selectedObj
                selectionDragMode = true;
                selectionDragged = false;

                for (var i = 0; i < num; i++) {
                    selectedObj = selectedObjects[i];
                    if (!objectActions[selectedObj.uid]['move']) {
                        objectActions[selectedObj.uid]['move'] = []
                    };
                    if (!objectActions[selectedObj.uid]['delete']) {
                        objectActions[selectedObj.uid]['delete'] = [];
                    };
                    objectActions[selectedObj.uid]['move'].push({});
                }
            }

            function renderMultiSelectionTrans() {
                var num = selectedObjects.length;
                if (!num) {
                    return
                }
                var dx = x - clickX;
                var dy = y - clickY;
                var selectedObj;
                selectionDragged = true;
                for (var i = 0; i < num; i++) {
                    selectedObj = selectedObjects[i];
                    var pd = cloneObjectDeep(selectedObj);
                    var li = objectActions[selectedObj.uid][transMode].length - 1;
                    var isTransformed = li > 0 ? isObjTransformed(selectedObj.uid, transMode, true) : false;
                    var trans = {
                        tx: dx,
                        ty: dy,
                        trect: selectedObj.brect
                    }
                    if (isTransformed) {
                        trans = {
                            tx: isTransformed.tx + dx,
                            ty: isTransformed.ty + dy,
                            trect: isTransformed.trect
                        }
                    }
                    transformObj(pd, trans.tx, trans.ty, selectedObj);
                    var tdata = {
                        tx: trans.tx,
                        ty: trans.ty,
                        trect: pd.brect
                    };
                    objectActions[selectedObj.uid][transMode][li] = tdata;

                }
                updateCanvas();
                updateMultiSelectRect()
                drawMultiSelectionRect();
            }

            function applyMultiSelectionTrans() {
                var dx = x - clickX;
                var dy = y - clickY;
                var num = selectedObjects.length;
                if (!num) {
                    return
                }
                var selectedObj
                if (selectionDragged) {
                    removeBoundRect();
                    var gid = getNextGroupID();
                    for (var i = 0; i < num; i++) {
                        selectedObj = selectedObjects[i];
                        var pd = cloneObjectDeep(selectedObj);
                        var li = objectActions[selectedObj.uid][transMode].length - 1;
                        var isTransformed = li > 0 ? isObjTransformed(selectedObj.uid, transMode, true) : false;
                        var trans = {
                            tx: dx,
                            ty: dy,
                            trect: selectedObj.brect
                        }
                        if (isTransformed) {
                            trans = {
                                tx: isTransformed.tx + dx,
                                ty: isTransformed.ty + dy,
                                trect: isTransformed.trect
                            }
                        }
                        transformObj(pd, trans.tx, trans.ty, selectedObj);



                        var tdata = {
                            tx: trans.tx,
                            ty: trans.ty,
                            trect: pd.brect
                        };
                        objectActions[selectedObj.uid][transMode][li] = tdata;
                        selectionDragged = false;
                        var mobj = {
                            id: selectedObj.id,
                            uid: selectedObj.uid,
                            groupid: gid,
                            type: 'cmd',
                            cmd: {
                                name: transMode,
                                data: tdata
                            },
                            dataArr: []
                        }
                        updateDataToSERVER(null, mobj);
                    }
                    updateCanvas();
                    updateMultiSelectRect()
                    drawMultiSelectionRect();

                } else {
                    for (var i = 0; i < num; i++) {
                        selectedObj = selectedObjects[i];
                        objectActions[selectedObj.uid][transMode].pop();
                    }
                }


            }

            //
            var ev_onmousedown = function (_event) {
                // alert("MDOWN")
                if(!IS_TOUCH_ONLY){
                $get_jqElement("#wb_menu").hide();
                }
                hideTemplates();
                transMode = 'move'
                if (isReadOnly || currentTool == 'nav' || isRightClick(_event)) {
                    return
                }
                var event = _event ? _event : window.event;
                var tevent = event
                isTouchEnabled = event.type.indexOf('touch') > -1
                if (isTouchEnabled) {
                    canvas.removeEventListener("mousedown", ev_onmousedown, false);
                    canvas.removeEventListener("mouseup", ev_onmouseup, false);
                    canvas.removeEventListener("mousemove", ev_onmousemove, false);
                }
                getCanvasPos();
                /*
                 * else{ canvas.removeEventListener('touchstart',ev_onmousedown,
                 * false); canvas.removeEventListener('touchmove',ev_onmousemove,
                 * false); canvas.removeEventListener('touchend',ev_onmouseup,
                 * false); }
                 */


                event = isTouchEnabled ? _event.changedTouches[0] : event;

                var dx, dy, dist;

                if (event.pageX != undefined) {
                    dx = event.pageX - offX;
                    dy = event.pageY - offY;
                } else {
                    dx = event.clientX - offX
                    dy = event.clientY - offY
                }
                // alert(dx+":"+canvas.width)
                // console.log(dy + ":" + event.clientY + ":" + event.layerY + ":" +
                // event.pageY + ":" + offY);
                context.lineWidth = 2.0;
                context.strokeStyle = wb.globalStrokeColor;

                var currPos = $get_Element('#canvas-container').style.left;
                currPos = currPos ? parseInt(currPos) : 0;
                var click_pos = dx + currPos
                console_log("MOUSE_DOWN " + dx + ":" + width + ":::" + click_pos + ":" + screen_width)

                if (mouseOverCalc(event)) {
                    penDown = false;
                    return
                } else if (click_pos >= 0 && click_pos < screen_width) {
                    hideCalc()
                    if (isTouchEnabled) {
                        if (tevent.touches.length > 1) {
                            penDown = false;
                            rendering = false;
                            if (true) {
                                initSwipe(_event);
                            }
                            return
                        }
                    }
                    penDown = true;
                    rendering = false;
                    var isOpen = $get_Element("#inputBox").style.display == 'block';
                    if (isOpen) {
                        if (selectionMode && selectedObj) {
                            transMode = 'edit';
                        }
                        renderText();
                    }
                    if (objOnSel) {
                        removeObjSelection();
                        if (!selectionMode) {
                            $get_jqElement("#button_move").trigger('click');
                        }

                    }
                    clickX = dx;
                    clickY = dy;
                    x = dx;
                    y = dy;
                    lineBound = {};
                    if (selectionMode) {

                        //selectionRect=null;
                        var i
                        if (multiSelection) {
                            if (contains(mSelRect, x, y)) {
                                initMultiSelection();
                            } else {
                                multiSelection = false;
                                mSelRect = null;
                                selectedObjects = []
                                selectionRect = {
                                    x: x,
                                    y: y,
                                    xmin: x,
                                    ymin: y,
                                    xmax: x,
                                    ymax: y
                                }
                                selectionDragMode = true;
                                removeBoundRect()
                            }
                            if (event.preventDefault) {
                                event.preventDefault()
                            } else {
                                event.returnValue = false
                            };


                            return
                        }
                        var dofindSel = true
                        if (selectedObj) {
                            var bsrect = getWhiteboardObjBound('sel');
                            // alert("A")
                            if (contains(bsrect.brect, x, y)) {
                                i = selectedObjIndex;
                                dofindSel = !true
                                transMode = selectionOnNode(selectedObj, x, y);
                                transMode = transMode == null ? 'move' : transMode
                                if (transMode == 'edit' || transMode == 'delete') {
                                    return
                                }
                            } else {
                                //alert("B")
                                transMode = selectionOnNode(selectedObj, x, y);
                                transMode = transMode == null ? 'move' : transMode
                                    // alert(transMode)
                                if (transMode == 'edit' || transMode == 'delete') {
                                    return
                                }
                            }
                        }
                        if (dofindSel) {
                            i = findSelectedObjIndex(x, y);
                        }
                        selectedObjIndex = i;
                        console.log(i)
                        console.log(selectedObj)
                        if (i > -1) {

                            if (wb.isErased(selectedObj)) {
                                penDown = !true
                                wb.removeSelectionMode(true);
                                alert("Sorry! Erased objects cannot be moved!!")
                                return
                            }
                            selectedObjID = selectedObj.uid;
                            selectionDragMode = true;
                            selectionDragged = false;
                            resetWhiteBoard(false);
                            updateCanvas();
                            var isTransformed = isObjTransformed(selectedObj.uid, transMode);
                            var isMoved = isObjTransformed(selectedObj.uid, 'move');
                            var isScaled = isObjTransformed(selectedObj.uid, 'scale');
                            var isRotated = isObjTransformed(selectedObj.uid, 'rotate');
                            var isEdited = selectedObj.id == '2' && isObjTransformed(selectedObj.uid, 'edit');
                            if (transMode == 'rotate') {
                                //var isMoved =  isObjTransformed(selectedObj.uid, 'move');
                                //var isScaled =  isObjTransformed(selectedObj.uid, 'scale');
                                var rect = cloneObject(selectedObj.brect)
                                if (isMoved) {
                                    transformRect(rect, isMoved.tx, isMoved.ty, 'move')
                                }
                                if (isScaled) {
                                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                                }
                                var cx = rect.xmin + rect.w / 2
                                var cy = rect.ymin + rect.h / 2
                                var dsx = x - cx - scrollPosition.x
                                var dsy = y - cy - scrollPosition.y
                                clickR = Math.atan2(dsy, dsx)
                            }
                            if (isTransformed || isEdited) {

                                if (isEdited) {
                                    drawBoundRect({
                                        tx: isTransformed ? isTransformed.tx : 0,
                                        ty: isTransformed ? isTransformed.ty : 0,
                                        tr: 0,
                                        brect: isEdited.brect
                                    })
                                } else {
                                    try {
                                        drawBoundRect({
                                            tx: isTransformed.tx,
                                            ty: isTransformed.ty,
                                            tr: isTransformed.tr,
                                            brect: isTransformed.trect
                                        })
                                    } catch (e) {
                                        alert(e);
                                    }
                                }
                            } else {
                                try {
                                    drawBoundRect({
                                        tx: 0,
                                        ty: 0,
                                        tr: 0,
                                        brect: selectedObj.brect
                                    });
                                } catch (e) {
                                    alert(e);
                                }
                            }
                            if (!objectActions[selectedObj.uid]['move']) {
                                objectActions[selectedObj.uid]['move'] = []
                            };
                            if (!objectActions[selectedObj.uid]['scale']) {
                                objectActions[selectedObj.uid]['scale'] = []
                            };
                            if (!objectActions[selectedObj.uid]['rotate']) {
                                objectActions[selectedObj.uid]['rotate'] = []
                            };
                            if (!objectActions[selectedObj.uid]['delete']) {
                                objectActions[selectedObj.uid]['delete'] = [];
                            };

                            if (transMode == 'scale') {
                                objectActions[selectedObj.uid]['scale'].push({});
                            } else if (transMode == 'rotate') {
                                objectActions[selectedObj.uid]['rotate'].push({});
                            } else {
                                objectActions[selectedObj.uid]['move'].push({});
                            }
                            penDown = true
                        } else {
                            //penDown = !true
                            //wb.removeSelectionMode();
                            selectionRect = {
                                x: x,
                                y: y,
                                xmin: x,
                                ymin: y,
                                xmax: x,
                                ymax: y
                            }
                            selectionDragMode = true;
                        }
                        if (event.preventDefault) {
                            event.preventDefault()
                        } else {
                            event.returnValue = false
                        };


                        return
                    }
                    if (!graphicData.dataArr) {
                        graphicData.dataArr = [];

                    }
                    graphicData.id = tool_id[currentTool];
                    graphicData.uid = getNextObjectID();
                    objectActions[graphicData.uid] = {};
                    console_log("CURRENT_TOOL:" + currentTool);
                    if (currentTool == 'pencil') {
                        context.beginPath();
                        context.moveTo(clickX, clickY);
                    } else if (currentTool == 'eraser') {
                        var eo = erase(x, y);
                        if (eo && eo.length) {
                            if (!eraseObjStore[graphicData.uid]) {
                                eraseObjStore[graphicData.uid] = []
                            }
                            eraseObjStore[graphicData.uid] = eraseObjStore[graphicData.uid].concat(eo);
                        }
                    }
                    drawcolor = colorToNumber(context.strokeStyle)
                    if (currentTool == 'text') {
                        penDown = false;

                        graphicData.dataArr[0] = {
                            x: x - scrollPosition.x,
                            y: y - scrollPosition.y,
                            text: "",
                            color: drawcolor,
                            name: "",
                            layer: drawingLayer
                        };
                        // alert("0:: "+graphicData.dataArr[0])
                        showTextBox();
                    } else {
                        graphicData.dataArr[graphicData.dataArr.length] = {
                            x: x - scrollPosition.x,
                            y: y - scrollPosition.y,
                            id: "move",
                            color: drawcolor,
                            name: "",
                            layer: drawingLayer
                        };
                        if (isIE && (currentTool == 'gr2D' || currentTool == 'nl')) {
                            context.beginPath();
                            context.moveTo(clickX, clickY);
                        }
                        lineBound.ymax = y - scrollPosition.y;
                        lineBound.ymin = y - scrollPosition.y;
                        lineBound.xmax = x - scrollPosition.x;
                        lineBound.xmin = x - scrollPosition.x;
                    }
                } else {
                    penDown = false;
                }
                if (event.preventDefault) {
                    event.preventDefault()
                } else {
                    event.returnValue = false
                };
                // _event.stopPropagation();
            };

            var ev_onmouseup = function (_event) {
                if (isReadOnly || currentTool == 'nav' || event_rightclick || wb.ib_drag == 'drag') {
                    event_rightclick = false;
                    wb.ib_drag == 'null'
                    return
                }
                if (!selectedObj && graphEditMode) {
                    showHideGraphModuleEditor(false)
                    penDown = false
                    return;
                }
                if (!selectedObj && textEditMode) {
                    // hideTextBox()
                    // penDown = false
                    return;
                }
                if (selectionMode) {
                    if (transMode == 'edit') {
                        if (selectedObj.id == 2) {
                            updateCanvas();
                            showTextBox()
                            penDown = false
                            return;
                        }
                        showHideGraphModuleEditor(true)
                        penDown = false
                        return;
                    }
                    if (transMode == 'delete') {
                        //showHideGraphModuleEditor(true)
                        wb.deleteSelectedObj();
                        penDown = false
                        return;
                    }
                    var dx = x - clickX;
                    var dy = y - clickY;
                    selectionDragMode = false;
                    if (multiSelection && selectedObjects) {
                        applyMultiSelectionTrans()
                        penDown = false;
                        rendering = false;
                        return
                    }
                    if (selectedObj) {
                        if (selectionDragged) {

                            removeBoundRect();

                            updateCanvas();


                            //drawTempObj(selectedObj, dx, dy);
                            //graphicDataStore.push(cloneObject(selectedObj))

                            //transformObj(selectedObj, dx, dy);

                            var pd = cloneObjectDeep(selectedObj);
                            var li = objectActions[selectedObj.uid][transMode].length - 1;
                            var isTransformed = li > 0 ? isObjTransformed(selectedObj.uid, transMode, true) : false;
                            var dr = 0
                            var isMoved = isObjTransformed(selectedObj.uid, 'move');
                            var isScaled = isObjTransformed(selectedObj.uid, 'scale');
                            var isRotated = isObjTransformed(selectedObj.uid, 'rotate');
                            if (transMode == 'rotate') {

                                var rect = cloneObject(selectedObj.brect)
                                if (isMoved) {
                                    transformRect(rect, isMoved.tx, isMoved.ty, 'move')
                                }
                                if (isScaled) {
                                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                                }
                                var cx = rect.xmin + rect.w / 2
                                var cy = rect.ymin + rect.h / 2
                                var dsx = x - cx - scrollPosition.x
                                var dsy = y - cy - scrollPosition.y
                                dr = -clickR + Math.atan2(dsy, dsx)
                            }
                            if (transMode == 'scale' && isRotated) {
                                var nr0 = getScaleRatio(dx, dy, isRotated.tr)
                                dx = nr0.w
                                dy = nr0.h
                            }
                            var trans = {
                                tx: transMode == 'rotate' ? dr : dx,
                                ty: transMode == 'rotate' ? dr : dy,
                                tr: transMode == 'rotate' ? dr : 0,
                                trect: selectedObj.brect
                            }
                            if (isTransformed) {
                                if (transMode == 'rotate') {
                                    //var dr=Math.atan2(dy,dx);
                                    trans = {
                                        tx: isTransformed.tr + dr,
                                        ty: isTransformed.tr + dr,
                                        tr: isTransformed.tr + dr,
                                        trect: isTransformed.trect
                                    }
                                } else {

                                    trans = {
                                        tx: isTransformed.tx + dx,
                                        ty: isTransformed.ty + dy,
                                        tr: 0,
                                        trect: isTransformed.trect
                                    }
                                }
                            }
                            /* var dd=checkforBoundry(pd,trans.tx, trans.ty);
                            trans.tx=dd.dx;
                            trans.ty=dd.dy;*/
                            transformObj(pd, trans.tx, trans.ty);
                            drawBoundRect({
                                tx: trans.tx,
                                ty: trans.ty,
                                tr: trans.tr,
                                brect: trans.trect
                            });


                            var tdata = {
                                tx: trans.tx,
                                ty: trans.ty,
                                tr: trans.tr,
                                trect: pd.brect
                            };
                            objectActions[selectedObj.uid][transMode][li] = tdata;
                            selectionDragged = false;
                            var mobj = {
                                id: selectedObj.id,
                                uid: selectedObj.uid,
                                type: 'cmd',
                                cmd: {
                                    name: transMode,
                                    data: tdata
                                },
                                dataArr: []
                            }
                            updateDataToSERVER(selectedObjIndex, mobj);
                        } else {
                            // graphicDataStore.splice(selectedObjIndex, 0,selectedObj);
                            objectActions[selectedObj.uid][transMode].pop();
                        }
                    } else {
                        var msel = checkForMultiSelect()
                        removeBoundRect()
                        if (msel && msel.length) {
                            if (msel.length == 1) {
                                selectionRect = null;
                                multiSelection = false;
                                selectedObj = msel[0];
                                var index = findObjIndex(selectedObj);
                                selectedObjIndex = index


                                drawBoundRect({
                                    tx: 0,
                                    ty: 0,
                                    tr: 0,
                                    brect: selectedObj.brect
                                }, true);

                            } else {
                                selectedObjects = msel;
                                drawMultiSelectionRect();
                            }
                        } else {
                            selectionRect = null;
                            multiSelection = false
                            wb.removeSelectionMode(true);

                        }
                    }
                    penDown = false;
                    rendering = false;
                    return
                }
                var event = _event ? _event : window.event;
                event = event.type.indexOf('touch') > -1 ? _event.targetTouches[0] : event;
                /*
                 * if(penDown){ x = event.layerX?event.layerX:event.pageX-offX; y =
                 * event.layerY?event.layerY:event.pageY-offY; }
                 */
                penDown = false;
                // alert(rendering);
                if (swipe_action == 'on') {
                    swipe_action = 'off'
                    return
                }
                if (rendering) {

                    if (currentTool == 'rect' || currentTool == 'oval') {
                        graphicData.dataArr[0].w = w0
                        graphicData.dataArr[0].h = h0
                        graphicData.dataArr[0].xs = w0 / 400
                        graphicData.dataArr[0].ys = h0 / 400
                        rect = getBoundRect(graphicData.dataArr[0].x, graphicData.dataArr[0].y, w0, h0)
                    } else if (currentTool == 'line' || currentTool == 'pencil' || currentTool == 'eraser') {
                        // alert(_event.type+": "+clickX+":"+clickY+":"+x+":"+y);
                        // {x:x-clickX, y:y-clickY, id:"line"}
                        var xp = x - clickX
                        var yp = y - clickY
                        xp = currentTool == 'eraser' ? x - scrollPosition.x : xp
                        yp = currentTool == 'eraser' ? y - scrollPosition.y : yp
                        graphicData.dataArr[graphicData.dataArr.length] = {
                            x: xp,
                            y: yp,
                            id: "line"
                        };
                        if (currentTool == 'eraser') {
                            var eo = eraseObjStore[graphicData.uid];
                            graphicData.hasErasedObj = false
                            if (eo && eo.length) {
                                graphicData.hasErasedObj = true;
                                graphicData.erasedObjs = eo
                            }
                        }
                        if (currentTool != 'eraser') {

                            rect = getBoundRect(graphicData.dataArr[0].x, graphicData.dataArr[0].y, xp - scrollPosition.x, yp - scrollPosition.y)
                            if (currentTool == 'pencil') {
                                rect.x = lineBound.xmin ? lineBound.xmin : 0
                                rect.y = lineBound.ymin ? lineBound.ymin : 0

                                rect.xmin = lineBound.xmin ? lineBound.xmin : 0;
                                rect.xmax = lineBound.xmax ? lineBound.xmax : 0;
                                rect.ymin = lineBound.ymin ? lineBound.ymin : 0;
                                rect.ymax = lineBound.ymax ? lineBound.ymax : 0;
                                rect.w = lineBound.xmax - lineBound.xmin;
                                rect.h = lineBound.ymax - lineBound.ymin;
                            }
                        } else {
                            rect = {
                                xmin: 1,
                                ymin: 1,
                                w: 0,
                                h: 0
                            }
                        }
                    }
                    //graphicData.imageData = context.getImageData(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)
                    graphicData.brect = rect;
                    sendData();
                    rendering = false;
                    updateCanvas();
                    context.beginPath();
                    /*
                    if (currentTool != 'eraser') {
                        updateCanvas();
                        context.beginPath();
                    } else if (currentTool == 'eraser' && isIE) {
                        updateCanvas();
                        context.beginPath();
                    }*/

                } else if (currentTool == 'eraser') {
                    // alert("A");
                    rect = {
                        xmin: 1,
                        ymin: 1,
                        w: 0,
                        h: 0
                    };
                    graphicData.brect = rect;
                    sendData();
                    updateCanvas();
                    context.beginPath();
                    // alert(rendering);
                } else {

                    if (currentTool != 'text') {
                        resetArrays()
                    } else {
                        // alert("B");
                        setTimeout(__focus);
                        // $('.mathquill-editable').focus();
                    }
                }
            };

            var ev_onmousemove = function (_event) {
                if (isReadOnly || currentTool == 'nav' || event_rightclick || transMode == 'edit') {
                    return
                }
                var event = _event ? _event : window.event;
                event = event.type.indexOf('touch') > -1 ? _event.changedTouches[0] : event;
                if (event.pageX != undefined) {
                    x = event.pageX - offX;
                    y = event.pageY - offY;
                } else {
                    x = event.clientX - offX
                    y = event.clientY - offY
                }
                if (penDown) {
                    rendering = true;
                    // console.log("MMOVE")
                    if (currentTool != 'pencil' && currentTool != 'text' && currentTool != 'eraser') {
                        // console.log("MMOVE: "+isIE)
                        if (isIE && currentTool != 'eraser') {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                        } else if (!isIE) {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                        }
                        reRenderCanvas();
                    }

                    // x = event.layerX?event.layerX:event.pageX-offX;
                    // y = event.layerY?event.layerY:event.pageY-offY;
                    // getCanvasPos()

                    var dx = x - clickX;
                    var dy = y - clickY;
                    var bool = isMultitouch_gesture(_event);
                    // alert("A")
                    if (selectionMode && multiSelection && selectedObjects.length) {
                        renderMultiSelectionTrans();

                        if (bool) {
                            return true
                        }
                        if (event.preventDefault) {
                            event.preventDefault()
                        } else {
                            event.returnValue = false
                        };
                    } else if (selectionMode) {
                        if (selectedObj && selectionDragMode) {
                            selectionDragged = true;
                            //drawTempObj(selectedObj, dx, dy)
                            //var pd=graphicDataStore.pop();
                            //pd=pd.dataArr[0]

                            var pd = cloneObjectDeep(selectedObj);

                            //transformObj(pd, dx, dy);
                            var li = objectActions[selectedObj.uid][transMode].length - 1;
                            //var tdata={tx:dx,ty:dy,trect:pd.brect};
                            //objectActions[selectedObj.uid][transMode][li]=tdata;
                            var isTransformed = li > 0 ? isObjTransformed(selectedObj.uid, transMode, true) : false;
                            var isMoved = isObjTransformed(selectedObj.uid, 'move');
                            var isScaled = isObjTransformed(selectedObj.uid, 'scale');
                            var isRotated = isObjTransformed(selectedObj.uid, 'rotate');
                            var isEdited = selectedObj.id == '2' && isObjTransformed(selectedObj.uid, 'edit');
                            if (transMode == 'rotate') {
                                var rect = cloneObject(selectedObj.brect)
                                if (isMoved) {
                                    transformRect(rect, isMoved.tx, isMoved.ty, 'move')
                                }
                                if (isScaled) {
                                    transformRect(rect, isScaled.tx, isScaled.ty, 'scale')
                                }
                                var cx = rect.xmin + rect.w / 2
                                var cy = rect.ymin + rect.h / 2
                                var dsx = x - cx - scrollPosition.x
                                var dsy = y - cy - scrollPosition.y
                                dr = -clickR + Math.atan2(dsy, dsx)
                            }
                            if (transMode == 'scale' && isRotated) {
                                var nr0 = getScaleRatio(dx, dy, isRotated.tr)
                                dx = nr0.w
                                dy = nr0.h
                            }
                            var trans = {
                                    tx: transMode == 'rotate' ? dr : dx,
                                    ty: transMode == 'rotate' ? dr : dy,
                                    tr: transMode == 'rotate' ? dr : 0,
                                    trect: selectedObj.brect
                                }
                                /*if (isTransformed) {
                                trans = {
                                    tx: isTransformed.tx + dx,
                                    ty: isTransformed.ty + dy,
                                    trect: isTransformed.trect
                                }
                            }*/
                            if (isTransformed) {
                                if (transMode == 'rotate') {

                                    trans = {
                                        tx: isTransformed.tr + dr,
                                        ty: isTransformed.tr + dr,
                                        tr: isTransformed.tr + dr,
                                        trect: isTransformed.trect
                                    }
                                } else {

                                    trans = {
                                        tx: isTransformed.tx + dx,
                                        ty: isTransformed.ty + dy,
                                        tr: 0,
                                        trect: isTransformed.trect
                                    }
                                }
                            }
                            if (isEdited) {

                            }
                            /*var dd=checkforBoundry(pd,trans.tx, trans.ty);
                            trans.tx=dd.dx;
                            trans.ty=dd.dy;*/

                            transformObj(pd, trans.tx, trans.ty);


                            var tdata = {
                                tx: trans.tx,
                                ty: trans.ty,
                                tr: trans.tr,
                                trect: pd.brect
                            };

                            objectActions[selectedObj.uid][transMode][li] = tdata;
                            //var mobj={id:selectedObj.id,type:'cmd',cmd:{name:'move',data:tdata},dataArr:[]}
                            //graphicDataStore.push(pd);
                            updateCanvas();
                            //drawBoundRect(pd);
                            //drawBoundRect({tx:isTransformed.tx+dx,ty:isTransformed.ty+dy,brect:isTransformed.trect});
                            drawBoundRect({
                                tx: trans.tx,
                                ty: trans.ty,
                                tr: trans.tr,
                                brect: trans.trect
                            });
                        } else if (selectionDragMode) {
                            //selectionDragMode=false;
                            selectionRect = getBoundRect(selectionRect.x, selectionRect.y, dx, dy)
                            removeBoundRect();
                            //console.log(selectionRect.x+":"+selectionRect.y+":"+selectionRect.w+":"+selectionRect.h+":"+selectionRect.xmin+":"+selectionRect.ymin)
                            drawSelectionRect({
                                tx: selectionRect.xmin,
                                ty: selectionRect.ymin,
                                brect: selectionRect
                            });
                        }
                        bool = isMultitouch_gesture(_event);
                        if (bool) {
                            return true
                        }
                        if (event.preventDefault) {
                            event.preventDefault()
                        } else {
                            event.returnValue = false
                        };

                    } else if (currentTool == 'rect' || currentTool == 'oval') {

                        x0 = clickX;
                        y0 = clickY;
                        w0 = x - clickX;
                        h0 = y - clickY;
                        if (currentTool == 'rect') {
                            drawRect(x0, y0, w0, h0, wb.globalStrokeColor)
                        }
                        if (currentTool == 'oval') {
                            drawOval(x0, y0, w0, h0, wb.globalStrokeColor)
                        }
                    } else {
                        if (currentTool == 'line') {
                            context.beginPath();
                            context.moveTo(clickX, clickY);
                            drawLine();
                        } else if (currentTool == 'eraser') {
                            var eo = erase(x, y);
                            if (eo && eo.length) {
                                if (!eraseObjStore[graphicData.uid]) {
                                    eraseObjStore[graphicData.uid] = []
                                }
                                eraseObjStore[graphicData.uid] = eraseObjStore[graphicData.uid].concat(eo);
                            }
                            graphicData.dataArr[graphicData.dataArr.length] = {
                                x: x - scrollPosition.x,
                                y: y - scrollPosition.y,
                                id: "line"
                            };
                        } else {
                            var xt = x - scrollPosition.x;
                            var yt = y - scrollPosition.y;
                            var cxt = clickX - scrollPosition.x;
                            var cyt = clickY - scrollPosition.y;
                            if (!selectionMode) {
                                if (xt > cxt) {
                                    if (!lineBound.xmax) {
                                        lineBound.xmax = xt
                                    }
                                    if (xt > lineBound.xmax) {
                                        lineBound.xmax = xt
                                    }
                                } else if (xt < cxt) {
                                    if (!lineBound.xmin) {
                                        lineBound.xmin = xt
                                    }
                                    if (xt < lineBound.xmin) {
                                        lineBound.xmin = xt
                                    }
                                } else {
                                    if (!lineBound.xmax) {
                                        lineBound.xmax = xt
                                    }
                                    if (xt > lineBound.xmax) {
                                        lineBound.xmax = xt
                                    }
                                    if (!lineBound.xmin) {
                                        lineBound.xmin = xt
                                    }
                                    if (xt < lineBound.xmin) {
                                        lineBound.xmin = xt
                                    }
                                }
                                if (yt > cyt) {
                                    if (!lineBound.ymax) {
                                        lineBound.ymax = yt
                                    }
                                    if (yt > lineBound.ymax) {
                                        lineBound.ymax = yt
                                    }
                                } else if (yt < cyt) {
                                    if (!lineBound.ymin) {
                                        lineBound.ymin = yt
                                    }
                                    if (yt < lineBound.ymin) {
                                        lineBound.ymin = yt
                                    }
                                } else {
                                    if (!lineBound.ymax) {
                                        lineBound.ymax = yt
                                    }
                                    if (yt > lineBound.ymax) {
                                        lineBound.ymax = yt
                                    }
                                    if (!lineBound.ymin) {
                                        lineBound.ymin = yt
                                    }
                                    if (yt < lineBound.ymin) {
                                        lineBound.ymin = yt
                                    }
                                }
                                lineBound.xmin = lineBound.xmin ? lineBound.xmin : xt;
                                lineBound.xmax = lineBound.xmax ? lineBound.xmax : xt;
                                lineBound.ymin = lineBound.ymin ? lineBound.ymin : yt;
                                lineBound.ymax = lineBound.ymax ? lineBound.ymax : yt;
                                graphicData.dataArr[graphicData.dataArr.length] = {
                                    x: x - clickX,
                                    y: y - clickY,
                                    id: "line"
                                };
                                // console.log("DRAW_LINE_PENCIL: "+x+":"+y);
                                drawLine();
                            }
                        }

                    }
                } else {
                    /*var _sobj = findObjUnder(x, y);
                    if (_sobj) {
                        if (selectedObj && (_sobj.uid == selectedObj.uid)) {

                        } else {
                            showObjSelection(_sobj);
                            objOnSel = _sobj;
                            $get_Element("#drawsection").style.cursor = 'default';
                        }
                    } else {
                        removeObjSelection();
                        objOnSel = null;
                        var cur = 'crosshair'
                        if (currentTool == 'pencil' && !selectionMode) {
                            cur = 'url(' + _imageBaseDir + 'pencil.png) 0 26,auto'
                        } else if (currentTool == 'text' && !selectionMode) {
                            cur = 'text'
                        } else if (selectionMode) {
                            cur = 'move'
                        }
                        var _ccur=$get_Element("#drawsection").style.cursor
                        _ccur=_ccur.split(",")[0]
                        _ccur=_ccur.split(" ")[0]
                        _ccur=_ccur.substring(_ccur.lastIndexOf("/"))
                        var _cur=cur.split(",")[0]
                        _cur=_cur.split(" ")[0]
                        _cur=_cur.substring(_cur.lastIndexOf("/"))
                        if(_cur!=_ccur){
                        $get_Element("#drawsection").style.cursor = cur;
                        }
                    }*/
                }
                var bool = isMultitouch_gesture(_event);
                if (bool) {
                    return true
                }
                if (event.preventDefault) {
                    event.preventDefault()
                } else {
                    event.returnValue = false
                };
                // _event.stopPropagation();
            };

            function initSwipe(_event) {
                var event = _event ? _event : window.event;
                var c = $get_Element('#canvas-container')
                var tl = 0;
                if (event.touches) {
                    console_log(event.touches.length)
                    tl = event.touches.length
                } else {
                    console_log("NOT TOUCH ENABLED!")
                }
                console_log("TOUCHES: " + tl);
                if (tl >= 2) {
                    event.preventDefault();
                    var tarr = event.touches
                    var tp = {}
                    var tx = 0;
                    var ty = 0;
                    var tlen = tarr.length
                    for (var t = 0; t < tlen; t++) {
                        tx += tarr[t].pageX
                        ty += tarr[t].pageY
                    }
                    var touch = {
                        pageX: tx,
                        pageY: ty
                    };
                    swipe_sx = touch.pageX
                    swipe_sy = touch.pageY
                    console_log("TOUCHE_POS: " + swipe_sx + ":" + swipe_sy);
                    swipe_nx = 0
                    swipe_ny = 0
                    swipe_action = 'on'
                    c.addEventListener("touchmove", startSwipe)
                    c.addEventListener("touchend", stopSwipe)
                }
            }

            function startSwipe(_event) {
                var event = _event ? _event : window.event;
                event.preventDefault();
                var tarr = event.touches
                var tp = {}
                var tx = 0;
                var ty = 0;
                var tlen = tarr.length
                if (tlen < 2) {
                    return
                }
                for (var t = 0; t < tlen; t++) {
                    tx += tarr[t].pageX
                    ty += tarr[t].pageY
                }
                var touch = {
                    pageX: tx,
                    pageY: ty
                };
                swipe_mx = touch.pageX;
                swipe_my = touch.pageY;
                swipe_dx = (swipe_mx - swipe_sx)/2;
                swipe_dy = (swipe_my - swipe_sy)/2;
                swipe_nx = swipe_ox + swipe_dx;
                swipe_ny = swipe_oy + swipe_dy;
                if (tlen < 2) {
                    return
                }
                // $get('canvas-container').style.left=dx+"px"
                var currPosY = swipe_ny ? swipe_ny : 0;
                currPosY = parseInt(currPosY)
                currPosY = currPosY > 0 ? 0 : currPosY
                currPosY = currPosY < -(scroll_window.height - screen_height) ? -(scroll_window.height - screen_height) : currPosY;
                // $get_Element('#canvas-container').style.top = currPosY + "px"
                $get_Element('#vscroll_thumb').style.top = getvscrolldata().t + "px";
                scrollPosition['y'] = currPosY;
                // console.log("Touch x:" + swipe_ox + ":" + swipe_nx + ", y:" +
                // swipe_oy + ":" + swipe_ny + ":::" + event.changedTouches.length);
                //
                var currPosX = swipe_nx ? swipe_nx : 0;
                currPosX = parseInt(currPosX)
                currPosX = currPosX > 0 ? 0 : currPosX
                currPosX = currPosX < -(scroll_window.width - screen_width) ? -(scroll_window.width - screen_width) : currPosX;
                //$get_Element('#canvas-container').style.left = currPosX + "px"
                $get_Element('#hscroll_thumb').style.left = gethscrolldata().t + "px";
                scrollPosition['x'] = currPosX;
                updateCanvas();
                //console_log("Touch x:" + swipe_ox + ":" + swipe_nx + ", y:" + swipe_oy + ":" + swipe_ny + ":::" + event.changedTouches.length);
            }

            function stopSwipe(_event) {
                swipe_ox = swipe_ox + swipe_dx
                swipe_oy = swipe_oy + swipe_dy
                var event = _event ? _event : window.event;
                // var touch=event.changedTouches[0]
                event.preventDefault();
                // swipe_action='stop';
                var c = $get_Element('#canvas-container')
                c.removeEventListener("touchmove", startSwipe)
                c.removeEventListener("touchend", stopSwipe)
                $get_Element('#vscroll_thumb').style.top = getvscrolldata().t + "px";
                $get_Element('#hscroll_thumb').style.left = gethscrolldata().t + "px";
                // console.log("Touch END x:" + touch.pageX + ", y:" + touch.pageY);
            }

            function getvscrolldata() {
                var currPos = scrollPosition.y;
                currPos = currPos ? currPos : 0;
                currPos = parseInt(currPos)
                currPos = currPos > 0 ? 0 : currPos
                currPos = currPos < -(scroll_window.height - screen_height) ? -(scroll_window.height - screen_height) : currPos;
                var scrub = (scroll_window.height - screen_height) / (screen_height - 30);
                return {
                    p: currPos,
                    s: scrub,
                    t: (-currPos / scrub)
                }
            }

            function gethscrolldata() {
                var currPos = scrollPosition.x;
                currPos = currPos ? currPos : 0;
                currPos = parseInt(currPos)
                currPos = currPos > 0 ? 0 : currPos
                currPos = currPos < -(scroll_window.width - screen_width) ? -(scroll_window.width - screen_width) : currPos;
                var scrub = (scroll_window.width - screen_width) / (screen_width - 30);
                return {
                    p: currPos,
                    s: scrub,
                    t: (-currPos / scrub)
                };
            }

            function moveObject(event) {
                var delta = 0;

                if (!event) event = window.event;

                // normalize the delta
                if (event.wheelDelta) {

                    // IE and Opera
                    delta = event.wheelDelta / 60;

                } else if (event.detail) {

                    // W3C
                    delta = -event.detail / 2;
                }

                var currPos = scrollPosition.y;
                currPos = currPos ? currPos : 0;
                // console.log("DELTA:"+delta+":"+currPos);
                // calculating the next position of the object
                currPos = parseInt(currPos) + (delta * 10);
                currPos = currPos > 0 ? 0 : currPos
                currPos = currPos < -(scroll_window.height - screen_height) ? -(scroll_window.height - screen_height) : currPos;
                var scrub = (scroll_window.height - screen_height) / (screen_height - 30)
                    //$get_Element('#canvas-container').style.top = currPos + "px";
                $get_Element('#vscroll_thumb').style.top = (-currPos / scrub) + "px";
                var diffY = currPos - scrollPosition['y'];
                var diffX = 0;
                scrollPosition['y'] = currPos;
                updateNavThumb(scrollPosition['x'], scrollPosition['y'])
                var egraph = $get_jqElement("#egraph")
                var egvisib = egraph.is(":visible");
                var txtBox = $get_jqElement("#inputBox");
                var txtvisib = txtBox.is(":visible");
                updateCanvas();
                if (selectedObj) {
                    //drawBoundRect(selectedObj);

                    if (transMode == 'edit') {
                        if (selectedObj.id == 2) {

                            showTextBox()


                        } else {
                            showHideGraphModuleEditor(true)
                        }
                    } else {
                        drawBoundRect({
                            tx: 0,
                            ty: 0,
                            tr: 0,
                            brect: selectedObj.brect
                        }, true);
                    }
                } else {

                    if (egvisib) {
                        showHideGraphModuleEditor(true);
                    }
                    if (txtvisib) {

                        var px = parseFloat($get_Element("#inputBox").style.left) + diffX
                        var py = parseFloat($get_Element("#inputBox").style.top) + diffY
                            //$get_Element("#inputBox").style.top = py + "px";
                            //$get_Element("#inputBox").style.left = px + "px";
                        clickX = px;
                        clickY = py;
                        showTextBox()
                    }
                }
                // console.log("AFTER:"+currPos+":"+(currPos/scrub));
                // moving the position of the object
                // document.getElementById('scroll').style.top = currPos+"px";
                // document.getElementById('scroll').innerHTML = event.wheelDelta +
                // ":" + event.detail;
            }
            if (!IS_IOS) {
                $get_Element('#drawsection').onmousewheel = moveObject;
            }
            __killListeners()
            if (document.addEventListener) {
                canvas.addEventListener("mousedown", ev_onmousedown, false);
                canvas.addEventListener("mouseup", ev_onmouseup, false);
                canvas.addEventListener("mousemove", ev_onmousemove, false);

                // touchscreen specific - to prevent web page being scrolled while
                // drawing
                canvas.addEventListener('touchstart', touchStartFunction, false);
                canvas.addEventListener('touchmove', touchMoveFunction, false);

                // attach the touchstart, touchmove, touchend event listeners.
                canvas.addEventListener('touchstart', ev_onmousedown, false);
                canvas.addEventListener('touchmove', ev_onmousemove, false);
                canvas.addEventListener('touchend', ev_onmouseup, false);
                //
                // document.addEventListener('DOMMouseScroll', moveObject, false);
                // $get_Element('#container').addEventListener('mousemove',
                // scrollTheCanvas, false);
            } else {
                canvas.attachEvent("onmousedown", ev_onmousedown);
                canvas.attachEvent("onmouseup", ev_onmouseup);
                canvas.attachEvent("onmousemove", ev_onmousemove);


                // touchscreen specific - to prevent web page being scrolled while
                // drawing
                canvas.attachEvent('touchstart', touchStartFunction);
                canvas.attachEvent('touchmove', touchMoveFunction);

                // attach the touchstart, touchmove, touchend event listeners.
                canvas.attachEvent('touchstart', ev_onmousedown);
                canvas.attachEvent('touchmove', ev_onmousemove);
                canvas.attachEvent('touchend', ev_onmouseup);
                //

            }
            if (isReadOnly) {
                wb.isReadOnly(true);
            }
            canvas.focus();
            wb.whiteboardIsReady();
        }, 100);
    }

    function $get_Element(n) {
        var str = n.indexOf("#") > -1 ? n.split("#")[1] : n
        var jqobj = $("div#" + contDiv + " [name=" + str + "]");
        return jqobj[0];
    }

    function $get_jqElement(n) {
        return $($get_Element(n))
    }

    function updateText(txt, x, y, c) {
        // alert("UT:"+txt)
        if (graphicData.dataArr.length) {
            var data = graphicData.dataArr[0]
            graphicData.dataArr = [data];
        }
        graphicData.dataArr[0].text = escape(txt);
        graphicData.dataArr[0].x = x - scrollPosition.x;
        graphicData.dataArr[0].y = y - scrollPosition.y;
        graphicData.dataArr[0].color = c;
    }

    function showTextBox() {
        cTMaxWidth = null;
        if (useMQ) {
            showTextBox_mq()
        } else {
            showTextBox_html()
        }
        textEditMode = true;
    }

    function hideTextBox() {
        if (useMQ) {
            hideTextBox_mq()
        } else {
            hideTextBox_html()
        }
        textEditMode = !true;
    }

    function showTextBox_html() {
        //alert("A")
        var siz = viewport()
        var docWidth = siz.width;
        var docHeight = siz.height;
        if (!$get_Element("#content")) {

            var maxW = docWidth - clickX - 50
                /*$($("#" + contDiv + " [name='inputBox'] div")[0]).html("<textarea class='content' name='content' style='white-space:normal;min-width:60px;min-height:40px;width:60px;height:40px;font:20pt Arial;color:" + wb.globalStrokeColor + "' ></textarea>" + '<div name="dummy_resize" style="max-width:' + maxW + 'px;min-height:40px;display: none;font:20pt Arial;word-wrap:normal;white-space:normal;"></div>');*/


            var ttHtml = "<div class='input_box' name='input_box'>" +
                "<textarea class='content' name='content' style='color:" + wb.globalStrokeColor + "'> " +
                "</textarea></div>" + "<div name='dummy_resize' style='max-width: " + maxW + "px;'></div>";
            $($("#" + contDiv + " [name='inputBox'] div")[0]).html(ttHtml);
            if(!dragBoxPluginInited){
            initDragBoxPlugin();
            dragBoxPluginInited=true;
            }
            $get_jqElement("#input_box").resizeBox(wb);
            /*$("#" + contDiv + " [name='inputBox']").css('border', '0px')
                 $get_jqElement("#inputBox").find("[name='content']").live({
                input: function (e) {
                    var rs = $get_jqElement("#dummy_resize")
                    rs.text($(this).val() + "9.");
                    rs.show()
                    var duw = rs.width();
                    var duh = rs.height();
                    rs.hide()
                    var cont=$get_jqElement("#input_box")
                    var cc=cont.find("[name='content']")
                    if(duw>120){
                     $(this).css("width", duw + 'px');
                     cont.css("width", duw + 'px');
                     cc.css("width", duw + 'px');
                    }
                    if(duh>40){
                    $(this).css("height", duh + 'px');
                    cont.css("height", duh + 'px');
                    cc.css("height", duh + 'px');
                    }
                    cont.parent().parent().find("[name='done_btn']").css({
            
                    'top': parseFloat(cont.css("top")) + (h + 30) + 'px',
                    'left': parseFloat(cont.css("left")) + 'px'
                    })
                   
                    
                    
                    
        
        
                },
                mousedown: function (e) {
                    textAreaW = $get_jqElement("#content").outerWidth()
                },
                mouseup: function (e) {
                    var _w = $get_jqElement("#content").outerWidth()
                    if (_w !== textAreaW) {
                        $get_jqElement("#dummy_resize").css('max-width', _w + 'px');
                        $get_jqElement("#content").trigger('input');
                    }
                }
            });*/
        } else {
            var rd = $get_jqElement("#dummy_resize");
            var rs = $get_jqElement("#content");
            var ri = $get_jqElement("#input_box")
            rs.css('width', '120px');
            rs.css('height', '40px');
            ri.css('width', '120px');
            ri.css('height', '40px');
            $get_jqElement("#inputBox").find("[name='done_btn']").css({
                'top': ($get_jqElement("#input_box").outerHeight() + 30) + "px",
                'left': 0 + "px"
            })
            var maxW = docWidth - clickX - 50;

            //rd.css('width','60px');
            //rd.css('height','40px');
            rd.css('max-width', maxW + 'px');
            rd.css('min-height', '40px');
        }


        var px = clickX;
        var py = clickY;
        if (selectedObj) {
            var isEdited = isObjTransformed(selectedObj.uid, 'edit');
            var data = isEdited || selectedObj.dataArr[0];
            var txt = data ? data.text : "";
            txt = unescape(decodeURI(txt));
            var dim = getTextBoxDim(txt)

            $get_jqElement("#inputBox").find("[name='content']").val(txt);
            var b = getWhiteboardObjBound('sel')
            var _w = b.brect.w; //isEdited?isEdited.textBoxWidth:selectedObj.textBoxWidth
            px = data && b ? b.tx : clickX;
            py = data && b ? b.ty : clickY;
            var rs = $get_jqElement("#dummy_resize");
            rs.css("max-width", _w + "px");
            $get_jqElement("#content").css("width", _w + "px");
            $get_jqElement("#content").css("height", b.brect.h + "px");
            $get_jqElement("#input_box").css("width", _w + "px");
            $get_jqElement("#input_box").css("height", b.brect.h + "px");

        }
        $get_Element("#inputBox").style.display = 'block';
        $get_Element("#inputBox").style.top = py + "px";
        $get_Element("#inputBox").style.left = px + "px";
        $get_Element("#input_box").style.top = 0 + "px";
        $get_Element("#input_box").style.left = 0 + "px";
        $get_jqElement("#inputBox").find("[name='done_btn']").css({
                'top': ($get_jqElement("#input_box").outerHeight() + 30) + "px",
                'left': 0 + "px"
            })
            //$get_Element("#inputBox").style.color = wb.globalStrokeColor;
        $get_Element("#content").focus();
        //$get_jqElement("#content").trigger('input');
    }

    function hideTextBox_html() {
        //alert("D1")
        if ($get_Element("#content")) {
            $get_Element("#content").value = "";
        }
        $get_Element("#inputBox").style.display = 'none';
    }

    function showTextBox_mq() {
        // $get_Element("#inputBox").css({"top":clickY, "left":clickX,
        // "position":"absolute"});
        $get_Element("#inputBox").style.display = 'block';
        // $get_Element("#inputBox").style.position="absolute";
        $get_Element("#inputBox").style.top = clickY + "px";
        $get_Element("#inputBox").style.left = clickX + "px";
        // $('#editable-math').mathquill('latex', "");
        // $("#editable-math").focus();
        if (wb.mode == 'student') {
            $get_jqElement("#editable-math").css('color', '#000000')
        } else {
            $get_jqElement("#editable-math").css('color', '#ff0000')
        }
        setTimeout(__focus);
        // alert($("textarea").value)
        // alert($get_Element("#inputBox").style.top+":"+$get_Element("#inputBox").style.left)
    }

    function __focus() {
        // $("#editable-math").focus();

        // $("#editable-math").focus();

        // alert(isIE);
        if (isIE || isTouchEnabled || ieVer > 8) {
            $("#" + contDiv + " [name='inputBox'] textarea").focus();
        } else {
            $('.mathquill-editable').focus();
        }

        // alert()
    }

    function hideTextBox_mq() {
        // $get_Element("#editable-math").value = "";
        var disp = $get_Element("#inputBox").style.display
        if (disp == 'block') {
            //$("#editable-math").mathquill('redraw');
            $get_jqElement('#editable-math').mathquill('latex', "");
            $get_Element("#inputBox").style.display = 'none';
        }
    }
    function togglePencil(){
        var boo=$get_jqElement("#button_pencil").is(":visible");
        if(boo){
            $get_jqElement("#button_pencil").hide();
            $get_jqElement("#button_eraser").show();
        }else{
            $get_jqElement("#button_pencil").show();
            $get_jqElement("#button_eraser").hide();
        }
    }
    function resetPencil(){        
        $get_jqElement("#button_pencil").hide();
        $get_jqElement("#button_eraser").show();        
    }
    function resetWhiteBoard(boo) {

        if (!canvas) {
            alert('resetWhiteBoard: canvas is null!');
            return;
        }

        penDown = false;
        graphMode = '';
        // origcanvas.width = graphcanvas.width = topcanvas.width = canvas.width
        // = width;
        buffercontext.clearRect(0, 0, canvas.width, canvas.height);
        shapeHitCtx.clearRect(0, 0, canvas.width, canvas.height);
        context.clearRect(0, 0, canvas.width, canvas.height);
        var _width = canvas.width;
        buffercanvas.width = canvas.width = _width;
        shapeHitcanvas.width = _width;
        drawingLayer = '1';
        if($get_Element("#button_gr2D")){
        $get_Element("#button_gr2D").style.border = '1px solid #000000';
        $get_Element("#button_nL").style.border = '1px solid #000000';
        }
        $('.mathquill-embedded-latex').remove();
        if ($get_Element("#graph_cont")) {
            $get_jqElement("#graph_cont").remove()
        }
        if (boo) {
            loadedImgTemps = {};
            graphicDataStore = [];
            wb.clearWhiteboard(true);

        }
        
    }

    function showHideGraph(flag, x, y, boo, foo) {
        // graphcanvas.width = graphcanvas.width;
        //graphcanvas.height = graphcanvas.height;
        //graphcontext.clearRect(0, 0, canvas.width, canvas.height);
        if ($get_Element("#graph_cont")) {
            $get_jqElement("#graph_cont").remove()
        }
        graphicData.dataArr = [];
        graphicData.id = tool_id[currentTool];
        var addGraph = false
        if (!boo && ((graphMode == 'gr2D' && flag == 'gr2D') || (graphMode == 'nL' && flag == 'nL'))) {
            graphMode = "";
            drawingLayer = '1'
            $get_Element("#button_gr2D").style.border = '1px solid #000000';
            $get_Element("#button_nL").style.border = '1px solid #000000';


        } else {
            $get_Element("#button_gr2D").style.border = '1px solid #000000';
            $get_Element("#button_nL").style.border = '1px solid #000000';
            var gr, xp, yp, xs, ys
            graphMode = flag;
            var cposX = parseInt($get_Element("#canvas-container").style.left);
            var cposY = parseInt($get_Element("#canvas-container").style.top);
            cposX = cposX ? cposX : 0;
            cposY = cposY ? cposY : 0;
            if (flag == 'gr2D') {
                gr = gr2D
                xp = x ? x - (gr2D_w / 2) : gr2D_xp - cposX
                yp = y ? y - (gr2D_h / 2) : gr2D_yp - cposY
                xs = x ? x : gr2D_xp - cposX + (gr2D_w / 2)
                ys = y ? y : gr2D_yp - cposY + (gr2D_h / 2)
                $get_Element("#button_gr2D").style.border = '2px solid #ff0000';
            } else {
                gr = nL;
                xp = x ? x - (nL_w / 2) : nL_xp - cposX
                yp = y ? y - (nL_h / 2) : nL_yp - cposY
                xs = x ? x : nL_xp - cposX + (nL_w / 2)
                ys = y ? y : nL_yp - cposY + (nL_h / 2)
                $get_Element("#button_nL").style.border = '2px solid #ff0000';
            }
            drawingLayer = isIE ? '1' : '3';
            addGraph = true;
            var gc = $("<div name='graph_cont' style='position:absolute;left:" + xp + "px;top:" + yp + "px;'></div>");
            gc.append(gr);
            $get_jqElement("#canvas-container").prepend(gc);
            //console.log(gc)
            //console.log($get_jqElement("#canvas-container").html())
            if (!foo) {
                var grNode = $get_jqElement("#canvas-container");
                if (true) {
                    grNode.data('grpos', {
                        x: xp,
                        y: yp,
                        sx: scrollPosition.x,
                        sy: scrollPosition.y
                    });
                }
            }
            // graphcontext.drawImage(gr,xp,yp);
            //graphcontext.drawImage(gr, xp, yp);

        }

        graphicData.dataArr.push({
            x: xs - scrollPosition.x,
            y: ys - scrollPosition.y,
            name: "graphImage",
            addImage: addGraph
        });
        graphicData.brect = getBoundRect(xs, ys, 300, (flag == 'gr2D' ? 300 : 150))
        sendData();
        if (currentTool == 'gr2D' || currentTool == 'nL') {
            currentTool = 'pencil';
        }
    }

    function mouseOverGraph() {
        getCanvasPos();
        var mx = event.layerX ? event.layerX : event.pageX - offX;
        var my = event.layerY ? event.layerY : event.pageY - offY;
        var xp, yp, wi, hi
        if (graphMode == 'gr2D') {
            gr = gr2D
            xp = gr2D_xp
            yp = gr2D_yp
            wi = 300
            hi = 300
        } else if (graphMode == 'nL') {
            gr = nL;
            xp = nL_xp
            yp = nL_yp
            wi = 300
            hi = 100
        }
        if ((mx >= xp && mx <= xp + wi) && (my >= yp && my <= yp + hi)) {
            return true;
        }
        return false;
    }

    function updateCanvas() {
        var egraph = $get_jqElement("#egraph")
        var visib = egraph.is(":visible");
        if (visib) {
            showHideGraphModuleEditor(false, true);
        }
        var txtBox = $get_jqElement("#inputBox");
        visib = txtBox.is(":visible");
        if (visib && ($get_jqElement("#content").val()||"").length) {
            txtBox.hide()
        }
        buffercontext.clearRect(0, 0, buffercanvas.width, buffercanvas.height);
        buffercanvas.width = canvas.width;
        buffercanvas.height = canvas.height;
        var l = graphicDataStore.length;
        /*var graphsTemp = []
        buffercontext.save();
        buffercontext.translate(scrollPosition.x, scrollPosition.y);
        for (var i = 0; i < l; i++) {
            var _t = graphicDataStore[i]
            if (_t.type != 'cmd' && (_t.id == 11 || _t.id == 12 || _t.id == 'graph')) {
                graphsTemp.push(_t);
                continue
            }

            renderToBuffer(_t, buffercontext);
        }
        for (var i = 0; i < graphsTemp.length; i++) {
            var _t = graphsTemp[i]
            renderToBuffer(_t, buffercontext);
        }*/
        var graphsTemp = [];
        var objTemp = [];
        buffercontext.save();
        buffercontext.translate(scrollPosition.x, scrollPosition.y);
        for (var i = 0; i < l; i++) {
            var _t = graphicDataStore[i]
            if (_t.type != 'cmd' && (_t.id == 11 || _t.id == 12 || _t.id == 'graph')) {
                graphsTemp.push(_t);
                continue
            }
            if (_t.type != 'cmd' && _t.id == 'template') {
                renderToBuffer(_t, buffercontext);
            } else {
                objTemp.push(_t)
            }
            //renderToBuffer(_t, buffercontext);
        }
        for (i = 0; i < objTemp.length; i++) {
            var _t = objTemp[i]
            renderToBuffer(_t, buffercontext);
        }
        for (i = 0; i < graphsTemp.length; i++) {
            var _t = graphsTemp[i]
            renderToBuffer(_t, buffercontext);
        }
        buffercontext.restore();
        context.clearRect(0, 0, canvas.width, canvas.height);
        reRenderCanvas();
        var gr = $get_jqElement("#canvas-container")
        if (gr.data('grpos')) {
            var grxp = gr.data('grpos').x + (-gr.data('grpos').sx + scrollPosition.x)
            var gryp = gr.data('grpos').y + (-gr.data('grpos').sy + scrollPosition.y)
            $get_jqElement("#graph_cont").css('left', grxp + 'px');
            $get_jqElement("#graph_cont").css('top', gryp + 'px');
        }
        context.beginPath();

    }

    function updateBuffer() {
        buffercontext.clearRect(0, 0, buffercanvas.width, buffercanvas.height);
        buffercanvas.width = canvas.width;
        buffercanvas.height = canvas.height;
        var l = graphicDataStore.length;
        buffercontext.save();
        buffercontext.translate(scrollPosition.x, scrollPosition.y);
        for (var i = 0; i < l; i++) {
            renderToBuffer(graphicDataStore[i], buffercontext);
        }
        buffercontext.restore();

    }

    function reRenderCanvas() {

        if (isIE) {
            //drawImage workaround for IE to fix high memory usage
            var cn = $($(canvas).children()[0]);
            var cv = $($(buffercanvas).children()[0]);
            var el = '<div style="position:absolute;">' + $($(buffercanvas).html()).html() + '</div><div style="position: absolute; filter: alpha(opacity=0); BACKGROUND-COLOR: red; overflow: hidden;"></div>'
            cn.append(el);
        } else {
            context.drawImage(buffercanvas, 0, 0);
        }
    }

    function erase(x, y, ctx, skip, check, arr) {
        var ew = 30
        var ep = ew;
        if (!check) {
            var cntx = ctx ? ctx : context
            if (isIE) {
                var x0 = x;
                var y0 = y;
                var graphics = cntx;
                var eR = ep / 2;
                cntx.save();
                cntx.beginPath();
                cntx.fillStyle = 'white';
                cntx.lineWidth = 0;
                // context.fillRect(x - ep / 2, y - ep / 2, ew, ew);
                graphics.moveTo(x0 - eR, y0 - eR);
                graphics.lineTo(x0 + eR, y0 - eR);
                graphics.lineTo(x0 + eR, y0 + eR);
                graphics.lineTo(x0 - eR, y0 + eR);
                graphics.lineTo(x0 - eR, y0 - eR);

                cntx.closePath();
                cntx.fill();
                cntx.restore();

                //return;
            } else {
                cntx.clearRect(x - ep / 2, y - ep / 2, ew, ew);
            }
        }
        var left = x - (ep / 2);
        var right = x + ew - (ep / 2);
        var top = y - (ep / 2);
        var bottom = y + ew - (ep / 2)
        var r = {
            xmin: left,
            ymin: top,
            xmax: right,
            ymax: bottom
        }
        if (!skip) {
            return checkForObjectErase(r, arr)
        }
        return null
    }


    function drawLine(ctx) {
        var cntx = ctx ? ctx : context
        cntx.lineTo(x, y)
        cntx.stroke();
    }

    function drawRect(x, y, w, h, color, ctx) {
        var cntx = ctx ? ctx : context;
        if (color != undefined) {
            cntx.strokeStyle = color;
        }
        cntx.strokeRect(x, y, w, h);
    }

    function drawOval(x, y, w, h, color, ctx) {
        var cntx = ctx ? ctx : context;
        if (color != undefined) {
            cntx.strokeStyle = color;
        }
        var kappa = 0.5522848;
        var ox = (w / 2) * kappa;
        var oy = (h / 2) * kappa;
        var xe = x + w;
        var ye = y + h;
        var xm = x + w / 2;
        var ym = y + h / 2;
        cntx.beginPath();
        cntx.moveTo(x, ym);
        cntx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        cntx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        cntx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        cntx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        cntx.closePath();
        cntx.stroke();
    }

    function sendData() {

        if (graphicData.id || graphicData.id === 0) {
            var txtVal = graphicData.dataArr[graphicData.dataArr.length - 1].text;
            if (graphicData.id == 2 && (txtVal == "" || txtVal == undefined)) {
                resetArrays();
                textRendering = false;
                return;
            }


            if (graphicData.id == 1 && graphicData.dataArr.length > 500) {

                var jStr = convertObjToString(graphicData);
                // currentObj.tempData = convertStringToObj(jStr);
                // ExternalInterface.call("console.log","A")



                var ptC = graphicData.dataArr.length
                var segArr = []
                var buf
                var header = graphicData.dataArr.shift()
                var tarr = graphicData.dataArr
                var segData
                var nxtStart
                var nx0
                var ny0
                var pt = {
                    x: header.x,
                    y: header.y
                }

                // alert('test 6');
                var nname = header.name
                    // ExternalInterface.call("console.log","B")
                var segC = 0;
                var nheader;

                while (ptC > 0) {
                    segC++;
                    buf = Math.min(500, ptC);
                    ptC = ptC - buf;
                    segData = tarr.splice(0, buf);
                    var ngdata = {}
                    ngdata.lineColor = graphicData.lineColor;
                    ngdata.id = graphicData.id;
                    ngdata.brect = graphicData.brect;


                    if (segC > 1) {
                        var sObj = {};
                        sObj.id = 'continue';
                        sObj.x = pt.x;
                        sObj.y = pt.y;
                        segData.unshift(sObj);
                    }
                    nheader = cloneObject(header);
                    nheader.name = nname;
                    segData.unshift(nheader);
                    ngdata.dataArr = segData;
                    segArr.push(ngdata);
                    nxtStart = segData[segData.length - 1];
                    pt = {
                        x: nxtStart.x,
                        y: nxtStart.y
                    }
                    var n = header.name.split("_");
                    nname = n[0] + "_" + (Number(n[1]) + 1);
                }
                for (var z = 0; z < segArr.length; z++) {
                    sendDataToSERVER(segArr[z]);
                }

                console_log("Sending json string_segemented line -segments  : " + segArr.length);
                render = false;
                resetArrays();
                textRendering = false;
                return;
            }

            render = false;
            // var jsonStr = convertObjToString(graphicData);
            console_log("Sending Data string for: " + graphicData.id);
            var isAGraph = graphicData.id == 11 || graphicData.id == 12
            if (!isAGraph && graphicData.dataArr[0].name == 'graphImage') {} else {
                sendDataToSERVER(graphicData);
            }
            textRendering = false;
        }
        resetArrays();
    }

    function sendDataToSERVER(jsdata) {
        var nobj = cloneObject(jsdata)
        nobj.imageData = undefined;
        var jsonStr = convertObjToString(nobj);
        if (!nobj.cmd) {
            var rect = nobj.brect;
            canvas_drawing_width = rect.xmax > canvas_drawing_width ? rect.xmax : canvas_drawing_width;
            canvas_drawing_height = rect.ymax > canvas_drawing_height ? rect.ymax : canvas_drawing_height;
            console_log("Sending json string: " + jsonStr);
        }
        /*if(!nobj.cmd&&nobj.id == 'template'){
       // graphicDataStore.unshift(cloneObject(jsdata));
       graphicDataStore.push(cloneObject(jsdata));
        }else{*/
        graphicDataStore.push(cloneObject(jsdata));
        //}
        wb.whiteboardOut(jsonStr, true);

        try {
            if (supports_localStorage()) {
                localStorage['jstr'] = jsonStr
            } else {
                console_log("DATA NOT SAVED - LOCAL STORAGE NOT AVAILABLE!")
            }
        } catch (e) {
            console_log("DATA NOT SAVED - LOCAL STORAGE NOT AVAILABLE!")
        }
    }

    function supports_localStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] != null;
        } catch (e) {
            return false;
        }
    }

    function cloneObject(obj) {
        var clone = {}
        for (var m in obj) {
            clone[m] = obj[m]
        }
        return clone
    }

    function cloneObjectDeep(obj) {
        var clone = {}
        jQuery.extend(true, clone, obj);
        return clone
    }

    function resetArrays() {
        graphicData.dataArr = null;
        graphicData = {};
        // alert("RESET_ARRAYS_CALLED");
    }

    function getToolFromID(id) {
            for (var m in tool_id) {
                if (id == tool_id[m]) {
                    return m
                }
            }
        }
        // function that converts flash object to JSON string

    function convertObjToString(obj) {
            try {
                var s = stringify(obj);
                return s;
            } catch (ex) {
                console_log(ex.name + ":" + ex.message + ":" + ex.location + ":" + ex.text);
            }
        }
        // function that converts JSON string to flash object

    function convertStringToObj(str) {
            try {
                var o = eval("(" + str + ")"); // eval(str);
                return o;
            } catch (ex) {
                console_log(ex.name + ":" + ex.message + ":" + ex.location + ":" + ex.text);
            }
        }
        //
        /**
json stringify method for browsers which doesnt  have support for JSON
source: https://gist.github.com/754454
*/

    function stringify(obj) {
        if ("JSON" in window) {
            return JSON.stringify(obj);
        }

        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"' + obj + '"';

            return String(obj);
        } else {
            // recurse array or object
            var n, v, json = [],
                arr = (obj && obj.constructor == Array);

            for (n in obj) {
                v = obj[n];
                t = typeof (v);
                if (obj.hasOwnProperty(n)) {
                    if (t == "string") {
                        v = '"' + v + '"';
                    } else if (t == "object" && v !== null) {
                        v = stringify(v);
                    }

                    json.push((arr ? "" : '"' + n + '":') + String(v));
                }
            }

            return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
        }
    }

    function getBoundRect(x0, y0, w0, h0) {
        var rect = {};
        rect.x = x0;
        rect.y = y0
        rect.w = w0
        rect.h = h0
        rect.xmin = rect.w >= 0 ? rect.x : rect.x + rect.w;
        rect.xmax = rect.w >= 0 ? rect.x + rect.w : rect.x;
        rect.ymin = rect.h >= 0 ? rect.y : rect.y + rect.h;
        rect.ymax = rect.h >= 0 ? rect.y + rect.h : rect.y;
        rect.w = Math.abs(w0)
        rect.h = Math.abs(h0)
        return rect
    }

    function isObjDeleted(uid) {
        if (!objectActions[uid]) {
            return false
        }
        if (!objectActions[uid]['delete']) {
            return false
        }
        return objectActions[uid]['delete'].length
    }

    function isObjTransformed(uid, mode, skipLast) {
            if (!objectActions[uid] || !objectActions[uid][mode]) {
                return false
            }
            var l = objectActions[uid][mode].length
            if (!l) {
                return false
            }
            var _l = skipLast ? l - 2 : l - 1;
            return objectActions[uid][mode][_l]
        }
        // ### RENDER OBJECT TO WHITEBOARD

    function renderObj(obj, boo) {
        try {
            renderObjAux(obj, boo);
        } catch (e) {
            console_log('error rendering: ' + e);
        }
    }

    function renderObjAux(obj, boo) {
        graphicData = obj
        if (obj.type && obj.type == 'cmd') {
            if (obj.cmd.name == 'erase') {
                var eo = eraseObjStore[obj.uid] = obj.erasedObjs;
                //checkForErase[obj.uid] = false;
                for (var c = 0; c < eo.length; c++) {
                    objsErased[eo[c]] = true;
                }
            } else {
                if (!objectActions[obj.uid][obj.cmd.name]) {
                    objectActions[obj.uid][obj.cmd.name] = []
                }
                objectActions[obj.uid][obj.cmd.name].push(obj.cmd.data);

                /*if(obj.cmd.name='move'){
        
        //var li=objectActions[uid].length-1
        //objectActions[uid][li].isTransformed=true;
        objectActions[uid][obj.cmd.name].push(obj.cmd.data);
        //objectActions[uid][li].graphicData=transformObj(cloneObjectDeep(getGraphicObj(uid)),obj.cmd.data.tx,ty);
        //transformGraphic(uid);
        }else if(obj.cmd.name='delete'){
        objectActions[uid].isDeleted=true;
        }*/
                var _obj = cloneObject(obj)
                graphicDataStore.push(_obj);
                if (obj.id == 'graph') {
                    //wb.addGraphModule(obj.config.gtype, undefined, undefined, false, obj);
                    updateGraphModule(_obj.uid, _obj.config, !true, null, true)
                }
                ////updateCanvas();
                if (obj.groupid !== undefined) {
                    gidSeed = obj.groupid
                    gidSeed++
                }
            }
            return
        }
        var graphic_id = obj.id;
        var graphic_data = obj.dataArr;
        var line_rgb = obj.lineColor;
        var dLength = graphic_data.length;
        var dep, x0, y0, x1, y1;
        var textF;
        var idName;
        var doUpdateCanvas = false;
        drawingLayer = graphic_data[0].layer ? graphic_data[0].layer : drawingLayer;
        drawingLayer = isIE ? '1' : drawingLayer;
        var rect, lineBound;
        var uid; //=obj.uid!==undefined?obj.uid:getNextObjectID();
        if (obj.uid === undefined) {
            uid = getNextObjectID();
        } else {
            uidSeed = uid = obj.uid;
            uidSeed++
        }
        obj.uid = uid
        objectActions[uid] = {}
        if (!boo) {
            rect = {
                xmin: 1,
                ymin: 1,
                w: 0,
                h: 0
            };
        }

        if (context.lineWidth != 2) {
            context.lineWidth = 2.0;
        }
        if (graphic_data[0].color !== undefined) {
            var cstr = String(graphic_data[0].color).indexOf("#") > -1 ? graphic_data[0].color.substr(1) : graphic_data[0].color.toString(16)
            var col = "#" + (cstr == '0' ? '000000' : cstr);
            context.strokeStyle = col;
        }
        var deb = ""
        console_log("RENDER_DATA_FOR: " + graphic_id)
        if (graphic_id === 0) {
            var _skip = obj.hasErasedObj
            var eo = []
            for (var i = 0; i < dLength; i++) {

                x1 = graphic_data[i].x + scrollPosition.x;
                y1 = graphic_data[i].y + scrollPosition.y;
                deb += x1 + ":" + y1 + "||"
                var _eo = erase(x1, y1, null, _skip);
                eo = eo.concat(_eo);
                if (isIE) {
                    // updateCanvas();
                    doUpdateCanvas = true;
                }

            }
            if (obj.hasErasedObj) {
                eo = eraseObjStore[obj.uid] = obj.erasedObjs;
                //checkForErase[obj.uid] = false;
                for (var c = 0; c < eo.length; c++) {
                    objsErased[eo[c]] = true;
                }
            } else {
                eraseObjStore[obj.uid] = eo;
                checkForErase[obj.uid] = {
                    data: cloneObject(obj),
                    id: obj.uid,
                    arr: eo
                };

            }
        }
        // alert(deb)
        if (graphic_id === 3 || graphic_id === 1) {
            if (graphic_data[0].name == 'graphImage') {
                return
            }
            lineBound = {}
            for (i = 0; i < dLength; i++) {
                x1 = graphic_data[i].x;
                y1 = graphic_data[i].y;
                if (graphic_data[i].id == "move") {
                    context.beginPath();
                    context.moveTo(x1, y1);
                    x0 = x1;
                    y0 = y1;
                    if (graphic_id == 1) {
                        lineBound.ymax = y1;
                        lineBound.ymin = y1;
                        lineBound.xmax = x1;
                        lineBound.xmin = x1;
                    }
                } else if (graphic_data[i].id == "continue") {
                    ctx.moveTo(x0 + x1, y0 + y1);
                    // x0 = 0;
                    //y0 = 0;
                } else {
                    context.lineTo(x0 + x1, y0 + y1);
                    if (!boo && graphic_id == 1) {
                        var xn = x0 + x1;
                        var yn = y0 + y1;
                        if (xn > x0) {
                            if (!lineBound.xmax) {
                                lineBound.xmax = xn
                            }
                            if (xn > lineBound.xmax) {
                                lineBound.xmax = xn
                            }
                        } else if (xn < x0) {
                            if (!lineBound.xmin) {
                                lineBound.xmin = xn
                            }
                            if (xn < lineBound.xmin) {
                                lineBound.xmin = xn
                            }
                        } else {
                            if (!lineBound.xmax) {
                                lineBound.xmax = xn
                            }
                            if (xn > lineBound.xmax) {
                                lineBound.xmax = xn
                            }
                            if (!lineBound.xmin) {
                                lineBound.xmin = xn
                            }
                            if (xn < lineBound.xmin) {
                                lineBound.xmin = xn
                            }
                        }
                        if (yn > y0) {
                            if (!lineBound.ymax) {
                                lineBound.ymax = yn
                            }
                            if (yn > lineBound.ymax) {
                                lineBound.ymax = yn
                            }
                        } else if (yn < y0) {
                            if (!lineBound.ymin) {
                                lineBound.ymin = yn
                            }
                            if (yn < lineBound.ymin) {
                                lineBound.ymin = yn
                            }
                        } else {
                            if (!lineBound.ymax) {
                                lineBound.ymax = yn
                            }
                            if (y1 > lineBound.ymax) {
                                lineBound.ymax = yn
                            }
                            if (!lineBound.ymin) {
                                lineBound.ymin = yn
                            }
                            if (yn < lineBound.ymin) {
                                lineBound.ymin = yn
                            }
                        }
                        lineBound.xmin = lineBound.xmin ? lineBound.xmin : xn;
                        lineBound.xmax = lineBound.xmax ? lineBound.xmax : xn;
                        lineBound.ymin = lineBound.ymin ? lineBound.ymin : yn;
                        lineBound.ymax = lineBound.ymax ? lineBound.ymax : yn;
                    }
                }
            }
            if (!boo) {
                if (graphic_id == 1) {
                    rect.x = lineBound.xmin ? lineBound.xmin : 0
                    rect.y = lineBound.ymin ? lineBound.ymin : 0
                    rect.w = lineBound.xmax - lineBound.xmin
                    rect.h = lineBound.ymax - lineBound.ymin
                    rect.xmin = lineBound.xmin ? lineBound.xmin : 0;
                    rect.xmax = lineBound.xmax ? lineBound.xmax : 0;
                    rect.ymin = lineBound.ymin ? lineBound.ymin : 0;
                    rect.ymax = lineBound.ymax ? lineBound.ymax : 0;
                } else {
                    rect = getBoundRect(x0, y0, x1, y1)
                }
            }
            context.stroke()
            if (!boo) {
                // obj.imageData = context.getImageData(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)
            }
            //updateCanvas()
            doUpdateCanvas = true;
        }
        if (graphic_id === 2) {
            for (i = 0; i < dLength; i++) {

                if (graphic_data[i].text != "" || graphic_data[i].text != undefined) {
                    x0 = graphic_data[i].x;
                    y0 = graphic_data[i].y;
                    // context.fillText(graphic_data[i].text, x0, y0);
                    xt = graphic_data[i].text;
                    xt = unescape(decodeURI(xt));
                    xt = String(xt).split("\\:").join(" ");
                    if (xt.indexOf('\\frac') > -1) {
                        xt = xt.split('\\frac').join("");
                        xt = xt.split('}{').join("/");
                        xt = xt.split('{').join("");
                        xt = xt.split('}').join("")
                    }
                    cTMaxWidth = obj.textBoxWidth ? obj.textBoxWidth : obj.brect.w
                    renderText(xt, x0, y0, col);
                    if (!boo) {
                        var str = xt.split("\n");
                        var ht = determineFontHeight(str[0]);
                        rect.x = rect.xmin = x0
                        rect.y = rect.ymin = y0
                        rect.w = context.measureText(xt).width
                        rect.h = (ht + ht / 3) * str.length
                        rect.xmax = rect.x + rect.w;
                        rect.ymax = rect.y + rect.h;
                    }
                }
            }
            if (!boo) {

                //obj.imageData = context.getImageData(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)
                //context.strokeRect(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)
            }
            //updateCanvas()
            doUpdateCanvas = true;
        }
        if (graphic_id === 4 || graphic_id === 5) {
            var fName = graphic_id == 4 ? drawRect : drawOval;
            for (i = 0; i < dLength; i++) {
                var xd = graphic_data[i].xs < 0 ? -1 : 1
                var yd = graphic_data[i].ys < 0 ? -1 : 1
                x0 = xd < 0 ? graphic_data[i].x + graphic_data[i].w : graphic_data[i].x
                y0 = yd < 0 ? graphic_data[i].y + graphic_data[i].h : graphic_data[i].y
                w0 = graphic_data[i].w * xd
                h0 = graphic_data[i].h * yd
                fName(x0, y0, w0, h0, col);
            }
            rect = getBoundRect(x0, y0, w0, h0)
            if (!boo) {
                // obj.imageData = context.getImageData(rect.xmin - 1, rect.ymin - 1, rect.w + 2, rect.h + 2)

            }
            //updateCanvas()
            doUpdateCanvas = true;
        }
        if (graphic_id === 11 || graphic_id === 12) {
            idName = graphic_id == 11 ? "gr2D" : "nL";
            var _obj = cloneObject(obj)
                //showHideGraph(idName, graphic_data[0].x + scrollPosition.x, graphic_data[0].y + scrollPosition.y, graphic_data[0].addImage);
            if (wb.options.showTemplates) {

                var config = {
                    gtype: idName == "gr2D" ? "xy" : 'x',
                    xmin: -5,
                    ymin: -5,
                    xmax: 5,
                    ymax: 5,
                    xinc: 1,
                    yinc: 1,
                    xaxis: 150,
                    yaxis: idName == "gr2D" ? 150 : 75,
                    xscale: 25,
                    yscale: 25
                }
                var w = 300
                var h = (idName == 'gr2D' ? 300 : 150)
                _obj.id = 'graph';
                _obj.config = config;
                objectActions[_obj.uid] = {};
                wb.addGraphModule(_obj.config.gtype, graphic_data[0].x, graphic_data[0].y, true, _obj);
                _obj.dataArr[0].x = graphic_data[0].x - w / 2
                _obj.dataArr[0].y = graphic_data[0].y - h / 2
            } else {
                showHideGraph(idName, graphic_data[0].x + scrollPosition.x, graphic_data[0].y + scrollPosition.y, graphic_data[0].addImage);
            }
            rect = getBoundRect(graphic_data[0].x, graphic_data[0].y, 300, (idName == 'gr2D' ? 300 : 150));
            obj = _obj;
        }
        if (graphic_id === 'template') {
            totalTempsloaded++
            var _obj = cloneObject(obj)
            loadTemplate({
                name: graphic_data[0].name,
                path: graphic_data[0].url
            }, graphic_data[0].x, graphic_data[0].y, true, !boo ? obj : undefined);
            rect = getBoundRect(graphic_data[0].x, graphic_data[0].y, graphic_data[0].w, graphic_data[0].h);
            obj = _obj;
            doUpdateCanvas = true;
        }
        if (graphic_id === 'graph') {
            var _obj = cloneObject(obj)
            wb.addGraphModule(_obj.config.gtype, graphic_data[0].x, graphic_data[0].y, true, _obj);
            rect = getBoundRect(graphic_data[0].x, graphic_data[0].y, graphic_data[0].w, graphic_data[0].h);
            obj = _obj;
            doUpdateCanvas = true;
        }
        if (!boo) {

            obj.brect = rect
            graphicDataStore.push(cloneObject(obj));
        }
        if (doUpdateCanvas) {
            //// updateCanvas();
        }
        canvas_drawing_width = rect.xmax > canvas_drawing_width ? rect.xmax : canvas_drawing_width;
        canvas_drawing_height = rect.ymax > canvas_drawing_height ? rect.ymax : canvas_drawing_height;
    }

    function renderToBuffer(_obj, _ctx) {
        var obj = _obj ? _obj : graphicData
        var graphic_id = obj.id;
        var graphic_data = obj.dataArr;
        var line_rgb = obj.lineColor;
        var dLength = graphic_data.length;
        var dep, x0, y0, x1, y1;
        var textF;
        var idName;
        var ctx = _ctx ? _ctx : buffercontext;
        var rect, lineBound;
        var uid = obj.uid
        var isCmd = obj.type === 'cmd'
        var isDeleted = isObjDeleted(uid);
        var isMoved = isObjTransformed(uid, 'move');
        var isScaled = isObjTransformed(uid, 'scale');
        var isRotated = isObjTransformed(uid, 'rotate');
        var isTransformed = isMoved || isScaled || isRotated; //isObjTransformed(uid);
        if (isDeleted || isCmd) {
            return
        }
        var cx = 0
        var cy = 0
        if (isTransformed) {
            ctx.save();
            var transRect = cloneObject(obj.brect)
            if (isMoved) {
                ctx.translate(isMoved.tx, isMoved.ty)
            }
            if (isRotated) {
                var dw = isRotated.tx
                var dh = isRotated.ty
                var r = isRotated.tr
                var o = obj.brect;
                var spx = Math.abs(scrollPosition.x)
                var spy = Math.abs(scrollPosition.y)

                var cx = o.xmin + (o.w / 2)
                var cy = o.ymin + (o.h / 2)
                    //ctx.save()
                    //ctx.translate(,-scrollPosition.y)
                    //ctx.save()
                ctx.translate(cx, cy)
                ctx.rotate(r);
                ctx.translate(-cx, -cy)
                    //ctx.restore()
                    //ctx.translate(scrollPosition.x,scrollPosition.y)


                //ctx.translate(isTransformed.tx, isTransformed.ty)
                cx = 0
                cy = 0
            }
            if (isScaled) {
                var dw = isScaled.tx
                var dh = isScaled.ty
                var r = isScaled.trect
                var o = obj.brect
                var w0 = o.w
                var h0 = o.h
                if (isRotated && transMode != 'rotate') {
                    /*var nr0=getScaleRatio(dw,dh,isRotated.tr)
            dw=nr0.w
            dh=nr0.h*/
                }
                var w = w0 + (dw * 2)
                var h = h0 + (dh * 2)

                var rw = w / o.w
                var rh = h / o.h

                var cx = o.xmin + (o.w / 2)
                var cy = o.ymin + (o.h / 2)
                ctx.translate(cx, cy)
                ctx.scale(rw, rh);
                ctx.translate(-cx, -cy)
                    //ctx.translate(isTransformed.tx, isTransformed.ty)
                cx = 0
                cy = 0
            }


        }
        if (ctx.lineWidth != 2) {
            ctx.lineWidth = 2.0;
        }
        if (graphic_data[0].color !== undefined) {
            var cstr = String(graphic_data[0].color).indexOf("#") > -1 ? graphic_data[0].color.substr(1) : graphic_data[0].color.toString(16)
            var col = "#" + (cstr == '0' ? '000000' : cstr);
            ctx.strokeStyle = col;
        }
        var deb = ""
            //console_log("RENDER_DATA_FOR: " + graphic_id)
        if (graphic_id === 0) {
            for (var i = 0; i < dLength; i++) {

                x1 = graphic_data[i].x - cx;
                y1 = graphic_data[i].y - cy;
                deb += x1 + ":" + y1 + "||"
                erase(x1, y1, ctx, true);


            }
        }
        // alert(deb)
        if (graphic_id === 3 || graphic_id === 1) {
            if (graphic_data[0].name == 'graphImage') {
                return
            }

            for (i = 0; i < dLength; i++) {
                x1 = graphic_data[i].x - cx;
                y1 = graphic_data[i].y - cy;
                if (graphic_data[i].id == "move") {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    x0 = x1;
                    y0 = y1;
                } else if (graphic_data[i].id == "continue") {
                    ctx.moveTo(x0 + x1, y0 + y1);
                    //x0 = 0;
                    //y0 = 0;
                } else {
                    ctx.lineTo(x0 + x1, y0 + y1);

                }
            }

            ctx.stroke()

        }
        if (graphic_id === 2) {
            if (transMode == 'edit' && selectedObj && (uid == selectedObj.uid)) {} else {
                var isEdited = isObjTransformed(uid, 'edit');
                if (isEdited) {
                    /* x0 = _obj.dataArr[0].x - (obj.brect.xmin - isEdited.x) - cx;
                    y0 = _obj.dataArr[0].y - (obj.brect.ymin - isEdited.y) - cy;
                    if (isMoved) {
                        x0 = _obj.dataArr[0].x - (obj.brect.xmin - (isEdited.x - isMoved.tx)) - cx;
                        y0 = _obj.dataArr[0].y - (obj.brect.ymin - (isEdited.y - isMoved.ty)) - cy;
                    }*/
                    // context.fillText(graphic_data[i].text, x0, y0);
                    x0 = obj.brect.xmin + cx + isEdited.x;
                    y0 = obj.brect.ymin + cy + isEdited.y;
                    if (isMoved) {
                        //x0 =- ( - (isEdited.x - isMoved.tx)) - cx;
                        //y0 =- (- (isEdited.y - isMoved.ty)) - cy;
                    }
                    xt = isEdited.text;
                    xt = unescape(decodeURI(xt));
                    xt = String(xt).split("\\:").join(" ");
                    if (xt.indexOf('\\frac') > -1) {
                        xt = xt.split('\\frac').join("");
                        xt = xt.split('}{').join("/");
                        xt = xt.split('{').join("");
                        xt = xt.split('}').join("")
                    }
                    cTMaxWidth = isEdited.textBoxWidth ? isEdited.textBoxWidth : _obj.brect.w
                    renderText(xt, x0, y0, isEdited.color, ctx, true);
                    //_obj.brect=cloneObject(isEdited.brect);
                } else {
                    for (i = 0; i < dLength; i++) {

                        if (graphic_data[i].text != "" || graphic_data[i].text != undefined) {
                            x0 = graphic_data[i].x - cx;
                            y0 = graphic_data[i].y - cy;
                            // context.fillText(graphic_data[i].text, x0, y0);
                            xt = graphic_data[i].text;
                            xt = unescape(decodeURI(xt));
                            xt = String(xt).split("\\:").join(" ");
                            if (xt.indexOf('\\frac') > -1) {
                                xt = xt.split('\\frac').join("");
                                xt = xt.split('}{').join("/");
                                xt = xt.split('{').join("");
                                xt = xt.split('}').join("")
                            }
                            cTMaxWidth = _obj.textBoxWidth ? _obj.textBoxWidth : _obj.brect.w
                            renderText(xt, x0, y0, col, ctx, true);

                        }
                    }
                }
            }

        }
        if (graphic_id === 4 || graphic_id === 5) {
            var fName = graphic_id == 4 ? drawRect : drawOval;
            for (i = 0; i < dLength; i++) {
                var xd = graphic_data[i].xs < 0 ? -1 : 1
                var yd = graphic_data[i].ys < 0 ? -1 : 1
                x0 = xd < 0 ? graphic_data[i].x + graphic_data[i].w : graphic_data[i].x
                y0 = yd < 0 ? graphic_data[i].y + graphic_data[i].h : graphic_data[i].y
                w0 = graphic_data[i].w * xd
                h0 = graphic_data[i].h * yd
                fName(x0 - cx, y0 - cy, w0, h0, col, ctx);
            }

        }
        if (graphic_id === 11 || graphic_id === 12) {
            idName = graphic_id == 11 ? "gr2D" : "nL";
            showHideGraph(idName, graphic_data[0].x, graphic_data[0].y, graphic_data[0].addImage, true);
        }
        if (graphic_id === 'template') {
            var img = loadedImgTemps[graphic_data[0].name]
            ctx.drawImage(img, graphic_data[0].x, graphic_data[0].y);

        }
        if (graphic_id === 'graph') {
            if (selectedObj && graphEditMode && (uid == selectedObj.uid)) {} else {
                var gimg = wb.graphModules[uid];
                var pimg = wb.plotModules[uid];
                ctx.drawImage(gimg, graphic_data[0].x, graphic_data[0].y);
                ctx.drawImage(pimg, graphic_data[0].x, graphic_data[0].y);
            }

        }
        if (isTransformed) {
            //ctx.translate(-cx,-cy)
            ctx.restore();

        }
    }
    wb.updateWhiteboard_local = function (cmdArray) {
        var oaL = cmdArray.length;

        for (var l = 0; l < oaL; l++) {
            if (cmdArray[l] instanceof Array) {

                var arg = cmdArray[l][1];
                arg = arg == undefined ? [] : arg;

                // alert('cmdArray[l][0]: ' + cmdArray[l][0]);
                // alert('data: ' + this[cmdArray[l][0]])
                var command = cmdArray[l][0];
                // make unique to whiteboard, otherwise
                // other code can override.
                if (command == 'clear') {
                    resetInternalStore()
                    resetWhiteBoard(false);
                } else {
                    this[command].apply(scope, arg);
                }
            } else if (cmdArray[l].indexOf("dataArr") != -1) {

                wb.draw(cmdArray[l]);
            } else {
                scope[cmdArray[l]]();
            }
        }
        // updateScroller();
        resetArrays()
    }

    function resetInternalStore() {
            graphicDataStore = [];
            loadedImgTemps = {};
            objectActions = {};
            uidSeed = 0;
            gidSeed = 0;
        }
        /**
         * Map GWT array type to JS Array.
         *
         * TODO: not sure why this is needed, otherwise instanceof Array seems to
         * fail.
         *
         * cmdArray is already an array in JSNI.
         *
         * @param cmdArray
         */

    function gwt_updatewhiteboard(cmdArray) {
        var realArray = [];
        for (var i = 0, t = cmdArray.length; i < t; i++) {
            var ele = [];
            ele[0] = cmdArray[i][0];
            ele[1] = cmdArray[i][1];
            realArray[i] = ele;
        }
        wb.updateWhiteboard_local(realArray);
    }

    wb.updateWhiteboard = function (cmdArray) {
            gwt_updatewhiteboard(cmdArray);
            //updateCanvas()
        }
        /** will be overriden in GWT/parent */
    wb.updateWhiteboardData = function (index, newJSON) {
        //
        console.log('updateWhiteboardData');
        console.log(index)
        console.log(newJSON)
    }
    wb.whiteboardLoadComplete = function () {
        //var c = []
        for (var m in checkForErase) {
            var _obj = checkForErase[m];
            if (_obj && _obj.arr && _obj.arr.length) {
                //c.push(m)

                var _data = _obj.data;
                var eo = _obj.arr
                _data.hasErasedObj = true;
                _data.erasedObjs = eo;
                var _uid = _obj.id;
                var _idx = findUIDIndex(_uid);
                //var nobj = cloneObject(_data);
                graphicDataStore[_idx] = _data;
                var _json = convertObjToString(_data);
                wb.updateWhiteboardData(_idx, _json);
            }
        }
        /* if (c.length) {
            var l = c.length
            for (var j = 0; j < l; j++) {
                var idx = findUIDIndex(c[j])
                var arr = graphicDataStore.slice(0, idx)
                var eobj = graphicDataStore[idx]
                var graphic_data = eobj.dataArr;
                var dLength = graphic_data.length;
                var x1, y1
                var eo = []
                for (var i = 0; i < dLength; i++) {

                    x1 = graphic_data[i].x + scrollPosition.x;
                    y1 = graphic_data[i].y + scrollPosition.y;
                    var _eo = erase(x1, y1, null, false, true,arr);
                    if (_eo && _eo.length) {
                        eo = eo.concat(_eo);
                    }

                }
                if (eo.length) {

                    eraseObjStore[eobj.uid] = eo;
                    var mobj = {
                    id: 0,
                    uid: eobj.uid,

                    type: 'cmd',
                    erasedObjs:eo,
                    cmd: {
                        name: 'erase'
                        
                    },                    
                    dataArr: []
                }

                updateDataToSERVER(null, mobj);
                }
            }
        }*/
        updateCanvas();
    }
    wb.renderFromStorage = function () {
            if (supports_localStorage()) {
                var str = localStorage['jstr'];
                wb.updateWhiteboard([
                    ["draw", [str]]
                ])
            } else {
                console_log("DATA NOT SAVED - LOCAL STORAGE NOT AVAILABLE!")
            }
        }
        //
        /**
         * * SETS THE WHITEBOARD MODE AS TEACHER MODE ++ ON TEACHER MODE THE DRAWING
         * COLOR WILL BE SET AS RED
         */
    wb.setAsTeacherMode = function (boo) {
        var b = boo === undefined ? true : boo
        if (b) {
            wb.globalStrokeColor = '#ff0000';
            wb.mode = 'admin'
        } else {
            wb.globalStrokeColor = '#000000';
            wb.mode = 'student';
        }
    }
    wb.getWhiteboardMode = function () {
            return wb.mode;
        }
        //
        // function receives jsonData and renders it to the screen
    wb.draw = function (json_str) {
        var grobj = convertStringToObj(json_str);
        renderObj(grobj);
    }

    function colorToNumber(c) {
        var n = c.split('#').join('0x');
        return Number(n);
    }

    wb.clearWhiteboard = function (boo) {
        if (!boo) {
            resetWhiteBoard(false)
        }

        wb.whiteboardOut("clear", false);
    }


    wb.resetWhiteBoard = function() {
    	resetWhiteBoard(false)
    }
    
    /** will be overriden in GWT/parent */
    wb.saveWhiteboard = function () {
        console_log('default whiteboard save');
    }

    /**
     * API method used to externalize handling of JSON data
     *
     * @param data
     * @param boo
     */

    wb.whiteboardOut = function (data, boo) {
        //alert('WHITEBOARD: whiteboardOut is going nowhere.  Hook up to external process to save data');
        if (data == 'undo') {
            if (graphicDataStore.length) {
                var obj = graphicDataStore.pop()
                if (obj.type && obj.type == 'cmd') {
                    if (obj.cmd.name != 'delete') {
                        objectActions[obj.uid][obj.cmd.name].pop()
                    }
                    if (obj.cmd.name == 'delete') {
                        objectActions[obj.uid]['delete'].pop()
                    }
                }
            }
            updateCanvas()
        }
        console.log(data)
    }
    wb.whiteboardOut_local = function (data, boo) {
        if (data == 'undo') {
            if (graphicDataStore.length) {
                var obj = graphicDataStore.pop()
                if (obj.type && obj.type == 'cmd') {
                    if (obj.cmd.name != 'delete') {
                        objectActions[obj.uid][obj.cmd.name].pop()
                    }
                    if (obj.cmd.name == 'delete') {
                        objectActions[obj.uid]['delete'].pop()
                    }
                }
                updateCanvas()
            }

        }
        console.log(data)
    }

    wb.disconnectWhiteboard = function (documentObject) {
        alert('default whiteboard disconnect');
        /** empty */
    }

    wb.whiteboardIsReady = function () {
            alert('This is the default whiteboardIsReady, it should be overridden in GWT');
    }
        /**
         * Exposed methods to: disable,enable calculator and show or hide them
         */
    wb.disableCalculator = function () {
        enable_calc = false;
        _disableCalc()
    }
    wb.enableCalculator = function () {
        enable_calc = true;
        _enableCalc()
    }
    wb.hideCalculator = function () {
        hideCalc();
    }
    wb.showCalculator = function () {
            showCalc();
        }
        //
    wb.setSelectionMode = function () {
        selectionMode = !selectionMode
        if (!selectionMode) {
            removeBoundRect()
        }
    }
    wb.removeSelectionMode = function (boo) {

        selectedObjects = [];
        selectedObj = null
        mSelRect = null;
        multiSelection = false
        removeBoundRect()
        if (!boo) {
            selectionMode = !true;
            $get_Element("#button_move").style.border = '1px solid #000000';
            currentTool = 'pencil';
            buttonHighlite(currentTool)
        }
    }
    wb.whiteboardDelete = function (n) {

    }
    wb.clearMemory = function () {
            graphicData = null;
            graphicDataStore = null;
            selectedObj = null;

            var _width = 0;
            buffercanvas.width = canvas.width = _width;
            buffercanvas.height = canvas.height = _width;
            if (isIE) {
                $(canvas).css({
                    'width': '0px',
                    'height': '0px'
                })
                $(canvas).empty();
                $(buffercanvas).css({
                    'width': '0px',
                    'height': '0px'
                })
                $(buffercanvas).empty();

            } else {
                /*$(canvas).remove();
            $(buffercanvas).remove();
            
                canvas = null;
                buffercanvas = null;
                
                context = null;
                buffercontext = null;
                */
            }
            gr2D = null;
            nL = null;
            //scope=null;
            //wb=null;

        }
        //

    function updateDataToSERVER(index, jsdata) {
            //wb.whiteboardDelete(index);
            graphicData = jsdata;
            //sendData();

            sendDataToSERVER(jsdata)
            resetArrays()
        }
        //
    wb.isReadOnly = function (boo) {
        isReadOnly = boo
        if (boo) {
            //$("div#" + contDiv + " [name='tools'] button").hide()
            $("div#" + contDiv + " .wb_menu button").hide()
            $("div#" + contDiv + " [name='toggleMenu']").hide()
        } else {
            //$("div#" + contDiv + " [name='tools'] button").show()
            $("div#" + contDiv + " .wb_menu button").show()
            $("div#" + contDiv + " [name='toggleMenu']").show()
        }
        adjustToolbar()
    }

    wb.releaseResources = function () {
        wb.clearMemory();
        graphicDataStore = [];
        loadedImgTemps = {};

    }
    wb.getSizeOfWhiteboard = function () {
        return canvas_drawing_width + ", " + canvas_drawing_height;
    }
    wb.getContentSizeOfWhiteboard = function () {
        var bound = getWhiteboardObjBound()
        canvas_drawing_width = bound.brect.xmax;
        canvas_drawing_height = bound.brect.ymax;
        var pad = 5;
        return [canvas_drawing_width + pad, canvas_drawing_height + pad];
    }
    wb.setSizeOfWhiteboard = function (w, h) {
        cwi = w;
        cht = h;
        scroll_window = {
            width: cwi,
            height: cht
        }
    }

    wb.enableUndo = function () {
        $get_jqElement('#button_undo').prop("disabled", !true);
        $get_jqElement('#button_undo').css({
            opacity: 1.0
        });
    }
    wb.disableUndo = function () {
        $get_jqElement('#button_undo').prop("disabled", true);
        $get_jqElement('#button_undo').css({
            opacity: 0.3
        });
    }
    wb.getUIDSeed = function () {
        var dat = new Date();
        return dat.getTime();
    }
    wb.deleteSelectedObj = function () {
        if (!selectedObj && !multiSelection) {
            alert("Select an object and click delete button!");
            return
        }
        var selObjs = multiSelection ? selectedObjects : [selectedObj];
        var num = selObjs.length;
        if (!num) {
            return
        }
        var gid = multiSelection ? getNextGroupID() : null;
        for (var i = 0; i < num; i++) {
            var _selectedObj = selObjs[i];
            objectActions[_selectedObj.uid]['delete'] = [true];
            var mobj = {
                id: _selectedObj.id,
                uid: _selectedObj.uid,
                type: 'cmd',
                cmd: {
                    name: 'delete',
                    data: null
                },
                dataArr: []
            }
            if (multiSelection) {
                mobj.groupid = gid;
            }
            updateDataToSERVER(selectedObjIndex, mobj);
        }

        wb.removeSelectionMode(true);
        updateCanvas();
    }
    wb.scrollRight = function (p) {
        doRightScroll(p)
    }
    wb.scrollTop = function (p) {
        doUpScroll(p)
    }
    wb.scrollScreen = function (x, y) {
        doRightScroll(x)
        doUpScroll(y)
        updateCanvas();
    }
    wb.resizeWhiteboardTo = function (match, width, height) {
        resizeWhiteboardTo(match, width, height)
    }
    wb.saveSelToImage = function () {
        if (IS_IE8) {
            alert('Not supported')
            return null
        }
        var mselobj = multiSelection ? {
                tx: mSelRect.xmin,
                ty: mSelRect.ymin,
                brect: {
                    xmin: mSelRect.xmin,
                    ymin: mSelRect.ymin,
                    xmax: mSelRect.xmax,
                    ymax: mSelRect.ymax,
                    w: mSelRect.xmax - mSelRect.xmin,
                    h: mSelRect.ymax - mSelRect.ymin
                }
            } : {}
            //var obj = multiSelection?mselobj:selectedObj;
        var obj;

        if (multiSelection && selectionMode) {
            obj = getWhiteboardObjBound('msel')
        } else if (selectedObj && selectionMode) {
            obj = getWhiteboardObjBound('sel')
        } else {
            obj = getWhiteboardObjBound()
        }
        var dcan = $('<canvas width="300" height="300"/>')[0];
        var rect = cloneObjectDeep(obj.brect);
        //

        //
        var pad = 10
        dcan.width = rect.w + pad;
        dcan.height = rect.h + pad;
        var dcontext = dcan.getContext('2d');
        //selectionMode = false;
        multiSelection = false;
        mSelRect = null;
        selectedObj = null;
        removeBoundRect()
        var imageData = context.getImageData(rect.xmin - (pad / 2), rect.ymin - (pad / 2), rect.w + pad, rect.h + pad);
        //drawBoundRect(obj)
        dcontext.putImageData(imageData, 0, 0);
        var dataURL = dcan.toDataURL();
        console.log(dataURL)
        if ($('#canvasImg')[0]) {
            $('#canvasImg')[0].src = dataURL;
        }
        return dataURL

    }
    wb.saveAsTemplate = function () {
        wb.gwt_saveWhiteboardAsTemplate();
    }
    wb.gwt_saveWhiteboardAsTemplate = function () {
        gwt_saveWhiteboardAsTemplate();
    }
    wb.getWhiteboardAsTemplate = function () {
        return wb.saveSelToImage()
    }
    wb.manageTemplates = function () {
        gwt_manageTemplates();
    }
    wb.setTransModeScale = function () {
        transMode = transMode == 'scale' ? 'move' : 'scale';
    }
    wb.setTransModeRotate = function () {
        transMode = transMode == 'rotate' ? 'move' : 'rotate';
    }
    wb.appendTemplates = function (temp) {
        wb.options['templates'].push(temp);
        var divObj = $get_jqElement("#temp_cont")
        if (divObj.length) {
            updateTempMenu(temp)
        }
    }
    wb.getRenderedCommands = function () {
        var jsonStr = convertObjToString(graphicDataStore);
        return jsonStr;
    }

    wb.setTemplate = function (name, path) {
        loadTemplate({
            'name': name,
            'path': path
        });
    }
    wb.loadFromJson = function (json) {
        try {
            var arr = eval('(' + json + ')');
            for (var i = 0; i < arr.length; i++) {
                renderObj(arr[i], false);
                resetArrays();
            }
            updateCanvas();
        } catch (e) {
            alert(e);
        }
    }
    wb.isErased = function (obj) {
        var id = obj.uid;

        return objsErased[id]

    }
    wb.getContainer=function(){
        return contDiv;
    }

    return wb;
};



/** return information about commands in json 
 *
 */
function _debugGetCommandInfoLabel(json) {
    var data = JSON.parse(json);

    var idMap = {};
    var dataArr = data.dataArr;
    for (var i = 0; i < dataArr.length; i++) {
        var cmd = dataArr[i];
        var id = cmd.id;

        var m = idMap[id];
        if (!m) {
            idMap[id] = 1;
        } else {
            idMap[id] = (m + 1);
        }
    }

    var label = '';
    for (key in idMap) {
        if (label != "") {
            label += ", ";
        }
        var keyVal = idMap[key];
        label += key + "[" + keyVal + "]";
    }
    return label;
}


/** textarea plugin inputBox which adds draggable handlers to resize the box
 */
function initDragBoxPlugin(){
(function ($) {
    var elmX, elmY, elmW, elmH, clickX, clickY, dx, dy;
    var cont;
    var wb
    var IS_IPAD = navigator.userAgent.match(/iPad/i) != null;
    var IS_IE8 = navigator.userAgent.match(/MSIE 8.0/i) != null;
    var IS_IE9 = navigator.userAgent.match(/MSIE 9.0/i) != null;
    var IS_IE = IS_IE8 || IS_IE9;
    var IS_ANDROID = navigator.userAgent.match(/Android/i) != null;
    var IS_KINDLE = navigator.userAgent.match(/Kindle/i) != null || navigator.userAgent.match(/Silk/i) != null;
    var IS_IPHONE = navigator.userAgent.match(/iPhone/i) != null;
    var IS_OPERA = navigator.userAgent.match(/Opera/i) != null;
    var isTouchEnabled = IS_IPAD || IS_ANDROID || IS_KINDLE || IS_IPHONE
    var IS_IOS = IS_IPAD || IS_IPHONE
    var getCanvasOffSet = function (scope) {
        var box = $(scope).get(0).getBoundingClientRect();
        var body = document.body;
        var docElem = document.documentElement;
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        var offX = Math.round(left);
        var offY = Math.round(top);
        scope.data('offX', offX);
        scope.data('offY', offY);
        return {
            top: offY,
            left: offX
        }
    }
    var getCursorPos = function (e, scope) {
        getCanvasOffSet(scope);
        var offX = scope.data('offX');
        var offY = scope.data('offY');
        // console.log(offX + "<>" + offY)
        var ev = e ? e.originalEvent : window.event;
        var isTouchEnabled = ev.type.indexOf('touch') > -1;
        ev = isTouchEnabled ? ev.changedTouches[0] : ev;
        var cursor = {
            x: 0,
            y: 0
        };
        if (ev.pageX !== undefined) {
            cursor.x = ev.pageX - offX;
            cursor.y = ev.pageY - offY;

        } else {
            cursor.x = ev.clientX - offX;
            cursor.y = ev.clientY - offY;

        }
        return cursor;
    }
    $.fn.resizeBox = function (board) {
        wb = board
        cont = $(this);
        var elm = cont[0];
        cont.css('height', cont.find("[name='content']").outerHeight() + "px");
        cont.css('width', cont.find("[name='content']").outerWidth() + "px");
        cont.parent().parent().find("[name='done_btn']").css({
                'position': 'absolute',
                'top': "70px"
            })
            /* var handles = ['tl', 'tm', 'tr',
            'ml', 'mr', 'bl', 'bm', 'br'
        ]*/
        var handles = ['tl', 'tm', 'tr',
            'ml', 'mr', 'bl', 'bm', 'br'
        ]
        var ev_onmouse = function (ev) {
            ev.preventDefault();
            wb.ib_drag = 'start';
            var click = getCursorPos(ev, cont.parent());
            clickX = click.x;
            clickY = click.y;
            elmX = parseFloat(cont.css("left"));
            elmY = parseFloat(cont.css("top"));
            elmW = parseFloat(cont.outerWidth());
            elmH = parseFloat(cont.outerHeight());
            var id = $(this).attr("id").split("_")[2];
            $(document).on('mousemove', {
                elm: $(this),
                id: id
            }, onMMHandler)
            $(document).on('mouseup', onMUHandler)
        }
        var ev_ontouch = function (ev) {
                ev.preventDefault();
                wb.ib_drag = 'start';
                var click = getCursorPos(ev, cont.parent());
                clickX = click.x;
                clickY = click.y;
                elmX = parseFloat(cont.css("left"));
                elmY = parseFloat(cont.css("top"));
                elmW = parseFloat(cont.outerWidth());
                elmH = parseFloat(cont.outerHeight());
                var id = $(this).attr("id").split("_")[2];
                $(document).on('touchmove', {
                    elm: $(this),
                    id: id
                }, onMMHandler)
                $(document).on('touchend', onMUHandler)
            }
            //alert(isTouchEnabled)
        for (var h = 0; h < handles.length; h++) {

            var hDiv = document.createElement('div');
            var hDiv_h = document.createElement('div');
            hDiv.className = 'dragresize' + ' ' + 'dragresize' + '-' + handles[h];
            hDiv_h.className = 'dragresize-hit' + ' ' + 'dragresize' + '-' + handles[h]+"-hit";
            $(hDiv).attr("id", cont.attr('name') + "_" + handles[h]);
            $(hDiv_h).attr("id", cont.attr('name') + "_" + handles[h]+"_hit");
            elm['_handle_' + handles[h]] = elm.appendChild(hDiv);
            elm['_handle_' + handles[h]+"_hit"] = elm.appendChild(hDiv_h);
            if (isTouchEnabled) {
                //alert(hDiv)
                $(hDiv_h).on('touchstart', function (ev) {
                    // alert('D1')
                    ev.preventDefault();
                    wb.ib_drag = 'start';
                    try {
                        var click = getCursorPos(ev, cont.parent());
                    } catch (e) {
                        alert(e)
                    }
                    // alert('D2'+click)
                    clickX = click.x;
                    clickY = click.y;
                    elmX = parseFloat(cont.css("left"));
                    elmY = parseFloat(cont.css("top"));
                    elmW = parseFloat(cont.outerWidth());
                    elmH = parseFloat(cont.outerHeight());
                    var id = $(this).attr("id").split("_")[2];
                    //  alert(id);
                    $(document).on('touchmove', {
                        elm: $(this),
                        id: id
                    }, onMMHandler)
                    $(document).on('touchend', onMUHandler)
                })
            } else {
                $(hDiv_h).on('mousedown', function (ev) {
                    ev.preventDefault();
                    wb.ib_drag = 'start';
                    var click = getCursorPos(ev, cont.parent());
                    clickX = click.x;
                    clickY = click.y;
                    elmX = parseFloat(cont.css("left"));
                    elmY = parseFloat(cont.css("top"));
                    elmW = parseFloat(cont.outerWidth());
                    elmH = parseFloat(cont.outerHeight());
                    var id = $(this).attr("id").split("_")[2];
                    // alert(id);
                    $(document).on('mousemove', {
                        elm: $(this),
                        id: id
                    }, onMMHandler)
                    $(document).on('mouseup', onMUHandler)
                })
            }
        }


        return this;
    };

    function onMUHandler(ev) {
        ev.preventDefault();

        var click = getCursorPos(ev, cont.parent());
        dx = click.x - clickX;
        dy = click.y - clickY;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            wb.ib_drag = 'end';
        } else {
            wb.ib_drag = 'null';
        }
        if (isTouchEnabled) {
            $(document).off('touchmove', onMMHandler);
            $(document).off('touchend', onMUHandler);
        } else {
            $(document).off('mousemove', onMMHandler);
            $(document).off('mouseup', onMUHandler);
        }
    }

    function onMMHandler(ev) {
        ev.preventDefault();
        wb.ib_drag = 'drag';
        var elm = ev.data.elm;
        var id = ev.data.id;
        //var cont=$("#cont");
        var click = getCursorPos(ev, cont.parent());
        dx = click.x - clickX;
        dy = click.y - clickY;
        var x, y, w, h;
        x = elmX;
        y = elmY;
        w = elmW;
        h = elmH;
        if (id == 'mr') {
            w = elmW + dx;
            if (w < 120) {
                w = 120
            }
        }
        if (id == 'br') {
            w = elmW + dx;
            h = elmH + dy;
            if (h < 40) {
                h = 40
            }
            if (w < 120) {
                w = 120
            }
        }
        if (id == 'bm') {
            h = elmH + dy;
            if (h < 40) {
                h = 40
            }
        }
        //
        if (id == 'tr') {
            w = elmW + dx;
            h = elmH - dy;
            y = elmY + dy;
            if (h < 40) {
                h = 40
                y = elmY + (elmH - h)
            }
            if (w < 120) {
                w = 120
            }
        }
        if (id == 'tm') {
            h = elmH - dy;
            y = elmY + dy;
            if (h < 40) {
                h = 40
                y = elmY + (elmH - h)
            }
        }
        if (id == 'bl') {
            w = elmW - dx;
            h = elmH + dy;
            x = elmX + dx;
            if (h < 40) {
                h = 40
            }
            if (w < 120) {
                w = 120
                x = elmX + (elmW - w)
            }
        }
        if (id == 'ml') {
            w = elmW - dx;
            x = elmX + dx;
            if (w < 120) {
                w = 120
                x = elmX + (elmW - w)
            }
        }
        if (id == 'tl') {
            //w = elmW - dx;
           // h = elmH - dy;
            x = elmX + dx;
            y = elmY + dy;
            if (h < 40) {
                h = 40
                y = elmY + (elmH - h)
            }
            if (w < 120) {
                w = 120
                x = elmX + (elmW - w)
            }
        }


        cont.css({
            'left': x + 'px',
            'top': y + 'px',
            'width': w + 'px',
            'height': h + 'px'
        })
        cont.find("[name='content']").css({
            'width': w + 'px',
            'height': h + 'px'
        })
        cont.parent().parent().find("[name='done_btn']").css({
            'position': 'absolute',
            'top': parseFloat(cont.css("top")) + (h + 30) + 'px',
            'left': parseFloat(cont.css("left")) + 'px'
        })
    }
}(jQuery));
}
//
/** Math quill has to be setup after the HTML has been rendered
 */

function setupMathQuill() {
    //on document ready, mathquill-ify all `<tag class="mathquill-*">latex</tag>`
    //elements according to their CSS class.
    $(function () {
        $('.mathquill-editable:not(.mathquill-rendered-math)').mathquill('editable');
        $('.mathquill-textbox:not(.mathquill-rendered-math)').mathquill('textbox');
        $('.mathquill-embedded-latex').mathquill();
    });
}