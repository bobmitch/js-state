class State {
    
    constructor(config) {
        if (!config.hasOwnProperty('init')||!config.hasOwnProperty('states')||!config.hasOwnProperty('transitions')) {
            throw new Error('Invalid state machine config', config);
        }
        this.prev_transition = null;
        if (config.hasOwnProperty('methods')) {
            Object.keys(config.methods).forEach(method_name => {
                console.log('Adding method', method_name);
                this[method_name] = config.methods[method_name];
            });
            delete (config.methods); // not required anymore
        }
        // set defaults
        Object.assign(this, config);
        
        // create transition onXXX functions
        Object.keys(this.transitions).forEach(transition_name => {
            this.transitions[transition_name].method_name = 'on' + this.capitalizeFirstLetter(transition_name);
            // check method hasn't been defined by config 
            if (this.hasOwnProperty(this.transitions[transition_name].method_name)) {
                if (this.debug) {
                    console.warn('Method already defined in config, skipping method for transition: ', transition_name);
                }
            }
            else {
                this[this.transitions[transition_name].method_name] = () => {
                    if (this.debug) {
                        console.log('Default empty transition method called for: ', transition_name);
                    }
                }
            }
        });
        this.setState(this.init);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    setState(state) {
        if (this.states.hasOwnProperty(state)) {
            this.state = state;
            this.states[state].actions?.forEach(action => {
                action();
            });
            if (this.debug) {
                console.log('State set: ', state, this);
            }
        }
        else {
            throw new Error('Invalid state', this);
        }
    }

    transition (transition_name, data=null) {
        if (this.transitions.hasOwnProperty(transition_name)) {
            if (Array.isArray(this.transitions[transition_name].from)) {
                if (!this.transitions[transition_name].from.includes(this.state)) {
                    console.warn('Invalid from state (checked multiple) for required transition', transition_name, this);
                    return false;
                }
            }
            else {
                if (this.transitions[transition_name].from != this.state) {
                    console.warn('Invalid from state for required transition', transition_name, this);
                    return false;
                }
            }
            // perform transition method actions
            this[this.transitions[transition_name].method_name](transition_name,data); // will be magically created default or user provided
            this.prev_transition = transition_name;
            this.setState(this.transitions[transition_name].to);
            if (this.debug) {
                console.log('Transition complete: ', transition_name, this);
            }
        }
        else {
            console.warn('Unknown transition', transition_name, this);
            return false;
        }
    }
}

export { State };
