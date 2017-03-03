var jsdom = require("jsdom").jsdom;
//var canvas=require("canvas");
global.window = jsdom().defaultView;
global.jQuery = global.$ = require("jquery");
global.Image=global.window.Image;
global.navigator=global.window.navigator;
global.document=global.window.document;
global.window.graphicData={};
var testWbCmd=[["draw",['{"dataArr":[{"x":220,"y":72,"id":"move","color":0,"name":"","layer":"1"},{"x":-1,"y":1,"id":"line"},{"x":-5,"y":1,"id":"line"},{"x":-21,"y":3,"id":"line"},{"x":-25,"y":3,"id":"line"},{"x":-27,"y":4,"id":"line"},{"x":-28,"y":4,"id":"line"},{"x":-35,"y":5,"id":"line"},{"x":-37,"y":5,"id":"line"},{"x":-41,"y":6,"id":"line"},{"x":-45,"y":8,"id":"line"},{"x":-47,"y":9,"id":"line"},{"x":-49,"y":11,"id":"line"},{"x":-50,"y":13,"id":"line"},{"x":-52,"y":14,"id":"line"},{"x":-54,"y":15,"id":"line"},{"x":-57,"y":18,"id":"line"},{"x":-58,"y":19,"id":"line"},{"x":-61,"y":21,"id":"line"},{"x":-62,"y":21,"id":"line"},{"x":-63,"y":21,"id":"line"},{"x":-66,"y":23,"id":"line"},{"x":-67,"y":24,"id":"line"},{"x":-67,"y":25,"id":"line"},{"x":-65,"y":28,"id":"line"},{"x":-63,"y":30,"id":"line"},{"x":-61,"y":34,"id":"line"},{"x":-54,"y":40,"id":"line"},{"x":-53,"y":41,"id":"line"},{"x":-48,"y":43,"id":"line"},{"x":-42,"y":43,"id":"line"},{"x":-26,"y":46,"id":"line"},{"x":-14,"y":48,"id":"line"},{"x":-3,"y":50,"id":"line"},{"x":12,"y":52,"id":"line"},{"x":17,"y":54,"id":"line"},{"x":17,"y":55,"id":"line"},{"x":18,"y":56,"id":"line"},{"x":18,"y":57,"id":"line"},{"x":22,"y":57,"id":"line"},{"x":23,"y":57,"id":"line"},{"x":25,"y":57,"id":"line"},{"x":28,"y":57,"id":"line"},{"x":31,"y":57,"id":"line"},{"x":31,"y":60,"id":"line"},{"x":30,"y":62,"id":"line"},{"x":38,"y":65,"id":"line"},{"x":39,"y":68,"id":"line"},{"x":43,"y":72,"id":"line"},{"x":51,"y":78,"id":"line"},{"x":55,"y":83,"id":"line"},{"x":59,"y":90,"id":"line"},{"x":59,"y":91,"id":"line"},{"x":59,"y":94,"id":"line"},{"x":59,"y":95,"id":"line"},{"x":60,"y":96,"id":"line"},{"x":60,"y":99,"id":"line"},{"x":60,"y":103,"id":"line"},{"x":60,"y":105,"id":"line"},{"x":60,"y":107,"id":"line"},{"x":60,"y":108,"id":"line"},{"x":60,"y":110,"id":"line"},{"x":60,"y":112,"id":"line"},{"x":60,"y":113,"id":"line"},{"x":60,"y":117,"id":"line"},{"x":60,"y":118,"id":"line"},{"x":60,"y":120,"id":"line"},{"x":60,"y":122,"id":"line"},{"x":60,"y":124,"id":"line"},{"x":58,"y":128,"id":"line"},{"x":56,"y":129,"id":"line"},{"x":54,"y":133,"id":"line"},{"x":52,"y":135,"id":"line"},{"x":49,"y":139,"id":"line"},{"x":45,"y":143,"id":"line"},{"x":38,"y":149,"id":"line"},{"x":31,"y":154,"id":"line"},{"x":23,"y":160,"id":"line"},{"x":15,"y":166,"id":"line"},{"x":8,"y":172,"id":"line"},{"x":0,"y":178,"id":"line"},{"x":-10,"y":185,"id":"line"},{"x":-19,"y":186,"id":"line"},{"x":-27,"y":191,"id":"line"},{"x":-29,"y":191,"id":"line"},{"x":-33,"y":192,"id":"line"},{"x":-36,"y":192,"id":"line"},{"x":-39,"y":192,"id":"line"},{"x":-45,"y":192,"id":"line"},{"x":-54,"y":189,"id":"line"},{"x":-64,"y":189,"id":"line"},{"x":-76,"y":189,"id":"line"},{"x":-77,"y":189,"id":"line"},{"x":-80,"y":188,"id":"line"},{"x":-80,"y":189,"id":"line"},{"x":-84,"y":186,"id":"line"},{"x":-85,"y":186,"id":"line"},{"x":-85,"y":183,"id":"line"},{"x":-85,"y":184,"id":"line"},{"x":-85,"y":182,"id":"line"},{"x":-85,"y":179,"id":"line"},{"x":-85,"y":178,"id":"line"},{"x":-85,"y":177,"id":"line"},{"x":-85,"y":177,"id":"line"}],"id":1,"uid":0,"brect":{"x":135,"y":72,"w":145,"h":192,"xmin":135,"xmax":280,"ymin":72,"ymax":264}}']]];
describe("cmwhiteboard", function() {  
	var wb=require('../../index').Whiteboard;
	var inst;
	var cont=document.createElement("div");
	cont.id="test-cont";
	cont.name="test-cont";
	document.body.appendChild(cont);
    //inst=new wb("test-cont",false,{showTemplates: false});
    //inst.setWhiteboardViewPort(300,300);
    
    beforeEach(function() {
        //    
    });

  it("should call whiteboardIsReady when initialized!", function(done) {
    inst=wb.addWhiteboard(document,"test-cont",{isReadOnly:false,width:300,height:300,showTemplates:false});
    spyOn(wb, "whiteboardIsReady");
    //inst.initWhiteboard(document);
	setTimeout(function(){
	console.log("wb is ready!");
	expect(wb.whiteboardIsReady).toHaveBeenCalled();
	done();
	},100);
  });
  it("check wb mode!", function() {
	wb.setAsTeacherMode(false);
	var mode=wb.getWhiteboardMode();
	console.log("wb mode: ",mode);
    expect(mode).toBe("student");
  });
  it("check wb container!", function() {
	
	var c=wb.getContainer();
	console.log("wb container: ",c);
    expect(c).toBe("test-cont");
  });
  it("check wb draw commad!", function() {
	
	wb.updateWhiteboard(testWbCmd);
	var boo=inst.rendered;
	console.log("wb.draw rendered: ",boo);
    expect(boo).toBeTruthy();
  });

});
