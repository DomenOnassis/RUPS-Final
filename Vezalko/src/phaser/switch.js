import { Component } from "./component";

class Switch extends Component{
    constructor(id, start, end, is_on=false) {
        if (is_on)
            super(id, 'switch', start, end, '/components/switch-on.png', true);
        else
            super(id, 'switch', start, end, '/components/switch-off.png', true);
        this.is_on = is_on
    }
}

export {Switch}