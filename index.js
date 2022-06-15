// monitor module mange and instatiate listners of agent status
// get the list of monitors
// instatiate monitors and provides a list of monitors to apply

import Bootstrap from "../configuration/index.js";
import Utils from "../utilities/index.js"
import _ from "lodash";
const DEVICE = Bootstrap.device;


export class Device {

    constructor(params){
        let {name} = params;
        let device = _.find(DEVICE,d=>d.label===name);
        if(!device){throw new Error(`ERROR: device "name" mandatory, got ${name}`)}

        this.device = device;

        let {test, action} = this.device;
        // console.log(monitor);
        if (!test || !action) {
            throw new Error(`ERROR: miss configured monitor ${this.device.label}`);
        }
        this.test = test;
        this.rate = test.rate ? test.rate : 1;
        this.action = action;
        this.rateTest = Utils.rate.test;
    }

    process(state,date){

        // test the rate
        if (!this.rateTest(this.rate)) {
            return false;
        }

        if( !this._test(state,this.test) ) {
            return false
        }

        let result = {};
        if(date){
            result.date = date;
        }

        // act
        switch (this.action.type) {

            case "message":
                result.message = Object.assign({},this._createMessage(state,this.action) );
                break;
            case "store":
                result.section = this.action.section;
            default:
                result.data = Object.assign({},state);
        }

        return result;
    }

    _createMessage(state,{fields,payload}) {
        let value = Utils.extractFromObject(state,fields);
        // console.log(state,fields,value);
        let fieldName = fields[fields.length-1];
        let newPayload = Object.assign({message:{}},payload);
        // add field in the message
        if(value && fieldName){
            let f = fields[fields.length-1];
            newPayload.message[f] = value;
        }
        // payload
        return newPayload;
    }
    _test(state,{fields,value,operator}) {
        if(!fields || Array.isArray(fields) || fields.length === 0){
            return true;
        }
        // test value
        let v = Utils.extractFromObject(state, fields);
        // evaluate expression
        return eval(`v ${operator} value`);
    }


};

// monitor function takes a state and returns a payload {section,message}
function generateMonitor(monitor){
    try {
        return new Monitor(monitor);
    }catch (err){
        console.error(err);
    }
}

const Monitoring = ()=> {
    return MONITOR.reduce( (partial,monitor) => {
        // check if this monitor should be returned to agent
        // with rate
        if(!Utils.rate.test(monitor.rate)){
            return partial;
        }

        let monitorFunction = generateMonitor(monitor);
        partial.push(monitorFunction);

        return partial;
    },[]);
};
// each monitor is generated as a function
export default Monitoring;