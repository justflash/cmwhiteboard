var wb=require('./assets/js/whiteboard_v3.js');
exports.Whiteboard={
    instances:{},
    addWhiteboard:function(scope,containerid,options){
        var isReadOnly=options.isReadOnly||false;
        var width=options.width||300;
        var height=options.height||300;
        var cbck=options.callback;
        var eventObj=options.eventObject;
        this.cont_id=containerid;
        var instance=new wb(containerid,isReadOnly,options);
        this.inst=instance;
        var self=this;
        self.cbck=cbck;
        instance.setWhiteboardViewPort(width,height);
        instance.initWhiteboard(scope);
        instance.whiteboardIsReady=function(){
            var _cont=instance.getContainer();
            if(self.cbck){
                //
                self.cbck(instance, _cont);
            }
            if(eventObj){
                //add event broadcaster
            }
            self.whiteboardIsReady();
        }
        return instance;
    },
    whiteboardIsReady:function(){
    },
    destroyAllWhiteboards:function(){
        var insts=this.instances;
        for(var m in insts){
            var _inst=insts[m];
            var _id=_inst.getContainer();
            $("#"+_id).empty();
            _inst=null;
            //delete _inst;
        }
    },
    deleteWhiteboard:function(n){
        this.inst.deleteWhiteboard(n);
    },
    disconnectWhiteboard:function(){
        this.inst.disconnectWhiteboard();
    },
    updateWhiteboard:function (cmdArray) {
        this.inst.updateWhiteboard(cmdArray);
    },
    updateWhiteboardData:function (index, newJSON) {
        this.inst.updateWhiteboardData(index, newJSON);
    },
    setAsTeacherMode:function (boo) {
        this.inst.setAsTeacherMode(boo)
    },
    getWhiteboardMode:function () {
        return this.inst.getWhiteboardMode();
    },
    getContainer:function(){
        return this.inst.getContainer();
    },
    getRenderedCommands:function(){
        return this.inst.getRenderedCommands();
    }
    
}
