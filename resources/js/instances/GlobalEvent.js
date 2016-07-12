
MODEL.GlobalEvent.declare.push(() => {
    
    let keyHandler = (key,ev,db) => {
        db[key] = mergeObjects(db[key],{
            ctrl: ev.ctrlKey,
            shift: ev.shiftKey,
            alt: ev.altKey,
            meta: ev.metaKey,
            target:ev.target
        });
    }
    let cursorHandler = (key,ev,db) => {
        db[key] = mergeObjects(db[key],{
            x: ev.clientX,
            y: ev.clientY,
            sx: ev.screenX,
            sy: ev.screenY,
            target:ev.target
        });
    }
    
    new GlobalEvent('mousemove', {
        initiator: window,
        worker: (ev, db) => {
            cursorHandler('cursor',ev,db);
        }
    });
    cursorHandler('cursor',{},EVENTDATA);
    
    new GlobalEvent(['keydown','keyup','keypress'], {
        worker: (ev,db) => {
            keyHandler('key',ev,db);
        }
    });
    keyHandler('key',{},EVENTDATA);
    
    new GlobalEvent(['click','mousedown','mouseup'], { worker: (ev,db, ref) => {
        keyHandler(ref.trigger,ev,db);
        cursorHandler(ref.trigger,ev,db)
    } });
    
    keyHandler(    'click'     ,{}, EVENTDATA );
    cursorHandler( 'click'     ,{}, EVENTDATA );
    keyHandler(    'mousedown' ,{}, EVENTDATA );
    cursorHandler( 'mousedown' ,{}, EVENTDATA );
    keyHandler(    'mouseup'   ,{}, EVENTDATA );
    cursorHandler( 'mouseup'   ,{}, EVENTDATA );
    
    new GlobalEvent('resize', {
        initiator: window,
        worker: (ev,db) => {
            db.size = {
                x: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                y: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
            }
        }
    });
    GLOBALEVENT.resize.options.worker({},EVENTDATA);
    
    new GlobalEvent('scroll', {
        worker: (ev,db) => {
            db.scroll = {
                x: window.pageXOffset || document.documentElement.scrollLeft,
                y: window.pageYOffset || document.documentElement.scrollTop
            }
        }
    });
    GLOBALEVENT.scroll.options.worker({},EVENTDATA);
    
});
